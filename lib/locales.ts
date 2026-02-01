import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export type Local = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type?: string;
  rating?: number;
};

export async function getLocales(): Promise<Local[]> {
  const snap = await getDocs(collection(db, "locales"));
  return snap.docs.map((doc) => {
    const d = doc.data() as any;
    return {
      id: doc.id,
      name: d.name,
      lat: d.lat,
      lng: d.lng,
      type: d.type,
      rating: d.rating,
    };
  });
}
