"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase"; // Ajusta la ruta según tu proyecto
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import Link from "next/link";

export default function EditProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setDisplayName(u.displayName || "");
      }
    });
    return () => unsub();
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage("");

    try {
      await updateProfile(user, { displayName });
      setMessage("¡Perfil actualizado con éxito!");
    } catch (error) {
      console.error(error);
      setMessage("Error al actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400">Cargando usuario...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pt-20 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Enlace de regreso */}
        <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
          ← Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold mt-6 mb-8">Editar Perfil</h1>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
          <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* Foto de Perfil */}
            <div className="flex items-center gap-6 mb-8">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  className="w-20 h-20 rounded-full border-2 border-yellow-500 object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold">
                  {user.displayName?.[0] || user.email?.[0]}
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Imagen de perfil</p>
                <p className="text-xs text-gray-500 mt-1">Sincronizada con tu cuenta de Google</p>
              </div>
            </div>

            {/* Campo: Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nombre de usuario
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                placeholder="Tu nombre en Farreo"
              />
            </div>

            {/* Campo: Email (Solo lectura) */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-600 mt-2 italic">
                El correo no se puede modificar por seguridad.
              </p>
            </div>

            {/* Mensaje de feedback */}
            {message && (
              <p className={`text-sm ${message.includes("éxito") ? "text-green-400" : "text-red-400"}`}>
                {message}
              </p>
            )}

            {/* Botón de acción */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}