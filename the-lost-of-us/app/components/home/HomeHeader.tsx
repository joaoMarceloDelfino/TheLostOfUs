import Link from "next/link";
import styles from "./HomeHeader.module.css";

export default function HomeHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/home" className={styles.brand}>
          THE LOST OF US
        </Link>

        <nav className={styles.nav}>
          <Link href="/new-occurrence">Nova Ocorrência</Link>
          <Link href="/history">Meu Histórico</Link>
          {/* <Link href="/home/profile">Meu Perfil</Link> */}
        </nav>
      </div>
    </header>
  );
}