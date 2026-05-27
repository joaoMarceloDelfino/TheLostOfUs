import { Prisma, PrismaClient } from "@/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClient = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

export type NotificationRow = {
    id: string;
    recipient_sub: string;
    actor_sub: string | null;
    post_id: string | null;
    sighting_id: string | null;
    type: string;
    data: any | null;
    read: boolean;
    created_at: Date;
};

type CreateNotificationInput = {
    recipientSub: string;
    actorSub?: string | null;
    postId?: string | null;
    sightingId?: string | null;
    type: string;
    data?: unknown | null;
};

class NotificationsRepository {
    async create(input: CreateNotificationInput): Promise<NotificationRow> {
        const idRows = await prismaClient.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            SELECT gen_random_uuid()::text AS id
        `);

        const notificationId = idRows[0]?.id;
        if (!notificationId) throw new Error("Failed to generate notification id");

        await prismaClient.$executeRaw(Prisma.sql`
            INSERT INTO notifications (
                id,
                recipient_sub,
                actor_sub,
                post_id,
                sighting_id,
                type,
                data,
                read,
                created_at
            ) VALUES (
                ${notificationId}::uuid,
                ${input.recipientSub},
                ${input.actorSub ?? null},
                ${input.postId ?? null}::uuid,
                ${input.sightingId ?? null}::uuid,
                ${input.type},
                ${input.data ? JSON.stringify(input.data) : null}::json,
                false,
                NOW()
            )
        `);

        const created = await this.findById(notificationId);
        if (!created) throw new Error("Failed to create notification");
        return created;
    }

    async findById(id: string): Promise<NotificationRow | null> {
        const rows = await prismaClient.$queryRaw<NotificationRow[]>(Prisma.sql`
            SELECT id, recipient_sub, actor_sub, post_id, sighting_id, type, data, read, created_at
            FROM notifications
            WHERE id = ${id}::uuid
            LIMIT 1
        `);

        return rows[0] ?? null;
    }

    async findByRecipient(recipientSub: string, limit = 50, offset = 0): Promise<NotificationRow[]> {
        if (!recipientSub) {
            return prismaClient.$queryRaw<NotificationRow[]>(Prisma.sql`
                SELECT id, recipient_sub, actor_sub, post_id, sighting_id, type, data, read, created_at
                FROM notifications
                ORDER BY created_at DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `);
        }
        return prismaClient.$queryRaw<NotificationRow[]>(Prisma.sql`
            SELECT id, recipient_sub, actor_sub, post_id, sighting_id, type, data, read, created_at
            FROM notifications
            WHERE recipient_sub = ${recipientSub}
            ORDER BY created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
        `);
    }

    async countUnread(recipientSub: string): Promise<number> {
        const rows = await prismaClient.$queryRaw<Array<{ cnt: number }>>(Prisma.sql`
            SELECT COUNT(*)::int AS cnt
            FROM notifications
            WHERE recipient_sub = ${recipientSub} AND read = false
        `);

        return rows[0]?.cnt ?? 0;
    }

    async markAsRead(ids?: string[], recipientSub?: string): Promise<void> {
        if (ids && ids.length > 0) {
            await prismaClient.$executeRaw(Prisma.sql`
                UPDATE notifications
                SET read = true
                WHERE id IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))})
            `);
            return;
        }

        if (recipientSub) {
            await prismaClient.$executeRaw(Prisma.sql`
                UPDATE notifications
                SET read = true
                WHERE recipient_sub = ${recipientSub}
            `);
            return;
        }
    }
}

export default new NotificationsRepository();
