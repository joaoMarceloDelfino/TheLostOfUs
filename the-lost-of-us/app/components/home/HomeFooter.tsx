import styles from "./HomeFooter.module.css";

export default function HomeFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span>Política de Privacidade</span>
          <span>©2026 TheLostOfUs</span>
        </div>

        <div className={styles.right}>
          <span>f</span>
          <span>t</span>
          <span>in</span>
        </div>
      </div>
    </footer>
  );
}