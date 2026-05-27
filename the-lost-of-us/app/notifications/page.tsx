"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import { BellIcon, EyeIcon } from "@heroicons/react/24/solid";

type Notification = {
    id: string;
    recipient_sub: string;
    actor_sub: string | null;
    post_id: string | null;
    sighting_id: string | null;
    type: string;
    data: any | null;
    read: boolean;
    created_at: string;
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function getTypeIcon(type: string) {
    if (type === "SIGHTING") return <EyeIcon width={22} height={22} style={{ color: "#0a7" }} />;
    return <BellIcon width={22} height={22} style={{ color: "#888" }} />;
}

export default function NotificationsPage() {
    const [items, setItems] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        try {
            const res = await fetch("/api/notification");
            if (res.ok) {
                const json = await res.json();
                setItems(json);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function markRead(id: string) {
        try {
            await fetch("/api/notification", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: [id] }),
            });
            setItems((prev) => prev.map((it) => (it.id === id ? { ...it, read: true } : it)));
        } catch {
            // ignore
        }
    }

    return (
        <main style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Notificações</h1>
            {loading && <p>Carregando...</p>}
            {!loading && items.length === 0 && <p>Sem notificações.</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {items.map((n) => (
                    <div
                        key={n.id}
                        style={{
                            background: n.read ? "#f8f8f8" : "#e6fff3",
                            border: n.read ? "1px solid #eee" : "1.5px solid #0a7",
                            borderRadius: 12,
                            padding: 18,
                            boxShadow: n.read ? "none" : "0 2px 8px #0a73.08",
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                            position: "relative",
                        }}
                    >
                        <div style={{ flexShrink: 0 }}>{getTypeIcon(n.type)}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 16, color: n.read ? "#444" : "#0a7" }}>
                                {n.type === "SIGHTING" ? "Novo avistamento no seu post!" : n.type}
                            </div>
                            <div style={{ fontSize: 14, color: "#333", margin: "6px 0" }}>
                                {n.data?.description ?? "Sem descrição"}
                            </div>
                            <div style={{ fontSize: 12, color: "#888" }}>
                                {formatDate(n.created_at)}
                                {n.post_id && (
                                    <>
                                        {" • "}
                                        <Link href={`/history`} style={{ color: "#0a7", textDecoration: "underline" }}>
                                            Ver post
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                        {!n.read && (
                            <button
                                onClick={() => markRead(n.id)}
                                style={{
                                    background: "#0a7",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "6px 12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    marginLeft: 12,
                                }}
                            >
                                Marcar como lida
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </main>
    );
}
