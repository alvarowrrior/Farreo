"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import Image from "next/image";

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
      let audioDownloadUrl = "";
      if (audioFile) {
        const audioName = `${Date.now()}_${audioFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const audioRef = ref(storage, `locales/audio/${audioName}`);
        await uploadBytes(audioRef, audioFile);
        audioDownloadUrl = await getDownloadURL(audioRef);
      }

      // 2. Guardar los datos en Firestore (con el array de fotos y el audio)
      await addDoc(collection(db, "locales"), {
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
        fotos: fotosUrls, // <-- Array de strings puro
        audioUrl: audioDownloadUrl, // <-- URL del MP3 o vacío
        createdAt: new Date(),
        createdBy: user?.email, // Auditoría
      });

      // 3. Resetear el formulario
      setMessage({ type: "success", text: "¡Local añadido con éxito!" });
      setFormData({
        nombre: "", tipo: "bar", lat: "", lng: "", direccion: "", descripcion: "", rating: "4.5", numResenas: "0", web: "", telefono: ""
      });
      setFotosLocales([]);
      setFotosPreview([]);
      setAudioFile(null);

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
      <main className="admin-dashboard" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p className="admin-dashboard__subtitle">Verificando credenciales...</p>
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="admin-dashboard">
        <div className="admin-dashboard__unauthorized">
          <div className="admin-dashboard__unauthorized-icon">🔒</div>
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
          <div className="profile-page__user-info">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Admin" className="profile-page__avatar" style={{ width: '3rem', height: '3rem' }} />
            ) : (
              <div className="profile-page__avatar" style={{ width: '3rem', height: '3rem' }}>
                {(user?.email?.[0] ?? "A").toUpperCase()}
              </div>
            )}
            <div>
              <p className="profile-page__name" style={{ fontSize: '1rem' }}>{user?.displayName || "Administrador"}</p>
              <p className="profile-page__email" style={{ fontSize: '0.8rem' }}>{user?.email}</p>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <p className="admin-dashboard__label" style={{ marginBottom: '1rem' }}>Estado del Sistema</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80', fontSize: '0.875rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80' }}></span>
              Base de datos online
            </div>
          </div>
        </aside>

        {/* MAIN CONTET: Formulario de añadir local */}
        <div className="admin-dashboard__form-container">
          <h2 className="admin-dashboard__section-title">Añadir Nuevo Local</h2>

          {message && (
            <div className={`profile-page__message profile-page__message--${message.type}`} style={{ marginBottom: '1.5rem' }}>
              {message.text}
            </div>
          )}

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

              <div className="admin-dashboard__form-group">
                <label className="admin-dashboard__label">Latitud *</label>
                <input required name="lat" type="number" step="any" value={formData.lat} onChange={handleChange} className="admin-dashboard__input" placeholder="40.410972" />
              </div>

              <div className="admin-dashboard__form-group">
                <label className="admin-dashboard__label">Longitud *</label>
                <input required name="lng" type="number" step="any" value={formData.lng} onChange={handleChange} className="admin-dashboard__input" placeholder="-3.693056" />
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
                    <span className="admin-dashboard__file-label-icon">📸</span>
                    <span className="admin-dashboard__file-label-title">Haz clic o arrastra fotos aquí</span>
                    <span className="admin-dashboard__file-label-subtitle">Sube JPG, PNG, WEBP limitados a 5MB cada una</span>
                  </div>
                </div>

                {fotosPreview.length > 0 && (
                  <div className="admin-dashboard__file-preview-grid">
                    {fotosPreview.map((url, i) => (
                      <div key={i} className="admin-dashboard__file-preview-item">
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
                )}
              </div>

              {/* UPLOAD MP3 AUDIO SECTION */}
              <div className="admin-dashboard__form-group admin-dashboard__form-group--full">
                <label className="admin-dashboard__label">Canción del Local (MP3 opcional para "¿Qué se escucha aquí?")</label>

                <div className="admin-dashboard__file-input-wrapper" style={{ minHeight: '80px', padding: '1.5rem' }}>
                  <input
                    type="file"
                    accept="audio/mpeg, audio/mp3"
                    onChange={handleAudioChange}
                    className="admin-dashboard__file-input"
                  />
                  <div className="admin-dashboard__file-label">
                    <span className="admin-dashboard__file-label-icon">🎵</span>
                    <span className="admin-dashboard__file-label-title">
                      {audioFile ? `Cargado: ${audioFile.name}` : 'Haz clic para subir un archivo MP3'}
                    </span>
                  </div>
                </div>
                {audioFile && (
                  <button
                    type="button"
                    onClick={() => setAudioFile(null)}
                    style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Eliminar canción
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
              {loading ? "Subiendo fotos y guardando..." : "Crear Local en la Base de Datos"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}