"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

function Avatar({ user }: { user: User }) {
  const photo = user.photoURL;
  const name = user.displayName ?? user.email ?? "Usuario";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name}
        className="h-9 w-9 rounded-full border border-white/10 object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="h-9 w-9 rounded-full border border-white/10 bg-white/10 grid place-items-center text-xs font-semibold">
      {initials || "U"}
    </div>
  );
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function logout() {
    await signOut(auth);
    setMenuOpen(false);
  }

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Farreo 🍻
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/explorar" className="hover:opacity-80">
            Explorar
          </Link>
          <Link href="/buscar" className="hover:opacity-80">
            Buscar
          </Link>

          {/* Zona usuario */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 hover:opacity-90"
                aria-label="Abrir menú de usuario"
              >
                <Avatar user={user} />
                <span className="hidden sm:inline text-gray-200 max-w-[160px] truncate">
                  {user.displayName ?? "Mi cuenta"}
                </span>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-3 w-56 rounded-2xl border border-white/10 bg-black/90 backdrop-blur p-2 shadow-lg"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold truncate">
                      {user.displayName ?? "Usuario"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email ?? ""}</p>
                  </div>

                  <div className="h-px bg-white/10 my-1" />

                  <Link
                    href="/perfil"
                    className="block rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    Perfil
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="hover:opacity-80">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
