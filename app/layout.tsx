import "./globals.css";
import Link from "next/link";
import Header from "../components/header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/icon-192.png" />
      </head>

      <body className="min-h-screen flex flex-col bg-black text-white">
        {/* HEADER GLOBAL */}
        <Header />

        {/* CONTENIDO DE CADA PÁGINA */}
        <main className="flex-1">{children}</main>

        {/* FOOTER GLOBAL */}
        <footer className="border-t border-white/10 text-sm text-gray-400">
          <div className="mx-auto max-w-6xl px-6 py-6 flex justify-between">
            <span>Farreo © 2026</span>
            <span>Todos los derechos reservados.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
