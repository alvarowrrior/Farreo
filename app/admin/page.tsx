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
    <main className="admin-page">
      <div className="admin-panel">
        <h1 className="admin-panel__title">Añadir Nuevo Local</h1>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form__group admin-form__group--full">
            <label className="admin-form__label">Nombre del Local</label>
            <input required name="nombre" value={formData.nombre} onChange={handleChange} className="admin-form__input" placeholder="Ej: Kapital" />
          </div>

          <div className="admin-form__group">
            <label className="admin-form__label">Tipo</label>
            <select name="tipo" value={formData.tipo} onChange={handleChange} className="admin-form__select">
              <option value="bar">Bar</option>
              <option value="discoteca">Discoteca</option>
              <option value="restaurante">Restaurante</option>
              <option value="pub">Pub</option>
            </select>
          </div>

          <div className="admin-form__group">
            <label className="admin-form__label">Rating (1-5)</label>
            <input name="rating" type="number" step="0.1" value={formData.rating} onChange={handleChange} className="admin-form__input" />
          </div>

          <div className="admin-form__group">
            <label className="admin-form__label">Latitud</label>
            <input required name="lat" type="number" step="any" value={formData.lat} onChange={handleChange} className="admin-form__input" placeholder="40.4168" />
          </div>

          <div className="admin-form__group">
            <label className="admin-form__label">Longitud</label>
            <input required name="lng" type="number" step="any" value={formData.lng} onChange={handleChange} className="admin-form__input" placeholder="-3.7038" />
          </div>

          <div className="admin-form__group admin-form__group--full">
            <label className="admin-form__label">Dirección Real</label>
            <input name="direccion" value={formData.direccion} onChange={handleChange} className="admin-form__input" placeholder="Calle Falsa 123, Madrid" />
          </div>

          <div className="admin-form__group admin-form__group--full">
            <label className="admin-form__label">URL de la Foto</label>
            <input name="fotoUrl" value={formData.fotoUrl} onChange={handleChange} className="admin-form__input" placeholder="https://..." />
          </div>

          <div className="admin-form__group admin-form__group--full">
            <label className="admin-form__label">Descripción</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} className="admin-form__textarea" placeholder="Cuéntanos algo del local..." />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-form__submit"
          >
            {loading ? "Subiendo..." : "Guardar en Firebase"}
          </button>
        </form>
      </div>
    </main>
  );
}