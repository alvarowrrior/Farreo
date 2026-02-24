import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export type Local = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  tipo: string;
  // AÑADE ESTAS LÍNEAS:
  fotoUrl?: string; 
  descripcion?: string;
  rating?: number;
  numResenas?: number;
  web?: string;
  direccion?: string;
  telefono?: string;
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