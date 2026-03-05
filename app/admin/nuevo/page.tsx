"use client";

import { useMemo, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";

type LocalForm = {
  nombre: string;
  tipo: "discoteca" | "bar" | "pub" | "after" | "otro";
  lat: string;
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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function isFiniteNumber(n: number) {
  return Number.isFinite(n) && !Number.isNaN(n);
}

export default function NuevoLocalPage() {
  const [files, setFiles] = useState<File[]>([]); // ✅ Cambio a array
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
    if (!isFiniteNumber(latNum) || latNum < -90 || latNum > 90) e.push("Latitud inválida.");
    if (!isFiniteNumber(lngNum) || lngNum < -180 || lngNum > 180) e.push("Longitud inválida.");

    if (files.length > 0) {
      files.forEach((f, i) => {
        if (!f.type.startsWith("image/")) e.push(`El archivo ${i + 1} no es una imagen.`);
        if (f.size > 12 * 1024 * 1024) e.push(`La imagen ${f.name} supera los 12MB.`);
      });
    }
    return e;
  }, [form.nombre, latNum, lngNum, files]);

  const canSubmit = errors.length === 0 && !loading;

  const onChange = (key: keyof LocalForm) => (value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  // ✅ Función para subir múltiples fotos
  async function uploadPhotos(localName: string, filesToUpload: File[]) {
    const urls: string[] = [];
    const safeName = slugify(localName) || "local";

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setStatus(`Optimizando imagen ${i + 1} de ${filesToUpload.length}...`);

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/webp",
      });

      const fileName = `${Date.now()}_${safeName}_${i}.webp`;
      const storageRef = ref(storage, `locales/${fileName}`);

      setStatus(`Subiendo imagen ${i + 1}...`);
      await uploadBytes(storageRef, compressed, { contentType: "image/webp" });
      
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      let urls: string[] = [];
      if (files.length > 0) {
        urls = await uploadPhotos(form.nombre, files);
      }

      setStatus("Guardando en Firestore...");

      const webNormalized = form.web.trim()
        ? form.web.trim().startsWith("http") ? form.web.trim() : `https://${form.web.trim()}`
        : "";

      await addDoc(collection(db, "locales"), {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        lat: latNum,
        lng: lngNum,
        direccion: form.direccion.trim(),
        descripcion: form.descripcion.trim(),
        web: webNormalized,
        
        // ✅ Guardamos el array de fotos para el carrusel
        fotos: urls, 
        // Por compatibilidad con el código anterior, guardamos la primera como fotoUrl
        fotoUrl: urls.length > 0 ? urls[0] : "",

        rating: 4.5,
        numResenas: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("¡Local con carrusel subido con éxito!");
      setForm({ nombre: "", tipo: "discoteca", lat: "", lng: "", direccion: "", descripcion: "", web: "" });
      setFiles([]);
    } catch (err) {
      console.error(err);
      alert("Error al subir.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="max-w-xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-black text-yellow-500 italic uppercase">Nuevo Local</h1>
          <p className="text-zinc-500 text-sm tracking-tight">Sube múltiples imágenes para activar el carrusel.</p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            value={form.nombre}
            placeholder="Nombre del local"
            className="bg-zinc-900 border border-white/5 p-4 rounded-2xl outline-none focus:border-yellow-500/50 transition-all"
            onChange={(e) => onChange("nombre")(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              required
              type="number"
              step="any"
              value={form.lat}
              placeholder="Latitud"
              className="bg-zinc-900 border border-white/5 p-4 rounded-2xl outline-none"
              onChange={(e) => onChange("lat")(e.target.value)}
            />
            <input
              required
              type="number"
              step="any"
              value={form.lng}
              placeholder="Longitud"
              className="bg-zinc-900 border border-white/5 p-4 rounded-2xl outline-none"
              onChange={(e) => onChange("lng")(e.target.value)}
            />
          </div>

          <textarea
            value={form.descripcion}
            placeholder="Descripción del local..."
            className="bg-zinc-900 border border-white/5 p-4 rounded-2xl h-32 outline-none"
            onChange={(e) => onChange("descripcion")(e.target.value)}
          />

          <div className="p-6 rounded-3xl border-2 border-dashed border-white/10 bg-zinc-900/50 space-y-4">
            <label className="block text-center cursor-pointer">
              <span className="text-yellow-500 font-bold block mb-1">Seleccionar Fotos</span>
              <span className="text-zinc-500 text-xs uppercase tracking-widest">Puedes elegir varias a la vez</span>
              <input
                type="file"
                multiple // ✅ CLAVE: permite elegir varios archivos
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  setFiles(selected);
                }}
              />
            </label>

            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {files.map((f, i) => (
                  <div key={i} className="aspect-square bg-zinc-800 rounded-lg flex items-center justify-center text-[10px] text-zinc-500 p-2 text-center overflow-hidden border border-white/5">
                    {f.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            disabled={!canSubmit}
            className="bg-white text-black font-black p-5 rounded-[2rem] hover:bg-yellow-500 disabled:opacity-20 transition-all uppercase italic tracking-tighter"
          >
            {loading ? status : "Publicar Local"}
          </button>
        </form>

        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
            {errors.map((err, i) => <p key={i} className="text-red-400 text-xs font-bold uppercase">× {err}</p>)}
          </div>
        )}
      </div>
    </main>
  );
}