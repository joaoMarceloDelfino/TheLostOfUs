export async function GET() {
    try {
        const posts = await PostService.getAllPosts();
        return NextResponse.json(posts, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch posts";
        return NextResponse.json(
            {
                error: "Failed to fetch posts",
                details: message,
            },
            { status: 500 }
        );
    }
}
import PostService from "@/services/PostService";
import { PostValidationError } from "@/services/PostService";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }

    try {
        const deleted = await PostService.deletePost(id, userId);
        return NextResponse.json(deleted, { status: 200 });
    } catch (error) {
        if (error instanceof PostValidationError && error.message === "Post not found") {
            return NextResponse.json(
                {
                    error: "Post not found",
                },
                { status: 404 }
            );
        }
        if (error instanceof PostValidationError && error.message === "You are not allowed to delete this post") {
            return NextResponse.json(
                {
                    error: "You are not allowed to delete this post",
                },
                { status: 403 }
            );
        }
        const message = error instanceof Error ? error.message : "Failed to delete post";
        return NextResponse.json(
            {
                error: "Failed to delete post",
                details: message,
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") || "";
    let body: unknown;

    if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const newImages = formData.getAll("newImages").filter((value): value is File => {
            return typeof value === "object" && value !== null && "arrayBuffer" in value && "name" in value;
        });
        const description = formData.get("description");
        const lastSeenDate = formData.get("lastSeenDate");
        const imagesToKeep = formData.get("imagesToKeep");

        body = {
            petName: formData.get("petName"),
            description: description ? String(description) : null,
            lastSeenDate: lastSeenDate ? String(lastSeenDate) : null,
            imagesToKeep: imagesToKeep === null ? undefined : String(imagesToKeep),
            newImages,
        };
    } else {
        body = await request.json();
    }

    try {
        const post = await PostService.updatePost(id, body, userId);
        return NextResponse.json(post, { status: 200 });
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

        const message = error instanceof Error ? error.message : "Failed to update post";

        return NextResponse.json(
            {
                error: "Failed to update post",
                details: message,
            },
            { status: 500 }
        );
    }
}


export async function POST(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    let body: unknown;

    if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const images = formData.getAll("images").filter((value): value is File => value instanceof File);
        const description = formData.get("description");
        const lastSeenDate = formData.get("lastSeenDate");

        body = {
            petName: formData.get("petName"),
            description: description ? String(description) : null,
            lastSeenDate: lastSeenDate ? String(lastSeenDate) : null,
            images,
        };
    } else {
        body = await request.json();
    }

    try {
        const post = await PostService.createPost(body, userId);

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