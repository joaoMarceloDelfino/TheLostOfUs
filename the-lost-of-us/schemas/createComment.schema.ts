import z from "zod";

export const schema = z.object({
    postId: z.string().min(1, "postId is required."),
    parentCommentId: z.string().uuid("parentCommentId must be a valid uuid.").nullable().optional(),
    commentText: z.string().trim().min(1, "commentText is required.").max(1000, "commentText is too long."),
});

export type CreateCommentSchema = z.infer<typeof schema>;

export function parseCreateCommentBodyWithZod(data: unknown): CreateCommentSchema {
    return schema.parse(data);
}
