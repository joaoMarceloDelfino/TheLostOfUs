import Image from "next/image";
import Link from "next/link";
import styles from "./ActionCard.module.css";

type ActionCardProps = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  backgroundColor: string;
  href?: string;
};

export default function ActionCard({
  imageSrc,
  imageAlt,
  title,
  description,
  backgroundColor,
  href,
}: ActionCardProps) {
  const content = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link href={href} className={styles.card} style={{ backgroundColor }}>
        {content}
      </Link>
    );
  }

  return (
    <article className={styles.card} style={{ backgroundColor }}>
      {content}
    </article>
  );
}
