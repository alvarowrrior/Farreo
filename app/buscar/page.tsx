"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import MapNearMe from "@/components/MapNearMe";
import type { Local } from "@/lib/locales";

type SheetSnap = "closed" | "mid" | "full";

export default function BuscarPage() {
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);
  const [snap, setSnap] = useState<SheetSnap>("closed");

  // Bloquear scroll y OCULTAR FOOTER
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    
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
      <div className="absolute inset-0">
        <MapNearMe onSelectLocal={setSelectedLocal} />
      </div>

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
          <div className="p-10 text-center">
            <p className="text-zinc-500 font-medium">Toca un marcador...</p>
          </div>
        )}
      </BottomSheet>
    </main>
  );
}

/* --- BOTTOM SHEET --- */
function BottomSheet({ snap, onSnapChange, onClose, title, children }: any) {
  const handleToggle = () => (snap === "mid" ? onSnapChange("full") : onSnapChange("mid"));
  
  const getTranslation = () => {
    switch (snap) {
      case "full": return "10vh";
      case "mid": return "55vh";
      case "closed": return "100vh";
      default: return "100vh";
    }
  };

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex justify-center">
      <div
        className="pointer-events-auto w-full sm:w-[90%] md:w-[550px] bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-t-[3rem] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ transform: `translateY(${getTranslation()})` }}
      >
        <div className="w-full pt-4 pb-2 cursor-pointer group" onClick={handleToggle}>
          <div className="mx-auto h-1.5 w-12 rounded-full bg-white/10 group-hover:bg-white/30 transition-colors" />
          <div className="mt-4 px-8 flex items-center justify-between">
            <h1 className="text-xl font-black text-white truncate pr-4 uppercase italic tracking-tighter">{title}</h1>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white">✕</button>
          </div>
        </div>
        <div className={`px-8 pb-20 h-full ${snap === "full" ? "overflow-y-auto" : "overflow-hidden"}`} style={{ maxHeight: "85vh" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* --- CONTENIDO DEL LOCAL --- */
function PanelContent({ local }: { local: Local }) {
  return (
    <article className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden bg-zinc-800 mt-4 shadow-2xl group">
        {local.fotoUrl ? (
          <Image
            src={local.fotoUrl}
            alt={local.nombre}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 550px"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-800 border border-white/5">
            <span className="text-4xl mb-2 opacity-20">📸</span>
            <span className="text-[10px] uppercase font-bold text-zinc-500">Sin foto</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="mt-8 flex justify-between items-start gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-yellow-500 text-black text-[10px] font-black uppercase mb-3 shadow-lg">
            {local.tipo || "Local"}
          </span>
          <h2 className="text-4xl font-black text-white uppercase italic leading-none tracking-tighter">{local.nombre}</h2>
        </div>
        <div className="bg-white/5 backdrop-blur-md p-3 rounded-[1.5rem] border border-white/10 text-center min-w-[70px]">
          <span className="block text-yellow-400 text-xl font-black">★ {local.rating || "4.5"}</span>
        </div>
      </div>

      <p className="mt-6 text-zinc-400 text-lg leading-relaxed font-light italic">
        "{local.descripcion || "Descripción no disponible."}"
      </p>

      {local.direccion && (
        <div className="mt-8 flex items-center gap-4 p-5 rounded-[1.5rem] bg-white/5 border border-white/5 text-zinc-300">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">📍</div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Ubicación</p>
            <span className="text-sm font-medium">{local.direccion}</span>
          </div>
        </div>
      )}

      <div className="mt-10 grid grid-cols-2 gap-4 pb-10">
        <button className="bg-white text-black py-5 rounded-[1.5rem] font-black text-sm uppercase hover:bg-yellow-500 transition-all">Reservar</button>
        <a href={local.web || "#"} target="_blank" className={`flex items-center justify-center border border-white/20 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase ${!local.web && "opacity-30 pointer-events-none"}`}>Web</a>
      </div>
    </article>
  );
}