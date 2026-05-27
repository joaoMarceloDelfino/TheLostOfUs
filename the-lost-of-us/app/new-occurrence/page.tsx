"use client";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPost } from "@/lib/apiClient";
import { createPostSchema } from "@/schemas/createPost.schema";
import HomeHeader from "@/app/components/home/HomeHeader";
import HomeFooter from "@/app/components/home/HomeFooter";
import styles from "../home/page.module.css";
import { ArrowUpTrayIcon } from '@heroicons/react/24/solid'
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { LocationCoordinates } from "@/lib/location";

const LocationPicker = dynamic(() => import("@/app/components/location/LocationPicker"), {
    ssr: false,
});


type CreatePostFormInput = z.input<typeof createPostSchema>;
type CreatePostFormOutput = z.output<typeof createPostSchema>;


export default function NewOccurrencePage() {
    const { getToken, isSignedIn } = useAuth();
    const router = useRouter();
    const [serverError, setServerError] = useState("");
    const [success, setSuccess] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<CreatePostFormInput, unknown, CreatePostFormOutput>({
        resolver: zodResolver(createPostSchema),
        defaultValues: {
            petName: "",
            description: "",
            lastSeenDate: null,
            lastSeenLatitude: undefined,
            lastSeenLongitude: undefined,
            images: [],
        },
    });

    const {
        ref: registerImagesRef,
        onChange: onImagesChange,
        name: imagesName,
        ...imagesInputProps
    } = register("images");
    const selectedImages = watch("images") as File[] | FileList | undefined;
    const selectedImagesCount = Array.isArray(selectedImages)
        ? selectedImages.length
        : selectedImages?.length ?? 0;

    const onSubmit = async (data: CreatePostFormOutput) => {
        setServerError("");
        setSuccess(false);

        if (!selectedLocation) {
            setServerError("Selecione a localização no mapa.");
            return;
        }

        try {
            const token = await getToken();
            await createPost(
                {
                    ...data,
                    lastSeenLatitude: selectedLocation.latitude,
                    lastSeenLongitude: selectedLocation.longitude,
                },
                token || undefined
            );
            setSuccess(true);
            reset();
            setSelectedLocation(null);
            router.push("/home");
        } catch (error: unknown) {
            if (typeof error === "object" && error !== null && "response" in error) {
                const response = error as { response?: { data?: { error?: string } } };
                setServerError(response.response?.data?.error || "Erro ao criar ocorrência");
            } else {
                setServerError("Erro ao criar ocorrência");
            }
            setSelectedLocation(null);
        } 
    };

    if (!isSignedIn) {
        return (
            <>
                <HomeHeader />
                <main className={styles.page} style={{ background: "var(--page-bg)", minHeight: "calc(100vh - 160px)" }}>
                    <div className={styles.container} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
                        <div style={{ background: "var(--surface-bg)", borderRadius: 12, boxShadow: "var(--shadow-card)", padding: 32, maxWidth: 420, width: "100%", textAlign: "center" }}>
                            <p style={{ fontSize: 18, color: "var(--text-main)" }}>Você precisa estar logado para criar uma ocorrência.</p>
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
            <main className={styles.page} style={{ background: "var(--page-bg)", minHeight: "calc(100vh - 160px)" }}>
                <div className={styles.container} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
                    <div style={{ background: "var(--surface-bg)", borderRadius: 12, boxShadow: "var(--shadow-card)", padding: 32, maxWidth: 420, width: "100%" }}>
                        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 32, textAlign: "center", color: "var(--text-main)" }}>Nova Ocorrência</h1>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div style={{ marginBottom: 28 }}>
                                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "var(--text-main)" }}>Nome do Pet *</label>
                                <input
                                    type="text"
                                    {...register("petName")}
                                    style={{
                                        width: "100%",
                                        border: "1px solid var(--border-input)",
                                        background: "var(--input-bg)",
                                        color: "var(--text-main)",
                                        borderRadius: 8,
                                        padding: "12px 14px",
                                        fontSize: 16,
                                        outline: "none"
                                    }}
                                    placeholder="Digite o nome do pet"
                                />
                                {errors.petName && (
                                    <span style={{ color: "var(--danger)", fontSize: 13, marginTop: 4, display: "block" }}>{errors.petName.message}</span>
                                )}
                            </div>
                            <div style={{ marginBottom: 28 }}>
                                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "var(--text-main)" }}>Descrição</label>
                                <textarea
                                    {...register("description")}
                                    style={{
                                        width: "100%",
                                        border: "1px solid var(--border-input)",
                                        background: "var(--input-bg)",
                                        color: "var(--text-main)",
                                        borderRadius: 8,
                                        padding: "12px 14px",
                                        fontSize: 16,
                                        outline: "none",
                                        minHeight: 80
                                    }}
                                    placeholder="Descreva detalhes relevantes (opcional)"
                                />
                                {errors.description && (
                                    <span style={{ color: "var(--danger)", fontSize: 13, marginTop: 4, display: "block" }}>{errors.description.message}</span>
                                )}
                            </div>
                            <div style={{ marginBottom: 28 }}>
                                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "var(--text-main)" }}>Data do último avistamento</label>
                                <input
                                    type="date"
                                    lang="pt-BR"
                                    {...register("lastSeenDate", {
                                        setValueAs: v => v ? new Date(v + "T00:00:00") : null
                                    })}
                                    style={{
                                        width: "100%",
                                        border: "1px solid var(--border-input)",
                                        background: "var(--input-bg)",
                                        color: "var(--text-main)",
                                        borderRadius: 8,
                                        padding: "12px 14px",
                                        fontSize: 16,
                                        outline: "none"
                                    }}
                                />
                                {errors.lastSeenDate && (
                                    <span style={{ color: "var(--danger)", fontSize: 13, marginTop: 4, display: "block" }}>{errors.lastSeenDate.message}</span>
                                )}
                            </div>
                            <div style={{ marginBottom: 28 }}>
                                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "var(--text-main)" }}>Localização no mapa *</label>
                                <LocationPicker value={selectedLocation} onChange={setSelectedLocation} />
                            </div>
                            <div style={{ marginBottom: 28 }}>
                                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "var(--text-main)" }}>Imagens*</label>
                                <input
                                    type="file"
                                    {...imagesInputProps}
                                    accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                                    name={imagesName}
                                    onChange={onImagesChange}
                                    ref={(el) => {
                                        registerImagesRef(el);
                                        fileInputRef.current = el;
                                    }}
                                    multiple
                                    style={{
                                        display: "none"
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        width: "100%",
                                        border: "1px dashed var(--primary)",
                                        background: "var(--primary-soft)",
                                        color: "var(--primary-strong)",
                                        borderRadius: 8,
                                        padding: "12px 14px",
                                        fontWeight: 600,
                                        fontSize: 15,
                                        cursor: "pointer"
                                    }}
                                >
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                        <ArrowUpTrayIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
                                        <p style={{ margin: 0 }}>Selecionar imagens</p>
                                    </span>
                                </button>
                                <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8 }}>
                                    {selectedImagesCount > 0
                                        ? `${selectedImagesCount} imagem(ns) selecionada(s)`
                                        : "Nenhuma imagem selecionada"}
                                </div>
                                {errors.images && (
                                    <span style={{ color: "var(--danger)", fontSize: 13, marginTop: 4, display: "block" }}>{errors.images.message}</span>
                                )}
                            </div>
                            {serverError && <div style={{ color: "var(--danger)", fontSize: 14, textAlign: "center", fontWeight: 500, marginBottom: 12 }}>{serverError}</div>}
                            {success && <div style={{ color: "var(--success)", fontSize: 14, textAlign: "center", fontWeight: 500, marginBottom: 12 }}>Ocorrência criada com sucesso!</div>}
                            <button
                                type="submit"
                                style={{
                                    width: "100%",
                                    background: "var(--primary)",
                                    color: "#fff",
                                    padding: "14px 0",
                                    borderRadius: 8,
                                    fontWeight: 700,
                                    fontSize: 16,
                                    border: "none",
                                    marginTop: 8,
                                    cursor: "pointer",
                                    boxShadow: "var(--shadow-card)"
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

