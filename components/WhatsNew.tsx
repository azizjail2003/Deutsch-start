"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";

export type WhatsNewItem = { icon: typeof Sparkles; title: string; body: string };

export default function WhatsNew({ open, items, onClose }: {
  open: boolean;
  items: WhatsNewItem[];
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label="What’s new" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="whatsnew-panel" ref={panelRef} tabIndex={-1}>
        <button className="confirm-x" aria-label="Close" onClick={onClose}><X size={18} /></button>
        <span className="whatsnew-badge"><Sparkles size={13} /> What’s new</span>
        <h3>Fresh ways to make the words stick</h3>
        <p className="whatsnew-sub">Your progress is safe — these upgrades just sharpen how you practise.</p>
        <ul className="whatsnew-list">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <li key={it.title}>
                <span className="whatsnew-ic"><Icon size={18} /></span>
                <span className="whatsnew-text"><strong>{it.title}</strong><small>{it.body}</small></span>
              </li>
            );
          })}
        </ul>
        <div className="confirm-actions">
          <button className="confirm-ok" onClick={onClose} autoFocus>Got it</button>
        </div>
      </div>
    </div>
  );
}
