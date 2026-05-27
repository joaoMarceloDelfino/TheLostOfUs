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

    useEffect(() => {
        if (!open) {
            return;
        }

        setDescription("");
        setSelectedLocation(initialLocation ?? null);
        setLocalError("");
    }, [open, initialLocation]);

    if (!open) {
        return null;
    }

    const handleSave = async () => {
        if (!selectedLocation) {
            setLocalError("Selecione a localização do avistamento.");
            return;
        }

        setLocalError("");
        await onSave({
            description: description.trim() ? description.trim() : null,
            location: selectedLocation,
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