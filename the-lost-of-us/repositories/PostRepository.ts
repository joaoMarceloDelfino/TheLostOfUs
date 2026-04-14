import { posts, PrismaClient } from "@/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "crypto";

const prismaClient = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });


import { UpdatePostSchema } from "@/schemas/updatePost.schema";
import { PostDTO } from "@/src/dto/post";

class PostRepository {
    async create(data: PostDTO): Promise<posts> {
        return prismaClient.$transaction(async (tx) => {
            const createdPost = await tx.posts.create({
                data: {
                    id: randomUUID(),
                    pet_name: data.petName,
                    user_sub: data.userSub,
                    description: data.description,
                    last_seen_date: data.lastSeenDate ?? null,
                },
            });

            if (data.imageUris && data.imageUris.length > 0) {
                await tx.petimages.createMany({
                    data: data.imageUris.map((uri) => ({
                        id: randomUUID(),
                        post_id: createdPost.id,
                        image_uri: uri,
                    })),
                });
            }

            return createdPost;
        });
    }

    async findById(id: string): Promise<posts | null> {
        return prismaClient.posts.findUnique({ where: { id } });
    }

    async findByIdWithImages(id: string): Promise<(posts & { petimages: { id: string; image_uri: string }[] }) | null> {
        return prismaClient.posts.findUnique({
            where: { id },
            include: {
                petimages: {
                    select: { id: true, image_uri: true },
                },
            },
        }) as Promise<(posts & { petimages: { id: string; image_uri: string }[] }) | null>;
    }

    async findAll(): Promise<(posts & { petimages: any[] })[]> {
        return prismaClient.posts.findMany({
            include: { petimages: true },
            orderBy: { created_at: 'desc' },
        }) as Promise<(posts & { petimages: any[] })[]>;
    }

    async findAllByUser(userSub: string): Promise<(posts & { petimages: any[] })[]> {
        return prismaClient.posts.findMany({
            where: { user_sub: userSub },
            include: { petimages: true },
            orderBy: { created_at: 'desc' },
        }) as Promise<(posts & { petimages: any[] })[]>;
    }

    async update(id: string, data: UpdatePostSchema): Promise<posts | null> {
        return prismaClient.posts.update({
            where: { id },
            data: {
                ...(data.petName !== undefined && { pet_name: data.petName }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.lastSeenDate !== undefined && { last_seen_date: data.lastSeenDate }),
            },
        });
    }

    async syncPostImages(postId: string, keepImageIds: string[], newImageUris: string[]): Promise<void> {
        await prismaClient.$transaction(async (tx) => {
            if (keepImageIds.length > 0) {
                await tx.petimages.deleteMany({
                    where: {
                        post_id: postId,
                        id: { notIn: keepImageIds },
                    },
                });
            } else {
                await tx.petimages.deleteMany({
                    where: { post_id: postId },
                });
            }

            if (newImageUris.length > 0) {
                await tx.petimages.createMany({
                    data: newImageUris.map((uri) => ({
                        id: randomUUID(),
                        post_id: postId,
                        image_uri: uri,
                    })),
                });
            }
        });
    }

    async delete(id: string): Promise<posts | null> {
        try {
            return await prismaClient.posts.delete({ where: { id } });
        } catch (error: any) {
            if (error.code === 'P2025') { // Prisma: record not found
                return null;
            }
            throw error;
        }
    }
}

export default new PostRepository();
