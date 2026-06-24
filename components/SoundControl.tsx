"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { playEffect } from "@/lib/practice";

export default function SoundControl({ sound, volume, onToggle, onVolume, inline = false }: {
  sound: boolean;
  volume: number;
  onToggle: () => void;
  onVolume: (v: number) => void;
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const muted = !sound || volume <= 0;
  const Icon = muted ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const panel = (
    <div className="sound-panel">
      <button
        className="sound-row-toggle"
        onClick={() => { onToggle(); if (muted) playEffect("achievement"); }}
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />} {sound ? "Sound on" : "Muted"}
      </button>
      <input
        type="range" min={0} max={100} value={Math.round(volume * 100)}
        className="volume-range" aria-label="Sound volume"
        onChange={(e) => onVolume(Number(e.target.value) / 100)}
        onPointerUp={() => playEffect("correct")}
      />
    </div>
  );

  if (inline) return <div className="sound-inline">{panel}</div>;

  return (
    <div className="sound-pop" ref={ref}>
      <button
        className={`icon-button ${open ? "active" : ""}`}
        aria-label="Sound settings"
        aria-expanded={open}
        title="Sound"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon size={18} />
      </button>
      {open && panel}
    </div>
  );
}
