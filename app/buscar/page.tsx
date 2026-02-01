import MapNearMe from "@/components/MapNearMe";

export default function BuscarPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <h1 className="text-2xl font-semibold mb-4">
        Buscar cerca de mí!
      </h1>

      <MapNearMe />
    </div>
  );
}
