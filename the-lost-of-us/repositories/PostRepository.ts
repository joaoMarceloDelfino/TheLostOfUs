import { posts, Prisma, PrismaClient } from "@/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "crypto";

const prismaClient = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });


import { UpdatePostSchema } from "@/schemas/updatePost.schema";
import { PostDTO } from "@/src/dto/post";

type PostImageRow = {
    id: string;
    post_id: string;
    image_uri: string;
};

type PostLocationRow = {
    id: string;
    last_seen_location_latitude: number | null;
    last_seen_location_longitude: number | null;
    last_seen_location_label?: string | null;
};

type PostWithImages = posts & {
    petimages: PostImageRow[];
};

type PostWithLocation = PostWithImages & PostLocationRow;

type LocationInput = {
    latitude: number;
    longitude: number;
} | null;

type RawExecutor = {
    $executeRaw: PrismaClient["$executeRaw"];
    $queryRaw: PrismaClient["$queryRaw"];
};

class PostRepository {
    private async setLocation(client: RawExecutor, postId: string, location: LocationInput | undefined): Promise<void> {
        if (location === undefined) {
            return;
        }

        if (location === null) {
            await client.$executeRaw(Prisma.sql`
                UPDATE posts
                SET last_seen_location = NULL
                WHERE id = ${postId}
            `);
            return;
        }

        await client.$executeRaw(Prisma.sql`
            UPDATE posts
            SET last_seen_location = ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography
            WHERE id = ${postId}
        `);
    }

    private async getLocations(postIds: string[]): Promise<Map<string, PostLocationRow>> {
        const uniquePostIds = Array.from(new Set(postIds));

        if (!uniquePostIds.length) {
            return new Map();
        }

        const rows = await prismaClient.$queryRaw<PostLocationRow[]>(Prisma.sql`
            SELECT
                id,
                CASE
                    WHEN last_seen_location IS NULL THEN NULL
                    ELSE ST_Y(last_seen_location::geometry)::double precision
                END AS last_seen_location_latitude,
                CASE
                    WHEN last_seen_location IS NULL THEN NULL
                    ELSE ST_X(last_seen_location::geometry)::double precision
                END AS last_seen_location_longitude
            FROM posts
            WHERE id IN (${Prisma.join(uniquePostIds)})
        `);

        return new Map(rows.map((row) => [row.id, row]));
    }

    private async attachLocations(postsList: PostWithImages[]): Promise<PostWithLocation[]> {
        const locationMap = await this.getLocations(postsList.map((post) => post.id));

        return postsList.map((post) => {
            const location = locationMap.get(post.id);

            return {
                ...post,
                last_seen_location_latitude: location?.last_seen_location_latitude ?? null,
                last_seen_location_longitude: location?.last_seen_location_longitude ?? null,
                last_seen_location_label: location?.last_seen_location_label ?? null,
            };
        });
    }

    async create(data: PostDTO): Promise<PostWithLocation> {
        const createdPostId = await prismaClient.$transaction(async (tx) => {
            const createdPost = await tx.posts.create({
                data: {
                    id: randomUUID(),
                    pet_name: data.petName,
                    user_sub: data.userSub,
                    description: data.description,
                    last_seen_date: data.lastSeenDate ?? null,
                },
            });

            await this.setLocation(tx, createdPost.id, data.lastSeenLatitude !== undefined && data.lastSeenLongitude !== undefined
                ? {
                    latitude: data.lastSeenLatitude as number,
                    longitude: data.lastSeenLongitude as number,
                }
                : undefined);

            if (data.imageUris && data.imageUris.length > 0) {
                await tx.petimages.createMany({
                    data: data.imageUris.map((uri) => ({
                        id: randomUUID(),
                        post_id: createdPost.id,
                        image_uri: uri,
                    })),
                });
            }

            return createdPost.id;
        });

        const post = await this.findByIdWithImages(createdPostId);

        if (!post) {
            throw new Error("Failed to load created post.");
        }

        return post;
    }

    async findById(id: string): Promise<posts | null> {
        return prismaClient.posts.findUnique({ where: { id } });
    }

    async findByIdWithImages(id: string): Promise<PostWithLocation | null> {
        const post = await prismaClient.posts.findUnique({
            where: { id },
            include: {
                petimages: {
                    select: { id: true, image_uri: true },
                },
            },
        }) as PostWithImages | null;

        if (!post) {
            return null;
        }

        const [enrichedPost] = await this.attachLocations([post]);
        return enrichedPost;
    }

    async findAll(): Promise<PostWithLocation[]> {
        const postsList = await prismaClient.posts.findMany({
            include: { petimages: true },
            orderBy: { created_at: 'desc' },
        }) as PostWithImages[];

        return this.attachLocations(postsList);
    }

    async findAllByUser(userSub: string): Promise<PostWithLocation[]> {
        const postsList = await prismaClient.posts.findMany({
            where: { user_sub: userSub },
            include: { petimages: true },
            orderBy: { created_at: 'desc' },
        }) as PostWithImages[];

        return this.attachLocations(postsList);
    }

    async update(id: string, data: UpdatePostSchema): Promise<PostWithLocation | null> {
        await prismaClient.$transaction(async (tx) => {
            await tx.posts.update({
                where: { id },
                data: {
                    ...(data.petName !== undefined && { pet_name: data.petName }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.lastSeenDate !== undefined && { last_seen_date: data.lastSeenDate }),
                },
            });

            if (data.lastSeenLatitude !== undefined && data.lastSeenLongitude !== undefined) {
                await this.setLocation(tx, id, data.lastSeenLatitude === null || data.lastSeenLongitude === null
                    ? null
                    : {
                        latitude: data.lastSeenLatitude,
                        longitude: data.lastSeenLongitude,
                    });
            }
        });

        return this.findByIdWithImages(id);
    }

    async syncPostImages(postId: string, keepImageIds: string[], newImageUris: string[]): Promise<void> {
        await prismaClient.$transaction(async (tx) => {
            if (keepImageIds.length > 0) {
                await tx.petimages.deleteMany({
                    where: {
                        post_id: postId,
                        id: { notIn: keepImageIds },
                    },
                });
            } else {
                await tx.petimages.deleteMany({
                    where: { post_id: postId },
                });
            }

            if (newImageUris.length > 0) {
                await tx.petimages.createMany({
                    data: newImageUris.map((uri) => ({
                        id: randomUUID(),
                        post_id: postId,
                        image_uri: uri,
                    })),
                });
            }
        });
    }

    async delete(id: string): Promise<posts | null> {
        try {
            return await prismaClient.posts.delete({ where: { id } });
        } catch (error: any) {
            if (error.code === 'P2025') { // Prisma: record not found
                return null;
            }
            throw error;
        }
    }
}

export default new PostRepository();
