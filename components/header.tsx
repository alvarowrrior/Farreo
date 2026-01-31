"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

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

          {/* SI NO HAY USUARIO */}
          {!user && (
            <Link href="/login" className="hover:opacity-80">
              Login
            </Link>
          )}

          {/* SI HAY USUARIO */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2"
              >
                {/* Imagen de Google */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.photoURL ?? ""}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 rounded-full border border-white/10"
                />
              </button>

              {open && (
                <div className="absolute right-0 mt-3 w-48 rounded-xl border border-white/10 bg-black/90 p-2">
                  <p className="px-3 py-2 text-sm font-semibold truncate">
                    {user.displayName}
                  </p>

                  <button
                    onClick={() => signOut(auth)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
