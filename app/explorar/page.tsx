import Link from "next/link";

type Result = {
  id: string;
  name: string;
  type: "Bar" | "Pub" | "Discoteca" | "Terraza";
  neighborhood: string;
  price: "€" | "€€" | "€€€";
  rating: number;
  tags: string[];
};

const RESULTS: Result[] = [
  { id: "1", name: "La Esquina", type: "Bar", neighborhood: "Centro", price: "€", rating: 4.4, tags: ["tapitas", "cerveza"] },
  { id: "2", name: "Neon Club", type: "Discoteca", neighborhood: "Malasaña", price: "€€€", rating: 4.1, tags: ["techno", "late"] },
  { id: "3", name: "Bruma Rooftop", type: "Terraza", neighborhood: "Chueca", price: "€€€", rating: 4.6, tags: ["cocktails", "vistas"] },
  { id: "4", name: "Sótano 12", type: "Pub", neighborhood: "Argüelles", price: "€€", rating: 4.7, tags: ["indie", "buen sonido"] },
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
      {children}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, rating));
  const full = Math.floor(r);
  const empty = 5 - full;
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex">
        {Array.from({ length: full }).map((_, i) => (
          <span key={`f-${i}`} className="text-yellow-400">★</span>
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`e-${i}`} className="text-gray-600">★</span>
        ))}
      </div>
      <span className="text-gray-400">{r.toFixed(1)}</span>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Top */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold">Buscar</h1>
            <p className="mt-2 text-gray-300 max-w-2xl">
              Encuentra locales por nombre, zona o estilo. Simple y rápido.
            </p>
          </div>

          <Link
            href="/explorar"
            className="w-fit rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Ir a Explorar →
          </Link>
        </div>

        {/* Search bar */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-7">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                <span aria-hidden className="text-gray-400">🔎</span>
                <input
                  placeholder="Buscar “terraza”, “techno”, “Centro”…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
                />
                <kbd className="hidden sm:inline rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-300">
                  Ctrl K
                </kbd>
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
                <option>Zona</option>
                <option>Centro</option>
                <option>Malasaña</option>
                <option>Chueca</option>
                <option>Argüelles</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <button className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:opacity-90">
                Buscar
              </button>
            </div>
          </div>

          {/* Quick chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill>🔥 Tendencia: terrazas</Pill>
            <Pill>🕺 Techno</Pill>
            <Pill>🍻 Barato</Pill>
            <Pill>✨ Mejor valorados</Pill>
          </div>
        </section>

        {/* Results */}
        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Resultados</h2>
              <span className="text-sm text-gray-400">{RESULTS.length} encontrados</span>
            </div>

            {RESULTS.map((r) => (
              <article
                key={r.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{r.name}</h3>
                    <p className="text-sm text-gray-400">
                      {r.type} · {r.neighborhood} · {r.price}
                    </p>
                    <div className="mt-2">
                      <Stars rating={r.rating} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.tags.map((t) => (
                        <Pill key={t}>#{t}</Pill>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 sm:justify-end">
                    <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90">
                      Ver
                    </button>
                    <button className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm hover:bg-black/60">
                      Guardar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Side panel */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-bold">Tips rápidos</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li>• Prueba buscar por zona: “Centro”, “Chueca”…</li>
                <li>• Usa tags: “cocktails”, “indie”, “tapitas”.</li>
                <li>• Luego conectamos esto a datos reales (Firebase).</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-bold">Atajos</h3>
              <div className="mt-3 grid gap-2 text-sm text-gray-300">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <span>Abrir búsqueda</span>
                  <span className="font-mono text-gray-400">Ctrl K</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <span>Ir a Explorar</span>
                  <span className="font-mono text-gray-400">/explorar</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
