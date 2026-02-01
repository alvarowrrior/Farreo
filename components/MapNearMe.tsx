"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

type Coords = { lng: number; lat: number };

const FALLBACK: Coords = {
  lng: -0.473,
  lat: 38.705,
};

export default function MapNearMe() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "ready" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  /* =========================================================
     1) Crear el mapa (SIEMPRE con fallback)
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
      style: "mapbox://styles/mapbox/streets-v12",
      center: [FALLBACK.lng, FALLBACK.lat],
      zoom: 14,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const marker = new mapboxgl.Marker({ color: "#111" })
      .setLngLat([FALLBACK.lng, FALLBACK.lat])
      .addTo(map);

    mapRef.current = map;
    markerRef.current = marker;
  }, [token]);

  /* =========================================================
     2) Pedir ubicación (NO depende del mapa)
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
        setCoords({
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
        });
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
     3) Cuando llegan coords → mover mapa y marker
     ========================================================= */
  useEffect(() => {
    if (!coords || !mapRef.current) return;

    const map = mapRef.current;

    const applyLocation = () => {
      map.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 15,
        essential: true,
      });

      markerRef.current?.setLngLat([coords.lng, coords.lat]);
    };

    if (!map.isStyleLoaded()) {
      map.once("load", applyLocation);
    } else {
      applyLocation();
    }
  }, [coords]);

  /* ========================================================= */

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-sm opacity-80">
          {status === "locating" && "Buscando tu ubicación…"}
          {status === "ready" &&
            (coords ? "Mostrando tu ubicación." : "Mostrando zona aproximada.")}
          {status === "error" && "Error configurando el mapa."}
        </div>

        {errorMsg && <div className="text-xs opacity-70">{errorMsg}</div>}
      </div>

      <div
        ref={mapContainerRef}
        className="w-full rounded-2xl overflow-hidden border border-white/10"
        style={{ height: 420 }}
      />
    </div>
  );
}
