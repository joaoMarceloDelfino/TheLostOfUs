import { z } from "zod";

export const updatePostSchema = z.object({
  petName: z.string().min(1, "petName is required.").optional(),
  description: z.string().nullable().optional(),
  lastSeenDate: z
    .date()
    .or(z.null())
    .optional(),
}).refine(
  (data) => data.petName !== undefined || data.description !== undefined || data.lastSeenDate !== undefined,
  {
    message: "At least one field must be provided for update.",
  }
);

export type UpdatePostSchema = z.infer<typeof updatePostSchema>;

export function parseUpdatePostBodyWithZod(data: unknown): UpdatePostSchema {
  return updatePostSchema.parse(data);
}
