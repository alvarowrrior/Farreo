"use client";

import { useState } from "react";
import { db } from "@/lib/firebase"; // Asegúrate de que tu ruta a firebase.ts sea correcta
import { collection, addDoc } from "firebase/firestore";

export default function NuevoLocalPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "bar",
    lat: "",
    lng: "",
    direccion: "",
    descripcion: "",
    fotoUrl: "",
    rating: "4.5",
    numResenas: "0",
    web: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "locales"), {
        ...formData,
        lat: parseFloat(formData.lat), // Convertimos a número obligatorio
        lng: parseFloat(formData.lng), // Convertimos a número obligatorio
        rating: parseFloat(formData.rating),
        numResenas: parseInt(formData.numResenas),
        createdAt: new Date(),
      });
      alert("¡Local añadido con éxito!");
      setFormData({ nombre: "", tipo: "bar", lat: "", lng: "", direccion: "", descripcion: "", fotoUrl: "", rating: "4.5", numResenas: "0", web: "" });
    } catch (error) {
      console.error("Error al añadir:", error);
      alert("Error al subir los datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto bg-zinc-900 p-8 rounded-[2rem] border border-white/10">
        <h1 className="text-3xl font-black uppercase italic mb-6">Añadir Nuevo Local</h1>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-bold uppercase text-gray-500">Nombre del Local</label>
            <input required name="nombre" value={formData.nombre} onChange={handleChange} className="w-full bg-black border border-white/10 p-3 rounded-xl mt-1" placeholder="Ej: Kapital" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Tipo</label>
            <select name="tipo" value={formData.tipo} onChange={handleChange} className="w-full bg-black border border-white/10 p-3 rounded-xl mt-1">
              <option value="bar">Bar</option>
              <option value="discoteca">Discoteca</option>
              <option value="restaurante">Restaurante</option>
              <option value="pub">Pub</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Rating (1-5)</label>
            <input name="rating" type="number" step="0.1" value={formData.rating} onChange={handleChange} className="w-full bg-black border border-white/10 p-3 rounded-xl mt-1" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Latitud</label>
            <input required name="lat" type="number" step="any" value={formData.lat} onChange={handleChange} className="w-full bg-black border border-white/10 p-3 rounded-xl mt-1" placeholder="40.4168" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Longitud</label>
            <input required name="lng" type="number" step="any" value={formData.lng} onChange={handleChange} className="w-full bg-black border border-white/10 p-3 rounded-xl mt-1" placeholder="-3.7038" />
          </div>

          <div className="col-span-2">
            <label className="text-xs font-bold uppercase text-gray-500">Dirección Real</label>
            <input name="direccion" value={formData.direccion} onChange={handleChange} className="w-full bg-black border border-white/10 p-3 rounded-xl mt-1" placeholder="Calle Falsa 123, Madrid" />
          </div>

          <div className="col-span-2">
            <label className="text-xs font-bold uppercase text-gray-500">URL de la Foto</label>
            <input name="fotoUrl" value={formData.fotoUrl} onChange={handleChange} className="w-full bg-black border border-white/10 p-3 rounded-xl mt-1" placeholder="https://..." />
          </div>

          <div className="col-span-2">
            <label className="text-xs font-bold uppercase text-gray-500">Descripción</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} className="w-full bg-black border border-white/10 p-3 rounded-xl mt-1 h-24" placeholder="Cuéntanos algo del local..." />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="col-span-2 bg-white text-black font-black uppercase py-4 rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Subiendo..." : "Guardar en Firebase"}
          </button>
        </form>
      </div>
    </main>
  );
}