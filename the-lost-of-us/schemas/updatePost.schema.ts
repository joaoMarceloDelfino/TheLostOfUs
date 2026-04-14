import { z } from "zod";

export const updatePostSchema = z.object({
  petName: z.string().min(1, "petName is required.").optional(),
  description: z.string().nullable().optional(),
  lastSeenDate: z
    .union([
      z.string().datetime({ message: "Invalid lastSeenDate." }).transform((v) => new Date(v)),
      z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, { message: "Invalid lastSeenDate." }).transform((v) => {
        const [day, month, year] = v.split("/");
        return new Date(`${year}-${month}-${day}T00:00:00`);
      }),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid lastSeenDate." }).transform((v) => new Date(`${v}T00:00:00`)),
      z.date({ message: "Invalid lastSeenDate." }),
      z.null(),
    ])
    .optional(),
  imagesToKeep: z
    .preprocess((value) => {
      if (value === undefined || value === null) {
        return undefined;
      }
      if (typeof value === "string") {
        if (!value.trim()) {
          return [];
        }
        return value.split(",").map((item) => item.trim()).filter(Boolean);
      }
      if (Array.isArray(value)) {
        return value.map((item) => String(item));
      }
      return value;
    }, z.array(z.string()).optional()),
  newImages: z
    .preprocess((value) => {
      if (value === undefined || value === null) {
        return undefined;
      }
      if (typeof FileList !== "undefined" && value instanceof FileList) {
        return Array.from(value);
      }
      return value;
    }, z.array(z.instanceof(File)).optional()),
}).refine(
  (data) =>
    data.petName !== undefined ||
    data.description !== undefined ||
    data.lastSeenDate !== undefined ||
    data.imagesToKeep !== undefined ||
    data.newImages !== undefined,
  {
    message: "At least one field must be provided for update.",
  }
);

export type UpdatePostSchema = z.infer<typeof updatePostSchema>;

export function parseUpdatePostBodyWithZod(data: unknown): UpdatePostSchema {
  return updatePostSchema.parse(data);
}
