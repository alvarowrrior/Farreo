"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import MapNearMe from "@/components/MapNearMe";
import type { Local } from "@/lib/locales";

type SheetSnap = "closed" | "mid" | "full";

export default function BuscarPage() {
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);
  const [snap, setSnap] = useState<SheetSnap>("closed");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const footer = document.querySelector("footer");
    if (footer) footer.style.display = "none";
    return () => {
      document.body.style.overflow = "auto";
      if (footer) footer.style.display = "block";
    };
  }, []);

  useEffect(() => {
    if (selectedLocal) setSnap("mid");
  }, [selectedLocal]);

  const title = useMemo(() => selectedLocal ? selectedLocal.nombre : "Cerca de ti", [selectedLocal]);

  return (
    <main className="buscar-page">
      <div className="map-view">
        <MapNearMe onSelectLocal={setSelectedLocal} />
      </div>

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

function BottomSheet({ snap, onSnapChange, onClose, title, children }: any) {
  const getTranslation = () => {
    if (snap === "full") return "10vh";
    if (snap === "mid") return "65vh"; // Ajustado para ver mejor el mapa arriba
    return "110vh";
  };

  return (
    <div className="bottom-sheet">
      <div
        className="bottom-sheet__panel"
        style={{ transform: `translateY(${getTranslation()})` }}
      >
        <div className="bottom-sheet__header" onClick={() => onSnapChange(snap === "mid" ? "full" : "mid")}>
          <div className="bottom-sheet__drag-handle" />
          <div className="bottom-sheet__title-row">
            <h1 className="bottom-sheet__title">{title}</h1>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="bottom-sheet__close-btn">✕</button>
          </div>
        </div>
        <div className={`bottom-sheet__content ${snap === "full" ? "bottom-sheet__content--scrollable" : "bottom-sheet__content--hidden"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

function PanelContent({ local }: { local: Local }) {
  return (
    <article className="local-detail">
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
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎵</span> ¿Qué se escucha aquí?
          </p>
          <audio controls controlsList="nodownload noplaybackrate" style={{ width: '100%', height: '40px' }} src={local.audioUrl}>
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
      )}

      {local.direccion && (
        <div className="local-detail__address">
          <span className="local-detail__address-icon">📍</span>
          <span className="local-detail__address-text">{local.direccion}</span>
        </div>
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
          <button className="local-detail__btn local-detail__btn--primary">
            Reservar
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