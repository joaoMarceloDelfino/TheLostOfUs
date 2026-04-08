"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPost } from "@/lib/apiClient";
import { createPostSchema } from "@/schemas/createPost.schema";

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
            lastSeenDate: undefined,
        },
    });

    const onSubmit = async (data: z.infer<typeof createPostSchema>) => {
        setServerError("");
        setSuccess(false);
        try {
            const token = await getToken();
            const payload = {
                ...data,
                lastSeenDate: data.lastSeenDate ? new Date(data.lastSeenDate) : null,
            };
            await createPost(payload, token || undefined);
            setSuccess(true);
            reset();
        } catch (err: any) {
            setServerError(err?.response?.data?.error || "Erro ao criar ocorrência");
        }
    };

    if (!isSignedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="max-w-md w-full p-8 bg-gray-900 rounded-xl shadow-2xl text-center border border-gray-700">
                    <p className="text-lg text-gray-100">Você precisa estar logado para criar uma ocorrência.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="max-w-md w-full p-8 bg-gray-900 rounded-xl shadow-2xl border border-gray-700">
                <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-100 tracking-tight drop-shadow-lg">Nova Ocorrência</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block font-semibold mb-2 text-gray-200">Nome do Pet *</label>
                        <input
                            type="text"
                            {...register("petName")}
                            className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder-gray-400 transition"
                            placeholder="Digite o nome do pet"
                        />
                        {errors.petName && (
                            <span className="text-red-400 text-sm mt-1 block">{errors.petName.message}</span>
                        )}
                    </div>
                    <div>
                        <label className="block font-semibold mb-2 text-gray-200">Descrição</label>
                        <textarea
                            {...register("description")}
                            className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder-gray-400 transition"
                            rows={3}
                            placeholder="Descreva detalhes relevantes (opcional)"
                        />
                        {errors.description && (
                            <span className="text-red-400 text-sm mt-1 block">{errors.description.message}</span>
                        )}
                    </div>
                    <div>
                        <label className="block font-semibold mb-2 text-gray-200">Data do último avistamento</label>
                        <input
                            type="date"
                            {...register("lastSeenDate")}
                            className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder-gray-400 transition"
                        />
                        {errors.lastSeenDate && (
                            <span className="text-red-400 text-sm mt-1 block">{errors.lastSeenDate.message}</span>
                        )}
                    </div>
                    {serverError && <div className="text-red-400 text-sm text-center font-medium">{serverError}</div>}
                    {success && <div className="text-green-400 text-sm text-center font-medium">Ocorrência criada com sucesso!</div>}
                    <button
                        type="submit"
                        className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition shadow-lg mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Enviando..." : "Criar Ocorrência"}
                    </button>
                </form>
            </div>
        </div>
    );
}
