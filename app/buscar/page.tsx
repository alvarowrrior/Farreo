"use client";

import { useEffect, useMemo, useState } from "react";
import MapNearMe from "@/components/MapNearMe";
import type { Local } from "@/lib/locales";

type SheetSnap = "closed" | "mid" | "full";

export default function BuscarPage() {
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);
  const [snap, setSnap] = useState<SheetSnap>("closed");

  // 1. Bloquear scroll y OCULTAR FOOTER
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    
    // Ocultar footer si existe en el layout global
    const footer = document.querySelector("footer");
    if (footer) footer.style.display = "none";

    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
      if (footer) footer.style.display = "block";
    };
  }, []);

  // Abrir al seleccionar local
  useEffect(() => {
    if (selectedLocal) setSnap("mid");
    else setSnap("closed");
  }, [selectedLocal]);

  const title = useMemo(() => {
    return selectedLocal ? selectedLocal.nombre : "Cerca de ti";
  }, [selectedLocal]);

  return (
    <main className="fixed inset-0 bg-black overflow-hidden">
      {/* MAPA */}
      <div className="absolute inset-0">
        <MapNearMe onSelectLocal={setSelectedLocal} />
      </div>

      {/* BOTTOM SHEET */}
      <BottomSheet
        snap={snap}
        onSnapChange={setSnap}
        title={title}
        onClose={() => {
          setSnap("closed");
          setSelectedLocal(null);
        }}
      >
        {selectedLocal ? (
          <PanelContent local={selectedLocal} />
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-400">Toca un marcador en el mapa</p>
          </div>
        )}
      </BottomSheet>
    </main>
  );
}

/* ---------------- Bottom Sheet ---------------- */

function BottomSheet({
  snap,
  onSnapChange,
  onClose,
  title,
  children,
}: {
  snap: SheetSnap;
  onSnapChange: (s: SheetSnap) => void;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  
  // Función para alternar snap al hacer click en la barra
  const handleToggle = () => {
    if (snap === "mid") onSnapChange("full");
    else onSnapChange("mid");
  };

  // Definición de posiciones (translateY)
  const getTranslation = () => {
    switch (snap) {
      case "full": return "12vh";  // Casi arriba
      case "mid": return "55vh";   // Mitad de pantalla
      case "closed": return "100vh"; // Escondido
    }
  };

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex justify-center">
      <div
        className={`
          pointer-events-auto 
          w-full sm:w-[90%] md:w-[600px] lg:w-[700px] /* ✅ Ancho responsivo actualizado */
          bg-zinc-900/95 backdrop-blur-xl 
          border border-white/10 rounded-t-[2.5rem] shadow-2xl shadow-black/90
          transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) /* Animación fluida */
        `}
        style={{ transform: `translateY(${getTranslation()})` }}
      >
        {/* HEADER / BOTÓN DE CONTROL */}
        <div 
          className="w-full pt-4 pb-2 cursor-pointer group"
          onClick={handleToggle}
        >
          {/* La barrita (píldora) */}
          <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors" />
          
          <div className="mt-4 px-6 flex items-center justify-between">
            <h1 className="text-lg font-bold text-white truncate pr-4 uppercase italic tracking-tight">
              {title}
            </h1>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Evita que el click cierre/abra el panel
                onClose();
              }}
              className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-widest"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* CONTENIDO */}
        <div
          className={`px-6 pb-10 h-full ${snap === "full" ? "overflow-y-auto" : "overflow-hidden"}`}
          style={{ maxHeight: "85vh" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Panel content ---------------- */

function PanelContent({ local }: { local: Local }) {
  return (
    <article className="pb-10">
      {/* Imagen con Aspect Ratio controlado */}
      <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-zinc-1200 mt-2 shadow-lg">
        {local.fotoUrl ? (
          <img
            src={local.fotoUrl}
            alt={local.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-zinc-800">
            <span className="text-4xl opacity-50">📸</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between items-start">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-yellow-500 text-black text-[10px] font-black uppercase tracking-tighter mb-2">
            {local.tipo || "Premium"}
          </span>
          <h2 className="text-3xl font-black text-white uppercase italic leading-none">
            {local.nombre}
          </h2>
        </div>
        
        <div className="bg-white/5 p-2 rounded-2xl border border-white/5 text-center min-w-[60px]">
          <span className="block text-yellow-400 text-lg font-bold">★ {local.rating || "4.5"}</span>
          <span className="text-[9px] text-zinc-500 uppercase font-bold">{local.numResenas || "0"} reviews</span>
        </div>
      </div>

      <p className="mt-4 text-zinc-400 text-base leading-relaxed">
        {local.descripcion || "Este local aún no tiene una descripción detallada. ¡Ven a descubrirlo!"}
      </p>

      {local.direccion && (
        <div className="mt-6 flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-zinc-300">
          <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="text-sm font-medium">{local.direccion}</span>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4">
        <button className="bg-white text-black py-4 rounded-2xl font-black text-sm uppercase hover:bg-yellow-400 transition-colors shadow-xl shadow-white/5">
          Reservar Mesa
        </button>
        <a
          href={local.web || "#"}
          target="_blank"
          className="flex items-center justify-center border-2 border-white/10 text-white py-4 rounded-2xl font-black text-sm uppercase hover:bg-white/5 transition-all"
        >
          Sitio Web
        </a>
      </div>
    </article>
  );
}