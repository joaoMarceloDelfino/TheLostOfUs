import PostService from "@/services/PostService";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const posts = await PostService.getAllPostsByUser(userId);
        return NextResponse.json(posts, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch user posts";
        return NextResponse.json(
            {
                error: "Failed to fetch user posts",
                details: message,
            },
            { status: 500 }
        );
    }
}
