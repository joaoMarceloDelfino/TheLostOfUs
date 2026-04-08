// --- GET USER POSTS ---
export async function getUserPosts(token?: string) {
    const response = await api.get("/post/user", {
        headers: authHeader(token),
    });
    return response.data;
}
// --- GET POSTS ---
export async function getPosts(token?: string) {
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

// --- POST ---
export async function createPost(data: any, token?: string) {
    const response = await api.post("/post", data, {
        headers: authHeader(token),
    });
    return response.data;
}

export async function updatePost(id: string, data: any, token?: string) {
    const response = await api.put(`/post?id=${id}`, data, {
        headers: authHeader(token),
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
