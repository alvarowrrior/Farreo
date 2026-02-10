"use client";

import { Suspense, useState } from "react";
import MapNearMe from "@/components/MapNearMe";
import type { Local } from "@/lib/locales";

export default function BuscarPage() {
  // Estado para almacenar el local seleccionado desde el mapa
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);

  return (
    <main className="relative pt-5 pb-10 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera */}
        <header className="flex flex-col gap-1 px-6 mb-1">
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
              {/* Le pasamos la función para "setear" el local al componente del mapa */}
              <MapNearMe onSelectLocal={setSelectedLocal} />
            </div>
          </Suspense>
        </section>

        {/* DETALLE DEL LOCAL SELECCIONADO */}
        {/* Se despliega solo si hay un local seleccionado */}
        <div 
          className={`px-4 sm:px-0 transition-all duration-500 ease-out ${
            selectedLocal 
              ? "mt-8 opacity-100 translate-y-0 max-h-[500px]" 
              : "mt-0 opacity-0 translate-y-4 max-h-0 overflow-hidden"
          }`}
        >
          {selectedLocal && (
            <div className="relative bg-white/5 border border-white/10 rounded-[2.5rem] p-6 sm:p-10 backdrop-blur-xl overflow-hidden">
              {/* Botón de cerrar */}
              <button 
                onClick={() => setSelectedLocal(null)}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Placeholder de imagen o miniatura */}
                <div className="w-full md:w-48 h-48 bg-yellow-500/10 rounded-3xl border border-yellow-500/20 flex items-center justify-center">
                  <span className="text-yellow-500 text-4xl">✨</span>
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <span className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em]">
                      Local Seleccionado
                    </span>
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                      {selectedLocal.name}
                    </h2>
                    <p className="text-gray-400 font-medium">
                      {selectedLocal.type || "Club nocturno"} • {selectedLocal.rating ? `⭐ ${selectedLocal.rating}` : "Sin valoraciones"}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <button className="px-8 py-3 bg-white text-black font-black uppercase text-xs rounded-xl hover:bg-yellow-500 transition-colors shadow-lg shadow-white/5">
                      Reservar Mesa
                    </button>
                    <button className="px-8 py-3 bg-white/5 border border-white/10 text-white font-black uppercase text-xs rounded-xl hover:bg-white/10 transition-colors">
                      Ver Menú
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row items-center gap-4 justify-between py-10 px-8 text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <p className="text-[10px] uppercase font-bold tracking-widest">
              Conexión GPS Estable
            </p>
          </div>
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">
            Farreo App v2.0
          </p>
        </footer>
      </div>

      {/* Luz ambiental */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 blur-[120px] -z-10 pointer-events-none" />
    </main>
  );
}