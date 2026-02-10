"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function LoginPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Mantiene el estado del usuario sincronizado (mejor que auth.currentUser directo)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function loginWithGoogle() {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Error al cerrar sesión");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-lg px-6 py-16">
        <Link href="/" className="text-sm text-gray-300 hover:text-white">
          ← Volver
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold">Login</h1>
        <p className="mt-1 text-gray-300 text-sm">
          Entra con Google para guardar favoritos, realizar reseñas y comprar entradas.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          {user ? (
            <>
              <p className="text-sm text-gray-300">Sesión iniciada como:</p>
              <p className="mt-1 font-semibold">{user.displayName ?? "Usuario"}</p>
              <p className="text-sm text-gray-400">{user.email ?? ""}</p>

              <button
                onClick={logout}
                className="mt-6 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm hover:bg-black/60"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <button
              onClick={loginWithGoogle}
              disabled={loading}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Abriendo Google..." : "Continuar con Google"}
            </button>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          La información de tu perfil se sincroniza con tu cuenta de Google. Puedes gestionarla desde la configuración de tu cuenta.
        </p>
      </div>
    </main>
  );
}
