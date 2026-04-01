"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import Image from "next/image";
import { getLocales, type Local } from "@/lib/locales";
import MapSelector from "@/components/MapSelector";

// USAR LA MISMA LISTA PARA PROTEGER LA RUTA
const ADMIN_EMAILS = [
  "guerrerogonzalez.alvaro@gmail.com",
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fotosLocales, setFotosLocales] = useState<File[]>([]);
  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<"crear" | "gestionar">("crear");
  const [localesList, setLocalesList] = useState<Local[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingFotos, setExistingFotos] = useState<string[]>([]);
  const [existingAudio, setExistingAudio] = useState<string>("");

  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "bar",
    lat: "",
    lng: "",
    direccion: "",
    descripcion: "",
    rating: "4.5",
    numResenas: "0",
    web: "",
    telefono: "",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email && ADMIN_EMAILS.includes(u.email)) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
      setIsCheckingAuth(false);
    });
    return () => unsub();
  }, []);

  const loadLocales = async () => {
    setLoading(true);
    const data = await getLocales();
    setLocalesList(data);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "gestionar") {
      loadLocales();
    }
  }, [activeTab]);

  const handleEdit = (local: Local) => {
    setFormData({
      nombre: local.nombre,
      tipo: local.tipo,
      lat: local.lat.toString(),
      lng: local.lng.toString(),
      direccion: local.direccion || "",
      descripcion: local.descripcion || "",
      rating: local.rating?.toString() || "4.5",
      numResenas: local.numResenas?.toString() || "0",
      web: local.web || "",
      telefono: local.telefono || "",
    });
    setEditingId(local.id);
    setExistingFotos(local.fotos || []);
    setExistingAudio(local.audioUrl || "");
    setFotosPreview([]);
    setFotosLocales([]);
    setAudioFile(null);
    setMessage(null);
    setActiveTab("crear");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar definitivamente el local "${nombre}"? Esta acción es irreversible.`)) return;
    try {
      await deleteDoc(doc(db, "locales", id));
      setMessage({ type: "success", text: `Local "${nombre}" eliminado correctamente.` });
      loadLocales();
    } catch (error) {
      console.error("Error al borrar:", error);
      setMessage({ type: "error", text: "Error de permisos o conexión al eliminar." });
    }
  };

  const removeExistingPhoto = (index: number) => {
    setExistingFotos(prev => prev.filter((_, i) => i !== index));
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFotosLocales((prev) => [...prev, ...newFiles]);

      // Crear URLs para previsualización
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setFotosPreview((prev) => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setFotosLocales((prev) => prev.filter((_, i) => i !== index));
    setFotosPreview((prev) => {
      // Liberar memoria
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) return;

    setLoading(true);
    setMessage(null);

    try {
      // 1. Subir las imágenes a Firebase Storage
      const fotosUrls: string[] = [];

      for (let i = 0; i < fotosLocales.length; i++) {
        const file = fotosLocales[i];
        // Crear un nombre único para el archivo 
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const storageRef = ref(storage, `locales/${fileName}`);

        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        fotosUrls.push(downloadUrl);
      }

      // 1.5 Subir el audio a Firebase Storage si existe
      let finalAudio = existingAudio;
      if (audioFile) {
        const audioName = `${Date.now()}_${audioFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const audioRef = ref(storage, `locales/audio/${audioName}`);
        await uploadBytes(audioRef, audioFile);
        finalAudio = await getDownloadURL(audioRef);
      }

      const finalFotos = [...existingFotos, ...fotosUrls];

      const localData = {
        nombre: formData.nombre.trim(),
        tipo: formData.tipo,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        direccion: formData.direccion.trim(),
        descripcion: formData.descripcion.trim(),
        rating: parseFloat(formData.rating),
        numResenas: parseInt(formData.numResenas),
        web: formData.web.trim(),
        telefono: formData.telefono.trim(),
        fotos: finalFotos,
        audioUrl: finalAudio,
      };

      if (editingId) {
        await updateDoc(doc(db, "locales", editingId), {
          ...localData,
          updatedAt: new Date(),
          updatedBy: user?.email,
        });
        setMessage({ type: "success", text: "¡Local actualizado con éxito!" });
      } else {
        await addDoc(collection(db, "locales"), {
          ...localData,
          createdAt: new Date(),
          createdBy: user?.email,
        });
        setMessage({ type: "success", text: "¡Local añadido con éxito!" });
      }

      // 3. Resetear el formulario
      setFormData({
        nombre: "", tipo: "bar", lat: "", lng: "", direccion: "", descripcion: "", rating: "4.5", numResenas: "0", web: "", telefono: ""
      });
      setFotosLocales([]);
      setFotosPreview([]);
      setAudioFile(null);
      setEditingId(null);
      setExistingFotos([]);
      setExistingAudio("");

      // Ocultar mensaje exitoso después de 3 segundos
      setTimeout(() => setMessage(null), 3000);

    } catch (error: any) {
      console.error("Error al añadir local:", error);

      // Extraemos el mensaje real de Firebase si existe, sino un mensaje genérico.
      const errorMessage = error?.message || "Error desconocido al contactar con Firebase.";
      setMessage({ type: "error", text: `Error: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  // ESTADOS DE CARGA Y AUTORIZACIÓN
  if (isCheckingAuth) {
    return (
      <main className="admin-dashboard admin-dashboard--loading">
        <p className="admin-dashboard__subtitle">Verificando credenciales...</p>
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="admin-dashboard">
        <div className="admin-dashboard__unauthorized">
          <h1 className="admin-dashboard__unauthorized-title">Acceso Denegado</h1>
          <p className="admin-dashboard__unauthorized-desc">
            No tienes permisos de Administrador para ver esta página.
          </p>
          <Link href="/" className="admin-dashboard__unauthorized-btn">
            Volver al Inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">Panel de Control</h1>
        <p className="admin-dashboard__subtitle">Gestiona la base de datos de locales de Farreo</p>
      </header>

      <div className="admin-dashboard__grid">
        {/* SIDEBAR: Información / Acciones rápidas (opcional para futuro) */}
        <aside className="admin-dashboard__sidebar">
          <h2 className="admin-dashboard__section-title">Sesión Admin</h2>
          <div className="admin-dashboard__user-info">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Admin" className="admin-dashboard__avatar" />
            ) : (
              <div className="admin-dashboard__avatar">
                {(user?.email?.[0] ?? "A").toUpperCase()}
              </div>
            )}
            <div>
              <p className="admin-dashboard__user-name">{user?.displayName || "Administrador"}</p>
              <p className="admin-dashboard__user-email">{user?.email}</p>
            </div>
          </div>

          <div className="admin-dashboard__nav">
            <p className="admin-dashboard__nav-title">Menú de Navegación</p>
            <div className="admin-dashboard__nav-list">
              <button
                onClick={() => {
                  setActiveTab("crear");
                  setEditingId(null);
                  setFormData({ nombre: "", tipo: "bar", lat: "", lng: "", direccion: "", descripcion: "", rating: "4.5", numResenas: "0", web: "", telefono: "" });
                  setExistingFotos([]);
                  setExistingAudio("");
                  setMessage(null);
                }}
                className={`admin-dashboard__nav-btn ${activeTab === 'crear' ? 'admin-dashboard__nav-btn--active' : ''}`}
              >
                {editingId ? "✏️ Editando Local..." : "➕ Añadir Local"}
              </button>
              <button
                onClick={() => { setActiveTab("gestionar"); setMessage(null); }}
                className={`admin-dashboard__nav-btn ${activeTab === 'gestionar' ? 'admin-dashboard__nav-btn--active' : ''}`}
              >
                📋 Gestionar Locales
              </button>
              <Link
                href="/admin/playlist"
                className="admin-dashboard__nav-btn"
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                🎧 Modo Spotify
              </Link>
            </div>
          </div>

          <div className="admin-dashboard__status">
            <p className="admin-dashboard__nav-title">Estado del Sistema</p>
            <div className="admin-dashboard__status-indicator">
              <svg className="admin-dashboard__status-icon" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="4" cy="4" r="4" />
              </svg>
              Base de datos online
            </div>
          </div>
        </aside>

        <div className="admin-dashboard__form-container">

          {message && (
            <div className={`admin-dashboard__message admin-dashboard__message--${message.type}`}>
              {message.text}
            </div>
          )}

          {activeTab === "gestionar" && (
            <div>
              <h2 className="admin-dashboard__section-title">Listado de Locales</h2>
              {loading && <p>Cargando locales...</p>}
              {!loading && localesList.length === 0 && <p>No hay locales registrados aún.</p>}

              <div className="admin-dashboard__list">
                {localesList.map(local => (
                  <div key={local.id} className="admin-dashboard__list-item">
                    <div>
                      <h3 className="admin-dashboard__list-item-title">{local.nombre}</h3>
                      <p className="admin-dashboard__list-item-desc">{local.direccion}</p>
                    </div>
                    <div className="admin-dashboard__list-item-actions">
                      <button
                        onClick={() => handleEdit(local)}
                        className="admin-dashboard__action-btn admin-dashboard__action-btn--edit"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(local.id, local.nombre)}
                        className="admin-dashboard__action-btn admin-dashboard__action-btn--delete"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "crear" && (
            <>
              <h2 className="admin-dashboard__section-title">
                {editingId ? "Editar Local" : "Añadir Nuevo Local"}
              </h2>

              <form onSubmit={handleSubmit} className="admin-dashboard__form">
                <div className="admin-dashboard__form-row">
                  <div className="admin-dashboard__form-group admin-dashboard__form-group--full">
                    <label className="admin-dashboard__label">Nombre del Local *</label>
                    <input required name="nombre" value={formData.nombre} onChange={handleChange} className="admin-dashboard__input" placeholder="Ej: Teatro Kapital" />
                  </div>

                  <div className="admin-dashboard__form-group">
                    <label className="admin-dashboard__label">Tipo *</label>
                    <select name="tipo" value={formData.tipo} onChange={handleChange} className="admin-dashboard__select">
                      <option value="discoteca">Discoteca</option>
                      <option value="club">Club Privado</option>
                      <option value="bar">Bar de Copas</option>
                      <option value="pub">Pub / Coctelería</option>
                      <option value="restaurante">Restaurante Espectáculo</option>
                    </select>
                  </div>

                  <div className="admin-dashboard__form-group">
                    <label className="admin-dashboard__label">Valoración Inicial (1-5)</label>
                    <input name="rating" type="number" step="0.1" min="1" max="5" value={formData.rating} onChange={handleChange} className="admin-dashboard__input" />
                  </div>

                  <div className="admin-dashboard__form-group admin-dashboard__form-group--full">
                    <label className="admin-dashboard__label">Dirección Completa *</label>
                    <input required name="direccion" value={formData.direccion} onChange={handleChange} className="admin-dashboard__input" placeholder="Calle de Atocha, 125, 28012 Madrid" />
                  </div>

                  <div className="admin-dashboard__form-group admin-dashboard__form-group--full">
                    <label className="admin-dashboard__label">Ubicación Exacta * (Haz clic o arrastra el marcador rojo)</label>
                    <div className="admin-dashboard__map-container">
                      <MapSelector
                        initialLat={formData.lat ? parseFloat(formData.lat) : undefined}
                        initialLng={formData.lng ? parseFloat(formData.lng) : undefined}
                        onLocationSelect={(lat, lng) => {
                          setFormData(prev => ({
                            ...prev,
                            lat: lat.toFixed(6),
                            lng: lng.toFixed(6)
                          }));
                        }}
                      />
                    </div>
                    <div className="admin-dashboard__coords">
                      <div className="admin-dashboard__coord-box">
                        <span className="admin-dashboard__coord-box-label">Latitud</span>
                        <span className="admin-dashboard__coord-box-value">{formData.lat || 'Sin seleccionar'}</span>
                      </div>
                      <div className="admin-dashboard__coord-box">
                        <span className="admin-dashboard__coord-box-label">Longitud</span>
                        <span className="admin-dashboard__coord-box-value">{formData.lng || 'Sin seleccionar'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-dashboard__form-group">
                    <label className="admin-dashboard__label">Página Web (Opcional)</label>
                    <input name="web" value={formData.web} onChange={handleChange} type="url" className="admin-dashboard__input" placeholder="https://..." />
                  </div>

                  <div className="admin-dashboard__form-group">
                    <label className="admin-dashboard__label">Teléfono (Opcional)</label>
                    <input name="telefono" value={formData.telefono} type="tel" onChange={handleChange} className="admin-dashboard__input" placeholder="+34 600..." />
                  </div>

                  {/* UPLOAD IMAGES SECTION */}
                  <div className="admin-dashboard__form-group admin-dashboard__form-group--full">
                    <label className="admin-dashboard__label">Fotos de la Galería (Múltiples)</label>

                    <div className="admin-dashboard__file-input-wrapper">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="admin-dashboard__file-input"
                      />
                      <div className="admin-dashboard__file-label">
                        <span className="admin-dashboard__file-label-title admin-dashboard__file-label-title--photo">Haz clic o arrastra nuevas fotos aquí</span>
                        <span className="admin-dashboard__file-label-subtitle">Sube JPG, PNG, WEBP limitados a 5MB cada una</span>
                      </div>
                    </div>

                    {existingFotos.length > 0 && (
                      <div className="admin-dashboard__file-section">
                        <p className="admin-dashboard__file-section-title">Fotos Actuales (Guardadas en el servidor)</p>
                        <div className="admin-dashboard__file-preview-grid">
                          {existingFotos.map((url, i) => (
                            <div key={`exist-${i}`} className="admin-dashboard__file-preview-item">
                              <img src={url} alt={`Existente ${i}`} />
                              <button
                                type="button"
                                onClick={() => removeExistingPhoto(i)}
                                className="admin-dashboard__file-preview-item-remove"
                                title="Eliminar foto guardada"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {fotosPreview.length > 0 && (
                      <div className="admin-dashboard__file-section admin-dashboard__file-section--new">
                        <p className="admin-dashboard__file-section-title">Fotos Nuevas a subir</p>
                        <div className="admin-dashboard__file-preview-grid">
                          {fotosPreview.map((url, i) => (
                            <div key={`new-${i}`} className="admin-dashboard__file-preview-item">
                              <img src={url} alt={`Preview ${i}`} />
                              <button
                                type="button"
                                onClick={() => removePhoto(i)}
                                className="admin-dashboard__file-preview-item-remove"
                                title="Quitar foto"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* UPLOAD MP3 AUDIO SECTION */}
                  <div className="admin-dashboard__form-group admin-dashboard__form-group--full">
                    <label className="admin-dashboard__label">Canción del Local (MP3 opcional para "¿Qué se escucha aquí?")</label>

                    <div className="admin-dashboard__file-input-wrapper admin-dashboard__file-input-wrapper--small">
                      <input
                        type="file"
                        accept="audio/mpeg, audio/mp3"
                        onChange={handleAudioChange}
                        className="admin-dashboard__file-input"
                      />
                      <div className="admin-dashboard__file-label">
                        <span className="admin-dashboard__file-label-title admin-dashboard__file-label-title--audio">
                          {audioFile ? `Cargado nuevo: ${audioFile.name}` : existingAudio ? 'Sube otro para reemplazar actual' : 'Haz clic para subir un archivo MP3'}
                        </span>
                      </div>
                    </div>
                    {existingAudio && !audioFile && (
                      <div className="admin-dashboard__audio-status">
                        <p className="admin-dashboard__audio-status-text">Audio actual guardado ✅</p>
                        <button
                          type="button"
                          onClick={() => setExistingAudio("")}
                          className="admin-dashboard__audio-status-btn"
                        >
                          Eliminar audio actual
                        </button>
                      </div>
                    )}
                    {audioFile && (
                      <button
                        type="button"
                        onClick={() => setAudioFile(null)}
                        className="admin-dashboard__audio-status-btn"
                      >
                        Quitar fichero seleccionado
                      </button>
                    )}
                  </div>

                  <div className="admin-dashboard__form-group admin-dashboard__form-group--full">
                    <label className="admin-dashboard__label">Descripción *</label>
                    <textarea
                      required
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      className="admin-dashboard__textarea"
                      placeholder="Describe el ambiente, la música, si hay dress code..."
                    />
                  </div>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="admin-dashboard__submit"
                >
                  {loading ? "Guardando datos..." : (editingId ? "Guardar Cambios del Local" : "Crear Local en la Base de Datos")}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ nombre: "", tipo: "bar", lat: "", lng: "", direccion: "", descripcion: "", rating: "4.5", numResenas: "0", web: "", telefono: "" });
                      setExistingFotos([]);
                      setExistingAudio("");
                      setActiveTab("gestionar");
                      setMessage(null);
                    }}
                    className="admin-dashboard__btn-cancel"
                  >
                    Cancelar Edición
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}