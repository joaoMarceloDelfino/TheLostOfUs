import { z } from "zod";

export const createPostSchema = z.object({
    petName: z.string().min(1, "petName is required."),
    description: z.string().nullable().optional(),
    lastSeenDate: z
        .date({ message: "Invalid lastSeenDate." })
        .or(z.null())
});

export type CreatePostSchema = z.infer<typeof createPostSchema>;

export function parseCreatePostBodyWithZod(data: unknown): CreatePostSchema {
    return createPostSchema.parse(data);
}
