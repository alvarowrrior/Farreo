"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { getLocales, type Local } from "@/lib/locales";

interface MapProps {
  onSelectLocal?: (local: Local) => void;
}

export default function MapNearMe({ onSelectLocal }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Falta NEXT_PUBLIC_MAPBOX_TOKEN");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-3.7038, 40.4168], // Madrid
      zoom: 14,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    mapRef.current = map;

    // --- CONTROL DE GEOLOCALIZACIÓN ---
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false, // 👈 importante para evitar sensación de deslizamiento
      showUserHeading: true,
    });

    map.addControl(geolocate, "bottom-right");

    map.on("load", () => {
      map.resize();
      geolocate.trigger();
      renderWaypoints(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ---------- WAYPOINTS ----------
  async function renderWaypoints(map: mapboxgl.Map) {
    try {
      const locales = await getLocales();

      locales.forEach((local) => {
        if (typeof local.lat !== "number" || typeof local.lng !== "number")
          return;

        // Elemento visual del marcador
        const el = document.createElement("button");
        el.type = "button";
        el.className = "waypoint-marker";
        el.setAttribute("aria-label", `Ver ${local.nombre}`);

        // 🔒 Evita que el mapa arrastre cuando tocas el waypoint
        const stop = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
        };
        el.addEventListener("pointerdown", stop, { passive: false });
        el.addEventListener("touchstart", stop, { passive: false });

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([local.lng, local.lat])
          .addTo(map);

        // Click estable
        marker.getElement().addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          onSelectLocal?.(local);

          map.flyTo({
            center: [local.lng, local.lat],
            zoom: 16,
            duration: 800,
            essential: true,
          });
        });
      });
    } catch (e) {
      console.error("Error cargando waypoints:", e);
    }
  }

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-black">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* --- ESTILO WAYPOINTS --- */}
      <style jsx global>{`
        .waypoint-marker {
          width: 18px;
          height: 18px;
          background: #f59e0b;
          border: 3px solid white;
          border-radius: 999px;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
        }

        .waypoint-marker:hover {
          background: #ffffff;
          border-color: #f59e0b;
          box-shadow: 0 0 18px rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  );
}