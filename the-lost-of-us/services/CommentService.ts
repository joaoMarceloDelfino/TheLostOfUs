import CommentRepository, { CommentRow } from "@/repositories/CommentRepository";
import { CreateCommentSchema, parseCreateCommentBodyWithZod } from "@/schemas/createComment.schema";
import { parseUpdateCommentBodyWithZod } from "@/schemas/updateComment.schema";
import { parseCommentVoteBodyWithZod } from "@/schemas/commentVote.schema";
// import { parseCommentReportBodyWithZod } from "@/schemas/commentReport.schema";
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

class CommentService {
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

    private mapRow(row: CommentRow, viewerUserSub?: string | null): CommentTreeItem {
        const canEdit = !!viewerUserSub && row.user_sub === viewerUserSub;
        const canDelete = !!viewerUserSub && (row.user_sub === viewerUserSub || row.post_user_sub === viewerUserSub);

        return {
            id: row.id,
            postId: row.post_id,
            parentCommentId: row.parent_comment_id,
            userSub: row.user_sub,
            postUserSub: row.post_user_sub,
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

    private buildTree(rows: CommentRow[], viewerUserSub?: string | null): CommentTreeItem[] {
        const mapped = rows.map((row) => this.mapRow(row, viewerUserSub));
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

        return this.mapRow(created, userSub);
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

        return this.mapRow(updated, userSub);
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

        return this.mapRow(updated, userSub);
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