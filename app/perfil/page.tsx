"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Escuchar el estado del usuario al cargar la página
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setDisplayName(u.displayName || "");
        setLoading(false);
      } else {
        // Si no está logueado, redirigir a la home
        router.push("/");
      }
    });
    return () => unsub();
  }, [router]);

  // Función para guardar los cambios
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    
    if (!auth.currentUser) return;

    setUpdating(true);
    setMessage("");

    try {
      // 1. Actualizar en los servidores de Firebase
      await updateProfile(auth.currentUser, { 
        displayName: displayName.trim() 
      });

      // 2. FORZAR ACTUALIZACIÓN VISUAL:
      // Creamos un nuevo objeto con los datos actualizados para que React lo detecte
      const updatedUser = { ...auth.currentUser };
      setUser(updatedUser);

      // 3. Notificar a Next.js que los datos han cambiado (actualiza el Header)
      router.refresh();

      setMessage("¡Perfil actualizado con éxito!");

      // Limpiar el mensaje de éxito tras unos segundos
      setTimeout(() => setMessage(""), 3000);

    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error al actualizar el perfil. Inténtalo de nuevo.");
    } finally {
      setUpdating(false);
    }
  }

  // Pantalla de carga inicial
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-xl mx-auto">
        
        {/* Navegación de regreso */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8"
        >
          <span>←</span> Volver al inicio
        </Link>

        <h1 className="text-4xl font-black mb-8 tracking-tighter text-white">
          MI PERFIL
        </h1>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md shadow-2xl">
          <form onSubmit={handleUpdate} className="space-y-8">
            
            {/* Sección de la Foto */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Avatar" 
                    className="w-24 h-24 rounded-full border-2 border-yellow-500 object-cover shadow-lg shadow-yellow-500/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-yellow-500 text-black flex items-center justify-center text-3xl font-black">
                    {displayName?.[0]?.toUpperCase() || "F"}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{displayName || "Usuario de Farreo"}</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Usuario de Farreo</p>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Input de Nombre */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                Nombre en la pista
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder:text-gray-700"
                placeholder="Escribe tu nombre..."
                required
              />
            </div>

            {/* Input de Email (Informativo) */}
            <div className="space-y-2 opacity-60">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                Email vinculado
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full bg-transparent border border-white/5 rounded-2xl px-5 py-4 text-gray-400 cursor-not-allowed"
              />
            </div>

            {/* Mensajes de Feedback */}
            {message && (
              <div className={`p-4 rounded-2xl text-center text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${
                message.includes("éxito") 
                  ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                {message}
              </div>
            )}

            {/* Botón Guardar */}
            <button
              type="submit"
              disabled={updating}
              className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-yellow-500 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait shadow-xl shadow-white/5 hover:shadow-yellow-500/20"
            >
              {updating ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
            </button>
          </form>
        </div>

        {/* Botón de Cerrar Sesión (Opcional pero recomendado) */}
        <button 
          onClick={() => auth.signOut()}
          className="w-full mt-8 py-4 text-sm text-gray-500 hover:text-red-400 transition-colors font-medium"
        >
          Cerrar sesión de forma segura
        </button>
      </div>
    </main>
  );
}