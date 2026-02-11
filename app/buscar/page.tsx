"use client";

import { Suspense, useState } from "react";
import MapNearMe from "@/components/MapNearMe";
import { Local } from "@/lib/locales";

export default function BuscarPage() {
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);

  return (
    <main className="relative pt-5 pb-10 min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col gap-1 px-6 mb-6">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
            Explorar Mapa
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium max-w-md">
            Encuentra los mejores locales y eventos a tu alrededor en Madrid.
          </p>
        </header>

        <section className="relative w-full overflow-hidden sm:rounded-[3rem] border-y sm:border border-white/10 shadow-2xl bg-zinc-950">
          <Suspense fallback={<LoadingState />}>
            <div className="w-full h-[70vh] sm:h-[650px]">
              <MapNearMe onSelectLocal={setSelectedLocal} />
            </div>
          </Suspense>
        </section>

        <div 
          className={`px-4 sm:px-0 transition-all duration-700 ease-in-out ${
            selectedLocal ? "mt-8 opacity-100 translate-y-0" : "mt-0 opacity-0 translate-y-10 pointer-events-none"
          }`}
        >
          {selectedLocal && (
            <div className="relative bg-zinc-900/50 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 backdrop-blur-2xl overflow-hidden shadow-2xl">
              
              <button 
                onClick={() => setSelectedLocal(null)}
                className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:rotate-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-72 space-y-4">
                  <div className="aspect-square bg-yellow-500/10 rounded-[2rem] border border-yellow-500/20 flex items-center justify-center overflow-hidden relative">
                    <span className="text-yellow-500 text-6xl">✨</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col items-center">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Rating</span>
                      <span className="text-white font-black text-sm">{selectedLocal.rating || "4.5"}</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col items-center">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Tipo</span>
                      <span className="text-white font-black text-sm capitalize">{selectedLocal.tipo || "Local"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between py-2">
                  <div className="space-y-4">
                    <span className="bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Verificado</span>
                    <h2 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                      {/* Ajustado a 'nombre' según tu Firebase */}
                      {selectedLocal.nombre}
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-xl">
                      {/* Ajustado a 'description' y 'direccion' */}
                      {selectedLocal.description || (selectedLocal.direccion ? `Ubicado en ${selectedLocal.direccion}.` : "Vive una experiencia única en el epicentro de la fiesta.")} 
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button className="flex-1 bg-white text-black font-black py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-yellow-500 transition-all">
                      Reservar Mesa
                    </button>
                    {/* Botón dinámico usando el campo 'web' de tu DB */}
                    <a 
                      href={selectedLocal.web || "#"} 
                      target="_blank" 
                      className="flex-1 bg-zinc-800 border border-white/10 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest text-center"
                    >
                      Más Información
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="flex flex-col sm:flex-row items-center gap-4 justify-between py-12 px-8 text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <p className="text-[10px] uppercase font-black tracking-widest">Sincronizado con Firebase</p>
          </div>
          <p className="text-[10px] uppercase font-black tracking-widest opacity-30">Farreo App v2.5 • 2026</p>
        </footer>
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="w-full h-[70vh] sm:h-[650px] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/5 border-t-yellow-500 rounded-full animate-spin mb-4" />
      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Cargando Radar</p>
    </div>
  );
}