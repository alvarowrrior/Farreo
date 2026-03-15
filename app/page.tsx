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

      <section className="home-actions">
        <Link href="/buscar" className="home-cta">
          <span className="home-cta__text">Ir al mapa</span>
          <svg className="home-cta__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </section>
    </main>
  );
}