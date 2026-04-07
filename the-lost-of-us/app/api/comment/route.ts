import CommentService, { CommentValidationError } from "@/services/CommentService";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const {userId} = await auth();

    if(!userId) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    let body = await req.json();

    try {
        const post = await CommentService.createComment(body, userId);

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        if (error instanceof CommentValidationError) {
            return NextResponse.json(
                {
                    error: "Invalid request data",
                    details: error.message,
                },
                { status: 400 }
            );
        }

        const message = error instanceof Error ? error.message : "Failed to create comment";

        return NextResponse.json(
            {
                error: "Failed to create comment",
                details: message,
            },
            { status: 500 }
        );
    }

}