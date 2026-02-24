import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <header className="px-6 pt-10">
        <nav className="max-w-5xl mx-auto flex justify-between items-center">
          <span className="text-lg font-semibold">Farreo</span>
          <Link href="/perfil" className="text-sm text-gray-400 hover:text-white">
            Mi perfil
          </Link>
        </nav>
      </header>

      <main className="px-6 pb-16">
        <section className="max-w-3xl mx-auto text-center mt-16">
          <h1 className="text-4xl md:text-6xl font-bold">
            Encuentra dónde salir esta noche
          </h1>

          <p className="mt-6 text-gray-400 text-lg">
            Descubre eventos y locales cerca de ti de forma rápida y sencilla.
          </p>
        </section>

        <section className="max-w-3xl mx-auto mt-16 grid gap-6 sm:grid-cols-2">
          <Link
            href="/mapa"
            className="block border border-white/10 rounded-2xl p-8 text-center hover:bg-white/5 transition"
          >
            <h2 className="text-xl font-semibold">Explorar mapa</h2>
            <p className="text-sm text-gray-400 mt-2">
              Ver locales y eventos cerca de tu ubicación.
            </p>
          </Link>

          <Link
            href="/explorar"
            className="block border border-white/10 rounded-2xl p-8 text-center hover:bg-white/5 transition"
          >
            <h2 className="text-xl font-semibold">Explorar por lista</h2>
            <p className="text-sm text-gray-400 mt-2">
              Buscar por ciudad, fecha o tipo de evento.
            </p>
          </Link>
        </section>
      </main>
    </>
  );
}