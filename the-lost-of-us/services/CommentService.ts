import CommentRepository, { CommentRow } from "@/repositories/CommentRepository";
import { CreateCommentSchema, parseCreateCommentBodyWithZod } from "@/schemas/createComment.schema";
import { parseUpdateCommentBodyWithZod } from "@/schemas/updateComment.schema";
import { parseCommentVoteBodyWithZod } from "@/schemas/commentVote.schema";
// import { parseCommentReportBodyWithZod } from "@/schemas/commentReport.schema";
import { clerkClient } from "@clerk/nextjs/server";
import PostService from "./PostService";

export class CommentValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CommentValidationError";
    }
}

export type CommentTreeItem = {
    id: string;
    postId: string;
    parentCommentId: string | null;
    userSub: string;
    postUserSub: string;
    authorName: string;
    commentText: string;
    likesCount: number;
    dislikesCount: number;
    reportsCount: number;
    score: number;
    userVote: number | null;
    createdAt: Date;
    updatedAt: Date;
    canEdit: boolean;
    canDelete: boolean;
    replies: CommentTreeItem[];
};

type ClerkUserLike = {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    primaryEmailAddress?: { emailAddress?: string | null } | null;
    emailAddresses?: Array<{ emailAddress?: string | null }>;
};

class CommentService {
    private readonly authorFallback = "Autor desconhecido";

    private parseValidation<T>(parser: (body: unknown) => T, body: unknown): T {
        try {
            return parser(body);
        } catch (err: any) {
            if (err?.name === "ZodError" && Array.isArray(err.issues)) {
                throw new CommentValidationError(err.issues[0]?.message || "Invalid request body.");
            }
            throw new CommentValidationError(err?.message || "Invalid request body.");
        }
    }

    private resolveAuthorName(user?: ClerkUserLike): string {
        if (!user) {
            return this.authorFallback;
        }

        const fullName = [user.firstName, user.lastName]
            .filter((value): value is string => Boolean(value && value.trim()))
            .join(" ")
            .trim();

        if (fullName) {
            return fullName;
        }

        if (user.username && user.username.trim()) {
            return user.username.trim();
        }

        const primaryEmail = user.primaryEmailAddress?.emailAddress?.trim();
        if (primaryEmail) {
            return primaryEmail;
        }

        const firstEmail = user.emailAddresses?.find((email) => email.emailAddress?.trim())?.emailAddress?.trim();
        if (firstEmail) {
            return firstEmail;
        }

        return this.authorFallback;
    }

    private async getAuthorNameMap(userSubs: string[]): Promise<Map<string, string>> {
        const uniqueSubs = Array.from(new Set(userSubs.filter((value) => Boolean(value && value.trim()))));

        if (!uniqueSubs.length) {
            return new Map();
        }

        try {
            const client = await clerkClient();
            const usersResponse = await client.users.getUserList({
                userId: uniqueSubs,
                limit: uniqueSubs.length,
            });

            const authorMap = new Map<string, string>();
            usersResponse.data.forEach((user) => {
                const typedUser = user as ClerkUserLike;
                authorMap.set(typedUser.id, this.resolveAuthorName(typedUser));
            });

            return authorMap;
        } catch {
            return new Map();
        }
    }

    private mapRow(row: CommentRow, viewerUserSub?: string | null, authorName?: string): CommentTreeItem {
        const canEdit = !!viewerUserSub && row.user_sub === viewerUserSub;
        const canDelete = !!viewerUserSub && (row.user_sub === viewerUserSub || row.post_user_sub === viewerUserSub);

        return {
            id: row.id,
            postId: row.post_id,
            parentCommentId: row.parent_comment_id,
            userSub: row.user_sub,
            postUserSub: row.post_user_sub,
            authorName: authorName ?? this.authorFallback,
            commentText: row.comment_text,
            likesCount: row.likes_count,
            dislikesCount: row.dislikes_count,
            reportsCount: row.reports_count,
            score: row.likes_count - row.dislikes_count,
            userVote: row.user_vote,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            canEdit,
            canDelete,
            replies: [],
        };
    }

    private async buildTree(rows: CommentRow[], viewerUserSub?: string | null): Promise<CommentTreeItem[]> {
        const authorMap = await this.getAuthorNameMap(rows.map((row) => row.user_sub));
        const mapped = rows.map((row) => this.mapRow(row, viewerUserSub, authorMap.get(row.user_sub)));
        const byId = new Map(mapped.map((item) => [item.id, item]));
        const roots: CommentTreeItem[] = [];

        mapped.forEach((item) => {
            if (item.parentCommentId) {
                const parent = byId.get(item.parentCommentId);
                if (parent) {
                    parent.replies.push(item);
                    return;
                }
            }
            roots.push(item);
        });

        const sortItems = (items: CommentTreeItem[]) => {
            items.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.createdAt.getTime() - b.createdAt.getTime();
            });
            items.forEach((item) => sortItems(item.replies));
        };

        sortItems(roots);
        return roots;
    }

    async listComments(postId: string, viewerUserSub?: string | null): Promise<CommentTreeItem[]> {
        if (!postId) {
            throw new CommentValidationError("postId is required.");
        }

        const parentPost = await PostService.findById(postId);
        if (!parentPost) {
            throw new CommentValidationError("Post not found!");
        }

        const rows = await CommentRepository.findByPostId(postId, viewerUserSub);
        return this.buildTree(rows, viewerUserSub);
    }

    async createComment(body: unknown, userSub: string): Promise<CommentTreeItem> {
        const parsedBody: CreateCommentSchema = this.parseValidation(parseCreateCommentBodyWithZod, body);
        const parentPost = await PostService.findById(parsedBody.postId);

        if (!parentPost) {
            throw new CommentValidationError("Post not found!");
        }

        if (parsedBody.parentCommentId) {
            const parentComment = await CommentRepository.findById(parsedBody.parentCommentId, userSub);
            if (!parentComment || parentComment.post_id !== parsedBody.postId) {
                throw new CommentValidationError("Parent comment not found!");
            }
        }

        const created = await CommentRepository.create({
            postId: parsedBody.postId,
            parentCommentId: parsedBody.parentCommentId ?? null,
            commentText: parsedBody.commentText,
            userSub,
        });

        const authorMap = await this.getAuthorNameMap([created.user_sub]);
        return this.mapRow(created, userSub, authorMap.get(created.user_sub));
    }

    async updateComment(body: unknown, userSub: string): Promise<CommentTreeItem> {
        const parsedBody = this.parseValidation(parseUpdateCommentBodyWithZod, body);
        const comment = await CommentRepository.findById(parsedBody.commentId, userSub);

        if (!comment) {
            throw new CommentValidationError("Comment not found!");
        }
        if (comment.user_sub !== userSub) {
            throw new CommentValidationError("You are not allowed to edit this comment");
        }

        const updated = await CommentRepository.update(parsedBody.commentId, parsedBody.commentText, userSub);
        if (!updated) {
            throw new CommentValidationError("Comment not found!");
        }

        const authorMap = await this.getAuthorNameMap([updated.user_sub]);
        return this.mapRow(updated, userSub, authorMap.get(updated.user_sub));
    }

    async deleteComment(commentId: string, userSub: string): Promise<void> {
        const comment = await CommentRepository.findById(commentId, userSub);

        if (!comment) {
            throw new CommentValidationError("Comment not found!");
        }
        if (comment.user_sub !== userSub && comment.post_user_sub !== userSub) {
            throw new CommentValidationError("You are not allowed to delete this comment");
        }

        await CommentRepository.delete(commentId);
    }

    async voteComment(body: unknown, userSub: string): Promise<CommentTreeItem> {
        const parsedBody = this.parseValidation(parseCommentVoteBodyWithZod, body);
        const comment = await CommentRepository.findById(parsedBody.commentId, userSub);

        if (!comment) {
            throw new CommentValidationError("Comment not found!");
        }

        const updated = await CommentRepository.vote(parsedBody.commentId, userSub, parsedBody.value);
        if (!updated) {
            throw new CommentValidationError("Comment not found!");
        }

        const authorMap = await this.getAuthorNameMap([updated.user_sub]);
        return this.mapRow(updated, userSub, authorMap.get(updated.user_sub));
    }

    // async reportComment(body: unknown, userSub: string): Promise<{ deleted: boolean; comment: CommentTreeItem | null }> {
    //     const parsedBody = this.parseValidation(parseCommentReportBodyWithZod, body);
    //     const comment = await CommentRepository.findById(parsedBody.commentId, userSub);
    //
    //     if (!comment) {
    //         throw new CommentValidationError("Comment not found!");
    //     }
    //
    //     const result = await CommentRepository.report(parsedBody.commentId, userSub, parsedBody.reason ?? null);
    //     return {
    //         deleted: result.deleted,
    //         comment: result.comment ? this.mapRow(result.comment, userSub) : null,
    //     };
    // }
}

export default new CommentService();