import PostRepository from "@/repositories/PostRepository";
import { posts } from "@/src/generated/prisma/browser";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

import { parseCreatePostBodyWithZod } from "@/schemas/createPost.schema";
import { parseUpdatePostBodyWithZod, UpdatePostSchema } from "@/schemas/updatePost.schema";
import { PostDTO } from "@/src/dto/post";

export class PostValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PostValidationError";
    }
}

class PostService {
    private getFileExtension(file: File): string {
        const fromName = file.name.split(".").pop()?.toLowerCase();
        if (fromName) {
            return fromName;
        }

        const fromType = file.type.split("/").pop()?.toLowerCase();
        return fromType || "bin";
    }

    private async saveImages(files: File[]): Promise<string[]> {
        if (!files.length) {
            return [];
        }

        const imagesDir = path.join(process.cwd(), "public", "images", "post-images");
        await fs.mkdir(imagesDir, { recursive: true });

        const imageUris: string[] = [];
        for (const file of files) {
            const ext = this.getFileExtension(file);
            const filename = `${Date.now()}-${randomUUID()}.${ext}`;
            const filePath = path.join(imagesDir, filename);
            const buffer = Buffer.from(await file.arrayBuffer());

            await fs.writeFile(filePath, buffer);
            imageUris.push(`/images/post-images/${filename}`);
        }

        return imageUris;
    }

    private async deleteImages(imageUris: string[]): Promise<void> {
        const deletions = imageUris
            .filter((uri) => uri.startsWith("/images/"))
            .map(async (uri) => {
                const normalized = uri.replace(/^\/+/, "");
                const absolutePath = path.join(process.cwd(), "public", normalized.replace(/^images\//, "images/"));
                try {
                    await fs.unlink(absolutePath);
                } catch {
                    // File may have been removed already; keep flow resilient.
                }
            });

        await Promise.all(deletions);
    }

    async createPost(data: unknown, userSub: string): Promise<posts> {
        let parsedData;

        try {
            parsedData = parseCreatePostBodyWithZod(data);
        } catch (err: any) {
            if (err && typeof err === "object" && err.name === "ZodError" && Array.isArray((err as any).issues)) {
                throw new PostValidationError((err as any).issues[0]?.message || "Invalid request body.");
            }
            throw new PostValidationError(err?.message || "Invalid request body.");
        }

        const imageUris = await this.saveImages(parsedData.images ?? []);

        const input: PostDTO = {
            petName: parsedData.petName.trim(),
            userSub: userSub,
            description: parsedData.description ?? null,
            lastSeenDate: parsedData.lastSeenDate,
            imageUris,
        };

        return PostRepository.create(input);
    }

    async getAllPosts(): Promise<posts[]> {
        return PostRepository.findAll();
    }

    async getAllPostsByUser(userSub: string): Promise<posts[]> {
        return PostRepository.findAllByUser(userSub);
    }

    async deletePost(id: string, userSub: string): Promise<posts> {
        const post = await PostRepository.findById(id);

        if (!post) {
            throw new PostValidationError("Post not found");
        }
        if (post.user_sub !== userSub) {
            throw new PostValidationError("You are not allowed to delete this post");
        }
        const deleted = await PostRepository.delete(id);
        return deleted!;
    }

    async updatePost(id: string, data: unknown, userSub: string): Promise<posts | null> {
        const post = await PostRepository.findByIdWithImages(id);

        if (!post) {
            throw new PostValidationError("Post not found");
        }
        if (post.user_sub !== userSub) {
            throw new PostValidationError("You are not allowed to update this post");
        }

        let parsedData;
        try {
            parsedData = parseUpdatePostBodyWithZod(data);
        } catch (err: any) {
            if (err && typeof err === "object" && err.name === "ZodError" && Array.isArray((err as any).issues)) {
                throw new PostValidationError((err as any).issues[0]?.message || "Invalid request body.");
            }
            throw new PostValidationError(err?.message || "Invalid request body.");
        }

        const input: UpdatePostSchema = {
            ...(parsedData.petName !== undefined && { petName: parsedData.petName.trim() }),
            ...(parsedData.description !== undefined && { description: parsedData.description }),
            ...(parsedData.lastSeenDate !== undefined && { lastSeenDate: parsedData.lastSeenDate }),
        };

        const existingImageIds = new Set(post.petimages.map((image) => image.id));
        const keepIdsFromPayload = parsedData.imagesToKeep;
        const keepImageIds = (keepIdsFromPayload ?? post.petimages.map((image) => image.id))
            .filter((imageId) => existingImageIds.has(imageId));

        const removedImages = post.petimages.filter((image) => !keepImageIds.includes(image.id));
        const newImageUris = await this.saveImages(parsedData.newImages ?? []);

        const updatedPost = await PostRepository.update(id, input);
        await PostRepository.syncPostImages(id, keepImageIds, newImageUris);
        await this.deleteImages(removedImages.map((image) => image.image_uri));

        return updatedPost;
    }

    async findById(id: string): Promise<posts | null> {
        const post = await PostRepository.findById(id);
        if (!post) {
            return null
        }
        return post;
    }
}

export default new PostService();