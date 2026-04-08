"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPost } from "@/lib/apiClient";
import { createPostSchema } from "@/schemas/createPost.schema";
import HomeHeader from "@/app/components/home/HomeHeader";
import HomeFooter from "@/app/components/home/HomeFooter";
import styles from "../home/page.module.css";

export default function NewOccurrencePage() {
    const { getToken, isSignedIn } = useAuth();
    const [serverError, setServerError] = useState("");
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<z.infer<typeof createPostSchema>>({
        resolver: zodResolver(createPostSchema),
        defaultValues: {
            petName: "",
            description: "",
            lastSeenDate: null,
        },
    });

    const onSubmit = async (data: z.infer<typeof createPostSchema>) => {
        setServerError("");
        setSuccess(false);
        try {
            const token = await getToken();
            await createPost(data, token || undefined);
            setSuccess(true);
            reset();
        } catch (err: any) {
            setServerError(err?.response?.data?.error || "Erro ao criar ocorrência");
        }
    };

    if (!isSignedIn) {
        return (
            <>
                <HomeHeader />
                <main className={styles.page} style={{ background: "#fff", minHeight: "calc(100vh - 160px)" }}>
                    <div className={styles.container} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
                        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 32, maxWidth: 420, width: "100%", textAlign: "center" }}>
                            <p style={{ fontSize: 18, color: "#222" }}>Você precisa estar logado para criar uma ocorrência.</p>
                        </div>
                    </div>
                </main>
                <HomeFooter />
            </>
        );
    }

    return (
        <>
            <HomeHeader />
            <main className={styles.page} style={{ background: "#fff", minHeight: "calc(100vh - 160px)" }}>
                <div className={styles.container} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
                    <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 32, maxWidth: 420, width: "100%" }}>
                        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 32, textAlign: "center", color: "#222" }}>Nova Ocorrência</h1>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div style={{ marginBottom: 28 }}>
                                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#222" }}>Nome do Pet *</label>
                                <input
                                    type="text"
                                    {...register("petName")}
                                    style={{
                                        width: "100%",
                                        border: "1px solid #ccc",
                                        background: "#fff",
                                        color: "#222",
                                        borderRadius: 8,
                                        padding: "12px 14px",
                                        fontSize: 16,
                                        outline: "none"
                                    }}
                                    placeholder="Digite o nome do pet"
                                />
                                {errors.petName && (
                                    <span style={{ color: "#e57373", fontSize: 13, marginTop: 4, display: "block" }}>{errors.petName.message}</span>
                                )}
                            </div>
                            <div style={{ marginBottom: 28 }}>
                                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#222" }}>Descrição</label>
                                <textarea
                                    {...register("description")}
                                    style={{
                                        width: "100%",
                                        border: "1px solid #ccc",
                                        background: "#fff",
                                        color: "#222",
                                        borderRadius: 8,
                                        padding: "12px 14px",
                                        fontSize: 16,
                                        outline: "none",
                                        minHeight: 80
                                    }}
                                    placeholder="Descreva detalhes relevantes (opcional)"
                                />
                                {errors.description && (
                                    <span style={{ color: "#e57373", fontSize: 13, marginTop: 4, display: "block" }}>{errors.description.message}</span>
                                )}
                            </div>
                            <div style={{ marginBottom: 28 }}>
                                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#222" }}>Data do último avistamento</label>
                                <input
                                    type="date"
                                    {...register("lastSeenDate", {
                                        setValueAs: v => v ? new Date(v + "T00:00:00") : null
                                    })}
                                    style={{
                                        width: "100%",
                                        border: "1px solid #ccc",
                                        background: "#fff",
                                        color: "#222",
                                        borderRadius: 8,
                                        padding: "12px 14px",
                                        fontSize: 16,
                                        outline: "none"
                                    }}
                                />
                                {errors.lastSeenDate && (
                                    <span style={{ color: "#e57373", fontSize: 13, marginTop: 4, display: "block" }}>{errors.lastSeenDate.message}</span>
                                )}
                            </div>
                            {serverError && <div style={{ color: "#e57373", fontSize: 14, textAlign: "center", fontWeight: 500, marginBottom: 12 }}>{serverError}</div>}
                            {success && <div style={{ color: "#43a047", fontSize: 14, textAlign: "center", fontWeight: 500, marginBottom: 12 }}>Ocorrência criada com sucesso!</div>}
                            <button
                                type="submit"
                                style={{
                                    width: "100%",
                                    background: "#5a98eb",
                                    color: "#fff",
                                    padding: "14px 0",
                                    borderRadius: 8,
                                    fontWeight: 700,
                                    fontSize: 16,
                                    border: "none",
                                    marginTop: 8,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 8px #5a98eb22"
                                }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Enviando..." : "Criar Ocorrência"}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
            <HomeFooter />
        </>
    );
}
