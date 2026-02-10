"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Local } from "@/lib/locales";
import { getLocales } from "@/lib/locales";

type Coords = { lng: number; lat: number };

interface MapProps {
  onSelectLocal: (local: Local) => void;
}

export default function MapNearMe({ onSelectLocal }: MapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const meMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"locating" | "ready" | "error">("locating");

  useEffect(() => {
    if (!("geolocation" in navigator)) { setStatus("error"); return; }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lng: pos.coords.longitude, lat: pos.coords.latitude });
        setStatus("ready");
      },
      () => { if (!coords) { setCoords({ lng: -0.481, lat: 38.345 }); setStatus("ready"); } },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (status !== "ready" || !coords || !token || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [coords.lng, coords.lat],
      zoom: 15, // Un poco menos de zoom para vista general
      pitch: 0,   // ✅ VISTA DESDE ARRIBA (0 grados de inclinación)
      bearing: 0, // ✅ NORTE HACIA ARRIBA
      antialias: true 
    });

    map.on("load", () => {
      map.resize();
      
      const layers = map.getStyle().layers;
      const labelLayerId = layers?.find(l => l.type === "symbol" && (l.layout as any)?.["text-field"])?.id;

      map.addLayer({
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#222",
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.8,
        },
      }, labelLayerId);
    });

    // Marcador de usuario
    const el = document.createElement("div");
    el.className = "user-marker";
    meMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map);

    mapRef.current = map;
    loadLocales(map);

    return () => { map.remove(); mapRef.current = null; };
  }, [status, token]);

  useEffect(() => {
    if (coords && meMarkerRef.current) {
      meMarkerRef.current.setLngLat([coords.lng, coords.lat]);
    }
  }, [coords]);

  async function loadLocales(map: mapboxgl.Map) {
    try {
      const locales = await getLocales();
      locales.forEach((local) => {
        if (!local.lat || !local.lng) return;

        const markerEl = document.createElement("div");
        markerEl.className = "disco-marker-container";
        markerEl.innerHTML = `<div class="disco-marker-pin"></div>`;

        const marker = new mapboxgl.Marker({ element: markerEl, anchor: 'bottom' }) 
          .setLngLat([local.lng, local.lat])
          .addTo(map);

        markerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectLocal(local);
          
          // ✅ Al hacer click, sí podemos inclinarlo para efecto "WOW"
          map.flyTo({ 
            center: [local.lng, local.lat], 
            zoom: 17, 
            pitch: 60, // Se inclina al seleccionar
            duration: 1500 
          });
        });
      });
    } catch (e) { console.error(e); }
  }

  const goToMe = () => {
    if (!coords || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom: 16,
      pitch: 0, // ✅ Vuelve a vista cenital al centrarte
      bearing: 0
    });
  };

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-zinc-950">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Botón flotante para centrar (estilo minimalista) */}
      {status === "ready" && (
        <button
          onClick={goToMe}
          className="absolute bottom-6 right-6 z-10 w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </button>
      )}

      <style jsx global>{`
        .user-marker {
          width: 18px; height: 18px;
          background: #3b82f6; border: 3px solid white;
          border-radius: 50%; box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
        }
        .disco-marker-container { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .disco-marker-pin {
          width: 18px; height: 18px;
          background: #f59e0b; border: 2px solid #000;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
        }
      `}</style>
    </div>
  );
}