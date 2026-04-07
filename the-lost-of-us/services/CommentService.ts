import CommentRepository from "@/repositories/CommentRepository";
import { CreateCommentSchema, parseCreateCommentBodyWithZod } from "@/schemas/createComment.schema";
import { CommentDTO } from "@/src/dto/comment";
import { comments } from "@/src/generated/prisma/client";
import PostService from "./PostService";


export class CommentValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CommentValidationError";
    }
}

class CommentService {
   async createComment(body: unknown, userSub: string): Promise<comments> {
        let parsedBody: CreateCommentSchema;
        try {
            parsedBody = parseCreateCommentBodyWithZod(body);
        } catch (err: any) {
            if (err?.name === "ZodError" && Array.isArray(err.issues)) {
                throw new CommentValidationError(err.issues[0]?.message || "Invalid request body.");
            }
            throw new CommentValidationError(err?.message || "Invalid request body.");
        }

        
        const parentPost = await PostService.findById(parsedBody.postId);

        if(!parentPost) {
            throw new CommentValidationError("Post not found!")
        }

        const inputBody: CommentDTO = {
            postId: parsedBody.postId,
            commentText: parsedBody.commentText,
            userSub: userSub
        }

        return CommentRepository.create(inputBody);
    }
}

export default new CommentService();