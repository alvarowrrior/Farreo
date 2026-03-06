"use client";

import { useEffect, useMemo, useState, Suspense, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import MapNearMe from "@/components/MapNearMe";
import { getLocales } from "@/lib/locales";
import type { Local } from "@/lib/locales";
import { motion, useAnimation, PanInfo } from "framer-motion";

type SheetSnap = "closed" | "mid" | "full";

function BuscarPageContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("id");

  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);
  const [snap, setSnap] = useState<SheetSnap>("closed");
  const [allLocales, setAllLocales] = useState<Local[]>([]);

  // Bloquear scroll fuera del bottom sheet
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const footer = document.querySelector("footer");
    if (footer) footer.style.display = "none";
    return () => {
      document.body.style.overflow = "auto";
      if (footer) footer.style.display = "block";
    };
  }, []);

  // Cargar locales (necesario por si venimos de la URL con un ID)
  useEffect(() => {
    getLocales().then(setAllLocales);
  }, []);

  // Setear el local inicial si viene por URL
  useEffect(() => {
    if (rawId && allLocales.length > 0) {
      const local = allLocales.find(l => l.id === rawId);
      if (local) {
        setSelectedLocal(local);
        // El mapa debería encargarse de volar hacia él, pero pasaremos la prop en el siguiente paso.
      }
    }
  }, [rawId, allLocales]);

  // Abrir panel al seleccionar
  useEffect(() => {
    if (selectedLocal) setSnap("mid");
  }, [selectedLocal]);

  const title = useMemo(() => selectedLocal ? selectedLocal.nombre : "Cerca de ti", [selectedLocal]);

  return (
    <main className="buscar-page">
      <MapNearMe
        onSelectLocal={setSelectedLocal}
        externalSelectedId={selectedLocal?.id || (rawId ? rawId : undefined)}
      />

      <BottomSheet
        snap={snap}
        onSnapChange={setSnap}
        title={title}
        onClose={() => { setSnap("closed"); setSelectedLocal(null); }}
      >
        {selectedLocal ? (
          <PanelContent local={selectedLocal} />
        ) : (
          <div className="local-detail__no-photos" style={{ background: 'transparent', border: 'none' }}>
            <span>Toca un marcador...</span>
          </div>
        )}
      </BottomSheet>
    </main>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Cargando mapa...</div>}>
      <BuscarPageContent />
    </Suspense>
  );
}

// ==== BOTTOM SHEET CON FRAMER MOTION ====
function BottomSheet({ snap, onSnapChange, onClose, title, children }: {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const controls = useAnimation();

  // Mapeamos los estados a un porcentaje de la pantalla (o píxeles desde arriba)
  const snapPoints: Record<SheetSnap, string> = {
    closed: "120vh",
    mid: "65vh",
    full: "10vh",
  };

  useEffect(() => {
    controls.start({ y: snapPoints[snap], transition: { type: "spring", stiffness: 300, damping: 30 } });
  }, [snap, controls, snapPoints]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50; // Píxeles de arrastre para considerar cambio de estado
    const velocityThreshold = 500; // Velocidad para forzar el cambio

    // Arrastre hacia abajo (cerrar o bajar de full a mid)
    if (info.offset.y > threshold || info.velocity.y > velocityThreshold) {
      if (snap === "full") {
        onSnapChange("mid");
      } else if (snap === "mid") {
        onSnapChange("closed");
        onClose();
      }
    }
    // Arrastre hacia arriba (subir de mid a full)
    else if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
      if (snap === "mid") {
        onSnapChange("full");
      } else if (snap === "closed") {
        // Si estuviera cerrado e intentan sacarlo arrastrando (difícil porque no se ve, pero por si acaso)
        onSnapChange("mid");
      }
    } else {
      // Revertir a la posición original si no superó el umbral
      controls.start({ y: snapPoints[snap], transition: { type: "spring", stiffness: 300, damping: 30 } });
    }
  };

  return (
    <div className="bottom-sheet" style={{ pointerEvents: "none" }}>
      <motion.div
        className="bottom-sheet__panel"
        initial={{ y: "120vh" }}
        animate={controls}
        drag="y"
        dragConstraints={{ top: 0, bottom: typeof window !== 'undefined' ? window.innerHeight : 1000 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ touchAction: "none", pointerEvents: "auto" }} // Evitar scroll de la página al arrastrar
      >
        <div className="bottom-sheet__header" onClick={() => onSnapChange(snap === "mid" ? "full" : "mid")}>
          <hr className="bottom-sheet__drag-handle" aria-hidden="true" />
          <div className="bottom-sheet__title-row">
            <h1 className="bottom-sheet__title">{title}</h1>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="bottom-sheet__close-btn">✕</button>
          </div>
        </div>
        <div
          className={`bottom-sheet__content ${snap === "full" ? "bottom-sheet__content--scrollable" : "bottom-sheet__content--hidden"}`}
          // Prevenir que el drag del panel reaccione al hacer scroll en el contenido
          onPointerDown={(e) => {
            if (snap === "full") e.stopPropagation();
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// ==== PANEL CONTENT CON BOTÓN DE COMPARTIR ====
function PanelContent({ local }: { local: Local }) {
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      // Desactivar preservación de tono si existe en el navegador (Safari / Safari iOS usa webkit)
      if ('preservesPitch' in audio) {
        audio.preservesPitch = false;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ('mozPreservesPitch' in audio) {
        (audio as any).mozPreservesPitch = false;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ('webkitPreservesPitch' in audio) {
        (audio as any).webkitPreservesPitch = false;
      }

      // Velocidad aleatoria entre 0.85 y 1.15 para simular cambio de tono en vinilo
      const randomRate = Math.random() * (1.15 - 0.85) + 0.85;
      audio.playbackRate = randomRate;
    }
  }, [local.id]); // Re-ejecutar cada vez que cambia el local seleccionado

  const handleShare = async () => {
    const url = `${window.location.origin}/buscar?id=${local.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Error copiando el enlace: ", err);
    }
  };

  return (
    <article className="local-detail" style={{ position: 'relative' }}>
      {/* TOAST NOTIFICATION */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: `translateX(-50%) translateY(${copied ? '0' : '20px'})`,
          opacity: copied ? 1 : 0,
          pointerEvents: 'none',
          backgroundColor: '#1E293B',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '999px',
          fontSize: '0.875rem',
          fontWeight: 500,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Copiado
      </div>

      {/* CARRUSEL SNAP SCROLL */}
      <div className="local-detail__carousel">
        <div className="local-detail__scroll-area">
          {local.fotos.length > 0 ? (
            local.fotos.map((url, i) => (
              <div key={i} className="local-detail__photo-card">
                <Image src={url} alt={local.nombre} fill className="object-cover" />
                <div className="local-detail__photo-counter">
                  {i + 1} / {local.fotos.length}
                </div>
              </div>
            ))
          ) : (
            <div className="local-detail__no-photos">
              <span>Sin fotos</span>
            </div>
          )}
        </div>
      </div>

      <div className="local-detail__header">
        <div>
          <span className="local-detail__tag">{local.tipo}</span>
          <h2 className="local-detail__name">{local.nombre}</h2>
        </div>
        <div className="local-detail__rating">
          ★ {local.rating}
        </div>
      </div>

      <p className="local-detail__desc">"{local.descripcion}"</p>

      {local.audioUrl && (
        <div className="local-detail__audio-section" style={{ marginTop: '1.5rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          <p className="local-detail__audio-title" style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ¿Qué se escucha aquí?
          </p>
          <audio ref={audioRef} controls controlsList="nodownload noplaybackrate" style={{ width: '100%', height: '40px' }} src={local.audioUrl}>
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
      )}

      {local.direccion && (
        <address className="local-detail__address">
          {local.direccion}
        </address>
      )}

      <div className="local-detail__actions">
        {local.web ? (
          <button
            onClick={() => window.open(local.web, '_blank')}
            className="local-detail__btn local-detail__btn--primary"
          >
            Ir a la Web
          </button>
        ) : (
          <button
            onClick={handleShare}
            className="local-detail__btn local-detail__btn--primary"
          >
            Compartir
          </button>
        )}
        <button
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${local.lat},${local.lng}`)}
          className="local-detail__btn local-detail__btn--secondary"
        >
          Cómo llegar
        </button>
      </div>
    </article>
  );
}