import { z } from "zod";

export const createPostSchema = z.object({
    petName: z.string().min(1, "petName is required."),
    description: z.string().nullable().optional(),
    lastSeenDate: z
        .union([
            z.string().datetime({ message: "Invalid lastSeenDate." }).transform((v) => new Date(v)),
            z.date({ message: "Invalid lastSeenDate." }),
            z.null()
        ])
});

export type CreatePostSchema = z.infer<typeof createPostSchema>;

export function parseCreatePostBodyWithZod(data: unknown): CreatePostSchema {
    return createPostSchema.parse(data);
}
