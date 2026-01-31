import Link from "next/link";

export default function HomePage() {
  return (
    <section className="px-6 py-16 text-center">
      <h1 className="text-5xl font-extrabold mb-6">
        Encuentra dónde salir esta noche
      </h1>

      <p className="text-gray-400 max-w-xl mx-auto mb-8">
        Descubre bares, pubs y discotecas cerca de ti.
      </p>

      <Link
        href="/explorar"
        className="inline-block bg-white text-black px-6 py-3 rounded-xl font-semibold hover:opacity-90"
      >
        Ver locales
      </Link>
    </section>
  );
}
