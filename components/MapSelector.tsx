"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapSelectorProps {
    initialLat?: number;
    initialLng?: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

export default function MapSelector({ initialLat, initialLng, onLocationSelect }: MapSelectorProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);

    // Inicializar en las coordenadas proporcionadas o en Madrid por defecto
    const defaultCenter: [number, number] = [-3.7038, 40.4168];
    const center: [number, number] = (initialLng && initialLat) ? [initialLng, initialLat] : defaultCenter;

    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
            console.error("Token de Mapbox no encontrado");
            return;
        }

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: center,
            zoom: (initialLng && initialLat) ? 16 : 13,
            antialias: true,
        });

        mapRef.current = map;

        // Control de Geolocalización (Botón "Dónde estoy")
        const geolocate = new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true,
        });
        map.addControl(geolocate, "bottom-right");
        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Función para crear/mover el marcador
        const updateMarker = (lng: number, lat: number) => {
            if (!markerRef.current) {
                // Crear estilo de marcador personalizado
                const el = document.createElement("div");
                el.className = "marker-container";
                el.innerHTML = `
          <div class="marker-dot" style="background-color: #f97316; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
        `;

                markerRef.current = new mapboxgl.Marker({ element: el, draggable: true })
                    .setLngLat([lng, lat])
                    .addTo(map);

                // Escuchar cuando el usuario termina de arrastrar el marcador
                markerRef.current.on('dragend', () => {
                    const lngLat = markerRef.current?.getLngLat();
                    if (lngLat) {
                        onLocationSelect(lngLat.lat, lngLat.lng);
                    }
                });
            } else {
                markerRef.current.setLngLat([lng, lat]);
            }
        };

        // Si hay coordenadas iniciales, colocar el marcador al principio
        if (initialLng && initialLat) {
            updateMarker(initialLng, initialLat);
        }

        // Escuchar clicks en el mapa para mover el marcador
        map.on("click", (e) => {
            const { lng, lat } = e.lngLat;
            updateMarker(lng, lat);
            onLocationSelect(lat, lng);
        });

        // Forzar redimensionado una vez que se carga
        map.on("load", () => {
            map.resize();
        });

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []); // Solo inicializamos el mapa una vez

    // Si las props externas cambian masivamente (ej. al editar otro local distinto), movemos el mapa o marcador:
    useEffect(() => {
        if (mapRef.current && initialLng && initialLat && markerRef.current) {
            // Solo actualizamos si las coordenadas son muy diferentes a donde está el marcador, 
            // para no interrumpir al usuario si está arrastrando
            const currentPos = markerRef.current.getLngLat();
            if (Math.abs(currentPos.lng - initialLng) > 0.0001 || Math.abs(currentPos.lat - initialLat) > 0.0001) {
                markerRef.current.setLngLat([initialLng, initialLat]);
                mapRef.current.flyTo({ center: [initialLng, initialLat], zoom: 16 });
            }
        }
    }, [initialLat, initialLng]);


    return (
        <div style={{ position: "relative", width: "100%", height: "350px", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
            <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(255,255,255,0.9)", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", color: "#1e293b", pointerEvents: "none", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                📍 Haz clic o arrastra el marcador
            </div>
        </div>
    );
}
