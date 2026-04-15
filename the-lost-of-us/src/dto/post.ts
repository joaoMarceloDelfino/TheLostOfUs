export type PostDTO = {
    petName: string;
    description?: string | null;
    lastSeenDate?: Date | null;
    lastSeenLatitude?: number | null;
    lastSeenLongitude?: number | null;
    userSub: string;
    imageUris?: string[];
    authorName?: string;
}