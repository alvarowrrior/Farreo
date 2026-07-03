import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

export type Local = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  tipo: string;
  fotos: string[];
  descripcion?: string;
  rating?: number;
  numResenas?: number;
  web?: string;
  direccion?: string;
  telefono?: string;
  audioUrl?: string;
};

function toNumber(v: any, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

// Caché en memoria: /buscar pedía la colección dos veces (página + mapa) y cada
// navegación repetía la lectura completa de Firestore.
const CACHE_TTL_MS = 5 * 60 * 1000;
let localesCache: { data: Local[]; ts: number } | null = null;
let pendingFetch: Promise<Local[]> | null = null;

export function invalidateLocalesCache() {
  localesCache = null;
  pendingFetch = null;
}

export async function getLocales(fresh = false): Promise<Local[]> {
  if (!fresh) {
    if (localesCache && Date.now() - localesCache.ts < CACHE_TTL_MS) {
      return localesCache.data;
    }
    if (pendingFetch) return pendingFetch;
  }

  pendingFetch = (async () => {
    try {
      const data = await fetchLocalesFromFirestore();
      localesCache = { data, ts: Date.now() };
      return data;
    } catch (error) {
      console.error("Error al obtener locales:", error);
      return localesCache?.data ?? [];
    } finally {
      pendingFetch = null;
    }
  })();

  return pendingFetch;
}

async function fetchLocalesFromFirestore(): Promise<Local[]> {
    const q = query(collection(db, "locales"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((doc) => {
      const d = doc.data(); // Eliminamos el 'as any' para mayor seguridad

      // Lógica de fotos con Type Guard para evitar errores de TypeScript
      let listaFotos: string[] = [];

      const fotosRaw = d.fotos;
      const fotoUrlRaw = d.fotoUrl;

      if (Array.isArray(fotosRaw)) {
        // Usamos un Type Guard (f is string) para que TS sepa que el resultado es string[]
        listaFotos = fotosRaw.filter((f): f is string =>
          typeof f === "string" && f.trim() !== ""
        );
      } else if (typeof fotoUrlRaw === "string" && fotoUrlRaw.trim() !== "") {
        listaFotos = [fotoUrlRaw.trim()];
      }

      return {
        id: doc.id,
        nombre: (d.nombre as string) ?? "Sin nombre",
        direccion: (d.direccion as string) ?? "",
        lat: toNumber(d.lat),
        lng: toNumber(d.lng),
        tipo: (d.tipo as string) ?? "Local",
        fotos: listaFotos,
        descripcion: (d.descripcion as string) ?? "",
        rating: typeof d.rating === "number" ? d.rating : 4.5,
        numResenas: typeof d.numResenas === "number" ? d.numResenas : 0,
        web: (d.web as string) ?? "",
        telefono: (d.telefono as string) ?? "",
        audioUrl: (d.audioUrl as string) ?? "",
      };
    });
}