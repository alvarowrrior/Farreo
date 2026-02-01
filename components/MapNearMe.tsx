"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Local } from "@/lib/locales";
import { getLocales } from "@/lib/locales";

type Coords = { lng: number; lat: number };

const FALLBACK: Coords = { lng: -0.473, lat: 38.705 };

export default function MapNearMe() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Marker de tu ubicación
  const meMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Markers de locales
  const localeMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "ready" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function clearLocaleMarkers() {
    localeMarkersRef.current.forEach((m) => m.remove());
    localeMarkersRef.current = [];
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

      localeMarkersRef.current.push(marker);
    });
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
  }, [token]);

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
     3) Cuando llegan coords → mover mapa y tu marker
     ========================================================= */
  useEffect(() => {
    if (!coords || !mapRef.current) return;

    const map = mapRef.current;

    const applyLocation = () => {
      map.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 16,
        pitch: 60,
        bearing: -20,
        essential: true,
      });

      meMarkerRef.current?.setLngLat([coords.lng, coords.lat]);
    };

    if (!map.isStyleLoaded()) map.once("load", applyLocation);
    else applyLocation();
  }, [coords]);

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
