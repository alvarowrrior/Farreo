"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type ChatMsg = {
  id: string;
  text: string;
  uid: string;
  displayName: string;
  photoURL: string;
  createdAt?: Timestamp;
};

function Avatar({ url, name }: { url: string; name: string }) {
  const initial = (name?.trim()?.[0] ?? "U").toUpperCase();

  if (!url) {
    return (
      <div className="h-9 w-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-sm">
        {initial}
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={url}
      alt={name}
      referrerPolicy="no-referrer"
      className="h-9 w-9 rounded-full border border-white/10 object-cover"
    />
  );
}

function MsgRow({ m, meUid }: { m: ChatMsg; meUid: string }) {
  const isMe = m.uid === meUid;

  return (
    <div className={`flex items-start gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && <Avatar url={m.photoURL} name={m.displayName} />}

      <div
        className={`max-w-[80%] rounded-2xl border border-white/10 px-4 py-3 ${
          isMe ? "bg-white text-black" : "bg-white/5 text-white"
        }`}
      >
        {!isMe && (
          <div className="text-xs text-gray-300 mb-1 truncate">{m.displayName}</div>
        )}
        <div className="whitespace-pre-wrap break-words">{m.text}</div>
        <div className={`mt-2 text-[11px] ${isMe ? "text-black/60" : "text-gray-400"}`}>
          {m.createdAt ? new Date(m.createdAt.toMillis()).toLocaleString() : "enviando…"}
        </div>
      </div>

      {isMe && <Avatar url={m.photoURL} name={m.displayName} />}
    </div>
  );
}

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 1) escuchar usuario
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingUser(false);
    });
    return () => unsub();
  }, []);

  // 2) escuchar mensajes en tiempo real
  useEffect(() => {
    const q = query(
      collection(db, "globalMessages"),
      orderBy("createdAt", "desc"),
      limit(60)
    );

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data() as Omit<ChatMsg, "id">;
        return { id: d.id, ...data };
      });

      // vienen desc (últimos primero) -> los mostramos asc (antiguos -> nuevos)
      const ordered = rows.reverse();
      setMessages(ordered);

      // scroll al final
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    });

    return () => unsub();
  }, []);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      await addDoc(collection(db, "globalMessages"), {
        text: trimmed,
        uid: user.uid,
        displayName: user.displayName ?? "Usuario",
        photoURL: user.photoURL ?? "",
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      console.error(err);
      alert("No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  if (loadingUser) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-gray-300">
        Cargando…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-gray-300">
        Tienes que iniciar sesión para entrar al chat.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">Chat global 💬</h1>
      <p className="mt-1 text-sm text-gray-400">
        Estás como <span className="text-gray-200">{user.displayName ?? "Usuario"}</span>
      </p>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="h-[60vh] overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <MsgRow key={m.id} m={m} meUid={user.uid} />
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-white/10 p-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje…"
            className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-gray-500"
            maxLength={500}
          />
          <button
            disabled={sending || !text.trim()}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
