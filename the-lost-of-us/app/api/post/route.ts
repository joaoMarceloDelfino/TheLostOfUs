import PostService from "@/services/PostService";
import { PostValidationError } from "@/services/PostService";
import type { CreatePostBody } from "@/src/types/post";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: CreatePostBody;

    try {
        body = (await request.json()) as CreatePostBody;
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    try {
        const post = await PostService.createPost(body);

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        if (error instanceof PostValidationError) {
            return NextResponse.json(
                {
                    error: "Invalid request data",
                    details: error.message,
                },
                { status: 400 }
            );
        }

        const message = error instanceof Error ? error.message : "Failed to create post";

        return NextResponse.json(
            {
                error: "Failed to create post",
                details: message,
            },
            { status: 500 }
        );
    }
}