import { Prisma, PrismaClient } from "@/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClient = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

export type SightingRow = {
    id: string;
    post_id: string;
    user_sub: string;
    description: string | null;
    reported_at: Date;
    location_latitude: number | null;
    location_longitude: number | null;
};

export type CreateSightingInput = {
    postId: string;
    userSub: string;
    description?: string | null;
    location: {
        latitude: number;
        longitude: number;
    };
};

class SightingRepository {
    async findByPostId(postId: string): Promise<SightingRow[]> {
        return prismaClient.$queryRaw<SightingRow[]>(Prisma.sql`
            SELECT
                id,
                post_id,
                user_sub,
                description,
                reported_at,
                CASE
                    WHEN location IS NULL THEN NULL
                    ELSE ST_Y(location::geometry)::double precision
                END AS location_latitude,
                CASE
                    WHEN location IS NULL THEN NULL
                    ELSE ST_X(location::geometry)::double precision
                END AS location_longitude
            FROM sightings
            WHERE post_id = ${postId}::uuid
            ORDER BY reported_at DESC
        `);
    }

    async findById(id: string): Promise<SightingRow | null> {
        const rows = await prismaClient.$queryRaw<SightingRow[]>(Prisma.sql`
            SELECT
                id,
                post_id,
                user_sub,
                description,
                reported_at,
                CASE
                    WHEN location IS NULL THEN NULL
                    ELSE ST_Y(location::geometry)::double precision
                END AS location_latitude,
                CASE
                    WHEN location IS NULL THEN NULL
                    ELSE ST_X(location::geometry)::double precision
                END AS location_longitude
            FROM sightings
            WHERE id = ${id}::uuid
            LIMIT 1
        `);

        return rows[0] ?? null;
    }

    async create(data: CreateSightingInput): Promise<SightingRow> {
        const idRows = await prismaClient.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            SELECT gen_random_uuid()::text AS id
        `);
        const sightingId = idRows[0]?.id;

        if (!sightingId) {
            throw new Error("Failed to generate sighting id");
        }

        await prismaClient.$executeRaw(Prisma.sql`
            INSERT INTO sightings (
                id,
                post_id,
                user_sub,
                description,
                location,
                reported_at
            ) VALUES (
                ${sightingId}::uuid,
                ${data.postId}::uuid,
                ${data.userSub},
                ${data.description ?? null},
                ST_SetSRID(ST_MakePoint(${data.location.longitude}, ${data.location.latitude}), 4326)::geography,
                NOW()
            )
        `);

        const created = await this.findById(sightingId);
        if (!created) {
            throw new Error("Failed to create sighting");
        }

        return created;
    }
}

export default new SightingRepository();