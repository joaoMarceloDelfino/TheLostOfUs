import axios from "axios";

export type CommentApiResponse = {
    id: string;
    postId: string;
    parentCommentId: string | null;
    userSub: string;
    postUserSub: string;
    commentText: string;
    likesCount: number;
    dislikesCount: number;
    reportsCount: number;
    score: number;
    userVote: number | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    canEdit: boolean;
    canDelete: boolean;
    replies: CommentApiResponse[];
};

export type PostApiResponse = {
    id: string;
    user_sub: string;
    pet_name: string;
    description?: string | null;
    last_seen_date?: string | Date | null;
    last_seen_location_latitude?: number | null;
    last_seen_location_longitude?: number | null;
    last_seen_location_label?: string | null;
    created_at: string | Date;
    petimages?: Array<{
        id: string;
        post_id: string;
        image_uri: string;
    }>;
    authorName?: string;
};

const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

function authHeader(token?: string) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeFiles(images: unknown): File[] {
    if (!images) {
        return [];
    }
    if (images instanceof FileList) {
        return Array.from(images);
    }
    if (Array.isArray(images)) {
        return images.filter((item): item is File => item instanceof File);
    }
    return [];
}

export async function getUserPosts(token?: string): Promise<PostApiResponse[]> {
    const response = await api.get("/post/user", {
        headers: authHeader(token),
    });
    return response.data;
}

export async function getPosts(token?: string): Promise<PostApiResponse[]> {
    const response = await api.get("/post", {
        headers: authHeader(token),
    });
    return response.data;
}

export async function createPost(data: any, token?: string) {
    const files = normalizeFiles(data?.images);

    if (files.length > 0) {
        const formData = new FormData();
        formData.append("petName", data?.petName ?? "");

        if (data?.description) {
            formData.append("description", data.description);
        }

        if (data?.lastSeenDate) {
            const date = data.lastSeenDate instanceof Date ? data.lastSeenDate : new Date(data.lastSeenDate);
            formData.append("lastSeenDate", date.toISOString());
        }

        if (data?.lastSeenLatitude !== undefined && data?.lastSeenLatitude !== null) {
            formData.append("lastSeenLatitude", String(data.lastSeenLatitude));
        }

        if (data?.lastSeenLongitude !== undefined && data?.lastSeenLongitude !== null) {
            formData.append("lastSeenLongitude", String(data.lastSeenLongitude));
        }

        files.forEach((file) => formData.append("images", file));

        const response = await api.post("/post", formData, {
            headers: {
                ...authHeader(token),
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    }

    const response = await api.post("/post", data, {
        headers: authHeader(token),
    });
    return response.data;
}

export async function updatePost(id: string, data: any, token?: string) {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    if (isFormData) {
        const response = await axios.put(`/api/post?id=${id}`, data, {
            headers: authHeader(token),
        });
        return response.data;
    }

    const response = await api.put(`/post?id=${id}`, data, {
        headers: {
            ...authHeader(token),
            "Content-Type": "application/json",
        },
    });
    return response.data;
}

export async function deletePost(id: string, token?: string) {
    const response = await api.delete(`/post?id=${id}`, {
        headers: authHeader(token),
    });
    return response.data;
}

export async function getComments(postId: string, token?: string): Promise<CommentApiResponse[]> {
    const response = await api.get(`/comment?postId=${postId}`, {
        headers: authHeader(token),
    });
    return response.data;
}

export async function createComment(data: { postId: string; commentText: string; parentCommentId?: string | null }, token?: string) {
    const response = await api.post("/comment", data, {
        headers: authHeader(token),
    });
    return response.data as CommentApiResponse;
}

export async function updateComment(data: { commentId: string; commentText: string }, token?: string) {
    const response = await api.put("/comment", data, {
        headers: authHeader(token),
    });
    return response.data as CommentApiResponse;
}

export async function deleteComment(commentId: string, token?: string) {
    const response = await api.delete(`/comment?id=${commentId}`, {
        headers: authHeader(token),
    });
    return response.data;
}

export async function voteComment(data: { commentId: string; value: 1 | -1 }, token?: string) {
    const response = await api.patch("/comment", { ...data, action: "vote" }, {
        headers: authHeader(token),
    });
    return response.data as CommentApiResponse;
}

// Denúncia de comentário desativada por enquanto.
// export async function reportComment(data: { commentId: string; reason?: string | null }, token?: string) {
//     const response = await api.patch("/comment", { ...data, action: "report" }, {
//         headers: authHeader(token),
//     });
//     return response.data as { deleted: boolean; comment: CommentApiResponse | null };
// }

export default api;