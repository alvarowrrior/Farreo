"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShuffleIcon, ArrowRightIcon, Volume2Icon, VolumeXIcon, DicesIcon } from "lucide-react";
import Link from "next/link";
// ⚠️ URL del servidor de música en casa del amigo (DDNS con HTTPS)
const TUNNEL_URL = "https://welite.ddns.net:3001";

interface PlaylistItem {
  id: string; // "nombre_archivo.mp3"
  name: string; // "Nombre legible"
  url?: string;
  variantes?: string[];
}

function PlayerContent() {
  const searchParams = useSearchParams();
  const songParam = searchParams.get("song");
  const playlistParam = searchParams.get("playlist");

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reproductor
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<PlaylistItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPitch, setPlaybackPitch] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(true);
  const [autoRandomPitch, setAutoRandomPitch] = useState(true);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (playlistParam) {
          const plRes = await fetch(`${TUNNEL_URL}/playlist/${encodeURIComponent(playlistParam)}`);
          if (!plRes.ok) throw new Error("Error cargando la playlist. Quizá no existe.");
          const plData = await plRes.json();
          
          const mapped: PlaylistItem[] = plData.canciones.map((c: any) => ({
            id: c.id,
            name: c.name,
            url: `${TUNNEL_URL}${c.url}`,
            variantes: c.variantes
          }));

          setPlaylist(mapped);
          if (mapped.length > 0) {
            setCurrentTrack(mapped[0]); // Solo lo preseleccionamos, no intentamos hacer autoplay
          }

        } else if (songParam) {
          const songsRes = await fetch(`${TUNNEL_URL}/canciones`);
          if (!songsRes.ok) throw new Error("Error cargando base de datos de canciones");
          const songsData = await songsRes.json(); // Array de canciones
          
          const dbSong = songsData.find((c: any) => c.id === songParam);
          if (!dbSong) throw new Error("Canción no encontrada");

          const songObj: PlaylistItem = {
            id: dbSong.id,
            name: dbSong.name,
            url: `${TUNNEL_URL}${dbSong.url}`,
            variantes: dbSong.variantes
          };

          setPlaylist([songObj]);
          setCurrentTrack(songObj); // Solo preseleccionamos, para evitar el error de autoplay
        } else {
          throw new Error("No se especificó qué reproducir.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [playlistParam, songParam]);

  const playSong = (track: PlaylistItem) => {
    if (!track.url) return;

    if (currentTrack?.id === track.id) {
      if (audioRef.current) {
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
      }
      return;
    }

    let pitch = playbackPitch;
    if (autoRandomPitch) {
      pitch = Math.random() * (1.2 - 0.8) + 0.8;
      setPlaybackPitch(pitch);
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.preservesPitch = false;
        audioRef.current.playbackRate = pitch;
        audioRef.current.volume = volume;
        audioRef.current.play().catch(e => {
          console.error("Auto-play prevented (requiere interacción)", e);
          setIsPlaying(false); // Si falla, que el botón vuelva a mostrar 'Play'
        });
      }
    }, 50);
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    if (isShuffle) {
      let nextIndex = Math.floor(Math.random() * playlist.length);
      if (playlist.length > 1 && currentTrack) {
        while (playlist[nextIndex].id === currentTrack.id) {
          nextIndex = Math.floor(Math.random() * playlist.length);
        }
      }
      playSong(playlist[nextIndex]);
    } else {
      if (!currentTrack) { playSong(playlist[0]); return; }
      const idx = playlist.findIndex(t => t.id === currentTrack.id);
      const nextIdx = (idx + 1) % playlist.length;
      playSong(playlist[nextIdx]);
    }
  };

  const playPrev = () => {
    if (playlist.length === 0) return;
    if (isShuffle) {
      playNext();
    } else {
      if (!currentTrack) { playSong(playlist[playlist.length - 1]); return; }
      const idx = playlist.findIndex(t => t.id === currentTrack.id);
      const prevIdx = (idx - 1 + playlist.length) % playlist.length;
      playSong(playlist[prevIdx]);
    }
  };

  const togglePlayPause = () => {
    if (!currentTrack && playlist.length > 0) { playNext(); return; }
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  };

  const handlePitchChange = (val: number) => {
    setPlaybackPitch(val);
    if (audioRef.current) {
      audioRef.current.preservesPitch = false;
      audioRef.current.playbackRate = val;
    }
  };

  const handleSeek = (val: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (error) {
    return (
      <main className="playlist-admin" style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", padding: "2rem", background: "#282828", borderRadius: "12px" }}>
          <h2>Oops...</h2>
          <p>{error}</p>
          <Link href="/" style={{ display: "inline-block", marginTop: "1rem", color: "#1ed760" }}>Ir al inicio</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="playlist-admin">
      <div className="playlist-admin__content" style={{ paddingBottom: "120px" }}>
        <header className="playlist-admin__header">
          <div>
            <h1 className="playlist-admin__title">{playlistParam ? `Playlist: ${playlistParam}` : "Reproduciendo"}</h1>
            <p className="playlist-admin__subtitle">{playlist.length} canciones</p>
          </div>
        </header>

        <section className="playlist-admin__list">
          <div className="playlist-admin__list-header">
            <div>#</div>
            <div>Título</div>
          </div>

          {loading ? (
            <p className="playlist-admin__empty">Cargando música...</p>
          ) : playlist.length === 0 ? (
            <p className="playlist-admin__empty">No hay canciones para reproducir.</p>
          ) : (
            playlist.map((track, i) => (
              <div
                key={track.id}
                className={`playlist-admin__item ${currentTrack?.id === track.id ? "playlist-admin__item--active" : ""}`}
                onClick={() => playSong(track)}
                style={{ gridTemplateColumns: "50px 1fr" }}
              >
                <div className="playlist-admin__item-index">
                  <span className="playlist-admin__item-play-icon">▶</span>
                  <span className="playlist-admin__item-num">{i + 1}</span>
                </div>
                <div className="playlist-admin__item-info">
                  <span className="playlist-admin__item-title">{track.name}</span>
                  {track.variantes && track.variantes.length > 0 && (
                    <span className="playlist-admin__item-date">
                      {track.variantes.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Reproductor fijo */}
      <div className="playlist-admin__player">
        {/* Izquierda: Canción actual */}
        <div className="playlist-admin__now-playing">
          {currentTrack ? (
            <>
              <span className="playlist-admin__now-playing-title">{currentTrack.name}</span>
              <span className="playlist-admin__now-playing-pitch">Pitch: {playbackPitch.toFixed(2)}x</span>
            </>
          ) : (
            <span className="playlist-admin__now-playing-title" style={{ color: '#666' }}>Sin canción</span>
          )}
        </div>

        {/* Centro: Controles + Barra de progreso */}
        <div className="playlist-admin__player-center">
          <div className="playlist-admin__player-buttons">
            <button
              className={`playlist-admin__control-btn playlist-admin__control-btn--shuffle ${isShuffle ? 'playlist-admin__control-btn--active' : ''}`}
              onClick={() => setIsShuffle(v => !v)}
              title={isShuffle ? 'Aleatorio activado' : 'En orden'}
            >
              {isShuffle ? <ShuffleIcon size={16} /> : <ArrowRightIcon size={16} />}
            </button>
            <button className="playlist-admin__control-btn" onClick={playPrev}>⏮</button>
            <button className="playlist-admin__control-btn playlist-admin__control-btn--play" onClick={togglePlayPause}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button className="playlist-admin__control-btn" onClick={playNext}>⏭</button>
          </div>

          <div className="playlist-admin__progress">
            <span className="playlist-admin__progress-time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="playlist-admin__progress-bar"
            />
            <span className="playlist-admin__progress-time">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Derecha: Pitch + Volumen */}
        <div className="playlist-admin__player-right">
          <div className="playlist-admin__slider-group">
            <button
              className={`playlist-admin__control-btn playlist-admin__control-btn--pitch-toggle ${autoRandomPitch ? 'playlist-admin__control-btn--active' : ''}`}
              onClick={() => setAutoRandomPitch(v => !v)}
              title={autoRandomPitch ? 'Pitch aleatorio al cambiar canción' : 'Pitch fijo (manual)'}
            >
              <DicesIcon size={16} />
            </button>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.01}
              value={playbackPitch}
              onChange={(e) => handlePitchChange(Number(e.target.value))}
              className="playlist-admin__mini-slider"
              title={`Pitch: ${playbackPitch.toFixed(2)}x`}
            />
          </div>

          <div className="playlist-admin__slider-group">
            <button
              className="playlist-admin__control-btn"
              onClick={() => handleVolumeChange(volume > 0 ? 0 : 0.8)}
              title={volume > 0 ? 'Silenciar' : 'Restaurar volumen'}
            >
              {volume > 0 ? <Volume2Icon size={16} /> : <VolumeXIcon size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="playlist-admin__mini-slider"
              title={`Volumen: ${Math.round(volume * 100)}%`}
            />
          </div>
        </div>

        <audio
          ref={audioRef}
          src={currentTrack?.url || undefined}
          onEnded={playNext}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
              audioRef.current.volume = volume;
              audioRef.current.preservesPitch = false;
              audioRef.current.playbackRate = playbackPitch;
            }
          }}
          style={{ display: "none" }}
        />
      </div>
    </main>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div>Cargando reproductor...</div>}>
      <PlayerContent />
    </Suspense>
  );
}
