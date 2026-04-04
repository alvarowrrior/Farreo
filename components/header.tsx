"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

// LISTA DE ADMINISTRADORES AUTORIZADOS
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",");

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
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;

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
          <Link href="/buscar" className="header__link">
            Buscar
          </Link>

          {isAdmin && (
            <Link href="/admin/playlist" className="header__link header__link--spotify" title="Playlist Exclusiva">
              {/* Icono SVG oficial de Spotify */}
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span>Playlist</span>
            </Link>
          )}

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
                <ul
                  className="header__dropdown"
                  onMouseLeave={() => setMenuOpen(false)}
                  role="menu"
                >
                  <li className="header__dropdown-header" role="presentation">
                    <p className="header__dropdown-name">
                      {user.displayName ?? "Usuario"}
                    </p>
                    <p className="header__dropdown-email">{user.email ?? ""}</p>
                  </li>

                  <li role="presentation">
                    <hr className="header__dropdown-divider" />
                  </li>

                  <li role="presentation">
                    <Link
                      href="/perfil"
                      className="header__dropdown-link"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      Perfil
                    </Link>
                  </li>

                  {isAdmin && (
                    <li role="presentation">
                      <Link
                        href="/admin"
                        className="header__dropdown-link"
                        onClick={() => setMenuOpen(false)}
                        role="menuitem"
                      >
                        Panel Admin
                      </Link>
                    </li>
                  )}

                  <li role="presentation">
                    <button
                      onClick={logout}
                      className="header__dropdown-btn header__dropdown-btn--danger"
                      role="menuitem"
                    >
                      Cerrar sesión
                    </button>
                  </li>
                </ul>
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