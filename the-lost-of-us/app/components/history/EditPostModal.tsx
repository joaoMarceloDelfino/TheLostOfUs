"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { LocationCoordinates } from "@/lib/location";

const LocationPicker = dynamic(() => import("@/app/components/location/LocationPicker"), {
    ssr: false,
});

type PostImage = {
    id: string;
    image_uri: string;
};

type EditablePost = {
    id: string;
    pet_name: string;
    description?: string | null;
    last_seen_date?: string | Date | null;
    last_seen_location_latitude?: number | null;
    last_seen_location_longitude?: number | null;
    petimages?: PostImage[];
};

export type EditPostSubmitInput = {
    petName: string;
    description: string | null;
    lastSeenDate: string | null;
    lastSeenLatitude: number | null;
    lastSeenLongitude: number | null;
    imagesToKeep: string[];
    newImages: File[];
};

type EditPostModalProps = {
    open: boolean;
    post: EditablePost | null;
    saving: boolean;
    errorMessage?: string;
    onClose: () => void;
    onSave: (payload: EditPostSubmitInput) => Promise<void>;
};

export default function EditPostModal({
    open,
    post,
    saving,
    errorMessage,
    onClose,
    onSave,
}: EditPostModalProps) {
    const [petName, setPetName] = useState("");
    const [description, setDescription] = useState("");
    const [lastSeenDate, setLastSeenDate] = useState("");
    const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates | null>(null);
    const [existingImages, setExistingImages] = useState<PostImage[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [localError, setLocalError] = useState("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const formatDateToBrazilian = (value: string | Date | null | undefined) => {
        if (!value) {
            return "";
        }

        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleDateString("pt-BR");
    };

    const formatBrazilianToInputDate = (value: string) => {
        const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) {
            const [, day, month, year] = match;
            return `${year}-${month}-${day}`;
        }

        return value;
    };

    const formatInputDateToBrazilian = (value: string) => {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
            const [, year, month, day] = match;
            return `${day}/${month}/${year}`;
        }

        return value;
    };

    useEffect(() => {
        if (!open || !post) {
            return;
        }

        const parsedDate = formatDateToBrazilian(post.last_seen_date);

        setPetName(post.pet_name || "");
        setDescription(post.description || "");
        setLastSeenDate(formatBrazilianToInputDate(parsedDate));
        if (post.last_seen_location_latitude !== undefined && post.last_seen_location_longitude !== undefined && post.last_seen_location_latitude !== null && post.last_seen_location_longitude !== null) {
            setSelectedLocation({
                latitude: post.last_seen_location_latitude,
                longitude: post.last_seen_location_longitude,
            });
        } else {
            setSelectedLocation(null);
        }
        setExistingImages(post.petimages || []);
        setNewImages([]);
        setLocalError("");
    }, [open, post]);

    if (!open || !post) {
        return null;
    }

    const handleAddImages = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        if (files.length === 0) {
            event.target.value = "";
            return;
        }
        setLocalError("");
        setNewImages((prev) => [...prev, ...files]);
        event.target.value = "";
    };

    const handleRemoveExistingImage = (imageId: string) => {
        setExistingImages((prev) => prev.filter((image) => image.id !== imageId));
    };

    const handleRemoveNewImage = (index: number) => {
        setNewImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
    };

    const handleSave = async () => {
        if (!petName.trim()) {
            setLocalError("Nome do pet e obrigatorio.");
            return;
        }

        setLocalError("");
        await onSave({
            petName: petName.trim(),
            description: description.trim() ? description.trim() : null,
            lastSeenDate: lastSeenDate || null,
            lastSeenLatitude: selectedLocation?.latitude ?? null,
            lastSeenLongitude: selectedLocation?.longitude ?? null,
            imagesToKeep: existingImages.map((image) => image.id),
            newImages,
        });
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1100,
                padding: 16,
                overflowY: "auto",
            }}
        >
            <div
                style={{
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 2px 12px #0001",
                    padding: 28,
                    maxWidth: 460,
                    width: "100%",
                }}
            >
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: "center", color: "#222" }}>Editar Ocorrencia</h2>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#222" }}>Nome do Pet *</label>
                    <input
                        type="text"
                        value={petName}
                        onChange={(event) => setPetName(event.target.value)}
                        style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            background: "#fff",
                            color: "#222",
                            borderRadius: 8,
                            padding: "12px 14px",
                            fontSize: 16,
                            outline: "none",
                        }}
                        placeholder="Digite o nome do pet"
                    />
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#222" }}>Descricao</label>
                    <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            background: "#fff",
                            color: "#222",
                            borderRadius: 8,
                            padding: "12px 14px",
                            fontSize: 16,
                            outline: "none",
                            minHeight: 90,
                            resize: "vertical",
                        }}
                        placeholder="Descreva detalhes relevantes (opcional)"
                    />
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#222" }}>Data do ultimo avistamento</label>
                    <input
                        type="date"
                        lang="pt-BR"
                        value={lastSeenDate}
                        onChange={(event) => setLastSeenDate(event.target.value)}
                        style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            background: "#fff",
                            color: "#222",
                            borderRadius: 8,
                            padding: "12px 14px",
                            fontSize: 16,
                            outline: "none",
                        }}
                    />
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                        {lastSeenDate ? `Selecionado: ${formatInputDateToBrazilian(lastSeenDate)}` : "Selecione uma data"}
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#222" }}>Localização no mapa</label>
                    <LocationPicker value={selectedLocation} onChange={setSelectedLocation} />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#222" }}>Imagens atuais</label>
                    {existingImages.length === 0 ? (
                        <div style={{ fontSize: 13, color: "#6b7280" }}>Nenhuma imagem mantida.</div>
                    ) : (
                        <div style={{ display: "grid", gap: 8 }}>
                            {existingImages.map((image) => (
                                <div
                                    key={image.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 8,
                                        padding: "8px 10px",
                                    }}
                                >
                                    <span style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {image.image_uri}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveExistingImage(image.id)}
                                        style={{
                                            background: "#e57373",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 6,
                                            padding: "6px 10px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#222" }}>Novas imagens</label>
                    <div style={{ fontSize: 12, fontWeight: 600, color: newImages.length > 0 ? "#2a5ea8" : "#6b7280", marginBottom: 10 }}>
                        {newImages.length > 0 ? `${newImages.length} nova(s) imagem(ns) selecionada(s)` : "Nenhuma nova imagem selecionada"}
                    </div>

                    {newImages.length > 0 && (
                        <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
                            {newImages.map((image, index) => (
                                <div
                                    key={`${image.name}-${index}`}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 8,
                                        padding: "8px 10px",
                                    }}
                                >
                                    <span style={{ fontSize: 12, color: "#374151" }}>{image.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveNewImage(index)}
                                        style={{
                                            background: "#e57373",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 6,
                                            padding: "6px 10px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAddImages}
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                        style={{ display: "none" }}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: "100%",
                            border: "1px dashed #5a98eb",
                            background: "#f5f9ff",
                            color: "#2a5ea8",
                            borderRadius: 8,
                            padding: "12px 14px",
                            fontWeight: 600,
                            fontSize: 15,
                            cursor: "pointer",
                        }}
                    >
                        Adicionar imagens
                    </button>
                </div>

                {(localError || errorMessage) && (
                    <div style={{ color: "#e57373", fontSize: 14, textAlign: "center", fontWeight: 500, marginBottom: 12 }}>
                        {localError || errorMessage}
                    </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            width: "50%",
                            background: "#e5e7eb",
                            color: "#374151",
                            padding: "12px 0",
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 15,
                            border: "none",
                            cursor: "pointer",
                        }}
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        style={{
                            width: "50%",
                            background: "#5a98eb",
                            color: "#fff",
                            padding: "12px 0",
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 15,
                            border: "none",
                            cursor: "pointer",
                        }}
                        disabled={saving}
                    >
                        {saving ? "Salvando..." : "Salvar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
