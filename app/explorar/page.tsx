"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLocales, type Local } from "@/lib/locales";
import { getCoords, type Coords } from "@/lib/location";

// Cálculo de distancia entre dos puntos (Fórmula de Haversine)
function haversineMeters(a: Coords, b: Coords) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function fmtDistance(m: number) {
  if (!Number.isFinite(m)) return "—";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

export default function BuscarPage() {
  const [me, setMe] = useState<Coords | null>(null);
  const [locals, setLocals] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // Nuevo: Estado para el buscador

  // 1) Obtener ubicación actual
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await getCoords();
        if (alive) setMe(c);
      } catch (e: any) {
        if (alive) setErr("Activa la ubicación para ver la distancia real.");
      }
    })();
    return () => { alive = false; };
  }, []);

  // 2) Cargar locales desde Firebase
  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await getLocales();
      setLocals(data);
    } catch (e: any) {
      setErr("Error al conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // 3) Filtrar por búsqueda + Calcular distancia + Ordenar por cercanía
  const filteredAndSorted = useMemo(() => {
    return locals
      .filter((l) => 
        l.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((l) => {
        const dist = me ? haversineMeters(me, { lat: l.lat, lng: l.lng }) : Infinity;
        return { ...l, dist };
      })
      .sort((a, b) => a.dist - b.dist);
  }, [locals, me, searchTerm]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 min-h-screen bg-black text-white">
      
      {/* CABECERA DINÁMICA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">
            Radar Farreo
          </h1>
          <p className="mt-2 text-gray-400 font-medium">
            Locales en Madrid ordenados por cercanía.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-500">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            Tu posición: {me ? `${me.lat.toFixed(4)}, ${me.lng.toFixed(4)}` : "Detectando..."}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={load} className="p-4 rounded-2xl bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition">
            <RefreshIcon />
          </button>
          <Link href="/buscar" className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-yellow-500 transition">
            Abrir Mapa
          </Link>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="relative mb-8">
        <input 
          type="text"
          placeholder="Busca por nombre o tipo (ej: bar, discoteca)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/50 transition"
        />
      </div>

      {err && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold uppercase tracking-tight">
          ⚠️ {err}
        </div>
      )}

      {/* LISTA DE LOCALES */}
      <section className="grid gap-4">
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-white/10 border-t-yellow-500 rounded-full animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Sincronizando con Firebase</p>
          </div>
        )}

        {!loading && filteredAndSorted.length === 0 && (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-[3rem]">
            <p className="text-gray-500 font-medium">No se encontraron locales que coincidan.</p>
          </div>
        )}

        {filteredAndSorted.map((l) => (
          <article
            key={l.id}
            className="group relative rounded-[2.5rem] border border-white/5 bg-zinc-950 p-6 hover:bg-zinc-900 hover:border-white/10 transition-all duration-500"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  ✨
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                    {l.nombre}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md">
                      {l.tipo || "Local"}
                    </span>
                    <span className="text-sm text-gray-400 font-medium">
                      Distancia: <b className="text-gray-200">{fmtDistance(l.dist)}</b>
                    </span>
                    <span className="text-sm text-gray-400 font-medium">
                      Rating: <b className="text-gray-200">{l.rating?.toFixed(1) || "4.5"}</b>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/buscar?lat=${l.lat}&lng=${l.lng}`}
                  className="px-6 py-3 rounded-xl bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  Ver Mapa
                </Link>
                {l.web && (
                  <a 
                    href={l.web} 
                    target="_blank" 
                    className="p-3 rounded-xl border border-white/10 text-gray-400 hover:text-white transition"
                  >
                    <LinkIcon />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

// ICONOS
function RefreshIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
  );
}

function LinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
  );
}