"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getLocales, type Local } from "@/lib/locales";

interface MapProps {
  onSelectLocal?: (local: Local) => void;
}

export default function MapNearMe({ onSelectLocal }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-3.7038, 40.4168], // Madrid
      zoom: 14,
      antialias: true,
    });

    mapRef.current = map;

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });
    map.addControl(geolocate, "bottom-right");

    map.on("load", async () => {
      map.resize();
      geolocate.trigger();
      await renderWaypoints(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  async function renderWaypoints(map: mapboxgl.Map) {
    try {
      const locales = await getLocales();
      
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      locales.forEach((local) => {
        if (!local.lat || !local.lng) return;

        // 1. Contenedor del marcador
        const container = document.createElement("div");
        container.className = "marker-container"; 

        // 2. El punto naranja
        const dot = document.createElement("div");
        dot.className = "marker-dot";
        container.appendChild(dot);

        // 3. La etiqueta de texto
        const label = document.createElement("div");
        label.className = "marker-label";
        label.innerText = local.nombre;
        container.appendChild(label);

        // Evento Click
        container.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectLocal?.(local);
          map.flyTo({
            center: [local.lng, local.lat],
            zoom: 16.5,
            duration: 1000,
            essential: true,
            padding: { bottom: 150 }
          });
        });

        // CLAVE: Usamos anchor center para que el punto naranja 
        // sea el eje de rotación y zoom.
        const marker = new mapboxgl.Marker({ 
          element: container,
          anchor: "center" 
        })
          .setLngLat([local.lng, local.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    } catch (e) {
      console.error("Error cargando waypoints:", e);
    }
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-zinc-900">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}