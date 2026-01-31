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
      <body className="min-h-screen flex flex-col bg-black text-white">

        {/* HEADER GLOBAL */}
        <Header />

        {/* BARRA GLOBAL EXTRA (CHAT) */}
        <div className="border-b border-white/10 bg-black/60">
          <div className="mx-auto max-w-6xl px-6 py-2 flex gap-6 text-sm">
            <Link href="/explorar" className="hover:opacity-80">
              Explorar
            </Link>

            <Link href="/chat">Chat 💬</Link>
          </div>
        </div>

        {/* CONTENIDO DE CADA PÁGINA */}
        <main className="flex-1">
          {children}
        </main>

        {/* FOOTER GLOBAL */}
        <footer className="border-t border-white/10 text-sm text-gray-400">
          <div className="mx-auto max-w-6xl px-6 py-6 flex justify-between">
            <span>Farreo © 2026</span>
            <span>Hecho con Next.js</span>
          </div>
        </footer>

      </body>
    </html>
  );
}
