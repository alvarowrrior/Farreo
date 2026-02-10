"use client";

import { Suspense, useState } from "react";
import MapNearMe from "@/components/MapNearMe";
import type { Local } from "@/lib/locales";

export default function BuscarPage() {
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);

  return (
    <main className="relative pt-5 pb-10 min-h-screen bg-black">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera */}
        <header className="flex flex-col gap-1 px-6 mb-6">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
            Explorar Mapa
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium max-w-md">
            Encuentra los mejores locales y eventos a tu alrededor.
          </p>
        </header>

        {/* CONTENEDOR DEL MAPA */}
        <section className="relative w-full overflow-hidden sm:rounded-[3rem] border-y sm:border border-white/10 shadow-2xl shadow-black/50 bg-zinc-950">
          <Suspense
            fallback={
              <div className="w-full h-[70vh] sm:h-[650px] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/5 border-t-yellow-500 rounded-full animate-spin mb-4" />
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black">
                  Cargando Radar
                </p>
              </div>
            }
          >
            <div className="w-full h-[70vh] sm:h-[650px]">
              <MapNearMe onSelectLocal={setSelectedLocal} />
            </div>
          </Suspense>
        </section>

        {/* DETALLE DEL LOCAL SELECCIONADO (Rediseñado) */}
        <div 
          className={`px-4 sm:px-0 transition-all duration-700 ease-in-out ${
            selectedLocal 
              ? "mt-8 opacity-100 translate-y-0" 
              : "mt-0 opacity-0 translate-y-10 pointer-events-none"
          }`}
        >
          {selectedLocal && (
            <div className="relative bg-zinc-900/50 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 backdrop-blur-2xl overflow-hidden shadow-2xl">
              
              {/* Botón de cerrar con rotación */}
              <button 
                onClick={() => setSelectedLocal(null)}
                className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:rotate-90 text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* COLUMNA IZQUIERDA: Imagen + Mini Info Dashboard */}
                <div className="w-full lg:w-72 space-y-4">
                  {/* Imagen Principal */}
                  <div className="aspect-square bg-yellow-500/10 rounded-[2rem] border border-yellow-500/20 flex items-center justify-center overflow-hidden relative group">
                    <span className="text-yellow-500 text-6xl group-hover:scale-110 transition-transform duration-500">✨</span>
                    {/* <img src={selectedLocal.imageUrl} className="object-cover w-full h-full" /> */}
                  </div>

                  {/* DASHBOARD DE DATOS RÁPIDOS */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col items-center">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Aforo</span>
                      <span className="text-white font-black text-sm">85%</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col items-center">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Precio Med.</span>
                      <span className="text-white font-black text-sm">15€</span>
                    </div>
                    <div className="col-span-2 bg-green-500/10 border border-green-500/20 p-2 rounded-2xl flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Abierto hasta 06:00</span>
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: Info Principal y Acciones */}
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Verificado
                        </span>
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest italic">
                          {selectedLocal.type || "Club"}
                        </span>
                      </div>
                      <h2 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
                        {selectedLocal.name}
                      </h2>
                      <div className="flex items-center gap-3 mt-3">
                         <div className="flex text-yellow-500 text-sm">
                            {"★".repeat(Math.floor(selectedLocal.rating || 5))}
                         </div>
                         <span className="text-gray-400 font-bold text-sm tracking-widest">
                           {selectedLocal.rating || "5.0"}
                         </span>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-xl">
                      {selectedLocal.description || "Vive una experiencia única en el epicentro de la fiesta. Sonido de alta fidelidad, zona VIP exclusiva y los mejores DJs de la escena actual."}
                    </p>
                  </div>

                  {/* BOTONES DE ACCIÓN */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button className="flex-1 bg-white text-black font-black py-4 rounded-2xl uppercase text-xs tracking-[0.2em] hover:bg-yellow-500 transition-all active:scale-95 shadow-xl shadow-white/5">
                      Reservar Mesa VIP
                    </button>
                    <button className="flex-1 bg-zinc-800 border border-white/10 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-[0.2em] hover:bg-zinc-700 transition-all active:scale-95">
                      Ver Programación
                    </button>
                    <button className="w-full sm:w-16 h-14 bg-zinc-800 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-zinc-700 transition-all group">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5 group-hover:scale-110 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row items-center gap-4 justify-between py-12 px-8 text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <p className="text-[10px] uppercase font-black tracking-[0.2em]">
              Sincronizado en tiempo real
            </p>
          </div>
          <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-30">
            Farreo App v2.5 • 2026
          </p>
        </footer>
      </div>

      {/* Luz ambiental de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 blur-[150px] -z-10 pointer-events-none" />
    </main>
  );
}