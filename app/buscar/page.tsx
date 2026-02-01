import { Suspense } from "react";
import MapNearMe from "@/components/MapNearMe";

export default function BuscarPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-extrabold mb-4">Buscar cerca de mí</h1>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm opacity-80">
              Cargando mapa…
            </div>
          }
        >
          <MapNearMe />
        </Suspense>
      </div>
    </main>
  );
}
