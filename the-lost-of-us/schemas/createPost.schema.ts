import { z } from "zod";

export const createPostSchema = z.object({
    petName: z.string().min(1, "petName is required."),
    description: z.string().nullable().optional(),
    lastSeenDate: z
        .union([
            z.string().datetime({ message: "Invalid lastSeenDate." }).transform((v) => new Date(v)),
            z.date({ message: "Invalid lastSeenDate." }),
            z.null()
        ]),
    lastSeenLatitude: z.number({ message: "Invalid lastSeenLatitude." }).optional(),
    lastSeenLongitude: z.number({ message: "Invalid lastSeenLongitude." }).optional(),
    images: z.preprocess(
        (value) => {
            if (typeof FileList !== "undefined" && value instanceof FileList) {
                return Array.from(value);
            }
            return value;
        },
        z.array(
            z.instanceof(File, { message: "Each image must be a valid file." })
                .refine(
                    (file) => file.type.startsWith("image/"),
                    "Each image must be a valid image file (JPEG, PNG, WebP, GIF)."
                )
        )
    )
});

export type CreatePostSchema = z.infer<typeof createPostSchema>;

export function parseCreatePostBodyWithZod(data: unknown): CreatePostSchema {
    return createPostSchema.parse(data);
}
