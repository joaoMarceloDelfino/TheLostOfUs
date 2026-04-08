import { posts, PrismaClient } from "@/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "crypto";
import { CreatePostSchema } from "@/schemas/createPost.schema";

const prismaClient = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });


import { UpdatePostSchema } from "@/schemas/updatePost.schema";
import { PostDTO } from "@/src/dto/post";

class PostRepository {
    async create(data: PostDTO): Promise<posts> {
        return prismaClient.posts.create({
            data: {
                id: randomUUID(),
                pet_name: data.petName,
                user_sub: data.userSub,
                description: data.description,
                last_seen_date: data.lastSeenDate ?? null,
            },
        });
    }

    async findById(id: string): Promise<posts | null> {
        return prismaClient.posts.findUnique({ where: { id } });
    }

    async findAll(): Promise<posts[]> {
        return prismaClient.posts.findMany({
            orderBy: { created_at: 'desc' },
        });
    }

    async findAllByUser(userSub: string): Promise<posts[]> {
        return prismaClient.posts.findMany({
            where: { user_sub: userSub },
            orderBy: { created_at: 'desc' },
        });
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
