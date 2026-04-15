// import z from "zod";
//
// export const schema = z.object({
//     commentId: z.string().uuid("commentId must be a valid uuid."),
//     reason: z.string().trim().max(500, "reason is too long.").nullable().optional(),
// });
//
// export type CommentReportSchema = z.infer<typeof schema>;
//
// export function parseCommentReportBodyWithZod(data: unknown): CommentReportSchema {
//     return schema.parse(data);
// }