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
    <main className="explore-page">

      {/* CABECERA DINÁMICA */}
      <div className="explore-header">
        <div>
          <h1 className="explore-header__title">
            Radar Farreo
          </h1>
          <p className="explore-header__subtitle">
            Locales en Madrid ordenados por cercanía.
          </p>
          <div className="explore-header__location">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="explore-header__location-dot">
              <circle cx="4" cy="4" r="4" fill="currentColor" />
            </svg>
            Tu posición: {me ? `${me.lat.toFixed(4)}, ${me.lng.toFixed(4)}` : "Detectando..."}
          </div>
        </div>

        <div className="explore-header__actions">
          <button onClick={load} className="explore-header__btn-refresh">
            <RefreshIcon />
          </button>
          <Link href="/buscar" className="explore-header__btn-map">
            Abrir Mapa
          </Link>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="explore-search">
        <input
          type="text"
          placeholder="Busca por nombre o tipo (ej: bar, discoteca)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="explore-search__input"
        />
      </div>

      {err && (
        <div className="explore-alert">
          ⚠️ {err}
        </div>
      )}

      {/* LISTA DE LOCALES */}
      <section className="explore-list">
        {loading && (
          <div className="explore-list__loading">
            <svg className="explore-list__loading-spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <p className="explore-list__loading-text">Sincronizando con Firebase</p>
          </div>
        )}

        {!loading && filteredAndSorted.length === 0 && (
          <div className="explore-list__empty">
            <p className="explore-list__empty-text">No se encontraron locales que coincidan.</p>
          </div>
        )}

        {filteredAndSorted.map((l) => (
          <article key={l.id} className="local-card">
            <div className="local-card__inner">
              <div className="local-card__info">
                <div className="local-card__details">
                  <h3 className="local-card__name">
                    {l.nombre}
                  </h3>
                  <div className="local-card__tags">
                    <span className="local-card__tag-type">
                      {l.tipo || "Local"}
                    </span>
                    <span className="local-card__tag-text">
                      Distancia: <b>{fmtDistance(l.dist)}</b>
                    </span>
                    <span className="local-card__tag-text">
                      Rating: <b>{l.rating?.toFixed(1) || "4.5"}</b>
                    </span>
                  </div>
                </div>
              </div>

              <div className="local-card__actions">
                <Link
                  href={`/buscar?id=${l.id}`}
                  className="local-card__btn-map"
                >
                  Ver Mapa
                </Link>
                {l.web && (
                  <a
                    href={l.web}
                    target="_blank"
                    className="local-card__btn-link"
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
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
  );
}

function LinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
  );
}