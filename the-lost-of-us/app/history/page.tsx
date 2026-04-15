"use client";

import { useEffect, useState } from "react";
import HomeHeader from "@/app/components/home/HomeHeader";
import HomeFooter from "@/app/components/home/HomeFooter";
import SightingCard from "@/app/components/home/SightingCard";
import EditPostModal, { EditPostSubmitInput } from "@/app/components/history/EditPostModal";
import { getUserPosts, deletePost, updatePost, PostApiResponse } from "@/lib/apiClient";
import { formatLocationDisplay } from "@/lib/location";
import styles from "../home/page.module.css";


export default function HistoryPage() {
    const [posts, setPosts] = useState<PostApiResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [selectedPostToEdit, setSelectedPostToEdit] = useState<PostApiResponse | null>(null);
    const [editError, setEditError] = useState("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const fetchUserPosts = async () => {
        setLoading(true);
        try {
            const data = await getUserPosts();
            setPosts(data);
            setError(null);
        } catch {
            setError("Erro ao carregar suas ocorrências");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserPosts();
    }, []);

    const handleDeleteClick = (postId: string) => {
        setSelectedPostId(postId);
        setShowModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedPostId) return;
        try {
            await deletePost(selectedPostId);
            setPosts((prev) => prev.filter((p) => p.id !== selectedPostId));
        } catch {
            alert("Erro ao remover ocorrência.");
        }
        setShowModal(false);
        setSelectedPostId(null);
    };

    const handleCancelDelete = () => {
        setShowModal(false);
        setSelectedPostId(null);
    };

    const handleEditClick = (post: PostApiResponse) => {
        setEditError("");
        setSelectedPostToEdit(post);
        setShowEditModal(true);
    };

    const handleCloseEdit = () => {
        if (isSavingEdit) {
            return;
        }
        setShowEditModal(false);
        setSelectedPostToEdit(null);
        setEditError("");
    };

    const handleSaveEdit = async (payload: EditPostSubmitInput) => {
        if (!selectedPostToEdit?.id) {
            return;
        }

        setIsSavingEdit(true);
        setEditError("");
        try {
            const formData = new FormData();
            formData.append("petName", payload.petName);
            formData.append("description", payload.description ?? "");
            formData.append("lastSeenDate", payload.lastSeenDate ?? "");
            formData.append("lastSeenLatitude", payload.lastSeenLatitude === null ? "" : String(payload.lastSeenLatitude));
            formData.append("lastSeenLongitude", payload.lastSeenLongitude === null ? "" : String(payload.lastSeenLongitude));
            formData.append("imagesToKeep", payload.imagesToKeep.join(","));

            payload.newImages.forEach((file) => {
                formData.append("newImages", file);
            });

            await updatePost(selectedPostToEdit.id, formData);
            await fetchUserPosts();
            setShowEditModal(false);
            setSelectedPostToEdit(null);
        } catch (error: unknown) {
            if (typeof error === "object" && error !== null && "response" in error) {
                const response = error as { response?: { data?: { details?: string; error?: string } } };
                setEditError(response.response?.data?.details || response.response?.data?.error || "Erro ao salvar edição.");
            } else {
                setEditError("Erro ao salvar edição.");
            }
        } finally {
            setIsSavingEdit(false);
        }
    };

    return (
        <>
            <HomeHeader />
            <main className={styles.page}>
                <section className={styles.container}>
                    <h1 className={styles.title}>Minhas Ocorrências</h1>
                    <section className={styles.sightingsSection}>
                        <div className={styles.sightingsGrid}>
                            {loading ? (
                                <div>Carregando suas ocorrências...</div>
                            ) : error ? (
                                <div>{error}</div>
                            ) : posts.length === 0 ? (
                                <div>Nenhuma ocorrência encontrada.</div>
                            ) : (
                                posts.map((post, index) => {
                                    const imageUris = post.petimages?.map((img) => img.image_uri) || ["/images/animal-1.png"];
                                    const hasLocation = post.last_seen_location_latitude != null && post.last_seen_location_longitude != null;
                                    const postLocation = hasLocation
                                        ? {
                                            latitude: post.last_seen_location_latitude!,
                                            longitude: post.last_seen_location_longitude!,
                                            label: post.last_seen_location_label ?? null,
                                        }
                                        : null;
                                    return (
                                        <div key={post.id || index} style={{ position: "relative" }}>
                                            <SightingCard
                                                postId={post.id}
                                                postUserSub={post.user_sub}
                                                allowCommentActions={false}
                                                imageSrc={imageUris.length > 0 ? imageUris : "/images/animal-1.png"}
                                                imageAlt={post.pet_name || "Animal avistado"}
                                                name={post.pet_name || "Sem nome"}
                                                authorName={post.authorName || "Autor desconhecido"}
                                                description={post.description || "Sem descrição"}
                                                location={formatLocationDisplay(postLocation)}
                                                date={post.last_seen_date ? new Date(post.last_seen_date).toLocaleDateString("pt-BR") : "Não informada"}
                                                status={"Desaparecido"}
                                                rawLastSeenDate={post.last_seen_date}
                                            />
                                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                                <button style={{ background: "#5a98eb", color: "#fff", border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }} onClick={() => handleEditClick(post)}>Editar</button>
                                                <button style={{ background: "#e57373", color: "#fff", border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }} onClick={() => handleDeleteClick(post.id)}>Excluir</button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </section>
            </main>
            <HomeFooter />

            {showModal && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "#fff",
                        padding: 24,
                        borderRadius: 8,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        minWidth: 300,
                        textAlign: "center"
                    }}>
                        <p style={{ marginBottom: 20 }}>Tem certeza que deseja remover esta ocorrência?</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                            <button style={{ background: "#e57373", color: "#fff", border: "none", borderRadius: 4, padding: "6px 18px", cursor: "pointer" }} onClick={handleConfirmDelete}>Sim</button>
                            <button style={{ background: "#ccc", border: "none", borderRadius: 4, padding: "6px 18px", cursor: "pointer" }} onClick={handleCancelDelete}>Não</button>
                        </div>
                    </div>
                </div>
            )}

            <EditPostModal
                open={showEditModal}
                post={selectedPostToEdit}
                saving={isSavingEdit}
                errorMessage={editError}
                onClose={handleCloseEdit}
                onSave={handleSaveEdit}
            />
        </>
    );
}
