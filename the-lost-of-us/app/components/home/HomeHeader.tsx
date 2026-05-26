"use client";

import Link from "next/link";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { useTheme } from "@/app/components/theme/ThemeProvider";
import styles from "./HomeHeader.module.css";

export default function HomeHeader() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

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
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
          >
            {isDark ? (
              <MoonIcon className={styles.themeIcon} aria-hidden="true" />
            ) : (
              <SunIcon className={styles.themeIcon} aria-hidden="true" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
