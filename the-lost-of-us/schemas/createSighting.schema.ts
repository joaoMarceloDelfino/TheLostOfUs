import { z } from "zod";

export const createSightingSchema = z.object({
    postId: z.string().min(1, "postId is required."),
    description: z.string().trim().max(1000, "description is too long.").nullable().optional(),
    location: z.object({
        latitude: z.number({ message: "Invalid latitude." }),
        longitude: z.number({ message: "Invalid longitude." }),
    }),
});

export type CreateSightingSchema = z.infer<typeof createSightingSchema>;

export function parseCreateSightingBodyWithZod(data: unknown): CreateSightingSchema {
    return createSightingSchema.parse(data);
}