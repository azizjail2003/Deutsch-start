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
  box: number; // Leitner box: 0 = relearn now, higher = longer interval
  due: number; // next-review timestamp (ms)
  lastWrong: boolean;
};

export type PracticeState = {
  // How far the learner has studied, as a curriculum index (1..totalDecks).
  // null → practise the whole course.
  studiedUpTo: number | null;
  stats: Record<string, CardStat>;
  xp: number;
  sessions: number;
  days: string[]; // ISO dates (YYYY-MM-DD) on which the learner practised
  badges: string[]; // earned badge ids
  marked: string[]; // card ids the learner flagged as "I keep forgetting this"
};

export const emptyStat: CardStat = { seen: 0, correct: 0, box: 0, due: 0, lastWrong: false };

export const initialPracticeState = (): PracticeState => ({ studiedUpTo: null, stats: {}, xp: 0, sessions: 0, days: [], badges: [], marked: [] });

export function loadPracticeState(): PracticeState {
  if (typeof window === "undefined") return initialPracticeState();
  try {
    const raw = window.localStorage.getItem(PRACTICE_STORAGE_KEY);
    if (!raw) return initialPracticeState();
    const parsed = JSON.parse(raw) as Partial<PracticeState>;
    return {
      studiedUpTo: parsed.studiedUpTo ?? null,
      stats: parsed.stats ?? {},
      xp: parsed.xp ?? 0,
      sessions: parsed.sessions ?? 0,
      days: parsed.days ?? [],
      badges: parsed.badges ?? [],
      marked: parsed.marked ?? [],
    };
  } catch {
    return initialPracticeState();
  }
}

export function getPracticeXp(): number {
  return loadPracticeState().xp;
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

const BOX_DAYS = [0, 1, 2, 4, 9, 21]; // Leitner review intervals (days)
const KNOWN_BOX = 4;
const DAY_MS = 86400000;
const XP_PER_CORRECT = 2;
// A marked ("tricky") word auto-releases once recalled correctly this many
// times in a row (box counts consecutive correct answers; a miss resets it).
export const MARK_RELEASE_BOX = 3;

export function isMarked(state: PracticeState, id: string): boolean {
  return state.marked.includes(id);
}
export function toggleMarked(state: PracticeState, id: string): PracticeState {
  const marked = state.marked.includes(id)
    ? state.marked.filter((m) => m !== id)
    : [...state.marked, id];
  return { ...state, marked };
}

function normalizeStat(stat?: Partial<CardStat> & { streak?: number }): CardStat {
  if (!stat) return { ...emptyStat };
  const box = stat.box ?? (typeof stat.streak === "number" && stat.streak >= 3 ? KNOWN_BOX : 0);
  return {
    seen: stat.seen ?? 0,
    correct: stat.correct ?? 0,
    box,
    due: stat.due ?? 0,
    lastWrong: stat.lastWrong ?? false,
  };
}

export function masteryOf(stat: CardStat | undefined): Mastery {
  const s = normalizeStat(stat);
  if (s.seen === 0) return "new";        // never practised
  if (s.lastWrong) return "learning";    // missed it most recently
  return "known";                        // answered correctly, currently recalling it
}

export function recordResult(state: PracticeState, id: string, correct: boolean): PracticeState {
  const prev = normalizeStat(state.stats[id]);
  const box = correct ? Math.min(prev.box + 1, BOX_DAYS.length - 1) : 0;
  const next: CardStat = {
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    box,
    due: Date.now() + BOX_DAYS[box] * DAY_MS,
    lastWrong: !correct,
  };
  const today = new Date().toISOString().slice(0, 10);
  const days = state.days.includes(today) ? state.days : [...state.days, today];
  // Auto-release a tricky word once it's been recalled correctly enough in a row.
  const marked = correct && box >= MARK_RELEASE_BOX && state.marked.includes(id)
    ? state.marked.filter((m) => m !== id)
    : state.marked;
  return {
    ...state,
    stats: { ...state.stats, [id]: next },
    xp: state.xp + (correct ? XP_PER_CORRECT : 0),
    days,
    marked,
  };
}

/** A previously-seen card whose scheduled review time has arrived. */
export function isDueForReview(stat: CardStat | undefined, now = Date.now()): boolean {
  const s = normalizeStat(stat);
  return s.seen > 0 && s.due <= now;
}

export function dueReviewCount(cards: FlashcardWithMeta[], stats: Record<string, CardStat>, now = Date.now()): number {
  return cards.reduce((n, c) => (isDueForReview(stats[c.id], now) ? n + 1 : n), 0);
}

/** Consecutive calendar days (ending today or yesterday) that had practice. */
export function practiceStreak(days: string[]): number {
  if (!days.length) return 0;
  const set = new Set(days);
  const d = new Date();
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  let count = 0;
  while (set.has(d.toISOString().slice(0, 10))) { count++; d.setDate(d.getDate() - 1); }
  return count;
}

/** End-of-session XP (with a small perfect-score bonus) and session count. */
export function addSessionBonus(state: PracticeState, correct: number, total: number): PracticeState {
  const perfect = total > 0 && correct === total;
  return { ...state, xp: state.xp + 10 + (perfect ? 10 : 0), sessions: state.sessions + 1 };
}

export type Badge = { id: string; name: string; hint: string };
export const BADGES: Badge[] = [
  { id: "first-session", name: "First steps", hint: "Finish a practice session" },
  { id: "fifty-known", name: "Fifty strong", hint: "Master 50 words" },
  { id: "hundred-known", name: "Centurion", hint: "Master 100 words" },
  { id: "streak-7", name: "Week warrior", hint: "Practise 7 days in a row" },
  { id: "a1-cleared", name: "A1 cleared", hint: "Master every A1 word" },
  { id: "xp-1000", name: "Thousand club", hint: "Earn 1,000 practice XP" },
];

export function earnedBadgeIds(args: { knownCount: number; a1Known: boolean; streak: number; sessions: number; xp: number }): string[] {
  const out: string[] = [];
  if (args.sessions >= 1) out.push("first-session");
  if (args.knownCount >= 50) out.push("fifty-known");
  if (args.knownCount >= 100) out.push("hundred-known");
  if (args.streak >= 7) out.push("streak-7");
  if (args.a1Known) out.push("a1-cleared");
  if (args.xp >= 1000) out.push("xp-1000");
  return out;
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
  reviewOnly = false,
  marked: string[] = [],
  markedOnly = false,
): FlashcardWithMeta[] {
  const markedSet = new Set(marked);
  if (markedOnly) {
    return shuffle(pool.filter((c) => markedSet.has(c.id))).slice(0, Math.min(count, pool.length));
  }
  let ordered: FlashcardWithMeta[];
  if (reviewOnly) {
    const now = Date.now();
    // Marked words are always considered due, so they keep coming back.
    const due = pool.filter((c) => { const s = normalizeStat(stats[c.id]); return s.seen === 0 || s.due <= now || markedSet.has(c.id); });
    due.sort((a, b) => normalizeStat(stats[a.id]).due - normalizeStat(stats[b.id]).due);
    ordered = due;
  } else {
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
    ordered = [...shuffle(wrong), ...shuffle(fresh), ...shuffle(rest)];
  }
  // Lead with up to half the session's worth of tricky words so they recur
  // often, without crowding out new and review cards entirely.
  if (markedSet.size) {
    const lead = ordered.filter((c) => markedSet.has(c.id)).slice(0, Math.max(1, Math.ceil(count / 2)));
    const leadIds = new Set(lead.map((c) => c.id));
    ordered = [...lead, ...ordered.filter((c) => !leadIds.has(c.id))];
  }
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

let primed = false;
export function primeSpeech() {
  if (primed || !isSpeechAvailable()) return;
  primed = true;
  try { window.speechSynthesis.resume(); } catch { /* ignore */ }
  refreshVoices();
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
