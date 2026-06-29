"use client";

import {
  ArrowRight, ArrowUpRight, Award, BookOpen, Check, ChevronLeft, ChevronRight, Clock, Download, Dumbbell,
  Flame, GraduationCap, HardDriveDownload, Headphones, Languages, Library, Lock, Maximize, Minimize, MapPin, Mic, Moon, Palette,
  PenLine, Play, RotateCcw, Search, Settings, Sparkles, Star, Sun, Target, Trash2, Trophy, Type, Upload,
  Volume2, X, Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GermanLevel, lessons, lessonUrl, levels, resourcesForSkill, skills, SkillId,
  totalLessons, vocabularyUrl,
} from "@/data/german";
import {
  allCards, BADGES, effectiveIndex, getPracticeXp, getVolume, initialPracticeState, loadPracticeState, masteryOf,
  playEffect, practiceStreak, PracticeState, savePracticeState, setSoundEnabled, setVolume, soundEnabled,
  speakGerman, summarize, toggleMarked,
} from "@/lib/practice";
import {
  deckAtIndex, initialPlanState, lessonIndicesForDay, loadPlanState, markDay, PlanState,
  planStatus, planUnlockedIndex, planXp, resetAnchorToToday, savePlanState, startTrack,
  TRACKS, trackById, unmarkDay, XP_PER_DAY,
} from "@/lib/plan";
import Practice from "@/components/Practice";
import SoundControl from "@/components/SoundControl";
import ConfirmDialog from "@/components/ConfirmDialog";
import Logo from "@/components/Logo";
import { clearAllData, exportBackup, importBackup, readableAccent } from "@/lib/settings";

const skillIcon: Record<SkillId, React.ComponentType<{ size?: number }>> = {
  grammar: BookOpen, vocabulary: Library, listening: Headphones,
  speaking: Mic, writing: PenLine, exam: GraduationCap,
};

function Countdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const ms = Math.max(0, midnight.getTime() - now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return <strong className="countdown">{pad(Math.floor(ms / 3600000))}:{pad(Math.floor((ms % 3600000) / 60000))}:{pad(Math.floor((ms % 60000) / 1000))}</strong>;
}

type View = "home" | "plan" | "lessons" | "dictionary" | "practice" | "progress" | "resources" | "settings";
const NAV: [View, string][] = [["home", "Home"], ["plan", "Plan"], ["lessons", "Lessons"], ["dictionary", "Dictionary"], ["practice", "Practice"], ["progress", "Progress"], ["resources", "Resources"], ["settings", "Settings"]];

const ACCENTS: { name: string; value: string }[] = [
  { name: "Gold", value: "" }, // default brand gold
  { name: "Amber", value: "#d98a23" },
  { name: "Crimson", value: "#c23b2e" },
  { name: "Forest", value: "#2f8f5b" },
  { name: "Teal", value: "#2f8f86" },
  { name: "Indigo", value: "#5b6cc4" },
  { name: "Rose", value: "#d1567f" },
];
const SCALES: { label: string; value: number }[] = [
  { label: "Compact", value: 0.9 }, { label: "Default", value: 1 },
  { label: "Large", value: 1.1 }, { label: "XL", value: 1.25 },
];

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [dark, setDark] = useState(false);
  const [accent, setAccent] = useState<string>("");
  const [uiScale, setUiScale] = useState<number>(1);
  const [practice, setPractice] = useState<PracticeState>(initialPracticeState);
  const [reviewSignal, setReviewSignal] = useState(0);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<GermanLevel | "all">("all");
  const [dictQuery, setDictQuery] = useState("");
  const [dictLevel, setDictLevel] = useState<GermanLevel | "all">("all");
  const [dictMarkedOnly, setDictMarkedOnly] = useState(false);
  const [focus, setFocus] = useState<{ level: GermanLevel; lesson: number } | null>(null);
  const [sound, setSound] = useState(true);
  const [volume, setVolumeState] = useState(0.7);
  const [plan, setPlan] = useState<PlanState>(initialPlanState);
  const [hydrated, setHydrated] = useState(false);
  const [planToast, setPlanToast] = useState<{ day: number; xp: number } | null>(null);
  const [viewedDay, setViewedDay] = useState<number | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [, setTick] = useState(0);
  const [confirm, setConfirm] = useState<{ title: string; message: string; confirmLabel: string; danger: boolean; onConfirm: () => void } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("deutsch-start-theme") === "dark");
    setAccent(localStorage.getItem("deutsch-start-accent") ?? "");
    const sc = parseFloat(localStorage.getItem("deutsch-start-scale") ?? "1");
    setUiScale(Number.isFinite(sc) ? sc : 1);
    setSound(soundEnabled());
    setVolumeState(getVolume());
    setPlan(loadPlanState());
    setPractice(loadPracticeState());
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) savePlanState(plan); }, [plan, hydrated]);
  // Keep plan status fresh across midnight, and roll the anchor (resetting the
  // streak) if a due day was missed.
  useEffect(() => {
    if (!hydrated || !plan.trackId) return;
    const check = () => {
      const t = trackById(plan.trackId);
      if (t && planStatus(plan, t).behind) setPlan((p) => resetAnchorToToday(p));
      setTick((x) => x + 1);
    };
    check();
    const id = window.setInterval(check, 30000);
    return () => window.clearInterval(id);
  }, [hydrated, plan]);

  const track = trackById(plan.trackId);
  const planIndex = track ? planUnlockedIndex(plan, track) : undefined;
  const totalXp = planXp(plan) + (hydrated ? getPracticeXp() : 0);

  const progressData = useMemo(() => {
    const stats = practice.stats;
    let seen = 0, correct = 0;
    for (const id of Object.keys(stats)) { seen += stats[id].seen; correct += stats[id].correct; }
    const accuracy = seen ? Math.round((correct / seen) * 100) : 0;
    const overall = summarize(allCards, stats);
    const byLevel = (["A1", "A2", "B1"] as const).map((lvl) => ({ lvl, ...summarize(allCards.filter((c) => c.level === lvl), stats) }));
    const weak = allCards
      .filter((c) => { const s = stats[c.id]; return s && s.seen > 0 && (s.lastWrong || s.correct / s.seen < 0.6); })
      .sort((a, b) => { const sa = stats[a.id], sb = stats[b.id]; return (sa.correct / sa.seen) - (sb.correct / sb.seen); })
      .slice(0, 12);
    const daySet = new Set(practice.days);
    const cells: { date: string; active: boolean }[] = [];
    const today = new Date();
    for (let i = 90; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      cells.push({ date: iso, active: daySet.has(iso) });
    }
    return { accuracy, seen, overall, byLevel, weak, cells, streak: practiceStreak(practice.days), daysActive: practice.days.length };
  }, [practice]);

  const choosePlan = (id: string) => { const t = trackById(id); if (t) setPlan(startTrack(t)); };
  const resetPlan = () => setConfirm({
    title: "Change your plan?",
    message: "Your day-by-day progress for this plan will be cleared. Your saved vocabulary practice and its XP aren’t affected.",
    confirmLabel: "Change plan",
    danger: true,
    onConfirm: () => { setPlan(initialPlanState()); setViewedDay(null); setShowNext(false); setConfirm(null); },
  });
  const completePlanDay = (d: number) => {
    setPlan((p) => markDay(p, d));
    setShowNext(false);
    playEffect("achievement");
    setPlanToast({ day: d, xp: XP_PER_DAY });
    window.setTimeout(() => setPlanToast((t) => (t && t.day === d ? null : t)), 8000);
  };
  const undoPlanDay = () => { if (planToast) { setPlan((p) => unmarkDay(p, planToast.day)); setPlanToast(null); } };
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);
  useEffect(() => {
    const doc = document as Document & { webkitFullscreenElement?: Element };
    const sync = () => setFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    sync();
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (accent) {
      const safe = readableAccent(accent);
      root.style.setProperty("--gold", safe);
      root.style.setProperty("--gold-soft", safe);
      root.style.setProperty("--ring", safe);
    } else {
      root.style.removeProperty("--gold");
      root.style.removeProperty("--gold-soft");
      root.style.removeProperty("--ring");
    }
  }, [accent]);
  useEffect(() => { document.documentElement.style.zoom = String(uiScale); }, [uiScale]);
  const toggleTheme = () => setDark((v) => { const n = !v; localStorage.setItem("deutsch-start-theme", n ? "dark" : "light"); return n; });
  const toggleFullscreen = () => {
    const doc = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (doc.fullscreenElement || doc.webkitFullscreenElement) (doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc);
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  };
  const changeAccent = (v: string) => { setAccent(v); localStorage.setItem("deutsch-start-accent", v); };
  const changeScale = (v: number) => { setUiScale(v); localStorage.setItem("deutsch-start-scale", String(v)); };
  const resetAppearance = () => { changeAccent(""); changeScale(1); };

  const restoreRef = useRef<HTMLInputElement>(null);
  const [dataMsg, setDataMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const downloadBackup = () => {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url; a.download = `deutsch-start-backup-${stamp}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    setDataMsg({ ok: true, text: "Backup downloaded." });
  };
  const onRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importBackup(String(reader.result));
      if (!res.ok) { setDataMsg({ ok: false, text: res.error ?? "Couldn’t restore that file." }); return; }
      setConfirm({
        title: "Backup loaded",
        message: "Your progress was restored. The app will reload to apply it.",
        confirmLabel: "Reload now",
        danger: false,
        onConfirm: () => window.location.reload(),
      });
    };
    reader.readAsText(file);
  };
  const clearData = () => setConfirm({
    title: "Erase all progress?",
    message: "This permanently deletes your plan, streak, practice history and preferences on this device. Export a backup first if you might want it back.",
    confirmLabel: "Erase everything",
    danger: true,
    onConfirm: () => { clearAllData(); window.location.reload(); },
  });
  const toggleSound = () => setSound((s) => { const n = !s; setSoundEnabled(n); return n; });
  const changeVolume = (v: number) => {
    setVolumeState(v); setVolume(v);
    if (v > 0 && !sound) { setSound(true); setSoundEnabled(true); }
  };

  const go = (v: View) => {
    if (v === "progress" || v === "dictionary") setPractice(loadPracticeState());
    setView(v);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const reviewWeak = () => { setReviewSignal((n) => n + 1); go("practice"); };
  const toggleMark = (id: string) => setPractice((p) => { const n = toggleMarked(p, id); savePracticeState(n); return n; });
  const openLevel = (lvl: GermanLevel) => { setLevelFilter(lvl); go("lessons"); };
  const practiceLesson = (l: { level: GermanLevel; number: number }) => { setFocus({ level: l.level, lesson: l.number }); go("practice"); };

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return lessons.filter((l) => {
      if (levelFilter !== "all" && l.level !== levelFilter) return false;
      if (!term) return true;
      return (
        l.title.toLowerCase().includes(term) ||
        l.grammar.toLowerCase().includes(term) ||
        l.vocabulary.toLowerCase().includes(term) ||
        `${l.level.toLowerCase()}${l.number}` === term.replace(/\s+/g, "") ||
        String(l.number) === term
      );
    });
  }, [query, levelFilter]);

  // Dictionary: every word, with lessons not yet reached shown locked.
  const reachedIndex = planIndex ?? effectiveIndex(practice);
  const markedSet = useMemo(() => new Set(practice.marked), [practice.marked]);
  const dict = useMemo(() => {
    const term = dictQuery.trim().toLowerCase();
    const rows = allCards.filter((c) => {
      if (dictMarkedOnly && !markedSet.has(c.id)) return false;
      if (dictLevel !== "all" && c.level !== dictLevel) return false;
      if (!term) return true;
      return c.de.toLowerCase().includes(term) || c.en.toLowerCase().includes(term);
    });
    const unlocked = allCards.filter((c) => c.deckIndex <= reachedIndex).length;
    const counts = (["A1", "A2", "B1"] as const).map((id) => ({ id, count: allCards.filter((c) => c.level === id).length }));
    return { rows, unlocked, counts };
  }, [dictQuery, dictLevel, dictMarkedOnly, markedSet, reachedIndex]);

  const start = lessons[0];

  return (
    <div className="app">
      <header className="site-header">
        <div className="wrap">
          <button className="brand" onClick={() => go("home")}>
            <span className="brand-mark"><Logo /></span>
            <span>Deutsch <b>Start</b></span>
          </button>
          <nav>
            {NAV.map(([v, label]) => (
              <button key={v} className={view === v ? "active" : ""} onClick={() => go(v)}>{label}</button>
            ))}
          </nav>
          <div className="header-actions">
            <span className="free-pill"><Sparkles size={13} /> 100% free</span>
            <SoundControl sound={sound} volume={volume} onToggle={toggleSound} onVolume={changeVolume} />
            <button className="icon-button" aria-label={fullscreen ? "Exit full screen" : "Enter full screen"} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            <button className="icon-button" aria-label="Toggle color theme" onClick={toggleTheme}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {view === "home" && (
        <main className="wrap">
          {track && (() => {
            const st = planStatus(plan, track);
            return (
              <button className="plan-resume" onClick={() => go("plan")}>
                <span className="plan-resume-ic"><Target size={18} /></span>
                <span className="plan-resume-text">
                  <strong>{st.finished ? "Plan complete 🎉" : st.due ? `Day ${st.currentDay} due today` : `You’re set for today · Day ${st.currentDay} next`}</strong>
                  <small>{track.name} · {totalXp.toLocaleString()} XP · {st.streak}-day streak{st.daysAhead > 0 ? ` · ${st.daysAhead} ahead` : ""}</small>
                </span>
                <ArrowRight size={18} />
              </button>
            );
          })()}
          <section className="hero">
            <div>
              <span className="eyebrow"><MapPin size={13} /> German A1 → B1</span>
              <h1>Start German<br />the <em>clear</em> way.</h1>
              <p>
                A free home base for learning German from <b>A1 to B1</b> — a structured
                {" "}{totalLessons}-lesson roadmap across three levels, paired with the best free
                resources for grammar, vocabulary, listening, speaking and writing.
              </p>
              <div className="hero-cta">
                <button className="btn btn-primary" onClick={() => go("lessons")}>Explore the lessons <ArrowRight size={18} /></button>
                <button className="btn btn-ghost" onClick={() => go("practice")}>Practice vocabulary</button>
              </div>
              <div className="hero-stats">
                <div><strong>{totalLessons}</strong><span>lessons</span></div>
                <div><strong>3</strong><span>levels · A1–B1</span></div>
                <div><strong>~900</strong><span>flashcards</span></div>
              </div>
            </div>
            <aside className="hero-card">
              <span className="eyebrow">Begin here</span>
              <h3>A1 · Lesson 1 — Greetings</h3>
              <p>The very first step: say hello, introduce the basics, and get your ear used to German sounds.</p>
              <a className="btn btn-primary" href={lessonUrl(start)} target="_blank" rel="noreferrer">
                <Play size={16} fill="currentColor" /> Open Lesson 1
              </a>
              <div className="lesson-peek">
                {lessons.slice(1, 4).map((l) => (
                  <a key={`${l.level}-${l.number}`} href={lessonUrl(l)} target="_blank" rel="noreferrer">
                    <span><b>L{l.number}</b> · {l.title}</span>
                    <ArrowUpRight size={15} />
                  </a>
                ))}
              </div>
            </aside>
          </section>

          <button className="dict-cta" onClick={() => go("dictionary")}>
            <span className="dict-cta-ic"><Library size={18} /></span>
            <span className="plan-resume-text">
              <strong>{dict.unlocked} word{dict.unlocked === 1 ? "" : "s"} unlocked</strong>
              <small>Browse your dictionary — every word you’ve reached, with its meaning, an example and audio</small>
            </span>
            <ArrowRight size={18} />
          </button>

          <section className="section">
            <div className="section-head">
              <span className="eyebrow"><MapPin size={13} /> The roadmap</span>
              <h2>Three levels, one clear path</h2>
              <p>Work from your first words to confident intermediate German. Pick a level to see its lessons.</p>
            </div>
            <div className="unit-grid">
              {levels.map((lvl) => (
                <button className="unit-card" key={lvl.id} onClick={() => openLevel(lvl.id)}>
                  <div className="unit-range">
                    <span className="unit-num">{lvl.id} · {lvl.tag}</span>
                    <span className="unit-count">{lvl.count} lessons</span>
                  </div>
                  <h3>{lvl.blurb}</h3>
                  <p>{lvl.focus}</p>
                  <span className="unit-go">View {lvl.id} lessons <ArrowRight size={15} /></span>
                </button>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <span className="eyebrow"><Sparkles size={13} /> How it works</span>
              <h2>A simple way to study</h2>
            </div>
            <div className="step-grid">
              <button className="step-card" onClick={() => go("lessons")}>
                <span className="step-no">01</span><h3>Follow the lessons</h3>
                <p>Work through the levels in order — each lesson links to its full video lesson and worksheet.</p>
                <span className="unit-go">Browse lessons <ArrowRight size={14} /></span>
              </button>
              <button className="step-card" onClick={() => go("practice")}>
                <span className="step-no">02</span><h3>Practice the words</h3>
                <p>Drill the exact vocabulary from each lesson with flashcards, typing, listening and more.</p>
                <span className="unit-go">Open practice <ArrowRight size={14} /></span>
              </button>
              <button className="step-card" onClick={() => go("resources")}>
                <span className="step-no">03</span><h3>Use the resources</h3>
                <p>One free resource per skill — grammar, listening, speaking and writing — no account needed.</p>
                <span className="unit-go">See resources <ArrowRight size={14} /></span>
              </button>
            </div>
          </section>
        </main>
      )}

      {view === "plan" && (
        <main className="wrap">
          {!track ? (
            <>
              <div className="page-head">
                <span className="eyebrow"><Target size={13} /> Study plan</span>
                <h1>Choose your pace</h1>
                <p>Pick a track that fits your time. It schedules the lessons day by day, tracks your XP and streak, and you can change it anytime.</p>
              </div>
              <div className="unit-grid">
                {TRACKS.map((t) => (
                  <button className="unit-card" key={t.id} onClick={() => choosePlan(t.id)}>
                    <div className="unit-range"><span className="unit-num">{t.days} days</span><span className="unit-count">{t.scope} lessons</span></div>
                    <h3>{t.name}</h3>
                    <p>{t.blurb}</p>
                    <p className="track-pace">{t.lessonsLabel} · {t.minutesPerDay}</p>
                    <span className="unit-go">Start this plan <ArrowRight size={15} /></span>
                  </button>
                ))}
              </div>
            </>
          ) : (() => {
            const st = planStatus(plan, track);
            const cur = st.currentDay;
            const pct = Math.round((st.completed / track.days) * 100);
            const vDay = Math.min(Math.max(viewedDay ?? Math.min(cur, track.days), 1), track.days);
            const vLessons = lessonIndicesForDay(track, vDay);
            const vCompleted = !!plan.completions[vDay];
            const viewingCurrent = vDay === cur && !st.finished;
            const showLessons = !viewingCurrent || st.finished || st.due || (st.covered && showNext);
            const vStatus = vCompleted ? "Completed" : viewingCurrent ? (st.due ? "Due today" : "Today") : vDay > cur ? "Upcoming" : "Day";
            return (
              <>
                <div className="page-head">
                  <span className="eyebrow"><Target size={13} /> {track.name}</span>
                  <h1>{st.finished ? "Plan complete — Glückwunsch!" : st.due ? `Day ${cur} — due today` : `Day ${cur} · you’re set for today`}</h1>
                  <p>{st.finished ? "You’ve finished every scheduled day. Keep your words fresh in Practice." : st.due ? "Complete it before midnight to keep your streak." : st.daysAhead > 0 ? `You’re ${st.daysAhead} day${st.daysAhead === 1 ? "" : "s"} ahead — nothing’s required today.` : "You’re done for today — come back tomorrow."}</p>
                </div>
                <div className="plan-stats">
                  <div className="pstat"><span className="pstat-ic"><Zap size={16} /></span><div><strong>{totalXp.toLocaleString()}</strong><span>XP</span></div></div>
                  <div className="pstat"><span className="pstat-ic"><Check size={16} /></span><div><strong>{st.completed}/{track.days}</strong><span>days done</span></div></div>
                  <div className="pstat"><span className="pstat-ic"><Flame size={16} /></span><div><strong>{st.streak}</strong><span>day streak</span></div></div>
                  <div className="pstat"><span className="pstat-ic"><Trophy size={16} /></span><div><strong>{pct}%</strong><span>complete</span></div></div>
                </div>
                <div className="mastery-bar" aria-hidden="true"><div className="seg known" style={{ width: `${pct}%` }} /></div>

                {st.finished ? (
                  <div className="today-card">
                    <div className="rest-msg"><Trophy size={16} /> Every day complete — keep practising to lock it in.</div>
                    <div className="rest-actions"><button className="btn btn-ghost" onClick={() => go("practice")}><Dumbbell size={16} /> Open practice</button></div>
                  </div>
                ) : (
                  <div className="today-card">
                    <div className="day-nav">
                      <button className="day-nav-btn" disabled={vDay <= 1} onClick={() => setViewedDay(vDay - 1)} aria-label="Previous day"><ChevronLeft size={18} /></button>
                      <div className="day-nav-label">
                        <span className="eyebrow">{vStatus} · Day {vDay} of {track.days}</span>
                        <strong>{vLessons.length ? `${vLessons.length} lesson${vLessons.length === 1 ? "" : "s"} · ~${track.minutesPerDay}` : "Lighter day — review your due words"}</strong>
                      </div>
                      <button className="day-nav-btn" disabled={vDay >= track.days} onClick={() => setViewedDay(vDay + 1)} aria-label="Next day"><ChevronRight size={18} /></button>
                    </div>

                    {showLessons && (
                      <div className="today-lessons">
                        {vLessons.map((idx) => {
                          const d = deckAtIndex(idx);
                          if (!d) return null;
                          return (
                            <a key={idx} href={lessonUrl({ level: d.level, number: d.lesson })} target="_blank" rel="noreferrer">
                              <span className={`lesson-level ${d.level.toLowerCase()}`}>{d.level}</span>
                              <span className="today-title">Lektion {d.lesson} · {d.title}</span>
                              <ArrowUpRight size={15} />
                            </a>
                          );
                        })}
                      </div>
                    )}

                    {viewingCurrent ? (
                      st.due ? (
                        <>
                          <div className="today-actions">
                            <button className="btn btn-ghost" onClick={() => go("practice")}><Dumbbell size={16} /> Practice today’s words</button>
                            <button className="btn btn-primary" onClick={() => completePlanDay(cur)}><Check size={16} /> Mark day complete</button>
                          </div>
                          <div className="due-line"><Clock size={16} /> Due in <Countdown /> — before midnight</div>
                        </>
                      ) : (
                        <div className="rest-block">
                          <div className="rest-msg"><Check size={16} /> All set for today{st.daysAhead > 0 ? ` — ${st.daysAhead} day${st.daysAhead === 1 ? "" : "s"} ahead` : ""}.</div>
                          <div className="due-line"><Clock size={16} /> Come back in <Countdown /></div>
                          <div className="rest-actions">
                            <button className="text-button" onClick={() => setShowNext((s) => !s)}>{showNext ? "Hide next task" : "Show next task"}</button>
                            {showNext && <button className="btn btn-primary" onClick={() => completePlanDay(cur)}><Check size={16} /> Start day {cur} now</button>}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="day-status">{vCompleted ? <><Check size={15} /> Completed</> : vDay > cur ? "Upcoming — finish earlier days first" : "Not completed yet"}</div>
                    )}

                    {viewedDay != null && viewedDay !== cur && (
                      <button className="text-button day-back" onClick={() => setViewedDay(null)}>← Back to today</button>
                    )}
                  </div>
                )}

                <button className="text-button plan-change" onClick={resetPlan}><RotateCcw size={14} /> Change plan</button>
              </>
            );
          })()}
        </main>
      )}

      {view === "lessons" && (
        <main className="wrap">
          <div className="page-head">
            <span className="eyebrow"><GraduationCap size={13} /> {totalLessons} lessons · A1–B1</span>
            <h1>Lesson explorer</h1>
            <p>Search by topic or grammar point, or filter by level. Each lesson links to its full page, and you can practise its words in one tap.</p>
          </div>
          <div className="toolbar">
            <div className="search">
              <Search size={17} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lessons — e.g. articles, Perfekt, Konjunktiv…" aria-label="Search lessons" />
            </div>
            <button className="btn btn-ghost" onClick={() => go("dictionary")}><Library size={16} /> Your dictionary</button>
          </div>
          <div className="unit-filter">
            <button className={levelFilter === "all" ? "active" : ""} onClick={() => setLevelFilter("all")}>All</button>
            {levels.map((l) => (
              <button key={l.id} className={levelFilter === l.id ? "active" : ""} onClick={() => setLevelFilter(l.id)}>
                {l.id} <span className="filter-count">{l.count}</span>
              </button>
            ))}
          </div>
          <p className="lesson-count">{filtered.length} lesson{filtered.length === 1 ? "" : "s"} shown</p>
          {filtered.length === 0 ? (
            <div className="empty">No lessons match “{query}”. Try a different word or clear the search.</div>
          ) : (
            <div className="lesson-grid">
              {filtered.map((lesson) => {
                const lessonHref = lessonUrl(lesson);
                const vocabHref = vocabularyUrl(lesson);
                const hasVocabPage = vocabHref !== lessonHref;
                return (
                  <article className="lesson-card" key={`${lesson.level}-${lesson.number}`}>
                    <span className="lesson-no">{lesson.number}</span>
                    <div className="lesson-body">
                      <div className="lesson-titrow">
                        <h4>{lesson.title}</h4>
                        <span className={`lesson-level ${lesson.level.toLowerCase()}`}>{lesson.level}</span>
                      </div>
                      <div className="lesson-meta">
                        <p><span className="lesson-tag">Grammar</span>{lesson.grammar}</p>
                        <p><span className="lesson-tag">Words</span>{lesson.vocabulary}</p>
                      </div>
                      <div className="lesson-links">
                        <a href={lessonHref} target="_blank" rel="noreferrer"><Play size={12} fill="currentColor" /> Open lesson</a>
                        {hasVocabPage && (
                          <a href={vocabHref} target="_blank" rel="noreferrer"><Library size={12} /> Vocabulary topic</a>
                        )}
                        <button className="lesson-practice" onClick={() => practiceLesson(lesson)}>
                          <Dumbbell size={12} /> Practice words
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      )}

      {view === "dictionary" && (
        <main className="wrap">
          <div className="page-head">
            <span className="eyebrow"><Library size={13} /> {dict.unlocked} of {allCards.length} words unlocked</span>
            <h1>Your dictionary</h1>
            <p>Every word in the course, with its meaning and an example. Words from lessons you’ve reached are unlocked — tap the speaker to hear any word. The rest unlock as you progress.</p>
          </div>
          <div className="toolbar">
            <div className="search">
              <Search size={17} />
              <input value={dictQuery} onChange={(e) => setDictQuery(e.target.value)} placeholder="Search a word — German or English…" aria-label="Search words" />
            </div>
          </div>
          <div className="unit-filter">
            <button className={dictLevel === "all" ? "active" : ""} onClick={() => setDictLevel("all")}>All</button>
            {dict.counts.map((l) => (
              <button key={l.id} className={dictLevel === l.id ? "active" : ""} onClick={() => setDictLevel(l.id)}>
                {l.id} <span className="filter-count">{l.count}</span>
              </button>
            ))}
            <button className={`dict-tricky-chip ${dictMarkedOnly ? "active" : ""}`} onClick={() => setDictMarkedOnly((v) => !v)} aria-pressed={dictMarkedOnly}>
              <Star size={13} /> Tricky <span className="filter-count">{practice.marked.length}</span>
            </button>
          </div>
          <p className="lesson-count">{dict.rows.length} word{dict.rows.length === 1 ? "" : "s"} shown</p>
          {dict.rows.length === 0 ? (
            <div className="empty">
              {dictMarkedOnly && !dictQuery
                ? "No tricky words yet. Tap the ☆ on any word — here or during practice — to keep seeing it until it sticks."
                : `No words match “${dictQuery}”. Try a different word or clear the search.`}
            </div>
          ) : (
            <div className="dict-list">
              {dict.rows.map((c) => {
                const locked = c.deckIndex > reachedIndex;
                return (
                  <div className={`dict-row${locked ? " locked" : ""}`} key={c.id}>
                    {locked ? (
                      <span className="dict-saylock" aria-hidden><Lock size={15} /></span>
                    ) : (
                      <button className="dict-say" onClick={() => speakGerman(c.de)} aria-label={`Hear ${c.de}`}>
                        <Volume2 size={15} />
                      </button>
                    )}
                    <div className="dict-text">
                      <div className="dict-headline">
                        <span className="dict-de">{c.de}</span>
                        {c.plural && !locked && <span className="dict-plural">pl. {c.plural}</span>}
                        <span className={`lesson-level ${c.level.toLowerCase()}`}>{c.level} · L{c.lesson}</span>
                      </div>
                      {locked ? (
                        <span className="dict-lockmsg">Unlocks at {c.level} · Lektion {c.lesson}</span>
                      ) : (
                        <>
                          <span className="dict-en">{c.en}</span>
                          {c.example && <span className="dict-ex">{c.example}{c.exampleEn ? ` — ${c.exampleEn}` : ""}</span>}
                          {c.note && <span className="dict-note">{c.note}</span>}
                        </>
                      )}
                    </div>
                    {!locked && (
                      <button
                        className={`dict-mark ${markedSet.has(c.id) ? "on" : ""}`}
                        onClick={() => toggleMark(c.id)}
                        aria-pressed={markedSet.has(c.id)}
                        title={markedSet.has(c.id) ? "On your tricky list — tap to remove" : "Mark as tricky — practise it more"}
                      >
                        <Star size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {view === "practice" && (
        <main className="wrap">
          <div className="page-head">
            <span className="eyebrow"><Dumbbell size={13} /> Vocabulary practice</span>
            <h1>Practice &amp; drills</h1>
            <p>Flashcards, multiple choice, type-it, der/die/das, listening and match pairs — on the exact words from the lessons. Set how far you’ve studied and only those words appear.</p>
          </div>
          <Practice focus={focus} onFocusHandled={() => setFocus(null)} planIndex={planIndex} reviewSignal={reviewSignal} />
        </main>
      )}

      {view === "resources" && (
        <main className="wrap">
          <div className="page-head">
            <span className="eyebrow"><BookOpen size={13} /> Free resources</span>
            <h1>Your study toolkit</h1>
            <p>German rests on five everyday skills plus steady practice. Each card points you straight to the free resources worth your time.</p>
          </div>
          <div className="skill-grid">
            {skills.map((skill) => {
              const Icon = skillIcon[skill.id];
              return (
                <article className="skill-card" key={skill.id}>
                  <span className="skill-icon"><Icon size={24} /></span>
                  <h3>{skill.name}</h3>
                  <p>{skill.tagline}</p>
                  <div className="skill-links">
                    {resourcesForSkill(skill.id).map((resource) => (
                      <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" title={resource.description}>
                        {resource.name}<ArrowUpRight className="ext" size={15} />
                      </a>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="section-head resources-tips-head">
            <span className="eyebrow"><Sparkles size={13} /> How to use this</span>
            <h2>A simple way to study</h2>
            <p>You don&apos;t need ten apps. Pick the course as your spine, add one resource per skill, and show up most days.</p>
          </div>
          <div className="tip-grid">
            <div className="tip"><span className="tip-no">01</span><h3>Follow the lessons in order</h3><p>Work through the levels one lesson at a time. Each builds on the last — resist the urge to skip ahead.</p></div>
            <div className="tip"><span className="tip-no">02</span><h3>Touch all five skills weekly</h3><p>Read the grammar, learn the words, listen to real German, say it out loud, and write a few sentences.</p></div>
            <div className="tip"><span className="tip-no">03</span><h3>Speak before you feel ready</h3><p>Record 30–60 seconds with Vocaroo and check pronunciation on YouGlish. Small, brave, daily.</p></div>
            <div className="tip"><span className="tip-no">04</span><h3>Learn nouns with their article</h3><p>Never learn <i>Tisch</i> — learn <i>der Tisch</i>, plural <i>die Tische</i>. Drill them in the Practice section&apos;s der/die/das trainer.</p></div>
            <div className="tip"><span className="tip-no">05</span><h3>Keep Duolingo as a snack</h3><p>Great for habit and streaks, but it&apos;s a supplement. The structured course stays your main meal.</p></div>
            <div className="tip"><span className="tip-no">06</span><h3>Aim for the exams</h3><p>When a level feels comfortable, try the matching Goethe model test (Start Deutsch 1 for A1) to measure real progress.</p></div>
          </div>

          <div className="about-card">
            <h3>About this project &amp; sources</h3>
            <p>Deutsch Start is a free, open companion for learning German from A1 to B1. It maps the full 142-lesson curriculum into a clear path, lets you practise the exact words from each lesson with spaced-repetition flashcards, and points you to the best free resources for every skill.</p>
            <p><b>Sources.</b> The lesson sequence and grammar/vocabulary topics follow the <a href="https://learngermanoriginal.com/" target="_blank" rel="noreferrer">Learn German Original</a> A1–B1 courses. Listening, speaking, writing and exam resources (DW Nicos Weg, Easy German, YouGlish, Vocaroo, LanguageTool, Duolingo, Goethe-Institut) are independently curated and link to their official pages. The flashcard decks are written to match each lesson&apos;s topic; pronunciation audio is generated by an online text-to-speech service.</p>
            <p><b>Disclaimer.</b> This is an independent educational project — not affiliated with or endorsed by any linked provider. All trademarks belong to their owners. Provided as is, without warranty; always verify important details with the original sources.</p>
            <p><b>Contribute.</b> Everyone is welcome. Open an issue or pull request on <a href="https://github.com/azizjail2003/Deutsch-start" target="_blank" rel="noreferrer">GitHub</a>, or email <a href="mailto:jailabdelaziz@icloud.com">Abdelaziz Jail</a>.</p>
          </div>
        </main>
      )}

      {view === "progress" && (() => {
        const pd = progressData;
        const seg = (n: number, total: number) => `${total ? (n / total) * 100 : 0}%`;
        const knownPct = pd.overall.total ? Math.round((pd.overall.knownCount / pd.overall.total) * 100) : 0;
        return (
          <main className="wrap">
            <div className="page-head">
              <span className="eyebrow"><Trophy size={13} /> Your progress</span>
              <h1>Progress</h1>
              <p>Everything you’ve built so far — mastery, your streak, and the words to shore up next.</p>
            </div>

            {pd.seen === 0 ? (
              <div className="prog-empty">
                <Sparkles size={28} />
                <h3>No practice yet</h3>
                <p>Run a practice session and your mastery, streak and weak-word list will appear here.</p>
                <button className="btn btn-primary" onClick={() => go("practice")}><Dumbbell size={17} /> Start practising</button>
              </div>
            ) : (
              <>
                <div className="prog-cards">
                  <div className="prog-stat"><span className="prog-ic"><Zap size={18} /></span><strong>{totalXp.toLocaleString()}</strong><span>total XP</span></div>
                  <div className="prog-stat"><span className="prog-ic"><Flame size={18} /></span><strong>{pd.streak}</strong><span>day streak</span></div>
                  <div className="prog-stat"><span className="prog-ic"><Check size={18} /></span><strong>{pd.overall.knownCount}</strong><span>words mastered</span></div>
                  <div className="prog-stat"><span className="prog-ic"><Target size={18} /></span><strong>{pd.accuracy}%</strong><span>accuracy</span></div>
                </div>

                <section className="prog-section">
                  <div className="prog-sec-head"><h2>Course mastery</h2><span>{pd.overall.knownCount}/{pd.overall.total} words · {knownPct}%</span></div>
                  <div className="mastery-bar big" aria-hidden="true">
                    <div className="seg known" style={{ width: seg(pd.overall.knownCount, pd.overall.total) }} />
                    <div className="seg learning" style={{ width: seg(pd.overall.learningCount, pd.overall.total) }} />
                  </div>
                  <div className="prog-levels">
                    {pd.byLevel.map((l) => (
                      <div key={l.lvl} className="prog-level">
                        <div className="prog-level-head"><strong>{l.lvl}</strong><span>{l.knownCount}/{l.total}</span></div>
                        <div className="mastery-bar" aria-hidden="true">
                          <div className="seg known" style={{ width: seg(l.knownCount, l.total) }} />
                          <div className="seg learning" style={{ width: seg(l.learningCount, l.total) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="prog-section">
                  <div className="prog-sec-head"><h2>Activity</h2><span>{pd.daysActive} day{pd.daysActive === 1 ? "" : "s"} practised</span></div>
                  <div className="heatmap">
                    {pd.cells.map((c) => <span key={c.date} className={`heat${c.active ? " on" : ""}`} title={c.date} />)}
                  </div>
                  <div className="heat-legend"><span>13 weeks ago</span><span>today</span></div>
                </section>

                {pd.weak.length > 0 && (
                  <section className="prog-section">
                    <div className="prog-sec-head">
                      <h2>Words to review</h2>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => go("dictionary")}><Library size={15} /> All words</button>
                        <button className="btn btn-primary btn-sm" onClick={reviewWeak}><RotateCcw size={15} /> Review {pd.weak.length}</button>
                      </div>
                    </div>
                    <div className="weak-list">
                      {pd.weak.map((c) => (
                        <div key={c.id} className="weak-item">
                          <strong>{c.de}</strong>
                          <span>{c.en}</span>
                          <em>{c.level} · L{c.lesson}</em>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="prog-section">
                  <div className="prog-sec-head"><h2>Badges</h2><span>{practice.badges.length}/{BADGES.length}</span></div>
                  <div className="badge-row">
                    {BADGES.map((b) => {
                      const earned = practice.badges.includes(b.id);
                      return <span key={b.id} className={`badge ${earned ? "earned" : ""}`} title={b.hint}><Award size={14} /> {b.name}</span>;
                    })}
                  </div>
                </section>
              </>
            )}
          </main>
        );
      })()}

      {view === "settings" && (
        <main className="wrap">
          <div className="page-head">
            <span className="eyebrow"><Settings size={13} /> Settings</span>
            <h1>Make it yours</h1>
            <p>Adjust the look and feel. Everything is saved on this device — no account, nothing leaves your browser.</p>
          </div>

          <div className="settings-grid">
            <section className="set-card">
              <h2><Sun size={17} /> Theme</h2>
              <p>Choose a light or dark interface.</p>
              <div className="seg">
                <button className={!dark ? "on" : ""} onClick={() => { if (dark) toggleTheme(); }}><Sun size={15} /> Light</button>
                <button className={dark ? "on" : ""} onClick={() => { if (!dark) toggleTheme(); }}><Moon size={15} /> Dark</button>
              </div>
            </section>

            <section className="set-card">
              <h2><Palette size={17} /> Accent color</h2>
              <p>The highlight used for buttons, links and progress.</p>
              <div className="swatches">
                {ACCENTS.map((a) => {
                  const on = accent === a.value;
                  return (
                    <button
                      key={a.value || "default"}
                      className={`swatch${on ? " on" : ""}`}
                      style={{ ["--sw" as string]: a.value || "#b8860b" } as React.CSSProperties}
                      onClick={() => changeAccent(a.value)}
                      aria-label={a.name}
                      title={a.name}
                    >
                      {on && <Check size={14} />}
                    </button>
                  );
                })}
                <label className="swatch swatch-custom" title="Custom color">
                  <Palette size={14} />
                  <input type="color" value={accent || "#b8860b"} onChange={(e) => changeAccent(e.target.value)} aria-label="Custom accent color" />
                </label>
              </div>
            </section>

            <section className="set-card">
              <h2><Type size={17} /> Text &amp; UI size</h2>
              <p>Scale the whole interface to taste.</p>
              <div className="seg">
                {SCALES.map((s) => (
                  <button key={s.label} className={uiScale === s.value ? "on" : ""} onClick={() => changeScale(s.value)}>{s.label}</button>
                ))}
              </div>
            </section>

            <section className="set-card">
              <h2><Volume2 size={17} /> Sound</h2>
              <p>Effects and pronunciation playback.</p>
              <SoundControl sound={sound} volume={volume} onToggle={toggleSound} onVolume={changeVolume} inline />
            </section>

            <section className="set-card set-data">
              <h2><HardDriveDownload size={17} /> Your data</h2>
              <p>Everything is stored only in this browser. Export a backup to keep it safe or move to another device.</p>
              <div className="data-actions">
                <button className="btn btn-primary" onClick={downloadBackup}><Download size={16} /> Export backup</button>
                <button className="btn btn-ghost" onClick={() => restoreRef.current?.click()}><Upload size={16} /> Restore backup</button>
                <button className="btn btn-ghost danger-ghost" onClick={clearData}><Trash2 size={16} /> Erase all</button>
                <input ref={restoreRef} type="file" accept="application/json,.json" hidden onChange={onRestoreFile} />
              </div>
              {dataMsg && <p className={`data-msg ${dataMsg.ok ? "ok" : "err"}`}>{dataMsg.ok ? <Check size={14} /> : <X size={14} />} {dataMsg.text}</p>}
            </section>

            <section className="set-card set-reset">
              <div>
                <h2><RotateCcw size={17} /> Reset appearance</h2>
                <p>Back to the default gold theme and standard size.</p>
              </div>
              <button className="btn btn-ghost" onClick={resetAppearance}><RotateCcw size={16} /> Reset</button>
            </section>
          </div>
        </main>
      )}

      {planToast && (
        <div className="day-toast" role="status">
          <span className="day-toast-msg"><Trophy size={18} /> Day {planToast.day} complete · +{planToast.xp} XP</span>
          <button className="day-toast-undo" onClick={undoPlanDay}><RotateCcw size={14} /> Undo</button>
          <button className="day-toast-x" aria-label="Dismiss" onClick={() => setPlanToast(null)}><X size={16} /></button>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={() => confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />

      <footer>
        <div className="wrap footer-grid">
          <div className="foot-brand">
            <span className="brand-mark"><Logo /></span>
            <div>
              <strong>Deutsch Start</strong>
              <span className="brand-tagline">Dein Weg zur Sprache</span>
              <p><Languages size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />Free &amp; open German A1–B1 · no account, no ads, no tracking.</p>
            </div>
          </div>
          <div className="foot-meta">
            <p>Built by <a href="mailto:jailabdelaziz@icloud.com">Abdelaziz Jail</a> · open source on <a href="https://github.com/azizjail2003/Deutsch-start" target="_blank" rel="noreferrer">GitHub</a> — contributions welcome.</p>
            <p>Lessons follow the <a href="https://learngermanoriginal.com/" target="_blank" rel="noreferrer">Learn German Original</a> A1–B1 courses; resources are independently curated. Pronunciation audio is generated by an online text-to-speech service.</p>
            <p className="foot-disclaimer">Not affiliated with or endorsed by any linked provider. Provided for educational use, as is, without warranty.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
