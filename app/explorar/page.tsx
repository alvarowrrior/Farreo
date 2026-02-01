"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLocales, type Local } from "@/lib/locales";

type Coords = { lat: number; lng: number };

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

  // 1) ubicación
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setErr("Tu navegador no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setErr("No se pudo obtener tu ubicación. (Permisos / HTTPS)");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  // 2) cargar locales
  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await getLocales();
      setLocals(data);
    } catch (e: any) {
      console.warn(e);
      setErr(e?.message ?? "No se pudieron cargar los locales.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // 3) calcular distancias + ordenar
  const localsWithDistance = useMemo(() => {
    const base = locals
      .filter((l) => typeof l.lat === "number" && typeof l.lng === "number")
      .map((l) => {
        const dist = me ? haversineMeters(me, { lat: l.lat, lng: l.lng }) : Infinity;
        return { ...l, dist };
      })
      .sort((a, b) => a.dist - b.dist);

    return base;
  }, [locals, me]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Buscar cerca de mí</h1>
          <p className="mt-2 text-gray-300">
            Lista de locales ordenados por distancia (sin buscador todavía).
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Recargar
          </button>
          <Link
            href="/buscar"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Abrir mapa
          </Link>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
          {err}
        </div>
      )}

      <section className="mt-6 space-y-4">
        {loading && (
          <div className="text-sm text-gray-300">Cargando locales…</div>
        )}

        {!loading && localsWithDistance.length === 0 && (
          <div className="text-sm text-gray-300">
            No hay locales aún. Crea alguno en Firestore en la colección <code>locales</code>.
          </div>
        )}

        {localsWithDistance.map((l) => (
          <article
            key={l.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">{l.name ?? "Local"}</h3>
                <p className="text-sm text-gray-400">
                  {l.type ?? "—"} · Distancia: <span className="text-gray-200">{fmtDistance(l.dist)}</span>
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Rating: <span className="text-gray-200">{typeof l.rating === "number" ? l.rating.toFixed(1) : "—"}</span>
                </p>
              </div>

              <div className="flex gap-2 sm:justify-end">
                <Link
                  href={`/buscar?lat=${encodeURIComponent(l.lat)}&lng=${encodeURIComponent(l.lng)}&name=${encodeURIComponent(
                    l.name ?? "Local"
                  )}`}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
                >
                  Ver en mapa
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
