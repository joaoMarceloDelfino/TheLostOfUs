import { reverseGeocodeLocation } from "@/lib/location";
import PostService from "@/services/PostService";
import SightingRepository, { CreateSightingInput, SightingRow } from "@/repositories/SightingRepository";
import NotificationsService from "@/services/NotificationsService";
import { parseCreateSightingBodyWithZod, type CreateSightingSchema } from "@/schemas/createSighting.schema";
import { clerkClient } from "@clerk/nextjs/server";

export class SightingValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SightingValidationError";
    }
}

export type SightingResponse = SightingRow & {
    locationLabel: string | null;
    authorName?: string;
};

export type SightingListItem = SightingResponse;

type ClerkUserLike = {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    primaryEmailAddress?: { emailAddress?: string | null } | null;
    emailAddresses?: Array<{ emailAddress?: string | null }>;
};

class SightingService {
    private readonly authorFallback = "Autor desconhecido";

    private parseValidation<T>(parser: (body: unknown) => T, body: unknown): T {
        try {
            return parser(body);
        } catch (err: any) {
            if (err?.name === "ZodError" && Array.isArray(err.issues)) {
                throw new SightingValidationError(err.issues[0]?.message || "Invalid request body.");
            }
            throw new SightingValidationError(err?.message || "Invalid request body.");
        }
    }

    private resolveAuthorName(user?: ClerkUserLike): string {
        if (!user) {
            return this.authorFallback;
        }

        const fullName = [user.firstName, user.lastName]
            .filter((value): value is string => Boolean(value && value.trim()))
            .join(" ")
            .trim();

        if (fullName) {
            return fullName;
        }

        if (user.username && user.username.trim()) {
            return user.username.trim();
        }

        const primaryEmail = user.primaryEmailAddress?.emailAddress?.trim();
        if (primaryEmail) {
            return primaryEmail;
        }

        const firstEmail = user.emailAddresses?.find((email) => email.emailAddress?.trim())?.emailAddress?.trim();
        if (firstEmail) {
            return firstEmail;
        }

        return this.authorFallback;
    }

    private async getAuthorNameMap(userSubs: string[]): Promise<Map<string, string>> {
        const uniqueSubs = Array.from(new Set(userSubs.filter((value) => Boolean(value && value.trim()))));

        if (!uniqueSubs.length) {
            return new Map();
        }

        try {
            const client = await clerkClient();
            const usersResponse = await client.users.getUserList({
                userId: uniqueSubs,
                limit: uniqueSubs.length,
            });

            const authorMap = new Map<string, string>();
            usersResponse.data.forEach((user) => {
                const typedUser = user as ClerkUserLike;
                authorMap.set(typedUser.id, this.resolveAuthorName(typedUser));
            });

            return authorMap;
        } catch {
            return new Map();
        }
    }

    private async enrichSightings(rows: SightingRow[]): Promise<SightingResponse[]> {
        const authorMap = await this.getAuthorNameMap(rows.map((row) => row.user_sub));

        return Promise.all(rows.map(async (row) => {
            const location =
                row.location_latitude != null && row.location_longitude != null
                    ? {
                        latitude: row.location_latitude,
                        longitude: row.location_longitude,
                    }
                    : null;

            const locationLabel = location ? await reverseGeocodeLocation(location) : null;

            return {
                ...row,
                locationLabel,
                authorName: authorMap.get(row.user_sub) ?? this.authorFallback,
            };
        }));
    }

    async createSighting(body: unknown, userSub: string): Promise<SightingResponse> {
        const parsedBody: CreateSightingSchema = this.parseValidation(parseCreateSightingBodyWithZod, body);

        const parentPost = await PostService.findById(parsedBody.postId);
        if (!parentPost) {
            throw new SightingValidationError("Post not found!");
        }


        // Impede o dono do post de registrar avistamento
        if (parentPost.user_sub === userSub) {
            throw new SightingValidationError("Você não pode registrar um avistamento no seu próprio post.");
        }

        const input: CreateSightingInput = {
            postId: parsedBody.postId,
            userSub,
            description: parsedBody.description ?? null,
            location: parsedBody.location,
        };

        const created = await SightingRepository.create(input);
        const locationLabel = await reverseGeocodeLocation(parsedBody.location);

        // create a notification for the owner of the post (if different from reporter)
        try {
            if (parentPost.user_sub && parentPost.user_sub !== userSub) {
                const notif = await NotificationsService.createNotification({
                    recipientSub: parentPost.user_sub,
                    actorSub: userSub,
                    postId: parsedBody.postId,
                    sightingId: created.id,
                    type: "SIGHTING",
                    data: { description: parsedBody.description ?? null },
                });
                console.log("[SightingService] Notificação criada:", notif);
            } else {
                console.log("[SightingService] Não criou notificação: mesmo userSub ou user_sub ausente");
            }
        } catch (err) {
            console.error("[SightingService] Erro ao criar notificação:", err);
        }

        return {
            ...created,
            locationLabel,
        };
    }

    async listSightings(postId: string): Promise<SightingListItem[]> {
        if (!postId) {
            throw new SightingValidationError("postId is required.");
        }

        const parentPost = await PostService.findById(postId);
        if (!parentPost) {
            throw new SightingValidationError("Post not found!");
        }

        const rows = await SightingRepository.findByPostId(postId);
        return this.enrichSightings(rows);
    }
}

export default new SightingService();