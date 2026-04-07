import z from "zod";

export const schema = z.object({
    postId: z.string().min(1, "postId is required."),
    commentText: z.string().min(1, "commentText is required."),
});

export type CreateCommentSchema = z.infer<typeof schema>;

export function parseCreateCommentBodyWithZod(data: unknown): CreateCommentSchema {
    return schema.parse(data);
}