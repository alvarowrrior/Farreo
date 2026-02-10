import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      
      <section className="relative z-10 px-6 py-16 text-center">
        {/* Badge superior */}
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
          <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">
            La noche te espera 🌙
          </span>
        </div>

        <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter text-white">
          FARREO 🍻
        </h1>

        <p className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto mb-12 font-light leading-relaxed">
          - Descubre los mejores locales para salir de <span className="text-white font-medium">fiesta</span> cerca de ti -
        </p>

        {/* CONTENEDOR DE BOTONES - Cambiado a flex-col-reverse y sm:flex-row-reverse */}
        <div className="flex flex-col-reverse sm:flex-row-reverse items-center justify-center gap-6 mb-18">
          
          {/* BOTÓN 2: EXPLORAR MAPA (Aparecerá a la izquierda en PC) */}
          <Link
            href="/buscar"
            className="group relative flex flex-col items-center justify-center w-48 h-48 font-semibold text-white transition-all duration-300 border border-white/10 bg-white/5 rounded-3xl hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
          >
            <span className="text-lg">Explorar mapa</span>
            <span className="text-5xl mt-4">🗺️</span>
          </Link>

          {/* BOTÓN 1: VER LOCALES (Aparecerá a la derecha en PC) */}
          <Link
            href="/explorar"
            className="group relative flex flex-col items-center justify-center w-48 h-48 font-bold text-white transition-all duration-300 border border-white/10 bg-white/5 rounded-3xl hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transform hover:scale-105 active:scale-95 shadow-xl backdrop-blur-sm"
          >
            <span className="text-lg">Ver locales</span>
            <span className="text-5xl mt-4">📍</span>
          </Link>

        </div>
      </section>
    </main>
  );
}