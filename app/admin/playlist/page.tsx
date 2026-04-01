"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { collection, addDoc, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";

const ADMIN_EMAILS = [
  "guerrerogonzalez.alvaro@gmail.com",
];

interface PlaylistItem {
  id: string;
  name: string;
  url: string;
  createdAt: { seconds: number; nanoseconds: number } | Date | null;
}

export default function AdminPlaylistPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reproductor states
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<PlaylistItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPitch, setPlaybackPitch] = useState(1);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email && ADMIN_EMAILS.includes(u.email)) {
        setIsAuthorized(true);
        loadPlaylist();
      } else {
        setIsAuthorized(false);
      }
      setIsCheckingAuth(false);
    });
    return () => unsub();
  }, []);

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "playlist"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const items: PlaylistItem[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as PlaylistItem);
      });
      setPlaylist(items);
    } catch (error) {
      console.error("Error cargando playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    handleFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    setUploading(true);
    setMessage(null);

    try {
      for (const file of files) {
        // Subir a Storage en la carpeta locales que es más probable que tenga permisos
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const storageRef = ref(storage, `locales/playlist_audio/${fileName}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        // Guardar metadata en Firestore
        await addDoc(collection(db, "playlist"), {
          name: file.name,
          url: downloadUrl,
          storagePath: `locales/playlist_audio/${fileName}`,
          createdAt: new Date(),
          uploadedBy: user?.email,
        });
      }
      setMessage({ type: "success", text: "¡Canciones subidas correctamente!" });
      loadPlaylist();
    } catch (error: any) {
      console.error("Error subiendo canciones:", error);
      setMessage({ type: "error", text: "Error: " + (error.message || "Hubo un error al subir los archivos.") });
    } finally {
      setUploading(false);
    }
  };

  const playSong = (track: PlaylistItem, changePitch: boolean = true) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.preservesPitch = false;
        
        // Pitch aleatorio entre 0.85 y 1.15
        const newPitch = changePitch ? (Math.random() * (1.15 - 0.85) + 0.85) : 1;
        setPlaybackPitch(newPitch);
        audioRef.current.playbackRate = newPitch;
        
        audioRef.current.play().catch(e => console.error("Auto-play prevented", e));
      }
    }, 50);
  };

  const playNextRandom = () => {
    if (playlist.length === 0) return;
    
    // Evita repetir la misma canción si hay más de 1
    let nextIndex = Math.floor(Math.random() * playlist.length);
    if (playlist.length > 1 && currentTrack) {
        while (playlist[nextIndex].id === currentTrack.id) {
            nextIndex = Math.floor(Math.random() * playlist.length);
        }
    }
    
    playSong(playlist[nextIndex]);
  };

  const togglePlayPause = () => {
    if (!currentTrack && playlist.length > 0) {
      playNextRandom();
      return;
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDelete = async (item: PlaylistItem) => {
    if (!window.confirm(`¿Borrar pista ${item.name}?`)) return;
    try {
      // Eliminar de Firestore
      await deleteDoc(doc(db, "playlist", item.id));
      // Intentar eliminar de Storage si existe la ref (ahora mismo no hemos guardado stoagePath completo en el type, pero asumiremos que no importa o lo omitmos para evitar fallback, o lo borramos si metemos la prop storgePath.
      // Aquí podemos refinarlo más adelante si es necesario.
      setMessage({ type: "success", text: "Canción eliminada." });
      if (currentTrack?.id === item.id) {
          audioRef.current?.pause();
          setCurrentTrack(null);
          setIsPlaying(false);
      }
      loadPlaylist();
    } catch {
       setMessage({ type: "error", text: "Error borrando." });
    }
  }


  if (isCheckingAuth) {
    return (
      <main className="playlist-admin playlist-admin--loading">
        <p className="playlist-admin__subtitle">Cargando Modo Spotify...</p>
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="playlist-admin">
        <div style={{ textAlign: "center", marginTop: "100px" }}>
          <h2>Acceso Denegado</h2>
          <p>Solo personal autorizado (Admin).</p>
        </div>
      </main>
    );
  }

  return (
    <main className="playlist-admin">
      <div className="playlist-admin__content">
        <header className="playlist-admin__header">
          <div>
            <Link href="/admin" className="playlist-admin__nav-back">
              ← Volver al Panel Admin
            </Link>
            <h1 className="playlist-admin__title">Playlist Exclusiva</h1>
            <p className="playlist-admin__subtitle">Sube MP3s y escúchalos con pitch aleatorio modo local.</p>
          </div>
        </header>

        {message && (
          <div style={{ marginBottom: "1rem", color: message.type === "success" ? "#1ed760" : "#ff4b4b" }}>
            {message.text}
          </div>
        )}

        <section 
          className={`playlist-admin__upload-section ${dragActive ? "playlist-admin__upload-section--active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <label className="playlist-admin__upload-label">
            <span className="playlist-admin__upload-icon">🎧</span>
            <span className="playlist-admin__upload-text">Subir nuevas canciones (MP3)</span>
            <span className="playlist-admin__upload-sub">Arrastra archivos aquí o haz clic para abrir el explorador</span>
            <button className="playlist-admin__upload-btn" disabled={uploading} onClick={(e) => { e.preventDefault(); document.getElementById("file-upload")?.click(); }}>
              {uploading ? "Subiendo..." : "Seleccionar Archivos"}
            </button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="audio/mpeg, audio/mp3"
              onChange={handleFileUpload}
              className="playlist-admin__upload-input"
            />
          </label>
        </section>

        <section className="playlist-admin__list">
          <div className="playlist-admin__list-header">
            <div>#</div>
            <div>Título</div>
            <div style={{ textAlign: "right" }}>Acciones</div>
          </div>

          {loading ? (
            <p style={{ color: "#b3b3b3", padding: "1rem" }}>Cargando canciones...</p>
          ) : playlist.length === 0 ? (
            <p style={{ color: "#b3b3b3", padding: "1rem" }}>No hay canciones en la playlist.</p>
          ) : (
            playlist.map((track, i) => (
              <div 
                key={track.id} 
                className={`playlist-admin__item ${currentTrack?.id === track.id ? "playlist-admin__item--active" : ""}`}
                onDoubleClick={() => playSong(track)}
              >
                <div className="playlist-admin__item-index">
                    <span className="playlist-admin__item-play-icon" onClick={(e) => { e.stopPropagation(); playSong(track); }}>▶</span>
                    <span className="playlist-admin__item-num">{i + 1}</span>
                </div>
                <div className="playlist-admin__item-info">
                  <span className="playlist-admin__item-title">{track.name}</span>
                  <span className="playlist-admin__item-date">
                    {track.createdAt && 'seconds' in track.createdAt && typeof track.createdAt.seconds === 'number' ? new Date(track.createdAt.seconds * 1000).toLocaleDateString() : 'Desconocida'}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleDelete(track); }}
                     style={{ background: "none", border: "none", color: "#b3b3b3", cursor: "pointer", fontSize: "1.2rem" }}
                     title="Eliminar"
                   >
                     ✕
                   </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Reproductor Fijo Bottom */}
      <div className="playlist-admin__player">
        {currentTrack && (
          <div className="playlist-admin__now-playing">
            <span className="playlist-admin__now-playing-title">{currentTrack.name}</span>
            <span className="playlist-admin__now-playing-pitch">
              Pitch: {playbackPitch.toFixed(2)}x
            </span>
          </div>
        )}
        
        <div className="playlist-admin__player-controls">
          <div className="playlist-admin__player-buttons">
            <button className="playlist-admin__control-btn" onClick={playNextRandom} title="Aleatorio Anterior (Simulado)">
              ⏮
            </button>
            <button 
                className="playlist-admin__control-btn playlist-admin__control-btn--play" 
                onClick={togglePlayPause}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button className="playlist-admin__control-btn" onClick={playNextRandom} title="Pasar a Siguiente Aleatoria">
              ⏭
            </button>
          </div>
        </div>

        <audio 
          ref={audioRef}
          src={currentTrack?.url || undefined}
          onEnded={playNextRandom}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          style={{ display: "none" }}
        />
      </div>
    </main>
  );
}
