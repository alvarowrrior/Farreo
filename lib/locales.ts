import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export type Local = {
  id: string;
  nombre: string;     // Cambiado de name
  direccion: string;  // Cambiado de address
  lat: number;
  lng: number;
  tipo?: string;      // Cambiado de type
  rating?: number;
  telefono?: string | null; // Cambiado de phone
  web?: string | null;      // Cambiado de website
  description?: string;     // Para evitar el error de Vercel
};

export async function getLocales(): Promise<Local[]> {
  const snap = await getDocs(collection(db, "locales"));
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      nombre: d.nombre || "Sin nombre",
      direccion: d.direccion || "Dirección no disponible",
      lat: d.lat,
      lng: d.lng,
      tipo: d.tipo || "bar",
      rating: d.rating || 4.5,
      telefono: d.telefono,
      web: d.web,
      description: d.description || "Sin descripción disponible",
    } as Local;
  });
}