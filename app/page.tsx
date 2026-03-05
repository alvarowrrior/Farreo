// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-main">
      <section className="hero">
        <h1 className="hero__title">
          Encuentra dónde salir esta noche
        </h1>
        <p className="hero__subtitle">
          Descubre eventos y locales cerca de ti de forma rápida y sencilla.
        </p>
      </section>

      <section className="features-grid">
        <Link href="/buscar" className="feature-card">
          <h2 className="feature-card__title">Explorar mapa</h2>
          <p className="feature-card__desc">
            Ver locales y eventos cerca de tu ubicación.
          </p>
        </Link>

        <Link href="/explorar" className="feature-card">
          <h2 className="feature-card__title">Explorar por lista</h2>
          <p className="feature-card__desc">
            Buscar por ciudad, fecha o tipo de evento.
          </p>
        </Link>
      </section>
    </main>
  );
}