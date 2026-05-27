"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { LocationCoordinates } from "@/lib/location";

const LocationPicker = dynamic(() => import("@/app/components/location/LocationPicker"), {
    ssr: false,
});

export type CreateSightingSubmitInput = {
    description: string | null;
    location: LocationCoordinates;
    images?: string[];
};

type CreateSightingModalProps = {
    open: boolean;
    petName: string;
    initialLocation?: LocationCoordinates | null;
    saving: boolean;
    errorMessage?: string;
    onClose: () => void;
    onSave: (payload: CreateSightingSubmitInput) => Promise<void>;
};

export default function CreateSightingModal({
    open,
    petName,
    initialLocation,
    saving,
    errorMessage,
    onClose,
    onSave,
}: CreateSightingModalProps) {
    const [description, setDescription] = useState("");
    const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates | null>(null);
    const [localError, setLocalError] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setDescription("");
        setSelectedLocation(initialLocation ?? null);
        setLocalError("");
        setImages([]);
        setImagePreviews([]);
    }, [open, initialLocation]);

    useEffect(() => {
        if (images.length > 0) {
            const urls = images.map((file) => URL.createObjectURL(file));
            setImagePreviews(urls);
            return () => urls.forEach((url) => URL.revokeObjectURL(url));
        } else {
            setImagePreviews([]);
        }
    }, [images]);

    if (!open) {
        return null;
    }

    // Upload local para public/images/sighting-images
    async function uploadImages(files: File[]): Promise<string[]> {
        const formData = new FormData();
        files.forEach(file => formData.append("images", file));
        const res = await fetch("/api/sighting/upload", {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error("Falha ao enviar imagens");
        const data = await res.json();
        return data.urls as string[];
    }

    const handleSave = async () => {
        if (!selectedLocation) {
            setLocalError("Selecione a localização do avistamento.");
            return;
        }

        setLocalError("");
        let imageUrls: string[] = [];
        if (images.length > 0) {
            imageUrls = await uploadImages(images);
        }
        await onSave({
            description: description.trim() ? description.trim() : null,
            location: selectedLocation,
            images: imageUrls,
        });
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(12, 18, 28, 0.52)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                zIndex: 1100,
                padding: 16,
                overflowY: "auto",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 680,
                    background: "#fff",
                    borderRadius: 18,
                    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
                    padding: 28,
                    marginTop: 24,
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: 0.08, textTransform: "uppercase", color: "#5a98eb" }}>
                        Novo avistamento
                    </p>
                    <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.1, color: "#101828" }}>
                        Registrar avistamento de {petName}
                    </h2>
                    <p style={{ margin: 0, color: "#667085", fontSize: 15 }}>
                        Marque no mapa onde o pet foi visto e adicione um detalhe curto, se quiser.
                    </p>
                </div>

                <div style={{ display: "grid", gap: 20 }}>
                    <div>
                        <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#101828" }}>
                            Descrição do avistamento
                        </label>
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Ex.: estava próximo ao mercado, parecia assustado, estava com coleira azul..."
                            style={{
                                width: "100%",
                                minHeight: 96,
                                borderRadius: 12,
                                border: "1px solid #d0d5dd",
                                padding: "12px 14px",
                                resize: "vertical",
                                fontSize: 15,
                                color: "#101828",
                                outline: "none",
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#101828" }}>
                            Imagens do avistamento (máx. 5)
                        </label>
                        <input
                            id="sighting-image-input"
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: "none" }}
                            onChange={e => {
                                const files = Array.from(e.target.files || []).slice(0, 5);
                                setImages(files);
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => document.getElementById("sighting-image-input")?.click()}
                            style={{
                                width: "100%",
                                border: "1px dashed #5a98eb",
                                background: "#eaf1fb",
                                color: "#2563eb",
                                borderRadius: 8,
                                padding: "12px 14px",
                                fontWeight: 600,
                                fontSize: 15,
                                cursor: "pointer",
                                marginBottom: 8
                            }}
                        >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                {/* Heroicons ArrowUpTrayIcon inline SVG */}
                                <svg style={{ width: 18, height: 18, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" /></svg>
                                <p style={{ margin: 0 }}>Selecionar imagens</p>
                            </span>
                        </button>
                        <div style={{ color: "#667085", fontSize: 13, marginTop: 4 }}>
                            {images.length > 0 ? `${images.length} imagem(ns) selecionada(s)` : "Nenhuma imagem selecionada"}
                        </div>
                        {imagePreviews.length > 0 && (
                            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                                {imagePreviews.map((src, idx) => (
                                    <img
                                        key={idx}
                                        src={src}
                                        alt={`Preview ${idx + 1}`}
                                        style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #ccc" }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#101828" }}>
                            Localização do avistamento
                        </label>
                        <LocationPicker value={selectedLocation} onChange={setSelectedLocation} />
                    </div>

                    {(localError || errorMessage) && (
                        <div style={{ color: "#b42318", fontSize: 14, fontWeight: 600 }}>
                            {localError || errorMessage}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            style={{
                                border: "1px solid #d0d5dd",
                                background: "#fff",
                                color: "#344054",
                                borderRadius: 12,
                                padding: "12px 16px",
                                minWidth: 120,
                                cursor: "pointer",
                                fontWeight: 700,
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                border: "none",
                                background: "#5a98eb",
                                color: "#fff",
                                borderRadius: 12,
                                padding: "12px 18px",
                                minWidth: 180,
                                cursor: "pointer",
                                fontWeight: 800,
                            }}
                        >
                            {saving ? "Registrando..." : "Registrar avistamento"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}