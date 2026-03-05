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
    <main className="login-page">
      <div className="login-card">
        <Link href="/" className="login-card__back">
          ← Volver
        </Link>

        <h1 className="login-card__title">Login</h1>
        <p className="login-card__subtitle">
          Entra con Google para guardar favoritos, realizar reseñas y comprar entradas.
        </p>

        <div className="login-card__box">
          {user ? (
            <>
              <p className="login-card__subtitle">Sesión iniciada como:</p>
              <p className="login-card__title" style={{ marginTop: '0.25rem', fontSize: '1rem' }}>{user.displayName ?? "Usuario"}</p>
              <p className="login-card__subtitle">{user.email ?? ""}</p>

              <button
                onClick={logout}
                className="login-card__btn login-card__btn--secondary"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <button
              onClick={loginWithGoogle}
              disabled={loading}
              className="login-card__btn login-card__btn--primary"
            >
              {loading ? "Abriendo Google..." : "Continuar con Google"}
            </button>
          )}
        </div>

        <p className="login-card__footer">
          La información de tu perfil se sincroniza con tu cuenta de Google. Puedes gestionarla desde la configuración de tu cuenta.
        </p>
      </div>
    </main>
  );
}
