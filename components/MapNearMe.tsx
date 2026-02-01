"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useSearchParams } from "next/navigation";
import type { Local } from "@/lib/locales";
import { getLocales } from "@/lib/locales";

type Coords = { lng: number; lat: number };

const FALLBACK: Coords = { lng: -0.473, lat: 38.705 };

// Para poder “matchear” coords con tolerancia
function dist2(aLat: number, aLng: number, bLat: number, bLng: number) {
  const dLat = aLat - bLat;
  const dLng = aLng - bLng;
  return dLat * dLat + dLng * dLng;
}

export default function MapNearMe() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const searchParams = useSearchParams();

  // ✅ params para “ir a un local”
  const focusLat = useMemo(() => Number(searchParams.get("lat")), [searchParams]);
  const focusLng = useMemo(() => Number(searchParams.get("lng")), [searchParams]);
  const focusName = useMemo(() => searchParams.get("name") ?? "Local", [searchParams]);

  const hasFocus =
    Number.isFinite(focusLat) &&
    Number.isFinite(focusLng) &&
    Math.abs(focusLat) <= 90 &&
    Math.abs(focusLng) <= 180;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Marker de tu ubicación
  const meMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // ✅ Guardamos markers de locales en un map (key aproximada) + lista con coords para tolerancia
  const localeMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const localeCoordsRef = useRef<Array<{ lat: number; lng: number; marker: mapboxgl.Marker }>>([]);

  // Marker del local enfocado por URL (solo fallback)
  const focusMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "ready" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function clearLocaleMarkers() {
    localeMarkersRef.current.forEach((m) => m.remove());
    localeMarkersRef.current = new Map();
    localeCoordsRef.current = [];
  }

  // Encuentra el marker del local “más cercano” a (lat,lng) para evitar problemas de decimales
  function findMarkerNear(lat: number, lng: number) {
    // 1) intenta match exacto por key redondeada
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    const exact = localeMarkersRef.current.get(key);
    if (exact) return exact;

    // 2) si no, busca por tolerancia (muy pequeña)
    let best: mapboxgl.Marker | null = null;
    let bestD = Infinity;

    for (const item of localeCoordsRef.current) {
      const d = dist2(lat, lng, item.lat, item.lng);
      if (d < bestD) {
        bestD = d;
        best = item.marker;
      }
    }

    // tolerancia: ~0.0005 grados (~50m). Ajusta si quieres.
    if (best && bestD <= 0.0005 * 0.0005) return best;

    return null;
  }

  async function loadAndRenderLocales() {
    if (!mapRef.current) return;

    clearLocaleMarkers();

    let locales: Local[] = [];
    try {
      locales = await getLocales();
    } catch (e) {
      console.warn("Error leyendo locales:", e);
      setErrorMsg("No se pudieron cargar locales.");
      return;
    }

    locales.forEach((local: any) => {
      if (typeof local.lat !== "number" || typeof local.lng !== "number") return;

      const name = local.name ?? "Local";
      const desc = local.type; // en tu app lo estás usando como "descripción"
      const rating = typeof local.rating === "number" ? local.rating : null;

      const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(`
        <div style="
          color:#0b0b0b;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
          min-width: 240px;
          max-width: 280px;
        ">
          <div style="font-weight: 900; font-size: 16px; margin-bottom: 8px; line-height: 1.15;">
            ${name}
          </div>

          ${
            rating !== null
              ? `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom: 10px;">
                  <span style="color:#f59e0b; font-size: 16px;">★</span>
                  <span style="font-weight: 700; font-size: 14px;">${rating.toFixed(1)}</span>
                  <span style="color:#6b7280; font-size: 12px;">rating</span>
                </div>
              `
              : ""
          }

          ${
            desc
              ? `
                <div style="margin-top: 2px;">
                  <div style="font-weight: 700; font-size: 12px; color:#6b7280; margin-bottom: 2px;">
                    Descripción:
                  </div>
                  <div style="font-size: 14px; line-height: 1.25;">
                    ${desc}
                  </div>
                </div>
              `
              : ""
          }
        </div>
      `);

      const marker = new mapboxgl.Marker({ color: "#f59e0b" }) // amarillo
        .setLngLat([local.lng, local.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      // Guardamos por key redondeada + lista para tolerancia
      const key = `${local.lat.toFixed(6)},${local.lng.toFixed(6)}`;
      localeMarkersRef.current.set(key, marker);
      localeCoordsRef.current.push({ lat: local.lat, lng: local.lng, marker });
    });

    // ✅ Si venimos con focus, intenta abrir el popup completo del local tras cargar locales
    if (hasFocus) {
      const m = findMarkerNear(focusLat, focusLng);
      if (m) {
        // cierra fallback focus si existía
        focusMarkerRef.current?.remove();
        focusMarkerRef.current = null;
        m.togglePopup();
      }
    }
  }

  /* =========================================================
     1) Crear el mapa (fallback) + 3D + cargar locales
     ========================================================= */
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Falta NEXT_PUBLIC_MAPBOX_TOKEN");
      return;
    }
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [FALLBACK.lng, FALLBACK.lat],
      zoom: 15,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // 3D buildings
    map.on("style.load", () => {
      map.easeTo({ pitch: 60, bearing: -20, duration: 800 });

      const layers = map.getStyle().layers ?? [];
      const labelLayerId = layers.find(
        (l) => l.type === "symbol" && (l.layout as any)?.["text-field"]
      )?.id;

      if (!map.getLayer("3d-buildings")) {
        map.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
              "fill-extrusion-color": "#aaa",
              "fill-extrusion-height": ["get", "height"],
              "fill-extrusion-base": ["get", "min_height"],
              "fill-extrusion-opacity": 0.65,
            },
          },
          labelLayerId
        );
      }
    });

    // Marker inicial (tu ubicación fallback)
    const meMarker = new mapboxgl.Marker({ color: "#111" })
      .setLngLat([FALLBACK.lng, FALLBACK.lat])
      .addTo(map);

    mapRef.current = map;
    meMarkerRef.current = meMarker;

    map.on("load", () => {
      loadAndRenderLocales();
    });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  /* =========================================================
     2) Pedir ubicación
     ========================================================= */
  useEffect(() => {
    setStatus("locating");

    if (!("geolocation" in navigator)) {
      setStatus("ready");
      setErrorMsg("Tu navegador no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lng: pos.coords.longitude, lat: pos.coords.latitude });
        setStatus("ready");
      },
      (err) => {
        const reason =
          err.code === err.PERMISSION_DENIED
            ? "Permiso de ubicación denegado"
            : err.code === err.POSITION_UNAVAILABLE
            ? "Posición no disponible"
            : err.code === err.TIMEOUT
            ? "Timeout al pedir ubicación"
            : "Error desconocido";

        setErrorMsg(`${reason}. Mostrando zona aproximada.`);
        setStatus("ready");
        console.warn("Geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  /* =========================================================
     3) Cuando llegan coords:
        - siempre actualizar marker "yo"
        - NO recentrar si hay focus
     ========================================================= */
  useEffect(() => {
    if (!coords || !mapRef.current) return;

    // Marker "yo" siempre
    meMarkerRef.current?.setLngLat([coords.lng, coords.lat]);

    // Si vienes a un local, no muevas la cámara a tu ubicación
    if (hasFocus) return;

    const map = mapRef.current;

    const applyLocation = () => {
      map.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 16,
        pitch: 60,
        bearing: -20,
        essential: true,
      });
    };

    if (!map.isStyleLoaded()) map.once("load", applyLocation);
    else applyLocation();
  }, [coords?.lng, coords?.lat, hasFocus]);

  /* =========================================================
     4) Focus por URL:
        - centrar en el local
        - intentar abrir popup completo del marker Firestore
        - si aún no existe (porque locales no han cargado), mostrar fallback
     ========================================================= */
  useEffect(() => {
    if (!mapRef.current || !hasFocus) return;

    const map = mapRef.current;

    const applyFocus = () => {
      map.flyTo({
        center: [focusLng, focusLat],
        zoom: 17,
        pitch: 60,
        bearing: -20,
        essential: true,
      });

      // 1) intenta abrir popup del local real
      const m = findMarkerNear(focusLat, focusLng);
      if (m) {
        focusMarkerRef.current?.remove();
        focusMarkerRef.current = null;
        m.togglePopup();
        return;
      }

      // 2) fallback si todavía no existe
      focusMarkerRef.current?.remove();

      const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(`
        <div style="color:#0b0b0b; font-family: system-ui; min-width: 220px">
          <div style="font-weight:900; font-size:16px; margin-bottom:6px;">${focusName}</div>
          <div style="font-size:12px; color:#6b7280;">Local seleccionado</div>
        </div>
      `);

      focusMarkerRef.current = new mapboxgl.Marker({ color: "#fb923c" }) // naranja
        .setLngLat([focusLng, focusLat])
        .setPopup(popup)
        .addTo(map);

      focusMarkerRef.current.togglePopup();
    };

    if (!map.isStyleLoaded()) map.once("load", applyFocus);
    else applyFocus();
  }, [hasFocus, focusLat, focusLng, focusName]);

  function goToMe() {
    if (!coords || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom: 16,
      pitch: 60,
      bearing: -20,
      essential: true,
    });
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-sm opacity-80">
          {status === "locating" && "Buscando tu ubicación…"}
          {status === "ready" &&
            (coords ? "Mostrando tu ubicación + locales." : "Mostrando zona aproximada + locales.")}
          {status === "error" && "Error configurando el mapa."}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAndRenderLocales}
            className="text-xs px-3 py-1 rounded-xl border border-white/10 hover:bg-white/10"
          >
            Recargar locales
          </button>

          <button
            onClick={goToMe}
            className="text-xs px-3 py-1 rounded-xl border border-white/10 hover:bg-white/10"
            disabled={!coords}
            title={!coords ? "Primero necesitamos tu ubicación" : "Centrar en mi ubicación"}
          >
            Ir a mí
          </button>

          {errorMsg && <div className="text-xs opacity-70">{errorMsg}</div>}
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className="w-full rounded-2xl overflow-hidden border border-white/10"
        style={{ height: 420 }}
      />
    </div>
  );
}
