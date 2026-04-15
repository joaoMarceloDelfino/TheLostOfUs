import PostRepository from "@/repositories/PostRepository";
import { posts } from "@/src/generated/prisma/browser";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { clerkClient } from "@clerk/nextjs/server";

import { parseCreatePostBodyWithZod } from "@/schemas/createPost.schema";
import { parseUpdatePostBodyWithZod, UpdatePostSchema } from "@/schemas/updatePost.schema";
import { PostDTO } from "@/src/dto/post";
import { reverseGeocodeLocation } from "@/lib/location";

export class PostValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PostValidationError";
    }
}

type PostWithImages = posts & {
    petimages: { id: string; post_id: string; image_uri: string }[];
    last_seen_location_latitude: number | null;
    last_seen_location_longitude: number | null;
    last_seen_location_label?: string | null;
};

type PostWithAuthorName = PostWithImages & {
    authorName: string;
};

type ClerkUserLike = {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    primaryEmailAddress?: { emailAddress?: string | null } | null;
    emailAddresses?: Array<{ emailAddress?: string | null }>;
};

class PostService {
    private readonly authorFallback = "Autor desconhecido";

    private resolveAuthorName(user?: ClerkUserLike): string {
        if (!user) {
            return this.authorFallback;
        }

        const fullName = [user.firstName, user.lastName]
            .filter((value): value is string => Boolean(value && value.trim()))
            .join(" ")
            .trim();

        if (fullName) {
            return fullName;
        }

        if (user.username && user.username.trim()) {
            return user.username.trim();
        }

        const primaryEmail = user.primaryEmailAddress?.emailAddress?.trim();
        if (primaryEmail) {
            return primaryEmail;
        }

        const firstEmail = user.emailAddresses?.find((email) => email.emailAddress?.trim())?.emailAddress?.trim();
        if (firstEmail) {
            return firstEmail;
        }

        return this.authorFallback;
    }

    private async getAuthorNameMap(userSubs: string[]): Promise<Map<string, string>> {
        const uniqueSubs = Array.from(new Set(userSubs.filter((value) => Boolean(value && value.trim()))));

        if (!uniqueSubs.length) {
            return new Map();
        }

        try {
            const client = await clerkClient();
            const usersResponse = await client.users.getUserList({
                userId: uniqueSubs,
                limit: uniqueSubs.length,
            });

            const authorMap = new Map<string, string>();
            usersResponse.data.forEach((user) => {
                const typedUser = user as ClerkUserLike;
                authorMap.set(typedUser.id, this.resolveAuthorName(typedUser));
            });

            return authorMap;
        } catch {
            return new Map();
        }
    }

    private async attachAuthorName(postsList: PostWithImages[]): Promise<PostWithAuthorName[]> {
        const authorMap = await this.getAuthorNameMap(postsList.map((post) => post.user_sub));

        return postsList.map((post) => ({
            ...post,
            authorName: authorMap.get(post.user_sub) ?? this.authorFallback,
        }));
    }

    private async attachLocationLabel(postsList: PostWithAuthorName[]): Promise<PostWithAuthorName[]> {
        const uniqueLocations = new Map<string, { latitude: number; longitude: number }>();

        postsList.forEach((post) => {
            if (post.last_seen_location_latitude == null || post.last_seen_location_longitude == null) {
                return;
            }

            const cacheKey = `${post.last_seen_location_latitude.toFixed(6)},${post.last_seen_location_longitude.toFixed(6)}`;
            if (!uniqueLocations.has(cacheKey)) {
                uniqueLocations.set(cacheKey, {
                    latitude: post.last_seen_location_latitude,
                    longitude: post.last_seen_location_longitude,
                });
            }
        });

        const labelEntries = await Promise.all(
            Array.from(uniqueLocations.entries()).map(async ([cacheKey, location]) => {
                const label = await reverseGeocodeLocation(location);
                return [cacheKey, label] as const;
            })
        );

        const labelMap = new Map(labelEntries);

        return postsList.map((post) => {
            if (post.last_seen_location_latitude == null || post.last_seen_location_longitude == null) {
                return post;
            }

            const cacheKey = `${post.last_seen_location_latitude.toFixed(6)},${post.last_seen_location_longitude.toFixed(6)}`;

            return {
                ...post,
                last_seen_location_label: labelMap.get(cacheKey) ?? null,
            };
        });
    }

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

        if (parsedData.lastSeenLatitude === undefined || parsedData.lastSeenLongitude === undefined) {
            throw new PostValidationError("Location is required.");
        }

        const imageUris = await this.saveImages(parsedData.images ?? []);

        const input: PostDTO = {
            petName: parsedData.petName.trim(),
            userSub: userSub,
            description: parsedData.description ?? null,
            lastSeenDate: parsedData.lastSeenDate,
            lastSeenLatitude: parsedData.lastSeenLatitude,
            lastSeenLongitude: parsedData.lastSeenLongitude,
            imageUris,
        };

        const createdPost = await PostRepository.create(input);
        const [enrichedPost] = await this.attachAuthorName([createdPost]);
        const [labeledPost] = await this.attachLocationLabel([enrichedPost]);
        return labeledPost;
    }

    async getAllPosts(): Promise<PostWithAuthorName[]> {
        const postsList = await PostRepository.findAll();
        const withAuthors = await this.attachAuthorName(postsList);
        return this.attachLocationLabel(withAuthors);
    }

    async getAllPostsByUser(userSub: string): Promise<PostWithAuthorName[]> {
        const postsList = await PostRepository.findAllByUser(userSub);
        const withAuthors = await this.attachAuthorName(postsList);
        return this.attachLocationLabel(withAuthors);
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

    async updatePost(id: string, data: unknown, userSub: string): Promise<PostWithAuthorName | null> {
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
            ...(parsedData.lastSeenLatitude !== undefined && { lastSeenLatitude: parsedData.lastSeenLatitude }),
            ...(parsedData.lastSeenLongitude !== undefined && { lastSeenLongitude: parsedData.lastSeenLongitude }),
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

        if (!updatedPost) {
            return null;
        }

        const [enrichedPost] = await this.attachAuthorName([updatedPost]);
        const [labeledPost] = await this.attachLocationLabel([enrichedPost]);
        return labeledPost;
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