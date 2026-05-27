import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import NotificationsService from "@/services/NotificationsService";

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const countOnly = url.searchParams.get("countOnly");

    try {
        if (countOnly === "1") {
            const cnt = await NotificationsService.countUnread(userId);
            return NextResponse.json({ count: cnt }, { status: 200 });
        }

        const notifications = await NotificationsService.listNotifications(userId, 100, 0);
        // DEBUG LOG
        const all = await NotificationsService.listNotifications("", 100, 0); // sem filtro
        console.log("[API/notification] userId:", userId, "notifications:", notifications, "ALL:", all);
        return NextResponse.json(notifications, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const ids: string[] | undefined = body?.ids;
        const markAll: boolean | undefined = body?.markAll;

        if (markAll) {
            await NotificationsService.markAsRead(undefined, userId);
            return NextResponse.json({ ok: true }, { status: 200 });
        }

        if (ids && Array.isArray(ids) && ids.length > 0) {
            await NotificationsService.markAsRead(ids, undefined);
            return NextResponse.json({ ok: true }, { status: 200 });
        }

        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
    }
}
