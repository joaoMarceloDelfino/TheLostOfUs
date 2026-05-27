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
    images?: Array<{ id: string; image_uri: string }>;
};

export type CreateSightingInput = {
    postId: string;
    userSub: string;
    description?: string | null;
    location: {
        latitude: number;
        longitude: number;
    };
    images?: string[];
};

class SightingRepository {
    async findByPostId(postId: string): Promise<SightingRow[]> {
        const rows: SightingRow[] = await prismaClient.$queryRaw(Prisma.sql`
            SELECT
                s.id,
                s.post_id,
                s.user_sub,
                s.description,
                s.reported_at,
                CASE WHEN s.location IS NULL THEN NULL ELSE ST_Y(s.location::geometry)::double precision END AS location_latitude,
                CASE WHEN s.location IS NULL THEN NULL ELSE ST_X(s.location::geometry)::double precision END AS location_longitude
            FROM sightings s
            WHERE s.post_id = ${postId}::uuid
            ORDER BY s.reported_at DESC
        `);
        // Buscar imagens para cada avistamento
        for (const row of rows) {
            const images = await prismaClient.$queryRaw<Array<{ id: string; image_uri: string }>>(Prisma.sql`
                SELECT id, image_uri FROM sighting_images WHERE sighting_id = ${row.id}::uuid
            `);
            row.images = images;
        }
        return rows;
    }

    async findById(id: string): Promise<SightingRow | null> {
        const rows = await prismaClient.$queryRaw<SightingRow[]>(Prisma.sql`
            SELECT
                id,
                post_id,
                user_sub,
                description,
                reported_at,
                CASE WHEN location IS NULL THEN NULL ELSE ST_Y(location::geometry)::double precision END AS location_latitude,
                CASE WHEN location IS NULL THEN NULL ELSE ST_X(location::geometry)::double precision END AS location_longitude
            FROM sightings
            WHERE id = ${id}::uuid
            LIMIT 1
        `);
        const row = rows[0];
        if (!row) return null;
        const images = await prismaClient.$queryRaw<Array<{ id: string; image_uri: string }>>(Prisma.sql`
            SELECT id, image_uri FROM sighting_images WHERE sighting_id = ${row.id}::uuid
        `);
        row.images = images;
        return row;
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

        // Salvar imagens, se houver
        if (data.images && data.images.length > 0) {
            for (const imageUrl of data.images) {
                await prismaClient.$executeRaw(Prisma.sql`
                    INSERT INTO sighting_images (
                        id, sighting_id, image_uri
                    ) VALUES (
                        gen_random_uuid(),
                        ${sightingId}::uuid,
                        ${imageUrl}
                    )
                `);
            }
        }

        const created = await this.findById(sightingId);
        if (!created) {
            throw new Error("Failed to create sighting");
        }

        return created;
    }
}

export default new SightingRepository();