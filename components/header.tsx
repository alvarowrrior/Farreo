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
        className="avatar__img"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="avatar__fallback">
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
    /* CAMBIO AQUÍ: 
       'relative' activa el posicionamiento.
       'z-50' lo pone al frente de todo.
       'bg-black' asegura que no sea transparente y se mezcle con el fondo.
    */
    <header className="header">
      <div className="header__container">
        <Link href="/" className="header__logo">
          Farreo 🍻
        </Link>

        <nav className="header__nav">
          <Link href="/explorar" className="header__link">
            Explorar
          </Link>
          <Link href="/buscar" className="header__link">
            Buscar
          </Link>

          {/* Zona usuario */}
          {user ? (
            <div className="header__user">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="header__user-btn"
                aria-label="Abrir menú de usuario"
              >
                <Avatar user={user} />
                <span className="header__user-name">
                  {user.displayName ?? "Mi cuenta"}
                </span>
              </button>

              {menuOpen && (
                <div
                  className="header__dropdown"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="header__dropdown-header">
                    <p className="header__dropdown-name">
                      {user.displayName ?? "Usuario"}
                    </p>
                    <p className="header__dropdown-email">{user.email ?? ""}</p>
                  </div>

                  <div className="header__dropdown-divider" />

                  <Link
                    href="/perfil"
                    className="header__dropdown-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    Perfil
                  </Link>

                  <button
                    onClick={logout}
                    className="header__dropdown-btn header__dropdown-btn--danger"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="header__link">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}