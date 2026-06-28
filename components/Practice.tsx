"use client";

import {
  ArrowRight, Award, Check, ChevronLeft, Ear, Flame, Keyboard, Languages, Layers, ListChecks,
  Lock, Minus, Plus, Quote, RotateCcw, Shuffle, Sparkles, Star, Target, Trophy, Volume2, X, Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { allCards, articleOf, clozeFor, deckIndexOf, FlashcardWithMeta, GermanLevel, headword, totalDecks } from "@/data/flashcards";
import {
  addSessionBonus, BADGES, deckAtIndex, distractorsFor, dueReviewCount, earnedBadgeIds,
  levelsIn, loadPracticeState, MARK_RELEASE_BOX, masteryOf, playEffect, practiceStreak, PracticeState,
  primeSpeech, recordResult, savePracticeState, selectSession, speakGerman, summarize, toggleMarked, unlockedCards,
} from "@/lib/practice";

type Mode = "flashcards" | "choice" | "type" | "articles" | "listen" | "match" | "cloze" | "dictation";

const MODES: { id: Mode; label: string; blurb: string; icon: typeof Layers }[] = [
  { id: "flashcards", label: "Flashcards", blurb: "Flip the card and check yourself", icon: Layers },
  { id: "choice", label: "Multiple choice", blurb: "Pick the right meaning", icon: ListChecks },
  { id: "type", label: "Type it", blurb: "Write the German word", icon: Keyboard },
  { id: "cloze", label: "Fill the gap", blurb: "Complete the example sentence", icon: Quote },
  { id: "dictation", label: "Dictation", blurb: "Hear it, then type it", icon: Ear },
  { id: "articles", label: "der · die · das", blurb: "Train the noun genders", icon: Languages },
  { id: "listen", label: "Listening", blurb: "Hear it, choose the meaning", icon: Volume2 },
  { id: "match", label: "Match pairs", blurb: "Connect German and English", icon: Shuffle },
];

const SESSION_SIZE = 12;
const MATCH_GROUP = 5;
// Modes that can be mixed card-by-card (match is a whole-screen game, excluded).
const MIXABLE: Mode[] = ["flashcards", "choice", "type", "cloze", "dictation", "articles", "listen"];

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // drop disambiguation labels like "(Plural)", "(formell)"
    .replace(/^(der|die|das)\s+/, "")
    .replace(/[.,!?;:()„“"…]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

function looseNormalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // drop disambiguation labels like "(Plural)", "(formell)"
    .replace(/^(der|die|das)\s+/, "")
    .replace(/[.,!?;:()„“"'…-]/g, "")
    .replace(/\s+/g, "")
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "s")
    .replace(/(.)\1+/g, "$1");
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

function evaluateTyped(typed: string, card: FlashcardWithMeta): { correct: boolean; exact: boolean } {
  const answer = typed.trim();
  if (!answer) return { correct: false, exact: false };
  const targets = [headword(card), card.de];
  const exactNorm = normalize(answer);
  if (targets.some((t) => normalize(t) === exactNorm)) return { correct: true, exact: true };
  const loose = looseNormalize(answer);
  for (const target of targets) {
    const lt = looseNormalize(target);
    if (loose === lt) return { correct: true, exact: false };
    const tolerance = lt.length >= 8 ? 2 : lt.length >= 4 ? 1 : 0;
    if (tolerance > 0 && editDistance(loose, lt) <= tolerance) return { correct: true, exact: false };
  }
  return { correct: false, exact: false };
}

function shuffleArray<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Match game
// ---------------------------------------------------------------------------
function MatchGame({ cards, onResult, onDone }: {
  cards: FlashcardWithMeta[];
  onResult: (id: string, correct: boolean) => void;
  onDone: () => void;
}) {
  const groups = useMemo(() => {
    const chunks: FlashcardWithMeta[][] = [];
    for (let i = 0; i < cards.length; i += MATCH_GROUP) chunks.push(cards.slice(i, i + MATCH_GROUP));
    return chunks;
  }, [cards]);
  const [groupIndex, setGroupIndex] = useState(0);
  const group = groups[groupIndex] ?? [];
  const left = useMemo(() => shuffleArray(group), [group]);
  const right = useMemo(() => shuffleArray(group), [group]);
  const [pickedDe, setPickedDe] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const missedRef = useRef<Set<string>>(new Set());

  useEffect(() => { setPickedDe(null); setMatched(new Set()); missedRef.current = new Set(); }, [groupIndex]);

  const finishGroup = () => {
    group.forEach((card) => onResult(card.id, !missedRef.current.has(card.id)));
    if (groupIndex + 1 < groups.length) { playEffect("achievement"); setGroupIndex(groupIndex + 1); }
    else onDone(); // last group → the session-finish sound plays instead
  };

  const onPickEnglish = (card: FlashcardWithMeta) => {
    if (!pickedDe || matched.has(card.id)) return;
    if (pickedDe === card.id) {
      playEffect("correct");
      const next = new Set(matched); next.add(card.id);
      setMatched(next); setPickedDe(null);
      if (next.size === group.length) window.setTimeout(finishGroup, 450);
    } else {
      playEffect("wrong");
      missedRef.current.add(card.id);
      missedRef.current.add(pickedDe);
      setWrongFlash(card.id);
      window.setTimeout(() => setWrongFlash(null), 450);
      setPickedDe(null);
    }
  };

  return (
    <div className="match-game">
      <p className="match-hint">Tap a German word, then its English meaning.</p>
      <div className="match-columns">
        <div className="match-col">
          {left.map((card) => (
            <button
              key={`de-${card.id}`}
              className={`match-tile ${matched.has(card.id) ? "matched" : ""} ${pickedDe === card.id ? "picked" : ""}`}
              disabled={matched.has(card.id)}
              onClick={() => setPickedDe(card.id)}
            >
              {card.de}
            </button>
          ))}
        </div>
        <div className="match-col">
          {right.map((card) => (
            <button
              key={`en-${card.id}`}
              className={`match-tile ${matched.has(card.id) ? "matched" : ""} ${wrongFlash === card.id ? "wrong" : ""}`}
              disabled={matched.has(card.id)}
              onClick={() => onPickEnglish(card)}
            >
              {card.en}
            </button>
          ))}
        </div>
      </div>
      <div className="match-progress">Group {groupIndex + 1} / {groups.length}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single-card exercises
// ---------------------------------------------------------------------------
function CardExercise({ card, mode, pool, onResult, onNext, isLast }: {
  card: FlashcardWithMeta;
  mode: Mode;
  pool: FlashcardWithMeta[];
  onResult: (correct: boolean) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [outcome, setOutcome] = useState<boolean | null>(null);
  const [typedExact, setTypedExact] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFlipped(false); setPicked(null); setTyped(""); setRevealed(false); setOutcome(null); setTypedExact(true);
    if (mode === "listen" || mode === "dictation") speakGerman(card.de);
    if (mode === "type" || mode === "cloze" || mode === "dictation") window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [card.id, mode]);

  const options = useMemo(() => {
    if (mode === "choice" || mode === "listen") return shuffleArray([card.en, ...distractorsFor(card, pool, "en", 3)]);
    return [];
  }, [card.id, mode, pool]);

  const settle = (correct: boolean) => {
    if (revealed) return;
    setOutcome(correct); setRevealed(true); onResult(correct);
  };

  const article = articleOf(card);

  // Keyboard-first drilling: 1–9 pick options, Space flips a flashcard,
  // 1/2 rate it, R (or Space in listening) replays the audio.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      if ((mode === "listen" || mode === "dictation") && (e.key === "r" || e.key === "R") && !typing) {
        e.preventDefault(); speakGerman(card.de); return;
      }
      if (mode === "listen" && e.key === " " && !typing) { e.preventDefault(); speakGerman(card.de); return; }
      if (revealed) return; // after reveal, the autofocused Next button takes Enter
      if ((mode === "choice" || mode === "listen") && /^[1-9]$/.test(e.key)) {
        const i = Number(e.key) - 1;
        if (i < options.length) { e.preventDefault(); setPicked(options[i]); settle(options[i] === card.en); }
      } else if (mode === "articles" && /^[1-3]$/.test(e.key)) {
        const a = (["der", "die", "das"] as const)[Number(e.key) - 1];
        e.preventDefault(); setPicked(a); settle(a === article);
      } else if (mode === "flashcards" && !typing) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!flipped) setFlipped(true); }
        else if (flipped && e.key === "1") { e.preventDefault(); settle(false); }
        else if (flipped && e.key === "2") { e.preventDefault(); settle(true); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, revealed, flipped, options, card.id, article]);

  const renderBody = () => {
    if (mode === "flashcards") {
      return (
        <>
          <button className={`flip-card ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
            <div className="flip-inner">
              <div className="flip-face front">
                <span className="flip-label">German</span>
                <strong>{card.de}</strong>
                {card.plural && card.type === "noun" && <small>Plural: {card.plural}</small>}
                <span className="flip-tap">Tap to flip</span>
              </div>
              <div className="flip-face back">
                <span className="flip-label">English</span>
                <strong>{card.en}</strong>
                {card.example && <small>{card.example}</small>}
                {card.exampleEn && <em>{card.exampleEn}</em>}
              </div>
            </div>
          </button>
          <button className="audio-button" onClick={(e) => { e.stopPropagation(); speakGerman(card.de); }}>
            <Volume2 size={16} /> Hear it
          </button>
          {!revealed ? (
            <div className="self-rate">
              <button className="rate again" onClick={() => settle(false)}><RotateCcw size={16} /> Still learning</button>
              <button className="rate got" onClick={() => settle(true)}><Check size={16} /> I knew it</button>
            </div>
          ) : null}
        </>
      );
    }

    if (mode === "choice" || mode === "listen") {
      return (
        <>
          {mode === "listen" ? (
            <div className="listen-prompt">
              <button className="audio-button big" onClick={() => speakGerman(card.de)}><Volume2 size={22} /> Play word</button>
              <span className="listen-hint">What does it mean?</span>
            </div>
          ) : (
            <div className="prompt-word">
              <span className="flip-label">German</span>
              <strong>{card.de}</strong>
              <button className="audio-button" onClick={() => speakGerman(card.de)}><Volume2 size={15} /> Hear it</button>
            </div>
          )}
          <div className="option-grid">
            {options.map((option, i) => {
              const isCorrect = option === card.en;
              const state = revealed ? (isCorrect ? "correct" : option === picked ? "wrong" : "dim") : "";
              return (
                <button
                  key={option}
                  className={`option ${state}`}
                  disabled={revealed}
                  onClick={() => { setPicked(option); settle(isCorrect); }}
                >
                  <span className="opt-key" aria-hidden="true">{i + 1}</span>{option}
                </button>
              );
            })}
          </div>
          {revealed && mode === "listen" && <p className="reveal-line">{card.de} — {card.en}</p>}
        </>
      );
    }

    if (mode === "type") {
      const check = () => {
        const { correct, exact } = evaluateTyped(typed, card);
        setTypedExact(exact);
        settle(correct);
      };
      return (
        <>
          <div className="prompt-word">
            <span className="flip-label">English</span>
            <strong>{card.en}</strong>
            {card.type === "noun" && <small>Type the German noun (article optional)</small>}
          </div>
          <form
            className="type-row"
            onSubmit={(e) => { e.preventDefault(); if (!revealed) check(); else onNext(); }}
          >
            <input
              ref={inputRef}
              value={typed}
              disabled={revealed}
              placeholder="Type in German…"
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {!revealed && <button type="submit" className="check-button">Check</button>}
          </form>
          {revealed && (
            <p className={`reveal-line ${outcome ? "ok" : "no"}`}>
              {outcome ? (typedExact ? "Correct!" : "Close enough — exact spelling:") : "Answer:"} <strong>{card.de}</strong>
              {card.plural && card.type === "noun" ? ` · ${card.plural}` : ""}
            </p>
          )}
        </>
      );
    }

    if (mode === "articles") {
      return (
        <>
          <div className="prompt-word">
            <span className="flip-label">Which article?</span>
            <strong>___ {headword(card)}</strong>
            <small>{card.en}</small>
          </div>
          <div className="article-row">
            {(["der", "die", "das"] as const).map((a, i) => {
              const isCorrect = a === article;
              const state = revealed ? (isCorrect ? "correct" : a === picked ? "wrong" : "dim") : "";
              return (
                <button key={a} className={`article-choice ${state}`} disabled={revealed} onClick={() => { setPicked(a); settle(isCorrect); }}>
                  <span className="opt-key" aria-hidden="true">{i + 1}</span>{a}
                </button>
              );
            })}
          </div>
          {revealed && (
            <p className={`reveal-line ${outcome ? "ok" : "no"}`}>
              {article} {headword(card)}{card.plural ? ` · ${card.plural}` : ""}
            </p>
          )}
        </>
      );
    }

    if (mode === "cloze") {
      const cloze = clozeFor(card);
      const check = () => { const { correct, exact } = evaluateTyped(typed, card); setTypedExact(exact); settle(correct); };
      return (
        <>
          <div className="prompt-word">
            <span className="flip-label">Fill the gap</span>
            <strong className="cloze-sentence">{cloze ? cloze.sentence : card.de}</strong>
            <small>{card.en}</small>
          </div>
          <form className="type-row" onSubmit={(e) => { e.preventDefault(); if (!revealed) check(); else onNext(); }}>
            <input ref={inputRef} value={typed} disabled={revealed} placeholder="Type the missing word…" onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCorrect="off" spellCheck={false} />
            {!revealed && <button type="submit" className="check-button">Check</button>}
          </form>
          {revealed && (
            <p className={`reveal-line ${outcome ? "ok" : "no"}`}>
              {outcome ? (typedExact ? "Correct! " : "Close — ") : "Answer: "}<strong>{cloze ? cloze.answer : card.de}</strong>
            </p>
          )}
        </>
      );
    }

    if (mode === "dictation") {
      const check = () => { const { correct, exact } = evaluateTyped(typed, card); setTypedExact(exact); settle(correct); };
      return (
        <>
          <div className="listen-prompt">
            <button className="audio-button big" onClick={() => speakGerman(card.de)}><Volume2 size={22} /> Play again</button>
            <span className="listen-hint">Type what you hear</span>
          </div>
          <form className="type-row" onSubmit={(e) => { e.preventDefault(); if (!revealed) check(); else onNext(); }}>
            <input ref={inputRef} value={typed} disabled={revealed} placeholder="Type in German…" onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCorrect="off" spellCheck={false} />
            {!revealed && <button type="submit" className="check-button">Check</button>}
          </form>
          {revealed && (
            <p className={`reveal-line ${outcome ? "ok" : "no"}`}>
              {outcome ? (typedExact ? "Correct! " : "Close enough — ") : "Answer: "}<strong>{card.de}</strong> — {card.en}
            </p>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <div className={`exercise ${revealed ? (outcome ? "is-correct" : "is-wrong") : ""}`}>
      <div className="exercise-meta">
        <span className="lesson-chip">{card.level} · Lektion {card.lesson}</span>
        <span className="type-chip">{card.type}</span>
      </div>
      {renderBody()}
      {!revealed && (() => {
        const hint =
          mode === "flashcards" ? "Space flips · 1 still learning · 2 knew it"
          : mode === "choice" ? "Press 1–4 to answer"
          : mode === "listen" ? "1–4 to answer · R replays"
          : mode === "articles" ? "Press 1–3"
          : mode === "dictation" ? "Enter checks · R replays"
          : "Enter to check";
        return <p className="kbd-hint" aria-hidden="true"><Keyboard size={13} /> {hint}</p>;
      })()}
      {revealed && (
        <button className="next-button" onClick={onNext} autoFocus>
          {isLast ? "Finish" : "Next"} <ArrowRight size={17} />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Practice (embedded as a page section)
// ---------------------------------------------------------------------------
export default function Practice({ focus, onFocusHandled, planIndex, reviewSignal }: {
  focus?: { level: GermanLevel; lesson: number } | null;
  onFocusHandled?: () => void;
  planIndex?: number;
  reviewSignal?: number;
}) {
  const [state, setState] = useState<PracticeState>(loadPracticeState);
  const [scope, setScope] = useState<"all" | GermanLevel>("all");
  const [weakOnly, setWeakOnly] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [session, setSession] = useState<FlashcardWithMeta[] | null>(null);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCards, setWrongCards] = useState<FlashcardWithMeta[]>([]);
  const [done, setDone] = useState(false);
  const [sessionModes, setSessionModes] = useState<Mode[] | null>(null);
  const [mixOpen, setMixOpen] = useState(false);
  const [mixSelected, setMixSelected] = useState<Set<Mode>>(() => new Set<Mode>(MIXABLE));
  const [mixCount, setMixCount] = useState(12);
  const [lessonFilter, setLessonFilter] = useState<{ level: GermanLevel; lesson: number } | null>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const streakRef = useRef(0);
  const toastIdRef = useRef(0);
  // Cards already scored this session — so stepping Back and re-answering a card
  // reviews it without counting twice.
  const answeredRef = useRef<Set<string>>(new Set());

  const pushToast = (text: string) => {
    const id = ++toastIdRef.current;
    setToasts((list) => [...list, { id, text }]);
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 2600);
  };

  useEffect(() => { savePracticeState(state); }, [state]);
  // A fresh session clears the answered set.
  useEffect(() => { answeredRef.current = new Set(); }, [session]);
  useEffect(() => {
    const onFirst = () => { primeSpeech(); window.removeEventListener("pointerdown", onFirst); };
    window.addEventListener("pointerdown", onFirst, { once: true });
    return () => window.removeEventListener("pointerdown", onFirst);
  }, []);
  useEffect(() => {
    if (done && session) {
      playEffect("finish");
      setState((s) => addSessionBonus(s, correctCount, session.length));
      const pct = Math.round((correctCount / session.length) * 100);
      pushToast(`Session done — ${correctCount}/${session.length} · ${pct}%`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  // A lesson card asked to practise a specific lesson: unlock it and focus it.
  useEffect(() => {
    if (!focus) return;
    const idx = deckIndexOf(focus.level, focus.lesson);
    if (idx > 0) {
      setState((s) => (s.studiedUpTo != null && s.studiedUpTo < idx ? { ...s, studiedUpTo: idx } : s));
      setLessonFilter({ level: focus.level, lesson: focus.lesson });
      setScope("all");
      setSession(null); setMode(null); setDone(false);
    }
    onFocusHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  // Manual slider overrides; otherwise follow the active study plan (if any);
  // otherwise the whole course.
  const upTo = state.studiedUpTo != null
    ? Math.min(Math.max(state.studiedUpTo, 0), totalDecks)
    : (planIndex ?? totalDecks);
  const all = state.studiedUpTo == null && planIndex == null;
  const allUnlocked = useMemo(() => unlockedCards(upTo), [upTo]);
  const unlockedLevels = useMemo(() => levelsIn(allUnlocked), [allUnlocked]);
  const scopedPool = useMemo(() => {
    if (lessonFilter) return allUnlocked.filter((c) => c.level === lessonFilter.level && c.lesson === lessonFilter.lesson);
    return scope === "all" ? allUnlocked : allUnlocked.filter((c) => c.level === scope);
  }, [allUnlocked, scope, lessonFilter]);
  const focusTitle = lessonFilter ? scopedPool[0]?.lessonTitle ?? "" : "";
  // Custom-mix question count is bounded by how many cards the current scope offers.
  const maxMix = Math.max(1, scopedPool.length);
  const mixPresets = useMemo(() => [6, 12, 20, 30, 50].filter((n) => n < maxMix), [maxMix]);
  useEffect(() => { setMixCount((c) => Math.min(Math.max(1, c), maxMix)); }, [maxMix]);
  const summary = useMemo(() => summarize(allUnlocked, state.stats), [allUnlocked, state.stats]);
  const globalSummary = useMemo(() => summarize(allCards, state.stats), [state.stats]);
  const streakDays = practiceStreak(state.days);
  const dueCount = useMemo(() => dueReviewCount(allUnlocked, state.stats), [allUnlocked, state.stats]);
  const trickyCards = useMemo(() => allUnlocked.filter((c) => state.marked.includes(c.id)), [allUnlocked, state.marked]);

  useEffect(() => {
    if (scope !== "all" && !unlockedLevels.includes(scope)) setScope("all");
  }, [scope, unlockedLevels]);

  // Detect and celebrate newly earned badges.
  useEffect(() => {
    const a1 = allCards.filter((c) => c.level === "A1");
    const a1Summary = summarize(a1, state.stats);
    const earned = earnedBadgeIds({
      knownCount: globalSummary.knownCount,
      a1Known: a1.length > 0 && a1Summary.knownCount === a1.length,
      streak: streakDays,
      sessions: state.sessions,
      xp: state.xp,
    });
    const fresh = earned.filter((id) => !state.badges.includes(id));
    if (fresh.length) {
      setState((s) => ({ ...s, badges: Array.from(new Set([...s.badges, ...fresh])) }));
      playEffect("achievement");
      fresh.forEach((id) => { const b = BADGES.find((x) => x.id === id); if (b) pushToast(`Badge unlocked — ${b.name}`); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.xp, state.sessions, state.stats, state.days]);

  // A "quizzable" card is a normal vocab item we can build a generated question
  // from. Reference cards — slash paradigms ("er/sie/es hat"), formulas
  // ("Partizip I = Infinitiv + -d") and bare affixes ("die Endung -st") — can't be
  // written and give themselves away in multiple choice, so they appear only as
  // flashcards.
  const quizzable = (c: FlashcardWithMeta) => {
    const h = headword(c);
    return !/[/=]/.test(h) && !/(^|\s)[-+]/.test(h);
  };
  const QUIZ_MODES: Mode[] = ["choice", "type", "dictation", "listen", "match"];
  const nounCount = scopedPool.filter((c) => articleOf(c) != null).length;
  const clozeCount = scopedPool.filter((c) => clozeFor(c) != null).length;
  const quizCount = scopedPool.filter(quizzable).length;
  const modeAvailable = (m: Mode): boolean => {
    if (m === "articles") return nounCount >= 1;
    if (m === "cloze") return clozeCount >= 1;
    if (m === "match") return quizCount >= 2;
    if (m === "choice" || m === "listen") return allUnlocked.length >= 2 && quizCount >= 1;
    if (m === "type" || m === "dictation") return quizCount >= 1;
    return scopedPool.length >= 1;
  };

  const startSession = (m: Mode, cardsOverride?: FlashcardWithMeta[], reviewOnly = false) => {
    primeSpeech();
    streakRef.current = 0;
    let base = cardsOverride ?? (reviewOnly ? allUnlocked : scopedPool);
    if (m === "articles") base = base.filter((c) => articleOf(c) != null);
    if (m === "cloze") base = base.filter((c) => clozeFor(c) != null);
    if (QUIZ_MODES.includes(m)) base = base.filter(quizzable);
    // Match shows bare word tiles, so two cards for the same word ("gut"/"gut",
    // "der"/"der (Dativ)") would be indistinguishable — keep one per word.
    if (m === "match") {
      const seen = new Set<string>();
      base = base.filter((c) => {
        const k = headword(c).toLowerCase().replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
        if (seen.has(k)) return false;
        seen.add(k); return true;
      });
    }
    const picked = cardsOverride
      ? cardsOverride
      : selectSession(base, state.stats, m === "match" ? Math.min(MATCH_GROUP * 2, base.length) : SESSION_SIZE, weakOnly && !reviewOnly, reviewOnly, state.marked);
    const cards = m === "match" ? shuffleArray(picked) : picked;
    if (!cards.length) return;
    setSessionModes(null); setMode(m); setSession(cards); setIndex(0); setCorrectCount(0); setWrongCards([]); setDone(false);
  };

  const startTricky = () => {
    if (trickyCards.length) startSession("flashcards", shuffleArray(trickyCards).slice(0, SESSION_SIZE));
  };

  // The Progress page can request a "review my weakest words" session.
  useEffect(() => {
    if (!reviewSignal) return;
    const weak = allUnlocked.filter((c) => { const s = state.stats[c.id]; return s && s.seen > 0 && (s.lastWrong || s.correct / s.seen < 0.6); });
    const pool = weak.length ? weak : allUnlocked.filter((c) => masteryOf(state.stats[c.id]) !== "known");
    if (pool.length) startSession("flashcards", shuffleArray(pool).slice(0, SESSION_SIZE));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewSignal]);

  const mixModeValid = (m: Mode, c: FlashcardWithMeta) => {
    if (m === "articles") return articleOf(c) != null;
    if (m === "cloze") return clozeFor(c) != null;
    if (QUIZ_MODES.includes(m)) return quizzable(c);
    return true;
  };
  const toggleMix = (m: Mode) => setMixSelected((s) => { const n = new Set(s); if (n.has(m)) n.delete(m); else n.add(m); return n; });
  const startMix = () => {
    primeSpeech();
    streakRef.current = 0;
    const cards = selectSession(scopedPool, state.stats, mixCount, weakOnly, false, state.marked);
    if (!cards.length || mixSelected.size === 0) return;
    const chosen = [...mixSelected];
    const modes = cards.map((c) => {
      const valid = chosen.filter((m) => mixModeValid(m, c));
      const poolM = valid.length ? valid : (["flashcards"] as Mode[]);
      return poolM[Math.floor(Math.random() * poolM.length)];
    });
    setSessionModes(modes); setMode("flashcards");
    setSession(cards); setIndex(0); setCorrectCount(0); setWrongCards([]); setDone(false); setMixOpen(false);
  };

  const handleResult = (id: string, correct: boolean) => {
    const firstTime = !answeredRef.current.has(id);
    if (firstTime) {
      answeredRef.current.add(id);
      // Detect a tricky word graduating: correct answer that reaches the release box.
      const released = correct && state.marked.includes(id) && (state.stats[id]?.box ?? 0) + 1 >= MARK_RELEASE_BOX;
      setState((s) => recordResult(s, id, correct));
      if (released) {
        const card = session?.find((c) => c.id === id);
        playEffect("achievement");
        pushToast(`Memorized${card ? ` “${card.de}”` : ""} 🎉 — off your tricky list`);
      }
      if (correct) setCorrectCount((c) => c + 1);
      else {
        const card = session?.find((c) => c.id === id);
        if (card) setWrongCards((w) => (w.some((x) => x.id === id) ? w : [...w, card]));
      }
    }
    const activeMode = sessionModes ? sessionModes[index] : mode;
    if (activeMode !== "match") {
      playEffect(correct ? "correct" : "wrong");
      if (firstTime) {
        if (correct) {
          streakRef.current += 1;
          if (streakRef.current % 5 === 0) pushToast(`${streakRef.current} in a row — stark!`);
        } else {
          streakRef.current = 0;
        }
      }
    }
  };

  const next = () => {
    if (!session) return;
    if (index + 1 < session.length) setIndex(index + 1);
    else setDone(true);
  };

  const prev = () => setIndex((i) => Math.max(0, i - 1));

  const exit = () => { setSession(null); setMode(null); setDone(false); setSessionModes(null); };

  const setUpTo = (value: number | null) => setState((s) => ({ ...s, studiedUpTo: value }));

  // ---- Active session ----
  if (session && mode) {
    const total = session.length;
    if (done) {
      const pct = total ? Math.round((correctCount / total) * 100) : 0;
      return (
        <div className="practice-root focus">
          <div className="result-card">
            <div className={`result-ring ${pct >= 80 ? "great" : pct >= 50 ? "ok" : "low"}`}>
              <Trophy size={30} /><strong>{pct}%</strong>
            </div>
            <h2>{pct >= 80 ? "Stark! Strong work." : pct >= 50 ? "Solid — keep going." : "Good effort — review and retry."}</h2>
            <p>{correctCount} of {total} correct{wrongCards.length ? ` · ${wrongCards.length} to review` : ""}.</p>
            <div className="result-actions">
              {wrongCards.length > 0 && (
                <button className="btn btn-primary" onClick={() => startSession(mode, wrongCards)}>
                  <RotateCcw size={17} /> Review the {wrongCards.length} missed
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => (sessionModes ? startMix() : startSession(mode))}>New set <ArrowRight size={16} /></button>
              <button className="text-button" onClick={exit}><ChevronLeft size={15} /> Back to practice</button>
            </div>
          </div>
          <ToastHost toasts={toasts} />
        </div>
      );
    }

    const activeMode: Mode = sessionModes ? sessionModes[index] : mode;
    const sessionTitle = sessionModes ? "Mixed practice" : MODES.find((m) => m.id === mode)!.label;
    return (
      <div className="practice-root focus">
        <div className="session-bar">
          <button className="back-button" onClick={exit}><X size={17} /> Exit</button>
          <span className="session-title">{sessionTitle}</span>
          {activeMode !== "match" && (
            <div className="session-bar-end">
              <button className="session-prev" onClick={prev} disabled={index === 0} aria-label="Previous card">
                <ChevronLeft size={15} /> Back
              </button>
              <button
                className={`mark-btn ${state.marked.includes(session[index].id) ? "on" : ""}`}
                onClick={() => setState((s) => toggleMarked(s, session[index].id))}
                aria-pressed={state.marked.includes(session[index].id)}
                title="Mark as tricky — keep practising it until it sticks"
              >
                <Star size={15} /> {state.marked.includes(session[index].id) ? "Tricky" : "Mark"}
              </button>
              <span className="session-count">{index + 1} / {total}</span>
            </div>
          )}
        </div>
        {activeMode !== "match" && (
          <div className="session-progress"><div style={{ width: `${(index / total) * 100}%` }} /></div>
        )}
        {activeMode === "match" ? (
          <MatchGame cards={session} onResult={handleResult} onDone={() => setDone(true)} />
        ) : (
          <CardExercise
            key={session[index].id}
            card={session[index]}
            mode={activeMode}
            pool={allUnlocked}
            onResult={(correct) => handleResult(session[index].id, correct)}
            onNext={next}
            isLast={index + 1 === total}
          />
        )}
        <ToastHost toasts={toasts} />
      </div>
    );
  }

  // ---- Empty (only if the learner pins the slider to 0) ----
  if (allUnlocked.length === 0) {
    return (
      <div className="practice-root">
        <div className="practice-empty">
          <Lock size={28} />
          <h3>No lessons selected</h3>
          <p>Move the slider to choose how far you’ve studied, then practise those words.</p>
          <LessonControl upTo={0} all={false} words={0} onSet={setUpTo} />
        </div>
      </div>
    );
  }

  return (
    <div className="practice-root">
      <div className="practice-stats">
        <div className="pstat"><strong>{summary.total}</strong><span>words in range</span></div>
        <div className="pstat known"><strong>{summary.knownCount}</strong><span>known</span></div>
        <div className="pstat learning"><strong>{summary.learningCount}</strong><span>learning</span></div>
        <div className="pstat new"><strong>{summary.newCount}</strong><span>new</span></div>
      </div>
      <div className="mastery-bar" aria-hidden="true">
        <div className="seg known" style={{ width: `${summary.total ? (summary.knownCount / summary.total) * 100 : 0}%` }} />
        <div className="seg learning" style={{ width: `${summary.total ? (summary.learningCount / summary.total) * 100 : 0}%` }} />
      </div>

      <div className="practice-meta">
        <span className="pmeta"><Zap size={15} /> {state.xp.toLocaleString()} XP</span>
        <span className="pmeta"><Flame size={15} /> {streakDays} day{streakDays === 1 ? "" : "s"}</span>
        <button className="review-btn" disabled={dueCount === 0} onClick={() => startSession("flashcards", undefined, true)}>
          <RotateCcw size={15} /> {dueCount > 0 ? `Review ${dueCount} due` : "All caught up"}
        </button>
        <button className="review-btn tricky" disabled={trickyCards.length === 0} onClick={startTricky}>
          <Star size={15} /> {trickyCards.length > 0 ? `Tricky ${trickyCards.length}` : "No tricky words"}
        </button>
      </div>

      <LessonControl upTo={upTo} all={all} words={allUnlocked.length} onSet={setUpTo} />

      <div className="practice-scope">
        {lessonFilter ? (
          <>
            <span className="scope-label">Practising</span>
            <span className="focus-chip">{lessonFilter.level} Lektion {lessonFilter.lesson}{focusTitle ? ` · ${focusTitle}` : ""}<button onClick={() => setLessonFilter(null)} aria-label="Clear lesson focus">✕</button></span>
          </>
        ) : (
          <>
            <span className="scope-label">Practice from</span>
            <div className="scope-chips">
              <button className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>All in range</button>
              {unlockedLevels.map((lvl) => (
                <button key={lvl} className={scope === lvl ? "active" : ""} onClick={() => setScope(lvl)}>{lvl}</button>
              ))}
            </div>
          </>
        )}
        <label className="weak-toggle">
          <input type="checkbox" checked={weakOnly} onChange={(e) => setWeakOnly(e.target.checked)} /> Focus on weak words
        </label>
      </div>

      <div className="mode-grid">
        {MODES.map((m) => {
          const Icon = m.icon;
          const available = modeAvailable(m.id);
          return (
            <button key={m.id} className={`mode-card ${available ? "" : "disabled"}`} disabled={!available} onClick={() => startSession(m.id)}>
              <span className="mode-icon"><Icon size={22} /></span>
              <div><h3>{m.label}</h3><p>{m.blurb}</p></div>
              {available ? <ArrowRight size={18} /> : <Lock size={16} />}
            </button>
          );
        })}
      </div>

      <button className="mix-toggle" onClick={() => setMixOpen((o) => !o)} aria-expanded={mixOpen}>
        <Shuffle size={16} /> {mixOpen ? "Hide custom mix" : "Build a custom mix"}
      </button>
      {mixOpen && (
        <div className="mix-builder">
          <div className="mix-section">
            <div className="mix-section-head">
              <span className="scope-label">Include exercises</span>
              <div className="mix-quick">
                <button type="button" onClick={() => setMixSelected(new Set(MIXABLE))}>Select all</button>
                <button type="button" onClick={() => setMixSelected(new Set())}>Clear</button>
              </div>
            </div>
            <div className="mix-chips">
              {MIXABLE.map((m) => {
                const meta = MODES.find((x) => x.id === m)!;
                return <button key={m} className={`mix-chip ${mixSelected.has(m) ? "on" : ""}`} onClick={() => toggleMix(m)}>{meta.label}</button>;
              })}
            </div>
          </div>
          <div className="mix-section">
            <span className="scope-label">Questions</span>
            <div className="scope-chips">
              {mixPresets.map((n) => <button key={n} className={mixCount === n ? "active" : ""} onClick={() => setMixCount(n)}>{n}</button>)}
              <button className={mixCount >= maxMix ? "active" : ""} onClick={() => setMixCount(maxMix)}>All ({maxMix})</button>
            </div>
            <div className="mix-stepper">
              <button type="button" className="mix-step" aria-label="Fewer questions" disabled={mixCount <= 1} onClick={() => setMixCount((c) => Math.max(1, c - 1))}><Minus size={15} /></button>
              <input
                type="number" min={1} max={maxMix} value={mixCount} aria-label="Number of questions"
                onChange={(e) => { const v = parseInt(e.target.value, 10); setMixCount(Number.isNaN(v) ? 1 : Math.min(maxMix, Math.max(1, v))); }}
              />
              <button type="button" className="mix-step" aria-label="More questions" disabled={mixCount >= maxMix} onClick={() => setMixCount((c) => Math.min(maxMix, c + 1))}><Plus size={15} /></button>
              <span className="mix-stepper-note">of {maxMix} available</span>
            </div>
          </div>
          <p className="mix-note">Uses your current level &amp; “focus on weak words” filters above.</p>
          <button className="btn btn-primary mix-start" disabled={mixSelected.size === 0 || scopedPool.length === 0} onClick={startMix}>
            <Shuffle size={16} /> Start mix
          </button>
        </div>
      )}

      <div className="badge-row">
        {BADGES.map((b) => {
          const earned = state.badges.includes(b.id);
          return <span key={b.id} className={`badge ${earned ? "earned" : ""}`} title={b.hint}><Award size={14} /> {b.name}</span>;
        })}
      </div>

      <div className="practice-note">
        <Sparkles size={16} />
        <p>Tip: <b>Review due</b> uses spaced repetition — words come back right before you’d forget them. <b>Fill the gap</b> and <b>Dictation</b> build the active recall you need to speak.</p>
      </div>

      <ToastHost toasts={toasts} />
    </div>
  );
}

function ToastHost({ toasts }: { toasts: { id: number; text: string }[] }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-wrap" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast"><Sparkles size={15} /> {t.text}</div>
      ))}
    </div>
  );
}

function LessonControl({ upTo, all, words, onSet }: { upTo: number; all: boolean; words: number; onSet: (v: number | null) => void }) {
  const at = deckAtIndex(upTo);
  const label = all ? "the whole course" : at ? `${at.level} Lektion ${at.lesson}` : "the start";
  return (
    <div className="lesson-control">
      <div className="lesson-control-head">
        <Target size={16} />
        <span>Studied up to <strong>{label}</strong> · {words} word{words === 1 ? "" : "s"}</span>
        {all ? <em className="auto-tag">whole course</em> : <button className="text-button" onClick={() => onSet(null)}><RotateCcw size={13} /> Practise all</button>}
      </div>
      <input
        type="range"
        min={0}
        max={totalDecks}
        value={upTo}
        onChange={(e) => onSet(Number(e.target.value))}
        aria-label="Highest lesson studied"
      />
      <div className="lesson-control-scale"><span>A1 L1</span><span>B1 L27</span></div>
    </div>
  );
}
