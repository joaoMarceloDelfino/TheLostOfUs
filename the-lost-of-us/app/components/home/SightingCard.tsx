import Image from "next/image";
import styles from "./SightingCard.module.css";

type SightingCardProps = {
  imageSrc: string;
  imageAlt: string;
  name: string;
  location: string;
  date: string;
  status: string;
};

export default function SightingCard({
  imageSrc,
  imageAlt,
  name,
  location,
  date,
  status,
}: SightingCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={198}
          height={135}
          className={styles.image}
        />
      </div>

      <h3 className={styles.name}>{name}</h3>

      <div className={styles.info}>
        <p>{location}</p>
        <p>{date}</p>
        <p>{status}</p>
      </div>

      <button type="button" className={styles.button}>
        Saiba mais
      </button>
    </article>
  );
}