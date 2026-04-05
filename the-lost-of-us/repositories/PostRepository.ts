import { posts, PrismaClient } from "@/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "crypto";
import { CreatePostInput } from "@/src/types/post";

const prismaClient = new PrismaClient({adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })});

class PostRepository {
    async create(data: CreatePostInput): Promise<posts> {
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
}

export default new PostRepository();
