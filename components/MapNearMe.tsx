"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

type Coords = { lng: number; lat: number };

const FALLBACK: Coords = {
  // Fallback cerca de Alcoy (Valencia). Ajusta si quieres.
  lng: -0.473, // aprox
  lat: 38.705, // aprox
};

export default function MapNearMe() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "ready" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const initialCenter = useMemo(() => coords ?? FALLBACK, [coords]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Falta NEXT_PUBLIC_MAPBOX_TOKEN en .env.local");
      return;
    }

    // Importante: asignar token
    mapboxgl.accessToken = token;

    // 1) Crea el mapa solo una vez
    if (mapRef.current || !mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 14,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Marker inicial (fallback)
    markerRef.current = new mapboxgl.Marker({ color: "#111" })
      .setLngLat([initialCenter.lng, initialCenter.lat])
      .addTo(mapRef.current);
  }, [token]);

  // 2) Pide ubicación y centra cuando la tengas
  useEffect(() => {
    if (!mapRef.current) return;

    setStatus("locating");

    if (!("geolocation" in navigator)) {
      setStatus("error");
      setErrorMsg("Tu navegador no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lng: pos.coords.longitude, lat: pos.coords.latitude };
        setCoords(next);

        mapRef.current?.flyTo({ center: [next.lng, next.lat], zoom: 15, essential: true });

        if (markerRef.current) markerRef.current.setLngLat([next.lng, next.lat]);

        setStatus("ready");
      },
      (err) => {
        // Si deniega permiso o falla, nos quedamos con el fallback
        setStatus("ready");
        setErrorMsg(
          err.code === err.PERMISSION_DENIED
            ? "No diste permiso de ubicación. Mostrando un centro aproximado."
            : "No se pudo obtener la ubicación. Mostrando un centro aproximado."
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-sm opacity-80">
          {status === "locating" && "Buscando tu ubicación…"}
          {status === "ready" && (coords ? "Mostrando tu ubicación." : "Mostrando zona aproximada.")}
          {status === "error" && "Error configurando el mapa."}
        </div>
        {errorMsg ? <div className="text-xs opacity-70">{errorMsg}</div> : null}
      </div>

      <div
        ref={mapContainerRef}
        className="w-full rounded-2xl overflow-hidden border border-white/10"
        style={{ height: 420 }}
      />
    </div>
  );
}
