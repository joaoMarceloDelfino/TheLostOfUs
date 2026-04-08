"use client";

import { useEffect, useState } from "react";
import HomeHeader from "@/app/components/home/HomeHeader";
import HomeFooter from "@/app/components/home/HomeFooter";
import SightingCard from "@/app/components/home/SightingCard";
import { getUserPosts, deletePost } from "@/lib/apiClient";
import styles from "../home/page.module.css";


export default function HistoryPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getUserPosts()
            .then((data) => {
                setPosts(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Erro ao carregar suas ocorrências");
                setLoading(false);
            });
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
                                posts.map((post, index) => (
                                    <div key={post.id || index} style={{ position: "relative" }}>
                                        <SightingCard
                                            imageSrc={"/images/animal-1.png"}
                                            imageAlt={post.pet_name || "Animal avistado"}
                                            name={post.pet_name || "Sem nome"}
                                            location="Local: Local não informado"
                                            date={post.last_seen_date ? `Data último avistamento: ${new Date(post.last_seen_date).toLocaleDateString()}` : "Data não informada"}
                                            status={"Ativo"}
                                        />
                                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                            <button style={{ background: "#e57373", color: "#fff", border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }} onClick={() => handleDeleteClick(post.id)}>Excluir</button>
                                        </div>
                                    </div>
                                ))
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
        </>
    );
}
