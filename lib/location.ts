// farreo/lib/location.ts
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export type Coords = { lat: number; lng: number };

export async function getCoords(): Promise<Coords> {
  // Si estamos dentro de la app (Capacitor)
  if (Capacitor.isNativePlatform()) {
    const perm = await Geolocation.requestPermissions();

    // En algunas versiones, el permiso viene como location/coarseLocation/fineLocation
    const granted =
      perm.location === "granted" ||
      (perm as any).coarseLocation === "granted" ||
      (perm as any).fineLocation === "granted";

    if (!granted) throw new Error("Permiso de ubicación denegado");

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });

    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }

  // Web normal
  if (!("geolocation" in navigator)) {
    throw new Error("Tu navegador no soporta geolocalización.");
  }

  return await new Promise<Coords>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        // Mensajes útiles
        if (err.code === err.PERMISSION_DENIED)
          return reject(new Error("Permiso de ubicación denegado"));
        if (err.code === err.POSITION_UNAVAILABLE)
          return reject(new Error("Ubicación no disponible"));
        if (err.code === err.TIMEOUT)
          return reject(new Error("Tiempo de espera agotado"));
        reject(new Error("No se pudo obtener tu ubicación"));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
