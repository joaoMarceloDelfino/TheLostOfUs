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

// --- GET USER POSTS ---
export async function getUserPosts(token?: string): Promise<PostApiResponse[]> {
    const response = await api.get("/post/user", {
        headers: authHeader(token),
    });
    return response.data;
}
// --- GET POSTS ---
export async function getPosts(token?: string): Promise<PostApiResponse[]> {
    const response = await api.get("/post", {
        headers: authHeader(token),
    });
    return response.data;
}
import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Helper para adicionar o token Clerk
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

// --- POST ---
export async function createPost(data: any, token?: string) {
    const files = normalizeFiles(data?.images);

    if (files.length > 0) {
        const formData = new FormData();
        formData.append("petName", data?.petName ?? "");

        if (data?.description) {
            formData.append("description", data.description);
        }

        if (data?.lastSeenDate) {
            const date = data.lastSeenDate instanceof Date
                ? data.lastSeenDate
                : new Date(data.lastSeenDate);
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

// --- COMMENT ---
export async function createComment(data: any, token?: string) {
    const response = await api.post("/comment", data, {
        headers: authHeader(token),
    });
    return response.data;
}

export default api;
