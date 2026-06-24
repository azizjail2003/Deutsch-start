import {
  allCards,
  cardsUpToIndex,
  FlashcardWithMeta,
  GermanLevel,
  lessonDecks,
  totalDecks,
} from "@/data/flashcards";

export const PRACTICE_STORAGE_KEY = "deutsch-start-practice-v1";

export type CardStat = {
  seen: number;
  correct: number;
  streak: number;
  lastWrong: boolean;
};

export type PracticeState = {
  // How far the learner has studied, as a curriculum index (1..totalDecks).
  // null → practise the whole course.
  studiedUpTo: number | null;
  stats: Record<string, CardStat>;
};

export const emptyStat: CardStat = { seen: 0, correct: 0, streak: 0, lastWrong: false };

export const initialPracticeState = (): PracticeState => ({ studiedUpTo: null, stats: {} });

export function loadPracticeState(): PracticeState {
  if (typeof window === "undefined") return initialPracticeState();
  try {
    const raw = window.localStorage.getItem(PRACTICE_STORAGE_KEY);
    if (!raw) return initialPracticeState();
    const parsed = JSON.parse(raw) as Partial<PracticeState>;
    return {
      studiedUpTo: parsed.studiedUpTo ?? null,
      stats: parsed.stats ?? {},
    };
  } catch {
    return initialPracticeState();
  }
}

export function savePracticeState(state: PracticeState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(state));
}

/** The curriculum index in effect (defaults to the whole course). */
export function effectiveIndex(state: PracticeState): number {
  if (state.studiedUpTo == null) return totalDecks;
  return Math.min(Math.max(state.studiedUpTo, 0), totalDecks);
}

/** Cards unlocked up to a curriculum index. */
export function unlockedCards(maxIndex: number): FlashcardWithMeta[] {
  return cardsUpToIndex(maxIndex);
}

/** The level + lesson at a given curriculum index, for labels. */
export function deckAtIndex(index: number): { level: GermanLevel; lesson: number; title: string } | null {
  const deck = lessonDecks[index - 1];
  return deck ? { level: deck.level, lesson: deck.lesson, title: deck.title } : null;
}

/** Distinct levels present in a card set, in curriculum order. */
export function levelsIn(cards: FlashcardWithMeta[]): GermanLevel[] {
  const order: GermanLevel[] = ["A1", "A2", "B1"];
  return order.filter((level) => cards.some((c) => c.level === level));
}

export type Mastery = "new" | "learning" | "known";

export function masteryOf(stat: CardStat | undefined): Mastery {
  if (!stat || stat.seen === 0) return "new";
  if (stat.streak >= 3) return "known";
  return "learning";
}

export function recordResult(state: PracticeState, id: string, correct: boolean): PracticeState {
  const prev = state.stats[id] ?? emptyStat;
  const next: CardStat = {
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    streak: correct ? prev.streak + 1 : 0,
    lastWrong: !correct,
  };
  return { ...state, stats: { ...state.stats, [id]: next } };
}

export type MasterySummary = { total: number; knownCount: number; learningCount: number; newCount: number };

export function summarize(cards: FlashcardWithMeta[], stats: Record<string, CardStat>): MasterySummary {
  let knownCount = 0;
  let learningCount = 0;
  let newCount = 0;
  for (const card of cards) {
    const m = masteryOf(stats[card.id]);
    if (m === "known") knownCount++;
    else if (m === "learning") learningCount++;
    else newCount++;
  }
  return { total: cards.length, knownCount, learningCount, newCount };
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function selectSession(
  pool: FlashcardWithMeta[],
  stats: Record<string, CardStat>,
  count: number,
  weakOnly = false,
): FlashcardWithMeta[] {
  const source = weakOnly ? pool.filter((c) => masteryOf(stats[c.id]) !== "known") : pool;
  const wrong: FlashcardWithMeta[] = [];
  const fresh: FlashcardWithMeta[] = [];
  const rest: FlashcardWithMeta[] = [];
  for (const card of source) {
    const stat = stats[card.id];
    if (stat?.lastWrong) wrong.push(card);
    else if (!stat || stat.seen === 0) fresh.push(card);
    else rest.push(card);
  }
  const ordered = [...shuffle(wrong), ...shuffle(fresh), ...shuffle(rest)];
  return ordered.slice(0, Math.min(count, ordered.length));
}

export function distractorsFor(
  card: FlashcardWithMeta,
  pool: FlashcardWithMeta[],
  field: "en" | "de",
  howMany: number,
): string[] {
  const correct = card[field];
  const candidates = pool
    .filter((c) => c.id !== card.id && c[field] !== correct)
    .map((c) => c[field]);
  const unique = Array.from(new Set(candidates));
  return shuffle(unique).slice(0, howMany);
}

// --- Speech ----------------------------------------------------------------
let cachedVoices: SpeechSynthesisVoice[] = [];
function refreshVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const current = window.speechSynthesis.getVoices();
  if (current.length) cachedVoices = current;
  return cachedVoices;
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  try { window.speechSynthesis.addEventListener("voiceschanged", refreshVoices); } catch { /* older browsers */ }
}

export function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function hasGermanVoice(): boolean {
  return refreshVoices().some((v) => v.lang.toLowerCase().startsWith("de"));
}

let primed = false;
export function primeSpeech() {
  if (primed || !isSpeechAvailable()) return;
  primed = true;
  try { window.speechSynthesis.resume(); } catch { /* ignore */ }
  refreshVoices();
}

export type SpeechDiag = { supported: boolean; voices: number; german: string | null };

export function getSpeechDiagnostics(): SpeechDiag {
  if (!isSpeechAvailable()) return { supported: false, voices: 0, german: null };
  const voices = refreshVoices();
  const g = voices.find((v) => v.lang.toLowerCase().startsWith("de"));
  return { supported: true, voices: voices.length, german: g ? `${g.name} (${g.lang})` : null };
}

// Fallback only: the browser's local speech engine (needs an installed voice).
function speakViaSynth(text: string, onEvent?: (e: string) => void) {
  if (!isSpeechAvailable()) { onEvent?.("unsupported"); return; }
  const synth = window.speechSynthesis;
  if (synth.speaking || synth.pending) { try { synth.cancel(); } catch { /* ignore */ } }
  try { synth.resume(); } catch { /* ignore */ }
  const voices = refreshVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  const german = voices.find((v) => v.lang.toLowerCase().startsWith("de"));
  if (german) { utterance.voice = german; utterance.lang = german.lang; }
  else { utterance.lang = "de-DE"; }
  utterance.onstart = () => onEvent?.("start");
  utterance.onend = () => onEvent?.("end");
  utterance.onerror = (ev) => onEvent?.(`error:${(ev as SpeechSynthesisErrorEvent).error || "unknown"}`);
  try { synth.speak(utterance); } catch { onEvent?.("error:throw"); }
}

// Primary: a real online German voice, played through an <audio> element.
// Works even when the OS has no German voice installed. The document sets a
// no-referrer policy (see layout.tsx) so the source returns audio instead of
// 404ing on the Referer header.
let ttsAudio: HTMLAudioElement | null = null;
function ttsUrls(text: string): string[] {
  const q = encodeURIComponent(text.slice(0, 200));
  return [
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=de&client=gtx&q=${q}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=de&client=tw-ob&q=${q}`,
  ];
}

export function speakGerman(text: string, onEvent?: (e: string) => void) {
  if (typeof window === "undefined") { onEvent?.("unsupported"); return; }
  if (!ttsAudio) ttsAudio = new Audio();
  const audio = ttsAudio;
  try { audio.pause(); } catch { /* ignore */ }
  try { (audio as unknown as { referrerPolicy?: string }).referrerPolicy = "no-referrer"; } catch { /* ignore */ }
  audio.volume = soundEnabled() ? getVolume() : 0;
  const urls = ttsUrls(text);
  let i = 0;
  const tryNext = () => {
    if (i >= urls.length) { speakViaSynth(text, onEvent); return; } // all sources failed
    const url = urls[i++];
    let advanced = false;
    const fail = () => { if (!advanced) { advanced = true; tryNext(); } };
    audio.onplaying = () => onEvent?.("start");
    audio.onended = () => onEvent?.("end");
    audio.onerror = fail;
    audio.src = url;
    audio.currentTime = 0;
    const played = audio.play();
    if (played && typeof played.then === "function") {
      played.catch((err: unknown) => {
        if ((err as { name?: string } | null)?.name === "AbortError") return; // superseded
        fail();
      });
    }
  };
  tryNext();
}

// --- Local sound effects (generated with Web Audio — always work) ----------
const SOUND_KEY = "deutsch-start-sound";
export function soundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_KEY) !== "off";
}
export function setSoundEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
}
const VOLUME_KEY = "deutsch-start-volume";
export function getVolume(): number {
  if (typeof window === "undefined") return 0.7;
  const v = parseFloat(window.localStorage.getItem(VOLUME_KEY) ?? "");
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.7;
}
export function setVolume(v: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VOLUME_KEY, String(Math.min(1, Math.max(0, v))));
}
let fxCtx: AudioContext | null = null;
function fxContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctor = w.AudioContext || w.webkitAudioContext;
  if (!Ctor) return null;
  if (!fxCtx) fxCtx = new Ctor();
  return fxCtx;
}
function note(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, peak: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter(); // soften the edges for a warmer tone
  filter.type = "lowpass";
  filter.frequency.value = 3600;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}
export function playEffect(kind: "correct" | "wrong" | "finish" | "achievement") {
  if (!soundEnabled()) return;
  const vol = getVolume();
  if (vol <= 0) return;
  const c = fxContext();
  if (!c) return;
  try {
    if (c.state === "suspended") c.resume();
    const t = c.currentTime + 0.005;
    const v = (p: number) => p * vol;
    if (kind === "correct") {
      // bright bell-like chime (two ascending notes + octave shimmer)
      note(c, 784, t, 0.18, "sine", v(0.22));
      note(c, 1568, t, 0.18, "sine", v(0.05));
      note(c, 1047, t + 0.08, 0.26, "sine", v(0.20));
      note(c, 2093, t + 0.08, 0.26, "sine", v(0.04));
    } else if (kind === "wrong") {
      // gentle descending tone, not a harsh buzz
      note(c, 392, t, 0.16, "triangle", v(0.18));
      note(c, 311, t + 0.12, 0.26, "triangle", v(0.16));
    } else if (kind === "achievement") {
      // snappy triumphant rise for finishing a part (e.g. a match group)
      [587, 740, 880, 1175].forEach((f, n) => note(c, f, t + n * 0.07, 0.22, "triangle", v(0.2)));
      note(c, 1175, t + 0.3, 0.32, "sine", v(0.12));
    } else {
      // finish: ascending major arpeggio resolving to a soft chord
      [523, 659, 784, 1047].forEach((f, n) => note(c, f, t + n * 0.11, 0.26, "triangle", v(0.2)));
      [523, 659, 784].forEach((f) => note(c, f, t + 0.46, 0.55, "sine", v(0.12)));
    }
  } catch { /* ignore */ }
}

export { allCards, totalDecks };
