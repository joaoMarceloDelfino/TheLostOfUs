import Image from "next/image";
import styles from "./ActionCard.module.css";

type ActionCardProps = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  backgroundColor: string;
};

export default function ActionCard({
  imageSrc,
  imageAlt,
  title,
  description,
  backgroundColor,
}: ActionCardProps) {
  return (
    <article
      className={styles.card}
      style={{ backgroundColor }}
    >
      <div className={styles.imageWrapper}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={92}
          height={92}
          className={styles.image}
        />
      </div>

      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </article>
  );
}