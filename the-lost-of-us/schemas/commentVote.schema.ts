import z from "zod";

export const schema = z.object({
    commentId: z.string().uuid("commentId must be a valid uuid."),
    value: z.union([z.literal(1), z.literal(-1)]),
});

export type CommentVoteSchema = z.infer<typeof schema>;

export function parseCommentVoteBodyWithZod(data: unknown): CommentVoteSchema {
    return schema.parse(data);
}
