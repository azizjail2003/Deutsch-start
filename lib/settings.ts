// Backup / restore of all on-device progress, plus an accent-contrast guard.
// Everything the app stores lives in localStorage under these keys.

export const STORAGE_KEYS = [
  "deutsch-start-plan-v1",      // study plan + streak
  "deutsch-start-practice-v1",  // SRS stats, XP, badges
  "deutsch-start-theme",        // light / dark
  "deutsch-start-accent",       // custom accent
  "deutsch-start-scale",        // UI scale
  "deutsch-start-sound",        // sound on/off
  "deutsch-start-volume",       // sound volume
] as const;

export type BackupBlob = {
  app: "deutsch-start";
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
};

export function exportBackup(): string {
  const data: Record<string, string> = {};
  if (typeof window !== "undefined") {
    for (const k of STORAGE_KEYS) {
      const v = window.localStorage.getItem(k);
      if (v != null) data[k] = v;
    }
  }
  const blob: BackupBlob = { app: "deutsch-start", version: 1, exportedAt: new Date().toISOString(), data };
  return JSON.stringify(blob, null, 2);
}

export function importBackup(text: string): { ok: boolean; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn’t valid JSON." };
  }
  const blob = parsed as Partial<BackupBlob>;
  if (!blob || blob.app !== "deutsch-start" || typeof blob.data !== "object" || !blob.data) {
    return { ok: false, error: "This doesn’t look like a Deutsch Start backup." };
  }
  let wrote = 0;
  for (const k of STORAGE_KEYS) {
    const v = (blob.data as Record<string, unknown>)[k];
    if (typeof v === "string") { window.localStorage.setItem(k, v); wrote++; }
  }
  if (!wrote) return { ok: false, error: "The backup had no recognisable data." };
  return { ok: true };
}

export function clearAllData() {
  if (typeof window === "undefined") return;
  for (const k of STORAGE_KEYS) window.localStorage.removeItem(k);
}

// --- Accent contrast guard -------------------------------------------------
// A custom accent must read as text on BOTH the light (#f4f4f1) and dark
// (#121316) surfaces, since the override applies to both themes. We keep its
// lightness in a mid band and ensure enough saturation so it never washes out.

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c);
  };
  return "#" + [f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Nudge an accent into a band that stays legible on light and dark surfaces. */
export function readableAccent(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [h, s0, l0] = rgbToHsl(...rgb);
  const s = Math.max(s0, 0.38);
  const l = Math.min(0.56, Math.max(0.34, l0));
  return hslToHex(h, s, l);
}
