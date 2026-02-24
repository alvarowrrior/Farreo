"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function EditProfilePage() {
  const router = useRouter();
  const nameId = useId();

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/");
        return;
      }
      setUser(u);
      setDisplayName(u.displayName ?? "");
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const current = auth.currentUser;
    if (!current) return;

    const nextName = displayName.trim();

    // Evita llamadas inútiles
    if (nextName === (current.displayName ?? "")) {
      setMessage({ type: "success", text: "No hay cambios que guardar." });
      return;
    }

    setUpdating(true);
    try {
      await updateProfile(current, { displayName: nextName });

      // Refrescamos estado local para UI inmediata
      setUser({ ...current });

      setMessage({ type: "success", text: "Perfil actualizado." });

      // Opcional: si tu header depende de server components/caché
      // router.refresh();

      window.setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "No se pudo actualizar el perfil. Inténtalo de nuevo." });
    } finally {
      setUpdating(false);
    }
  }

  async function handleSignOut() {
    try {
      await auth.signOut();
      router.push("/");
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "No se pudo cerrar sesión." });
    }
  }

  if (loading) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center">
        <p className="text-sm text-gray-400">Cargando…</p>
      </main>
    );
  }

  return (
    <>
      <header className="px-6 pt-10">
        <nav className="max-w-xl mx-auto">
          <Link href="/" className="text-sm text-gray-500 hover:text-white">
            ← Volver
          </Link>
        </nav>
      </header>

      <main className="px-6 pb-12">
        <div className="max-w-xl mx-auto mt-6">
          <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
          <p className="text-sm text-gray-400 mt-1">
            Actualiza tu nombre público.
          </p>

          <section className="mt-8">
            <div className="rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-4">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Foto de perfil"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                    {(displayName?.[0] ?? "F").toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="text-white font-medium">
                    {displayName || "Usuario de Farreo"}
                  </p>
                  <p className="text-sm text-gray-400">{user?.email ?? ""}</p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="mt-6">
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-white">
                    Datos públicos
                  </legend>

                  <label htmlFor={nameId} className="block text-sm text-gray-400">
                    Nombre
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-white"
                    placeholder="Tu nombre…"
                  />

                  {message && (
                    <p
                      role={message.type === "success" ? "status" : "alert"}
                      className={`text-sm ${
                        message.type === "success" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {message.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-60"
                  >
                    {updating ? "Guardando…" : "Guardar cambios"}
                  </button>
                </fieldset>
              </form>
            </div>
          </section>

          <section className="mt-6">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-xl border border-white/10 py-3 text-sm text-gray-300 hover:text-white"
            >
              Cerrar sesión
            </button>
          </section>
        </div>
      </main>
    </>
  );
}