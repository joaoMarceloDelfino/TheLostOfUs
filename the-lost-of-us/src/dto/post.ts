export type PostDTO = {
    petName: string;
    description?: string | null;
    lastSeenDate?: Date | null;
    userSub: string;
    imageUris?: string[];
}