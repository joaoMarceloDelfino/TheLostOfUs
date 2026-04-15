import Image from "next/image";
import { useState } from "react";
import styles from "./SightingCard.module.css";

type SightingCardProps = {
  imageSrc: string | string[];
  imageAlt: string;
  name: string;
  authorName?: string;
  description?: string;
  location: string;
  date: string;
  status: string;
  rawLastSeenDate?: string | Date | null;
};

export default function SightingCard({
  imageSrc,
  imageAlt,
  name,
  authorName,
  description,
  location,
  date,
  status,
}: SightingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = Array.isArray(imageSrc) ? imageSrc : [imageSrc];
  const currentImage = images[currentImageIndex];
  const hasMultipleImages = images.length > 1;

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={currentImage}
          alt={imageAlt}
          width={198}
          height={135}
          className={styles.image}
        />

        <div className={styles.badges}>
          <span className={styles.statusBadge}>{status}</span>
        </div>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              className={`${styles.carouselButton} ${styles.carouselLeft}`}
              aria-label="Imagem anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              className={`${styles.carouselButton} ${styles.carouselRight}`}
              aria-label="Próxima imagem"
            >
              ›
            </button>
            <div className={styles.carouselCounter}>
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      <header className={styles.header}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.author}>Publicado por {authorName || "Autor desconhecido"}</p>
      </header>

      <section className={styles.keyInfo}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Último avistamento</span>
          <span className={styles.infoValue}>{date}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Localização</span>
          <span className={styles.infoValue}>{location}</span>
        </div>
      </section>

      {description && (
        <p className={styles.description}>{description}</p>
      )}

      <p className={styles.footerHint}>Compartilhe esta ocorrência para ampliar a busca.</p>

    </article>
  );
}