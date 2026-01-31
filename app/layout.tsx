import "./globals.css";
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
