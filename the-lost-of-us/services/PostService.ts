import PostRepository from "@/repositories/PostRepository";
import { posts } from "@/src/generated/prisma/browser";

import { CreatePostSchema, parseCreatePostBodyWithZod } from "@/schemas/createPost.schema";
import { parseUpdatePostBodyWithZod, UpdatePostSchema } from "@/schemas/updatePost.schema";
import { PostDTO } from "@/src/dto/post";

export class PostValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PostValidationError";
    }
}

class PostService {
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

        const input: PostDTO = {
            petName: parsedData.petName.trim(),
            userSub: userSub,
            description: parsedData.description ?? null,
            lastSeenDate: parsedData.lastSeenDate,
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
        const post = await PostRepository.findById(id);

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

        return PostRepository.update(id, input);
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