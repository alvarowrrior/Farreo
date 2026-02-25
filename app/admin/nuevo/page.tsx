"use client";

import { useMemo, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";

type LocalForm = {
  nombre: string;
  tipo: "discoteca" | "bar" | "pub" | "after" | "otro";
  lat: string; // input string -> convertimos a number al guardar
  lng: string;
  direccion: string;
  descripcion: string;
  web: string;
};

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function isFiniteNumber(n: number) {
  return Number.isFinite(n) && !Number.isNaN(n);
}

export default function NuevoLocalPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  const [form, setForm] = useState<LocalForm>({
    nombre: "",
    tipo: "discoteca",
    lat: "",
    lng: "",
    direccion: "",
    descripcion: "",
    web: "",
  });

  const latNum = useMemo(() => parseFloat(form.lat), [form.lat]);
  const lngNum = useMemo(() => parseFloat(form.lng), [form.lng]);

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!form.nombre.trim()) e.push("El nombre es obligatorio.");
    if (!isFiniteNumber(latNum) || latNum < -90 || latNum > 90)
      e.push("Latitud inválida (debe estar entre -90 y 90).");
    if (!isFiniteNumber(lngNum) || lngNum < -180 || lngNum > 180)
      e.push("Longitud inválida (debe estar entre -180 y 180).");

    if (form.web.trim()) {
      try {
        // Acepta sin https (lo arreglamos al guardar)
        const w = form.web.trim();
        const normalized = w.startsWith("http") ? w : `https://${w}`;
        new URL(normalized);
      } catch {
        e.push("La web no parece una URL válida.");
      }
    }

    // No obligatoria, pero si hay archivo, validamos tamaño/tipo básicos
    if (file) {
      if (!file.type.startsWith("image/")) e.push("El archivo debe ser una imagen.");
      const maxMB = 12;
      if (file.size > maxMB * 1024 * 1024) e.push(`La imagen supera ${maxMB}MB.`);
    }
    return e;
  }, [form.nombre, latNum, lngNum, form.web, file]);

  const canSubmit = errors.length === 0 && !loading;

  const onChange =
    <K extends keyof LocalForm>(key: K) =>
    (value: LocalForm[K]) =>
      setForm((p) => ({ ...p, [key]: value }));

  async function uploadPhotoIfAny(localName: string, file: File) {
    setStatus("Optimizando imagen...");

    const compressed = await imageCompression(file, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: "image/webp", // fuerza a webp
      initialQuality: 0.86,
    });

    const safeName = slugify(localName) || "local";
    const fileName = `${Date.now()}_${safeName}.webp`;
    const storageRef = ref(storage, `locales/${fileName}`);

    setStatus("Subiendo imagen...");
    await uploadBytes(storageRef, compressed, {
      contentType: "image/webp",
      cacheControl: "public,max-age=31536000",
    });

    setStatus("Obteniendo URL...");
    const url = await getDownloadURL(storageRef);

    return { url, path: storageRef.fullPath };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setStatus("");

    try {
      let fotoUrl = "";
      let fotoPath = "";

      if (file) {
        const uploaded = await uploadPhotoIfAny(form.nombre, file);
        fotoUrl = uploaded.url;
        fotoPath = uploaded.path;
      }

      setStatus("Guardando en Firestore...");

      const webNormalized = form.web.trim()
        ? form.web.trim().startsWith("http")
          ? form.web.trim()
          : `https://${form.web.trim()}`
        : "";

      await addDoc(collection(db, "locales"), {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        lat: latNum,
        lng: lngNum,
        direccion: form.direccion.trim(),
        descripcion: form.descripcion.trim(),
        web: webNormalized,

        fotoUrl, // ✅ URL HTTPS de downloadURL
        fotoPath, // útil para borrar/gestionar luego

        rating: 4.5,
        numResenas: 0,

        createdAt: serverTimestamp(), // mejor que new Date()
        updatedAt: serverTimestamp(),
      });

      setStatus("");
      alert("¡Local subido con éxito!");

      // reset limpio
      setForm({
        nombre: "",
        tipo: "discoteca",
        lat: "",
        lng: "",
        direccion: "",
        descripcion: "",
        web: "",
      });
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Error al subir. Mira la consola (F12) para ver el detalle.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="max-w-xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-black text-yellow-500">Añadir local</h1>
          <p className="text-zinc-400">
            Sube un local con coordenadas correctas. La foto se optimiza a WebP y se guarda en
            Firebase Storage.
          </p>
        </header>

        {errors.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
            <p className="font-bold text-red-400 mb-2">Revisa esto:</p>
            <ul className="list-disc ml-5 text-zinc-300 space-y-1">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            value={form.nombre}
            placeholder="Nombre"
            className="bg-zinc-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/40"
            onChange={(e) => onChange("nombre")(e.target.value)}
          />

          <select
            value={form.tipo}
            className="bg-zinc-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/40"
            onChange={(e) => onChange("tipo")(e.target.value as LocalForm["tipo"])}
          >
            <option value="discoteca">Discoteca</option>
            <option value="bar">Bar</option>
            <option value="pub">Pub</option>
            <option value="after">After</option>
            <option value="otro">Otro</option>
          </select>

          <div className="grid grid-cols-2 gap-4">
            <input
              required
              type="number"
              step="any"
              value={form.lat}
              placeholder="Latitud (ej: 38.705)"
              className="bg-zinc-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/40"
              onChange={(e) => onChange("lat")(e.target.value)}
            />
            <input
              required
              type="number"
              step="any"
              value={form.lng}
              placeholder="Longitud (ej: -0.473)"
              className="bg-zinc-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/40"
              onChange={(e) => onChange("lng")(e.target.value)}
            />
          </div>

          <input
            value={form.direccion}
            placeholder="Dirección (opcional)"
            className="bg-zinc-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/40"
            onChange={(e) => onChange("direccion")(e.target.value)}
          />

          <input
            value={form.web}
            placeholder="Web (opcional) ej: farreo.app"
            className="bg-zinc-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/40"
            onChange={(e) => onChange("web")(e.target.value)}
          />

          <textarea
            value={form.descripcion}
            placeholder="Descripción (opcional)"
            className="bg-zinc-800 p-3 rounded-xl h-28 outline-none focus:ring-2 focus:ring-yellow-500/40"
            onChange={(e) => onChange("descripcion")(e.target.value)}
          />

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4 space-y-2">
            <label className="block text-sm font-bold text-zinc-300">
              Foto del local (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              className="bg-zinc-800 p-3 rounded-xl w-full"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <p className="text-xs text-zinc-400">
                Seleccionada: <span className="text-zinc-200">{file.name}</span> (
                {(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <button
            disabled={!canSubmit}
            className="bg-white text-black font-black p-4 rounded-xl hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Subiendo..." : "Guardar local"}
          </button>

          {loading && status && (
            <p className="text-center text-sm text-zinc-400">{status}</p>
          )}
        </form>
      </div>
    </main>
  );
}