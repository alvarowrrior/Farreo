import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b">
        <h1 className="text-2xl font-bold">Farreo 🍻</h1>

        <nav className="flex gap-6">
          <a href="#" className="text-gray-600 hover:text-black">
            Explorar
          </a>
          <a href="#" className="text-gray-600 hover:text-black">
            Login
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-5xl font-extrabold mb-6">
          Encuentra dónde salir esta noche
        </h2>

        <p className="text-lg text-gray-600 max-w-xl mb-8">
          Descubre bares, discotecas y planes cerca de ti. 
          Farreo te dice dónde está el ambiente.
        </p>

        <Link
          href="/explorar"
          className="px-6 py-3 text-lg font-semibold bg-black text-white rounded-xl hover:bg-gray-800 transition"
        >
          Ver locales
        </Link>
      </section>

    </main>
  );
}
