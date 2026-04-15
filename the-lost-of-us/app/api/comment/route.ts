import CommentService, { CommentValidationError } from "@/services/CommentService";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

function validationResponse(error: unknown, fallback: string) {
    if (error instanceof CommentValidationError) {
        return NextResponse.json(
            {
                error: fallback,
                details: error.message,
            },
            { status: 400 }
        );
    }

    const message = error instanceof Error ? error.message : fallback;
    return NextResponse.json(
        {
            error: fallback,
            details: message,
        },
        { status: 500 }
    );
}

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    const url = new URL(req.url);
    const postId = url.searchParams.get("postId");

    if (!postId) {
        return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    try {
        const comments = await CommentService.listComments(postId, userId ?? null);
        return NextResponse.json(comments, { status: 200 });
    } catch (error) {
        return validationResponse(error, "Failed to list comments");
    }
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    try {
        const comment = await CommentService.createComment(body, userId);
        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        return validationResponse(error, "Failed to create comment");
    }
}

export async function PUT(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    try {
        const comment = await CommentService.updateComment(body, userId);
        return NextResponse.json(comment, { status: 200 });
    } catch (error) {
        return validationResponse(error, "Failed to update comment");
    }
}

export async function PATCH(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const action = body?.action;

    try {
        if (action === "vote") {
            const comment = await CommentService.voteComment(body, userId);
            return NextResponse.json(comment, { status: 200 });
        }

        // Denúncia de comentário desativada por enquanto.
        // if (action === "report") {
        //     const result = await CommentService.reportComment(body, userId);
        //     return NextResponse.json(result, { status: 200 });
        // }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        return validationResponse(error, "Failed to update comment action");
    }
}

export async function DELETE(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const commentId = url.searchParams.get("id");

    if (!commentId) {
        return NextResponse.json({ error: "Missing comment id" }, { status: 400 });
    }

    try {
        await CommentService.deleteComment(commentId, userId);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return validationResponse(error, "Failed to delete comment");
    }
}