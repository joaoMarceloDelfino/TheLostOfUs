import Image from "next/image";
import { useState } from "react";
import styles from "./SightingCard.module.css";

type SightingCardProps = {
  imageSrc: string | string[];
  imageAlt: string;
  name: string;
  description?: string;
  location: string;
  date: string;
  status: string;
};

export default function SightingCard({
  imageSrc,
  imageAlt,
  name,
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
      <div className={styles.imageWrapper} style={{ position: "relative" }}>
        <Image
          src={currentImage}
          alt={imageAlt}
          width={198}
          height={135}
          className={styles.image}
        />
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0, 0, 0, 0.5)",
                color: "#fff",
                border: "none",
                width: 24,
                height: 24,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: "bold"
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0, 0, 0, 0.5)",
                color: "#fff",
                border: "none",
                width: 24,
                height: 24,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: "bold"
              }}
            >
              ›
            </button>
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0, 0, 0, 0.6)",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: "600"
              }}
            >
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      <h3 className={styles.name}>{name}</h3>

      <div className={styles.info}>
        {description && <p>{description}</p>}
        <p>{location}</p>
        <p>{date}</p>
        <p>{status}</p>
      </div>

      {/* <button type="button" className={styles.button} >
        Saiba mais
      </button> */}
    </article>
  );
}