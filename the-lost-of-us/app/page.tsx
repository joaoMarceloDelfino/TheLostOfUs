"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth, useClerk, UserButton } from "@clerk/nextjs";
import styles from "./page.module.css";

export default function Page() {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn, openSignUp } = useClerk();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>THE LOST OF US</div>

        <nav className={styles.nav}>
          <a href="#missao">Nossa missão</a>
          <a href="#sobre">Sobre nós</a>
          <a href="#contato">Contato</a>
        </nav>

        <div className={styles.actions}>
          {!isLoaded ? null : isSignedIn ? (
            <>
              <Link href="/home" className={styles.homeButton}>
                Ir para home
              </Link>
              <div className={styles.userButtonWrapper}>
                <UserButton />
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.loginButton}
                onClick={() => openSignIn({ forceRedirectUrl: "/home" })}
              >
                Login
              </button>

              <button
                type="button"
                className={styles.registerButton}
                onClick={() => openSignUp({ forceRedirectUrl: "/home" })}
              >
                Registrar
              </button>
            </>
          )}
        </div>
      </header>

      <section className={styles.hero} id="sobre">
        <div className={styles.heroText}>
          <h1>
            Perdeu seu
            <br />
            bichinho? Nós
            <br />
            ajudamos você a
            <br />
            encontrá-lo!
          </h1>

          <p>
            Acesse nosso site de busca de animais desaparecidos e conecte-se com
            quem pode ter visto ou resgatado seu pet.
          </p>

          {!isLoaded ? null : isSignedIn ? (
            <Link href="/home" className={styles.ctaLink}>
              Acesse de graça →
            </Link>
          ) : (
            <button
              type="button"
              className={styles.ctaButton}
              onClick={() => openSignUp({ forceRedirectUrl: "/home" })}
            >
              Acesse de graça →
            </button>
          )}
        </div>

        <div className={styles.heroImageCard}>
          <Image
            src="/images/muitoscachorros.png"
            alt="Animais"
            width={700}
            height={400}
            className={styles.heroImage}
          />
        </div>

        <div className={styles.waveLeft} />
        <div className={styles.waveCenter} />
      </section>

      <section className={styles.infoSection} id="missao">
        <div className={styles.infoText}>
          <h2>
            Receba notificações
            <br />
            de novos
            <br />
            avistamentos
          </h2>

          <p>
            Esteja sempre preparado para ajudar quem precisa com nosso sistema
            de notificações.
          </p>
        </div>

        <div className={styles.infoIllustration}>
          <Image
            src="/images/telefone.jpg"
            alt="Notificações"
            width={420}
            height={320}
          />
        </div>
      </section>

      <section className={styles.locationSection}>
        <div className={styles.locationIllustration}>
          <Image
            src="/images/cachorralizacao.png"
            alt="Busca por localização"
            width={260}
            height={260}
          />
        </div>

        <div className={styles.locationText}>
          <h2>
            Busca otimizada por
            <br />
            localização
          </h2>

          <p>
            Nosso sistema recomenda a você os desaparecimentos mais próximos à
            sua residência.
          </p>
        </div>
      </section>

      <footer className={styles.footer} id="contato">
        <div className={styles.footerBrand}>The Lost Of Us</div>

        <div className={styles.footerBottom}>
          <div className={styles.footerLeft}>
            <span>Política de Privacidade</span>
            <span>©2025 TheLostOfUs</span>
          </div>

          <div className={styles.footerRight}>
            <span>f</span>
            <span>t</span>
            <span>in</span>
          </div>
        </div>
      </footer>
    </main>
  );
}