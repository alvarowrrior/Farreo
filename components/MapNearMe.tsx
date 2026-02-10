"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Local } from "@/lib/locales";
import { getLocales } from "@/lib/locales";

type Coords = { lng: number; lat: number };

// ✅ Definimos la interfaz para las props
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

  /* =========================================================
      1) RASTREO GPS
     ========================================================= */
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lng: pos.coords.longitude, lat: pos.coords.latitude });
        setStatus("ready");
      },
      () => {
        if (!coords) {
            setCoords({ lng: -0.481, lat: 38.345 }); 
            setStatus("ready");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* =========================================================
      2) Inicializar mapa
     ========================================================= */
  useEffect(() => {
    if (status !== "ready" || !coords || !token || mapRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [coords.lng, coords.lat],
      zoom: 16,
      pitch: 60,
      bearing: -10,
      antialias: true 
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

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
    
    meMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([coords.lng, coords.lat])
      .addTo(map);

    mapRef.current = map;
    loadLocales(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [status, token]);

  /* =========================================================
      3) Actualizar marcador "Yo"
     ========================================================= */
  useEffect(() => {
    if (coords && meMarkerRef.current) {
      meMarkerRef.current.setLngLat([coords.lng, coords.lat]);
    }
  }, [coords]);

  /* =========================================================
      4) Cargar locales y manejar clicks
     ========================================================= */
  async function loadLocales(map: mapboxgl.Map) {
    try {
      const locales = await getLocales();
      locales.forEach((local) => {
        if (!local.lat || !local.lng) return;

        const markerEl = document.createElement("div");
        markerEl.className = "disco-marker";

        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([local.lng, local.lat])
          .addTo(map);

        // ✅ EVENTO CLICK: Notificamos a la página del local seleccionado
        markerEl.addEventListener('click', (e) => {
          e.stopPropagation(); // Evita clics en el fondo del mapa
          onSelectLocal(local);
          
          // Efecto visual de cámara al seleccionar
          map.flyTo({
            center: [local.lng, local.lat],
            zoom: 17,
            pitch: 70,
            duration: 1500
          });
        });
      });
    } catch (e) {
      console.error(e);
    }
  }

  const goToMe = () => {
    if (!coords || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom: 17,
      essential: true,
      pitch: 60
    });
  };

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-zinc-950">
      {status === "locating" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
          <p className="text-white font-black text-xs tracking-widest uppercase animate-pulse">Sincronizando señal...</p>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full" />

      {status === "ready" && (
        <button
          onClick={goToMe}
          className="absolute bottom-6 left-6 z-10 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" className="w-7 h-7">
            <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 10a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" />
            <path d="M12 2a1 1 0 0 1 1 1v1.1a8.001 8.001 0 0 1 7.9 7.9H21a1 1 0 1 1 0 2h-1.1a8.001 8.001 0 0 1-7.9 7.9V21a1 1 0 1 1-2 0v-1.1A8.001 8.001 0 0 1 4.1 12H3a1 1 0 1 1 0-2h1.1A8.001 8.001 0 0 1 11 3.1V3a1 1 0 0 1 1-1z" />
          </svg>
        </button>
      )}

      <style jsx global>{`
        .user-marker {
          width: 18px; height: 18px;
          background: #3b82f6; border: 3px solid white;
          border-radius: 50%; box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
        }
        .disco-marker {
          width: 22px; height: 22px;
          background: #f59e0b; border: 2px solid #000;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg); cursor: pointer;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
          transition: transform 0.2s;
        }
        .disco-marker:hover {
          transform: rotate(-45deg) scale(1.2);
          background: #ffffff;
        }
      `}</style>
    </div>
  );
}