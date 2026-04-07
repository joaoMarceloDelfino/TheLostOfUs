import { CreateCommentSchema } from "@/schemas/createComment.schema";
import { CreatePostSchema } from "@/schemas/createPost.schema";
import { CommentDTO } from "@/src/dto/comment";
import { comments } from "@/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client/extension";

const prismaClient = new PrismaClient({adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })});

class CommentRepository {

    async create(data: CommentDTO): Promise<comments> {
        return prismaClient.comments.create({
            data: {
                post_id: data.postId,
                user_sub: data.userSub,
                commentText: data.commentText,
            }
        })
    }
}

export default new CommentRepository();