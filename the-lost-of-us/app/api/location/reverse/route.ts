import { reverseGeocodeLocation } from "@/lib/location";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const lat = Number(url.searchParams.get("lat"));
    const lng = Number(url.searchParams.get("lng"));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const label = await reverseGeocodeLocation({ latitude: lat, longitude: lng });

    return NextResponse.json({ label }, { status: 200 });
}