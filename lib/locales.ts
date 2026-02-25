import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

export type Local = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  tipo: string;

  fotoUrl?: string;
  descripcion?: string;
  rating?: number;
  numResenas?: number;

  web?: string;
  direccion?: string;
  telefono?: string;
};

function toNumber(v: any, fallback = 0) {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function getLocales(): Promise<Local[]> {
  // si createdAt existe, esto te los ordena (si no existe aún, puedes quitar query/orderBy)
  const q = query(collection(db, "locales"), orderBy("createdAt", "desc"));

  const snap = await getDocs(q);

  return snap.docs.map((doc) => {
    const d = doc.data() as any;

    return {
      id: doc.id,
      nombre: d.nombre ?? "Sin nombre",
      direccion: d.direccion ?? "",
      lat: toNumber(d.lat),
      lng: toNumber(d.lng),
      tipo: d.tipo ?? "bar",

      // ✅ CLAVE: traer la URL
      fotoUrl: typeof d.fotoUrl === "string" ? d.fotoUrl.trim() : "",

      // ✅ CLAVE: mismo nombre que usas en /buscar
      descripcion: d.descripcion ?? "Sin descripción disponible",

      rating: typeof d.rating === "number" ? d.rating : 4.5,
      numResenas: typeof d.numResenas === "number" ? d.numResenas : 0,

      web: d.web ?? "",
      telefono: d.telefono ?? "",
    };
  });
}