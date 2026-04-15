import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/src/generated/prisma/client";

const prismaClient = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

export type CommentRow = {
    id: string;
    post_id: string;
    parent_comment_id: string | null;
    user_sub: string;
    comment_text: string;
    likes_count: number;
    dislikes_count: number;
    reports_count: number;
    created_at: Date;
    updated_at: Date;
    post_user_sub: string;
    user_vote: number | null;
};

export type CreateCommentInput = {
    postId: string;
    parentCommentId?: string | null;
    userSub: string;
    commentText: string;
};

class CommentRepository {
    async findByPostId(postId: string, viewerUserSub?: string | null): Promise<CommentRow[]> {
        return prismaClient.$queryRaw<CommentRow[]>(Prisma.sql`
            SELECT
                c.id,
                c.post_id,
                c.parent_comment_id,
                c.user_sub,
                c.comment_text,
                c.likes_count,
                c.dislikes_count,
                c.reports_count,
                c.created_at,
                c.updated_at,
                p.user_sub AS post_user_sub,
                ${viewerUserSub
                    ? Prisma.sql`cv.value`
                    : Prisma.sql`NULL::integer`} AS user_vote
            FROM comments c
            INNER JOIN posts p ON p.id = c.post_id
            ${viewerUserSub
                ? Prisma.sql`LEFT JOIN comment_votes cv ON cv.comment_id = c.id AND cv.user_sub = ${viewerUserSub}`
                : Prisma.empty}
            WHERE c.post_id = ${postId}
            ORDER BY (c.likes_count - c.dislikes_count) DESC, c.created_at ASC
        `);
    }

    async findById(commentId: string, viewerUserSub?: string | null): Promise<CommentRow | null> {
        const rows = await prismaClient.$queryRaw<CommentRow[]>(Prisma.sql`
            SELECT
                c.id,
                c.post_id,
                c.parent_comment_id,
                c.user_sub,
                c.comment_text,
                c.likes_count,
                c.dislikes_count,
                c.reports_count,
                c.created_at,
                c.updated_at,
                p.user_sub AS post_user_sub,
                ${viewerUserSub
                    ? Prisma.sql`cv.value`
                    : Prisma.sql`NULL::integer`} AS user_vote
            FROM comments c
            INNER JOIN posts p ON p.id = c.post_id
            ${viewerUserSub
                ? Prisma.sql`LEFT JOIN comment_votes cv ON cv.comment_id = c.id AND cv.user_sub = ${viewerUserSub}`
                : Prisma.empty}
            WHERE c.id = ${commentId}
            LIMIT 1
        `);

        return rows[0] ?? null;
    }

    async create(data: CreateCommentInput): Promise<CommentRow> {
        const idRows = await prismaClient.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT gen_random_uuid()::text AS id`);
        const commentId = idRows[0].id;

        await prismaClient.$executeRaw(Prisma.sql`
            INSERT INTO comments (
                id,
                post_id,
                parent_comment_id,
                user_sub,
                comment_text,
                likes_count,
                dislikes_count,
                reports_count,
                created_at,
                updated_at
            ) VALUES (
                ${commentId}::uuid,
                ${data.postId}::uuid,
                ${data.parentCommentId ? Prisma.sql`${data.parentCommentId}::uuid` : Prisma.sql`NULL`},
                ${data.userSub},
                ${data.commentText},
                0,
                0,
                0,
                NOW(),
                NOW()
            )
        `);

        const created = await this.findById(commentId, data.userSub);
        if (!created) {
            throw new Error("Failed to create comment");
        }
        return created;
    }

    async update(commentId: string, commentText: string, viewerUserSub?: string | null): Promise<CommentRow | null> {
        await prismaClient.$executeRaw(Prisma.sql`
            UPDATE comments
            SET comment_text = ${commentText}, updated_at = NOW()
            WHERE id = ${commentId}::uuid
        `);

        return this.findById(commentId, viewerUserSub);
    }

    async delete(commentId: string): Promise<void> {
        await prismaClient.$executeRaw(Prisma.sql`
            DELETE FROM comments
            WHERE id = ${commentId}::uuid
        `);
    }

    async vote(commentId: string, userSub: string, value: 1 | -1): Promise<CommentRow | null> {
        await prismaClient.$transaction(async (tx) => {
            const existing = await tx.$queryRaw<Array<{ value: number }>>(Prisma.sql`
                SELECT value
                FROM comment_votes
                WHERE comment_id = ${commentId}::uuid AND user_sub = ${userSub}
                LIMIT 1
            `);

            if (!existing.length) {
                await tx.$executeRaw(Prisma.sql`
                    INSERT INTO comment_votes (id, comment_id, user_sub, value, created_at, updated_at)
                    VALUES (gen_random_uuid(), ${commentId}::uuid, ${userSub}, ${value}, NOW(), NOW())
                `);
            } else if (existing[0].value === value) {
                await tx.$executeRaw(Prisma.sql`
                    DELETE FROM comment_votes
                    WHERE comment_id = ${commentId}::uuid AND user_sub = ${userSub}
                `);
            } else {
                await tx.$executeRaw(Prisma.sql`
                    UPDATE comment_votes
                    SET value = ${value}, updated_at = NOW()
                    WHERE comment_id = ${commentId}::uuid AND user_sub = ${userSub}
                `);
            }

            await tx.$executeRaw(Prisma.sql`
                UPDATE comments c
                SET likes_count = COALESCE(v.likes_count, 0),
                    dislikes_count = COALESCE(v.dislikes_count, 0),
                    updated_at = NOW()
                FROM (
                    SELECT
                        comment_id,
                        COUNT(*) FILTER (WHERE value = 1) AS likes_count,
                        COUNT(*) FILTER (WHERE value = -1) AS dislikes_count
                    FROM comment_votes
                    WHERE comment_id = ${commentId}::uuid
                    GROUP BY comment_id
                ) v
                WHERE c.id = ${commentId}::uuid
            `);

            await tx.$executeRaw(Prisma.sql`
                UPDATE comments
                SET likes_count = 0,
                    dislikes_count = 0,
                    updated_at = NOW()
                WHERE id = ${commentId}::uuid
                  AND NOT EXISTS (
                    SELECT 1 FROM comment_votes WHERE comment_id = ${commentId}::uuid
                  )
            `);
        });

        return this.findById(commentId, userSub);
    }

    // async report(commentId: string, userSub: string, reason?: string | null): Promise<{ deleted: boolean; comment: CommentRow | null }> {
    //     let deleted = false;
    //
    //     await prismaClient.$transaction(async (tx) => {
    //         const existing = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    //             SELECT id
    //             FROM comment_reports
    //             WHERE comment_id = ${commentId}::uuid AND user_sub = ${userSub}
    //             LIMIT 1
    //         `);
    //
    //         if (!existing.length) {
    //             await tx.$executeRaw(Prisma.sql`
    //                 INSERT INTO comment_reports (id, comment_id, user_sub, reason, created_at)
    //                 VALUES (gen_random_uuid(), ${commentId}::uuid, ${userSub}, ${reason ?? null}, NOW())
    //             `);
    //         }
    //
    //         await tx.$executeRaw(Prisma.sql`
    //             UPDATE comments c
    //             SET reports_count = COALESCE(r.reports_count, 0),
    //                 updated_at = NOW()
    //             FROM (
    //                 SELECT comment_id, COUNT(*)::integer AS reports_count
    //                 FROM comment_reports
    //                 WHERE comment_id = ${commentId}::uuid
    //                 GROUP BY comment_id
    //             ) r
    //             WHERE c.id = ${commentId}::uuid
    //         `);
    //
    //         const reportRows = await tx.$queryRaw<Array<{ reports_count: number }>>(Prisma.sql`
    //             SELECT reports_count
    //             FROM comments
    //             WHERE id = ${commentId}::uuid
    //             LIMIT 1
    //         `);
    //
    //         const reportCount = reportRows[0]?.reports_count ?? 0;
    //         if (reportCount >= 30) {
    //             await tx.$executeRaw(Prisma.sql`
    //                 DELETE FROM comments WHERE id = ${commentId}::uuid
    //             `);
    //             deleted = true;
    //         }
    //     });
    //
    //     return {
    //         deleted,
    //         comment: deleted ? null : await this.findById(commentId, userSub),
    //     };
    // }
}

export default new CommentRepository();