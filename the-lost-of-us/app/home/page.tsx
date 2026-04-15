"use client"

"use client"

import styles from "./page.module.css";
import ActionCard from "@/app/components/home/ActionCard";
import SightingCard from "@/app/components/home/SightingCard";
import { useEffect, useState } from "react";
import { getPosts, PostApiResponse } from "@/lib/apiClient";
import { formatLocationDisplay } from "@/lib/location";

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

  useEffect(() => {
    setLoading(true);
    getPosts()
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar posts");
        setLoading(false);
      });
  }, []);

  const [posts, setPosts] = useState<PostApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


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
                  <SightingCard
                    key={post.id || index}
                    postId={post.id}
                    postUserSub={post.user_sub}
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
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}