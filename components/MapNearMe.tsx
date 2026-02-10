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
  
  // Guardamos el marcador seleccionado para poder cambiarle el color
  const [selectedMarkerEl, setSelectedMarkerEl] = useState<HTMLElement | null>(null);
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
      zoom: 15,
      pitch: 0, 
      bearing: 0,
      antialias: true 
    });

    map.on("load", () => {
      map.resize();
    });

    const el = document.createElement("div");
    el.className = "user-marker";
    meMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map);

    mapRef.current = map;
    loadLocales(map);

    return () => { map.remove(); mapRef.current = null; };
  }, [status, token]);

  async function loadLocales(map: mapboxgl.Map) {
    try {
      const locales = await getLocales();
      locales.forEach((local) => {
        if (!local.lat || !local.lng) return;

        const container = document.createElement("div");
        container.className = "disco-marker-container";
        
        const pin = document.createElement("div");
        pin.className = "disco-marker-pin";
        container.appendChild(pin);

        const marker = new mapboxgl.Marker({ element: container, anchor: 'bottom' }) 
          .setLngLat([local.lng, local.lat])
          .addTo(map);

        container.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Resetear color del marcador anterior
          if (selectedMarkerEl) {
            selectedMarkerEl.classList.remove('is-active');
          }
          // Activar nuevo marcador
          pin.classList.add('is-active');
          setSelectedMarkerEl(pin);

          onSelectLocal(local);
          
          // Movimiento suave sin cambiar la inclinación (pitch)
          map.flyTo({ 
            center: [local.lng, local.lat], 
            zoom: 17,
            duration: 1000 
          });
        });
      });
    } catch (e) { console.error(e); }
  }

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-zinc-950">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      <style jsx global>{`
        .user-marker {
          width: 18px; height: 18px;
          background: #3b82f6; border: 3px solid white;
          border-radius: 50%; box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
        }
        .disco-marker-container { 
          width: 30px; height: 30px; 
          display: flex; align-items: center; justify-content: center; 
          cursor: pointer; 
        }
        .disco-marker-pin {
          width: 18px; height: 18px;
          background: #f59e0b; border: 2px solid #000;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        /* ✅ Estilo para cuando el local está seleccionado */
        .disco-marker-pin.is-active {
          background: #fff; /* Blanco o el color que prefieras */
          transform: rotate(-45deg) scale(1.3);
          border-color: #f59e0b;
          box-shadow: 0 0 20px #f59e0b;
          z-index: 99;
        }
      `}</style>
    </div>
  );
}