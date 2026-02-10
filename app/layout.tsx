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

      <body className="min-h-screen flex flex-col bg-black text-white antialiased">
        
        {/* --- CAPAS DE FONDO GLOBAL --- */}
        {/* Usamos fixed para que no se reinicie al cambiar de página */}
        <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden">
          {/* Capa de luces (la animación neon-pulse de tu globals.css) */}
          <div className="absolute inset-0 bg-night-life will-change-transform" />
          
          {/* Capa de textura (grano) */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
        {/* ------------------------------ */}

        {/* HEADER GLOBAL */}
        <Header />

        {/* CONTENIDO DE CADA PÁGINA */}
        {/* relative y z-0 para asegurar que el contenido flote sobre el fondo */}
        <main className="flex-1 relative z-0">{children}</main>

        {/* FOOTER GLOBAL */}
        <footer className="relative z-10 border-t border-white/10 text-sm text-gray-400 bg-black/50 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-6 py-6 flex justify-between">
            <span>Farreo © 2026</span>
            <span>Todos los derechos reservados.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}