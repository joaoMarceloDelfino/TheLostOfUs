"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { useTheme } from "@/app/components/theme/ThemeProvider";
import styles from "./HomeHeader.module.css";
import { BellIcon, BellAlertIcon } from "@heroicons/react/24/solid";

export default function HomeHeader() {
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/notification?countOnly=1");
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) setUnread(json.count ?? 0);
      } catch {
        // ignore
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

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
          <Link href="/notifications" style={{ position: "relative", marginLeft: 8, display: "inline-block" }}>
            {unread > 0 ? (
              <BellAlertIcon width={24} height={24} style={{ verticalAlign: "middle", color: "#d00" }} />
            ) : (
              <BellIcon width={24} height={24} style={{ verticalAlign: "middle", color: "#222" }} />
            )}
            {unread > 0 && (
              <span style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "red",
                color: "white",
                borderRadius: "50%",
                minWidth: 16,
                height: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                padding: "0 4px",
                boxSizing: "border-box",
              }}>
                {unread}
              </span>
            )}
          </Link>
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
