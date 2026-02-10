import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-[85vh] flex items-center justify-center overflow-hidden z-0 bg-black">
      
      {/* Capa de fondo con luces: la animación viene de globals.css */}
      <div className="absolute inset-0 bg-night-life -z-10 pointer-events-none will-change-transform" />

      {/* Grano de película para textura nocturna */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/explorar"
            className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-black transition-all duration-200 bg-white rounded-full hover:bg-yellow-500 transform hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
          >
            Ver locales
          </Link>
          
          <Link
            href="/buscar"
            className="px-10 py-4 font-semibold text-white transition-all duration-200 border border-white/10 rounded-full hover:bg-white/5"
          >
            Explorar mapa
          </Link>
        </div>

        {/* Decoración inferior */}
        <div className="mt-20 flex flex-col items-center gap-2 opacity-20">
          <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
          <span className="text-[10px] uppercase tracking-widest text-white">Scroll para descubrir</span>
        </div>
      </section>
    </main>
  );
}