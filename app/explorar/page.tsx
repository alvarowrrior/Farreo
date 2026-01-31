import Link from "next/link";

type Local = {
  id: string;
  name: string;
  type: "Bar" | "Pub" | "Discoteca" | "Terraza";
  neighborhood: string;
  price: "€" | "€€" | "€€€";
  rating: number; // 0..5
  tags: string[];
  distanceKm: number;
  openNow: boolean;
};

const LOCALES: Local[] = [
  {
    id: "1",
    name: "La Esquina",
    type: "Bar",
    neighborhood: "Centro",
    price: "€",
    rating: 4.4,
    tags: ["tapitas", "cerveza", "tranquilo"],
    distanceKm: 0.8,
    openNow: true,
  },
  {
    id: "2",
    name: "Neon Club",
    type: "Discoteca",
    neighborhood: "Malasaña",
    price: "€€€",
    rating: 4.1,
    tags: ["techno", "late", "cola"],
    distanceKm: 2.3,
    openNow: true,
  },
  {
    id: "3",
    name: "Bruma Rooftop",
    type: "Terraza",
    neighborhood: "Chueca",
    price: "€€€",
    rating: 4.6,
    tags: ["cocktails", "vistas", "fotos"],
    distanceKm: 1.7,
    openNow: false,
  },
  {
    id: "4",
    name: "El Barril",
    type: "Pub",
    neighborhood: "Lavapiés",
    price: "€€",
    rating: 4.2,
    tags: ["rock", "buen ambiente", "tiradores"],
    distanceKm: 3.1,
    openNow: true,
  },
  {
    id: "5",
    name: "Caña & Limon",
    type: "Bar",
    neighborhood: "Centro",
    price: "€",
    rating: 4.0,
    tags: ["barato", "amigos", "raciones"],
    distanceKm: 0.5,
    openNow: false,
  },
  {
    id: "6",
    name: "Sótano 12",
    type: "Pub",
    neighborhood: "Argüelles",
    price: "€€",
    rating: 4.7,
    tags: ["indie", "sin postureo", "buen sonido"],
    distanceKm: 4.4,
    openNow: true,
  },
];

function clampRating(r: number) {
  return Math.max(0, Math.min(5, r));
}

function Stars({ rating }: { rating: number }) {
  const r = clampRating(rating);
  const full = Math.floor(r);
  const half = r - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {Array.from({ length: full }).map((_, i) => (
          <span key={`f-${i}`} aria-hidden className="text-yellow-400">★</span>
        ))}
        {half === 1 && <span aria-hidden className="text-yellow-400">☆</span>}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`e-${i}`} aria-hidden className="text-gray-400">★</span>
        ))}
      </div>
      <span className="text-sm text-gray-400">{r.toFixed(1)}</span>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
      {children}
    </span>
  );
}

export default function ExplorarPage() {
  // Filtros (sin estado aún: versión “estática” bonita)
  // Si quieres, en el siguiente paso la hacemos interactiva con useState.
  const featured = LOCALES.slice().sort((a, b) => b.rating - a.rating).slice(0, 3);
  const openNow = LOCALES.filter((l) => l.openNow).slice(0, 4);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold hover:opacity-90">
              Farreo 🍻
            </Link>
            <span className="hidden sm:inline text-sm text-gray-400">
              Explorar
            </span>
          </div>

          <nav className="flex items-center gap-4">
            <Link
              href="/explorar"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Explorar
            </Link>
            <Link
              href="#"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Hero + Search */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/0 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">
                Explora locales cerca de ti
              </h1>
              <p className="mt-2 max-w-2xl text-gray-300">
                Filtra por tipo, precio y zona. Guarda favoritos y descubre dónde está el ambiente.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                ← Volver
              </Link>
              <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90">
                Usar mi ubicación
              </button>
            </div>
          </div>

          {/* Search + Filters row */}
          <div className="mt-6 grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-6">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                <span aria-hidden className="text-gray-400">🔎</span>
                <input
                  placeholder="Buscar por nombre, tag o zona…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <select className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-gray-200 outline-none">
                <option>Tipo</option>
                <option>Bar</option>
                <option>Pub</option>
                <option>Discoteca</option>
                <option>Terraza</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <select className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-gray-200 outline-none">
                <option>Precio</option>
                <option>€</option>
                <option>€€</option>
                <option>€€€</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <select className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-gray-200 outline-none">
                <option>Zona</option>
                <option>Centro</option>
                <option>Malasaña</option>
                <option>Chueca</option>
                <option>Lavapiés</option>
                <option>Argüelles</option>
              </select>
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill>Abiertos ahora</Pill>
            <Pill>Mejor valorados</Pill>
            <Pill>Baratos</Pill>
            <Pill>Terrazas</Pill>
            <Pill>Sin cola</Pill>
          </div>
        </section>

        {/* Content grid */}
        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Left: lists */}
          <div className="lg:col-span-7 space-y-6">
            {/* Destacados */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Destacados</h2>
                <button className="text-sm text-gray-300 hover:text-white">
                  Ver todos →
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {featured.map((l) => (
                  <article
                    key={l.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4 hover:bg-black/60 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{l.name}</h3>
                        <p className="text-sm text-gray-400">
                          {l.type} · {l.neighborhood} · {l.price}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          l.openNow
                            ? "bg-green-500/15 text-green-300 border border-green-500/20"
                            : "bg-red-500/15 text-red-300 border border-red-500/20"
                        }`}
                      >
                        {l.openNow ? "Abierto" : "Cerrado"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <Stars rating={l.rating} />
                      <span className="text-sm text-gray-400">
                        {l.distanceKm.toFixed(1)} km
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {l.tags.slice(0, 3).map((t) => (
                        <Pill key={t}>#{t}</Pill>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90">
                        Ver detalles
                      </button>
                      <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                        ☆
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Abiertos ahora */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Abiertos ahora</h2>
                <span className="text-sm text-gray-400">
                  {openNow.length} resultados
                </span>
              </div>

              <div className="space-y-3">
                {openNow.map((l) => (
                  <article
                    key={l.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold">{l.name}</h3>
                      <p className="text-sm text-gray-400">
                        {l.type} · {l.neighborhood} · {l.price} · {l.distanceKm.toFixed(1)} km
                      </p>
                      <div className="mt-2">
                        <Stars rating={l.rating} />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90">
                        Ir
                      </button>
                      <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                        Guardar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Right: map + sidebar */}
          <aside className="lg:col-span-5 space-y-6">
            {/* Map placeholder */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold">Mapa</h2>
                <span className="text-sm text-gray-400">Próximamente</span>
              </div>

              <div className="h-72 rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">
                  Aquí irá el mapa (Mapbox / Google Maps) con marcadores.
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-400">
                Mientras, puedes explorar con lista y filtros. Luego conectamos el mapa a los datos.
              </p>
            </div>

            {/* Recommendations */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-bold">Para esta noche</h2>
              <p className="mt-1 text-sm text-gray-300">
                Sugerencias rápidas según “ambiente”.
              </p>

              <div className="mt-4 grid gap-3">
                <button className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-left hover:bg-black/60 transition">
                  <div className="text-sm font-semibold">🕺 Fiesta</div>
                  <div className="text-xs text-gray-400">
                    Discotecas, música alta y cierre tarde.
                  </div>
                </button>

                <button className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-left hover:bg-black/60 transition">
                  <div className="text-sm font-semibold">🍻 Chill</div>
                  <div className="text-xs text-gray-400">
                    Bares tranquilos para hablar y picar algo.
                  </div>
                </button>

                <button className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-left hover:bg-black/60 transition">
                  <div className="text-sm font-semibold">🍸 Cocktails</div>
                  <div className="text-xs text-gray-400">
                    Terrazas y coctelerías con buen rollo.
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-white/10 py-8 text-sm text-gray-400">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Farreo · Exploración (mock)</span>
            <span>Luego: datos reales + mapa + favoritos</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
