import PostRepository from "@/repositories/PostRepository";
import { posts } from "@/src/generated/prisma/browser";
import { CreatePostBody, CreatePostInput } from "@/src/types/post";

export class PostValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PostValidationError";
    }
}

function parseCreatePostBody(data: CreatePostBody): CreatePostInput {
    if (typeof data !== "object" || data === null) {
        throw new PostValidationError("Invalid request body.");
    }

    if (typeof data.petName !== "string" || data.petName.trim().length === 0) {
        throw new PostValidationError("petName is required.");
    }

    if (typeof data.userSub !== "string" || data.userSub.trim().length === 0) {
        throw new PostValidationError("userSub is required.");
    }

    if (data.description !== null && typeof data.description !== "string") {
        throw new PostValidationError("description must be a string or null.");
    }

    if (data.lastSeenDate !== undefined && data.lastSeenDate !== null && typeof data.lastSeenDate !== "string") {
        throw new PostValidationError("lastSeenDate must be a string or null.");
    }

    let lastSeenDate: Date | null = null;

    if (data.lastSeenDate) {
        lastSeenDate = new Date(data.lastSeenDate);

        if (Number.isNaN(lastSeenDate.getTime())) {
            throw new PostValidationError("Invalid lastSeenDate.");
        }
    }

    return {
        petName: data.petName.trim(),
        userSub: data.userSub.trim(),
        description: data.description,
        lastSeenDate,
    };
}

class PostService {
    async createPost(data: CreatePostBody): Promise<posts> {
        const parsedData = parseCreatePostBody(data);

        return PostRepository.create(parsedData);
    }
}

export default new PostService();