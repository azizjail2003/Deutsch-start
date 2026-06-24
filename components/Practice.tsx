"use client";

import {
  ArrowRight, Check, ChevronLeft, Keyboard, Languages, Layers, ListChecks,
  Lock, RotateCcw, Shuffle, Sparkles, Target, Trophy, Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { articleOf, deckIndexOf, FlashcardWithMeta, GermanLevel, headword, totalDecks } from "@/data/flashcards";
import {
  deckAtIndex, distractorsFor, effectiveIndex, levelsIn, loadPracticeState, masteryOf,
  playEffect, PracticeState, primeSpeech, recordResult, savePracticeState, selectSession,
  speakGerman, summarize, unlockedCards,
} from "@/lib/practice";

type Mode = "flashcards" | "choice" | "type" | "articles" | "listen" | "match";

const MODES: { id: Mode; label: string; blurb: string; icon: typeof Layers }[] = [
  { id: "flashcards", label: "Flashcards", blurb: "Flip the card and check yourself", icon: Layers },
  { id: "choice", label: "Multiple choice", blurb: "Pick the right meaning", icon: ListChecks },
  { id: "type", label: "Type it", blurb: "Write the German word", icon: Keyboard },
  { id: "articles", label: "der · die · das", blurb: "Train the noun genders", icon: Languages },
  { id: "listen", label: "Listening", blurb: "Hear it, choose the meaning", icon: Volume2 },
  { id: "match", label: "Match pairs", blurb: "Connect German and English", icon: Shuffle },
];

const SESSION_SIZE = 12;
const MATCH_GROUP = 5;

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^(der|die|das)\s+/, "")
    .replace(/[.,!?;:()„“"]/g, "")
    .replace(/\s+/g, " ")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

function looseNormalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^(der|die|das)\s+/, "")
    .replace(/[.,!?;:()„“"'-]/g, "")
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
    if (mode === "listen") speakGerman(card.de);
    if (mode === "type") window.setTimeout(() => inputRef.current?.focus(), 50);
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
            {options.map((option) => {
              const isCorrect = option === card.en;
              const state = revealed ? (isCorrect ? "correct" : option === picked ? "wrong" : "dim") : "";
              return (
                <button
                  key={option}
                  className={`option ${state}`}
                  disabled={revealed}
                  onClick={() => { setPicked(option); settle(isCorrect); }}
                >
                  {option}
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
            {(["der", "die", "das"] as const).map((a) => {
              const isCorrect = a === article;
              const state = revealed ? (isCorrect ? "correct" : a === picked ? "wrong" : "dim") : "";
              return (
                <button key={a} className={`article-choice ${state}`} disabled={revealed} onClick={() => { setPicked(a); settle(isCorrect); }}>
                  {a}
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
    return null;
  };

  return (
    <div className={`exercise ${revealed ? (outcome ? "is-correct" : "is-wrong") : ""}`}>
      <div className="exercise-meta">
        <span className="lesson-chip">{card.level} · Lektion {card.lesson}</span>
        <span className="type-chip">{card.type}</span>
      </div>
      {renderBody()}
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
export default function Practice({ focus, onFocusHandled }: {
  focus?: { level: GermanLevel; lesson: number } | null;
  onFocusHandled?: () => void;
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
  const [lessonFilter, setLessonFilter] = useState<{ level: GermanLevel; lesson: number } | null>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const streakRef = useRef(0);
  const toastIdRef = useRef(0);

  const pushToast = (text: string) => {
    const id = ++toastIdRef.current;
    setToasts((list) => [...list, { id, text }]);
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 2600);
  };

  useEffect(() => { savePracticeState(state); }, [state]);
  useEffect(() => {
    const onFirst = () => { primeSpeech(); window.removeEventListener("pointerdown", onFirst); };
    window.addEventListener("pointerdown", onFirst, { once: true });
    return () => window.removeEventListener("pointerdown", onFirst);
  }, []);
  useEffect(() => {
    if (done && session) {
      playEffect("finish");
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

  const upTo = effectiveIndex(state);
  const all = state.studiedUpTo == null;
  const allUnlocked = useMemo(() => unlockedCards(upTo), [upTo]);
  const unlockedLevels = useMemo(() => levelsIn(allUnlocked), [allUnlocked]);
  const scopedPool = useMemo(() => {
    if (lessonFilter) return allUnlocked.filter((c) => c.level === lessonFilter.level && c.lesson === lessonFilter.lesson);
    return scope === "all" ? allUnlocked : allUnlocked.filter((c) => c.level === scope);
  }, [allUnlocked, scope, lessonFilter]);
  const focusTitle = lessonFilter ? scopedPool[0]?.lessonTitle ?? "" : "";
  const summary = useMemo(() => summarize(allUnlocked, state.stats), [allUnlocked, state.stats]);

  useEffect(() => {
    if (scope !== "all" && !unlockedLevels.includes(scope)) setScope("all");
  }, [scope, unlockedLevels]);

  const nounCount = scopedPool.filter((c) => articleOf(c) != null).length;
  const modeAvailable = (m: Mode): boolean => {
    if (m === "articles") return nounCount >= 1;
    if (m === "match") return scopedPool.length >= 2;
    if (m === "choice" || m === "listen") return allUnlocked.length >= 2 && scopedPool.length >= 1;
    return scopedPool.length >= 1;
  };

  const startSession = (m: Mode, cardsOverride?: FlashcardWithMeta[]) => {
    primeSpeech();
    streakRef.current = 0;
    let base = cardsOverride ?? scopedPool;
    if (m === "articles") base = base.filter((c) => articleOf(c) != null);
    const picked = cardsOverride
      ? cardsOverride
      : selectSession(base, state.stats, m === "match" ? Math.min(MATCH_GROUP * 2, base.length) : SESSION_SIZE, weakOnly && !cardsOverride);
    const cards = m === "match" ? shuffleArray(picked) : picked;
    if (!cards.length) return;
    setMode(m); setSession(cards); setIndex(0); setCorrectCount(0); setWrongCards([]); setDone(false);
  };

  const handleResult = (id: string, correct: boolean) => {
    setState((s) => recordResult(s, id, correct));
    if (correct) setCorrectCount((c) => c + 1);
    else {
      const card = session?.find((c) => c.id === id);
      if (card) setWrongCards((w) => (w.some((x) => x.id === id) ? w : [...w, card]));
    }
    if (mode !== "match") {
      playEffect(correct ? "correct" : "wrong");
      if (correct) {
        streakRef.current += 1;
        if (streakRef.current % 5 === 0) pushToast(`${streakRef.current} in a row — stark!`);
      } else {
        streakRef.current = 0;
      }
    }
  };

  const next = () => {
    if (!session) return;
    if (index + 1 < session.length) setIndex(index + 1);
    else setDone(true);
  };

  const exit = () => { setSession(null); setMode(null); setDone(false); };

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
              <button className="btn btn-ghost" onClick={() => startSession(mode)}>New set <ArrowRight size={16} /></button>
              <button className="text-button" onClick={exit}><ChevronLeft size={15} /> Back to practice</button>
            </div>
          </div>
          <ToastHost toasts={toasts} />
        </div>
      );
    }

    const modeMeta = MODES.find((m) => m.id === mode)!;
    return (
      <div className="practice-root focus">
        <div className="session-bar">
          <button className="back-button" onClick={exit}><ChevronLeft size={18} /> Exit</button>
          <span className="session-title">{modeMeta.label}</span>
          {mode !== "match" && <span className="session-count">{index + 1} / {total}</span>}
        </div>
        {mode !== "match" && (
          <div className="session-progress"><div style={{ width: `${(index / total) * 100}%` }} /></div>
        )}
        {mode === "match" ? (
          <MatchGame cards={session} onResult={handleResult} onDone={() => setDone(true)} />
        ) : (
          <CardExercise
            key={session[index].id}
            card={session[index]}
            mode={mode}
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

      <div className="practice-note">
        <Sparkles size={16} />
        <p>Tip: set the slider to how far you’ve studied so you only drill words you’ve met. <b>Type it</b> and <b>Listening</b> build the active recall you need to actually speak.</p>
      </div>

      <SpeechCheck />
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

function SpeechCheck() {
  const [status, setStatus] = useState<string>("");
  const test = () => {
    setStatus("loading…");
    speakGerman("Hallo! Guten Tag.", (e) => {
      if (e === "start") setStatus("playing…");
      else if (e === "end") setStatus("✓ played");
      else if (e === "unsupported") setStatus("audio unavailable in this browser");
      else if (e.startsWith("error")) setStatus("using system voice…");
    });
  };
  return (
    <div className="speech-check">
      <div>
        <span className="flip-label">Audio</span>
        <p>Words are read aloud by an online German voice — no install needed.</p>
      </div>
      <div className="speech-check-actions">
        <button className="audio-button" onClick={test}><Volume2 size={15} /> Test voice</button>
        {status && <span className="speech-status">{status}</span>}
      </div>
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
