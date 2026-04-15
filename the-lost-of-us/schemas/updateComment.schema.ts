import z from "zod";

export const schema = z.object({
    commentId: z.string().uuid("commentId must be a valid uuid."),
    commentText: z.string().trim().min(1, "commentText is required.").max(1000, "commentText is too long."),
});

export type UpdateCommentSchema = z.infer<typeof schema>;

export function parseUpdateCommentBodyWithZod(data: unknown): UpdateCommentSchema {
    return schema.parse(data);
}
