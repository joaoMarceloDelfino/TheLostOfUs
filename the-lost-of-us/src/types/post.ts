export type CreatePostBody = {
    petName: string;
    userSub: string;
    description: string | null;
    lastSeenDate?: string | null;
};

export type CreatePostInput = {
    petName: string;
    userSub: string;
    description: string | null;
    lastSeenDate?: Date | null;
};