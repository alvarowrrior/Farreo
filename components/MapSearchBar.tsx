"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { type Local } from "@/lib/locales";
import { type Coords } from "@/lib/location";

interface MapSearchBarProps {
    locales: Local[];
    userCoords: Coords | null;
    onSelectLocal: (local: Local) => void;
}

// Cálculo de distancia entre dos puntos (Fórmula de Haversine)
function haversineMeters(a: Coords, b: { lat: number; lng: number }) {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
}

function fmtDistance(m: number) {
    if (!Number.isFinite(m)) return "—";
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(2)} km`;
}

export default function MapSearchBar({ locales, userCoords, onSelectLocal }: MapSearchBarProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Mostrar resultados si hay texto o el input está enfocado
    useEffect(() => {
        if (isFocused || searchTerm.trim().length > 0) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [searchTerm, isFocused]);

    const filteredAndSorted = useMemo(() => {
        if (!searchTerm.trim() && !isFocused) return []; // Solo mostrar si abrimos

        // Filtrar
        const filtered = locales.filter(l =>
            l.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Calcular distancias y ordenar si tenemos coordenadas
        return filtered.map(l => {
            const dist = userCoords ? haversineMeters(userCoords, { lat: l.lat, lng: l.lng }) : Infinity;
            return { ...l, dist };
        }).sort((a, b) => a.dist - b.dist)
            .slice(0, 10); // Limitar a los 10 primeros resultados para no sobrecargar el dom
    }, [locales, userCoords, searchTerm, isFocused]);

    return (
        <div className="map-search-container" ref={containerRef}>
            <div className={`map-search-bar ${isOpen ? 'map-search-bar--open' : ''}`}>
                <svg className="map-search-bar__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                    type="text"
                    placeholder="Busca locales, clubs, bares..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className="map-search-bar__input"
                />
                {searchTerm && (
                    <button
                        className="map-search-bar__clear"
                        onClick={() => { setSearchTerm(""); setIsFocused(true); }}
                        aria-label="Limpiar búsqueda"
                    >
                        ✕
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="map-search-dropdown">
                    {filteredAndSorted.length > 0 ? (
                        <ul className="map-search-dropdown__list">
                            {filteredAndSorted.map(local => (
                                <li key={local.id} className="map-search-dropdown__item">
                                    <button
                                        className="map-search-dropdown__btn"
                                        onClick={() => {
                                            onSelectLocal(local);
                                            setIsOpen(false);
                                            setSearchTerm(local.nombre); // Opcional: rellenar con el nombre
                                        }}
                                    >
                                        <div className="map-search-dropdown__info">
                                            <span className="map-search-dropdown__name">{local.nombre}</span>
                                            <span className="map-search-dropdown__type">{local.tipo || "Local"}</span>
                                        </div>
                                        {userCoords && (
                                            <span className="map-search-dropdown__dist">{fmtDistance(local.dist)}</span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="map-search-dropdown__empty">
                            No se han encontrado resultados.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
