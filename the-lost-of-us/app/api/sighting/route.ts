import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import SightingService, { SightingValidationError } from "@/services/SightingService";

function validationResponse(error: unknown, fallback: string) {
    if (error instanceof SightingValidationError) {
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

export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    try {
        const sighting = await SightingService.createSighting(body, userId);
        return NextResponse.json(sighting, { status: 201 });
    } catch (error) {
        return validationResponse(error, "Failed to create sighting");
    }
}

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const postId = url.searchParams.get("postId");

    if (!postId) {
        return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    try {
        const sightings = await SightingService.listSightings(postId);
        return NextResponse.json(sightings, { status: 200 });
    } catch (error) {
        return validationResponse(error, "Failed to list sightings");
    }
}