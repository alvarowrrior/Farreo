"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getLocales, type Local } from "@/lib/locales";

interface MapProps {
  onSelectLocal?: (local: Local) => void;
  externalSelectedId?: string;
}

export default function MapNearMe({ onSelectLocal, externalSelectedId }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const localesRef = useRef<Local[]>([]); // Para guardar locales disponibles

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

      // Solo geolocalizar al usuario si NO venimos con una selección por URL
      if (!externalSelectedId) {
        geolocate.trigger();
      }

      await renderWaypoints(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // Mantener array vacío para que solo se inicialice una vez

  // Mantenemos los markers en un Record (diccionario) para saber cuáles están vivos
  const markersOnScreenRef = useRef<Record<string, mapboxgl.Marker>>({});
  const [localesLoaded, setLocalesLoaded] = React.useState(false);

  // Efecto independiente para reaccionar a cambios en externalSelectedId
  useEffect(() => {
    if (!mapRef.current || !externalSelectedId || !localesLoaded) return;

    const localToSelect = localesRef.current.find(l => l.id === externalSelectedId);
    if (localToSelect && mapRef.current) {
      // Necesitamos asegurar que el mapboxGlD haya terminado el setup antes de animar
      mapRef.current.flyTo({
        center: [localToSelect.lng, localToSelect.lat],
        zoom: 16.5,
        duration: 2000,
        essential: true,
        padding: { bottom: 150 }
      });
    }
  }, [externalSelectedId, localesLoaded]);

  async function renderWaypoints(map: mapboxgl.Map) {
    try {
      const locales = await getLocales();
      localesRef.current = locales;

      // 1. Crear GeoJSON
      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: locales.map(local => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [local.lng, local.lat]
          },
          properties: {
            id: local.id,
            nombre: local.nombre,
            tipo: local.tipo,
            // Guardamos todo el objeto por si a caso (serializado porque mapbox prop properties no soporta objetos anidados complejos bien en clusters a veces)
            localData: JSON.stringify(local)
          }
        }))
      };

      // 2. Añadir la fuente con clustering habilitado
      map.addSource("locales", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14, // Zoom máximo donde agrupa
        clusterRadius: 50 // Radio de cada cluster
      });

      // 3. Añadir capas invisibles para que mapbox se encargue del clustering internamente
      // No necesitamos que se vean porque usaremos marcadores HTML
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "locales",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "transparent",
          "circle-radius": 0
        }
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "locales",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "transparent",
          "circle-radius": 0
        }
      });

      // 4. Función para actualizar los marcadores HTML
      const updateMarkers = () => {
        if (!map.getSource("locales")) return;

        const features = map.queryRenderedFeatures({
          layers: ["clusters", "unclustered-point"]
        });
        const newMarkers: Record<string, mapboxgl.Marker> = {};

        // Identificar qué marcadores necesitamos renderizar
        features.forEach((feature) => {
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
          const props = feature.properties;

          if (!props) return;

          const isCluster = props.cluster;
          // Un ID único para saber si reciclamos el marker (las coordenadas en string suelen servir para clusters)
          const markerId = isCluster ? `cluster-${props.cluster_id}` : `local-${props.id}`;

          let marker = markersOnScreenRef.current[markerId];

          if (!marker) {
            // CREAR MARKER NUEVO
            const container = document.createElement("div");
            container.className = "marker-container";

            if (isCluster) {
              const dot = document.createElement("div");
              dot.className = "marker-dot";
              dot.style.width = "30px";
              dot.style.height = "30px";
              dot.style.display = "flex";
              dot.style.alignItems = "center";
              dot.style.justifyContent = "center";
              dot.style.fontWeight = "bold";
              dot.style.color = "white";
              dot.innerText = props.point_count ? String(props.point_count) : "";
              container.appendChild(dot);

              // Click para hacer zoom al cluster
              container.addEventListener("click", (e) => {
                e.stopPropagation();
                // Ver mapbox docs: source.getClusterExpansionZoom
                const source = map.getSource('locales') as mapboxgl.GeoJSONSource;
                if (props.cluster_id) {
                  source.getClusterExpansionZoom(props.cluster_id, (err, zoom) => {
                    if (err) return;
                    map.easeTo({
                      center: coords,
                      zoom: zoom || 14
                    });
                  });
                }
              });
            } else {
              // LOCAL INDIVIDUAL
              const localData = JSON.parse(props.localData) as Local;

              const dot = document.createElement("div");
              dot.className = "marker-dot";
              container.appendChild(dot);

              const label = document.createElement("div");
              label.className = "marker-label";
              label.innerText = props.nombre;
              container.appendChild(label);

              container.addEventListener("click", (e) => {
                e.stopPropagation();
                onSelectLocal?.(localData);
                map.flyTo({
                  center: coords,
                  zoom: 16.5,
                  duration: 1000,
                  essential: true,
                  padding: { bottom: 150 }
                });
              });
            }

            marker = new mapboxgl.Marker({
              element: container,
              anchor: "center"
            }).setLngLat(coords);
          }

          newMarkers[markerId] = marker;
          // Si no estaba en el mapa, añadirlo
          if (!markersOnScreenRef.current[markerId]) {
            marker.addTo(map);
          }
        });

        // Eliminar los marcadores que ya no están visibles
        for (const id in markersOnScreenRef.current) {
          if (!newMarkers[id]) {
            markersOnScreenRef.current[id].remove();
          }
        }

        markersOnScreenRef.current = newMarkers;
      };

      // Asignar los eventos de movimiento SOLO UNA VEZ
      map.on("move", updateMarkers);
      map.on("moveend", updateMarkers);

      // Actualizar markers cuando movemos la vista o cambia la fuente (después de cagar)
      map.on("data", (e: any) => {
        if (e.sourceId !== "locales" || !e.isSourceLoaded) return;
        updateMarkers();
      });

      setLocalesLoaded(true);

    } catch (e) {
      console.error("Error cargando waypoints:", e);
    }
  }

  return (
    <div className="map-view">
      <div ref={mapContainerRef} className="map-view__container" />
    </div>
  );
}