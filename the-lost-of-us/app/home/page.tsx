"use client"

import styles from "./page.module.css";
import ActionCard from "@/app/components/home/ActionCard";
import SightingCard from "@/app/components/home/SightingCard";
import { useEffect, useState } from "react";
import { getPosts } from "@/lib/apiClient";

const actions = [
  {
    imageSrc: "/images/image.png",
    imageAlt: "Perdi meu pet",
    title: "PERDI MEU PET –",
    description: "Cadastrar anuncio de desaparecimento",
    backgroundColor: "#ecd789",
  },
  {
    imageSrc: "/images/localizacao.png",
    imageAlt: "Avistei um pet",
    title: "AVISTEI UM PET –",
    description: "Reportar animal encontrado na rua",
    backgroundColor: "#5a98eb",
  },
  {
    imageSrc: "/images/sino.png",
    imageAlt: "Meus alertas",
    title: "MEUS ALERTAS",
    description: "• Gerenciar seus anuncios ativos",
    backgroundColor: "#98ea84",
  },
];




export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getPosts()
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Erro ao carregar posts");
        setLoading(false);
      });
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <h1 className={styles.title}>Painel Geral: Ajude a Encontrar um Amigo!</h1>

        <section className={styles.actionsSection}>
          {actions.map((action) => (
            <ActionCard
              key={action.title}
              imageSrc={action.imageSrc}
              imageAlt={action.imageAlt}
              title={action.title}
              description={action.description}
              backgroundColor={action.backgroundColor}
            />
          ))}
        </section>

        <section className={styles.sightingsSection}>
          <h2 className={styles.sectionTitle}>Ultimas Ocorrências</h2>

          <div className={styles.sightingsGrid}>
            {loading ? (
              <div>Carregando posts...</div>
            ) : error ? (
              <div>{error}</div>
            ) : posts.length === 0 ? (
              <div>Nenhum post encontrado.</div>
            ) : (
              posts.map((post: any, index) => {
                const imageUris = post.petimages?.map((img: any) => img.image_uri) || ["/images/animal-1.png"];
                return (
                  <SightingCard
                    key={post.id || index}
                    imageSrc={imageUris.length > 0 ? imageUris : "/images/animal-1.png"}
                    imageAlt={post.pet_name || "Animal avistado"}
                    name={post.pet_name || "Sem nome"}
                    description={post.description || "Sem descrição"}
                    location={"Local: Local não informado"}
                    date={post.last_seen_date ? `Data último avistamento: ${new Date(post.last_seen_date).toLocaleDateString()}` : "Data não informada"}
                    status={"Ativo"}
                  />
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}