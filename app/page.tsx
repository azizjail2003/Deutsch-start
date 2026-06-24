"use client";

import {
  ArrowRight, ArrowUpRight, BookOpen, Check, ChevronLeft, ChevronRight, Clock, Dumbbell, Flame,
  GraduationCap, Headphones, Languages, Library, MapPin, Mic, Moon, PenLine, Play, RotateCcw, Search,
  Sparkles, Sun, Target, Trophy, X, Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  GermanLevel, lessons, lessonUrl, levels, resourcesForSkill, skills, SkillId,
  totalLessons, vocabularyUrl,
} from "@/data/german";
import { getPracticeXp, getVolume, playEffect, setSoundEnabled, setVolume, soundEnabled } from "@/lib/practice";
import {
  completedCount, currentDay, deckAtIndex, initialPlanState, isFinished, lessonIndicesForDay,
  loadPlanState, markDay, PlanState, planStreak, planUnlockedIndex, planXp, savePlanState,
  startTrack, TRACKS, trackById, unmarkDay, XP_PER_DAY,
} from "@/lib/plan";
import Practice from "@/components/Practice";
import SoundControl from "@/components/SoundControl";
import ConfirmDialog from "@/components/ConfirmDialog";

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

type View = "home" | "plan" | "lessons" | "practice" | "resources";
const NAV: [View, string][] = [["home", "Home"], ["plan", "Plan"], ["lessons", "Lessons"], ["practice", "Practice"], ["resources", "Resources"]];

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<GermanLevel | "all">("all");
  const [focus, setFocus] = useState<{ level: GermanLevel; lesson: number } | null>(null);
  const [sound, setSound] = useState(true);
  const [volume, setVolumeState] = useState(0.7);
  const [plan, setPlan] = useState<PlanState>(initialPlanState);
  const [hydrated, setHydrated] = useState(false);
  const [planToast, setPlanToast] = useState<{ day: number; xp: number } | null>(null);
  const [viewedDay, setViewedDay] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; confirmLabel: string; danger: boolean; onConfirm: () => void } | null>(null);

  useEffect(() => {
    setDark(localStorage.getItem("deutsch-start-theme") === "dark");
    setSound(soundEnabled());
    setVolumeState(getVolume());
    setPlan(loadPlanState());
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) savePlanState(plan); }, [plan, hydrated]);

  const track = trackById(plan.trackId);
  const planIndex = track ? planUnlockedIndex(plan, track) : undefined;
  const totalXp = planXp(plan) + (hydrated ? getPracticeXp() : 0);

  const choosePlan = (id: string) => { const t = trackById(id); if (t) setPlan(startTrack(t)); };
  const resetPlan = () => setConfirm({
    title: "Change your plan?",
    message: "Your day-by-day progress for this plan will be cleared. Your saved vocabulary practice and its XP aren’t affected.",
    confirmLabel: "Change plan",
    danger: true,
    onConfirm: () => { setPlan(initialPlanState()); setViewedDay(null); setConfirm(null); },
  });
  const completePlanDay = (d: number) => {
    setPlan((p) => markDay(p, d));
    playEffect("achievement");
    setPlanToast({ day: d, xp: XP_PER_DAY });
    window.setTimeout(() => setPlanToast((t) => (t && t.day === d ? null : t)), 8000);
  };
  const undoPlanDay = () => { if (planToast) { setPlan((p) => unmarkDay(p, planToast.day)); setPlanToast(null); } };
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);
  const toggleTheme = () => setDark((v) => { const n = !v; localStorage.setItem("deutsch-start-theme", n ? "dark" : "light"); return n; });
  const toggleSound = () => setSound((s) => { const n = !s; setSoundEnabled(n); return n; });
  const changeVolume = (v: number) => {
    setVolumeState(v); setVolume(v);
    if (v > 0 && !sound) { setSound(true); setSoundEnabled(true); }
  };

  const go = (v: View) => { setView(v); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };
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

  const start = lessons[0];

  return (
    <div className="app">
      <header className="site-header">
        <div className="wrap">
          <button className="brand" onClick={() => go("home")}>
            <span className="brand-mark">D</span>
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
            <button className="icon-button" aria-label="Toggle color theme" onClick={toggleTheme}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {view === "home" && (
        <main className="wrap">
          {track && (
            <button className="plan-resume" onClick={() => go("plan")}>
              <span className="plan-resume-ic"><Target size={18} /></span>
              <span className="plan-resume-text">
                <strong>{isFinished(plan, track) ? "Plan complete 🎉" : `Continue your plan · Day ${currentDay(plan, track)} of ${track.days}`}</strong>
                <small>{track.name} · {totalXp.toLocaleString()} XP · {planStreak(plan)}-day streak</small>
              </span>
              <ArrowRight size={18} />
            </button>
          )}
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
            const cur = currentDay(plan, track);
            const finished = isFinished(plan, track);
            const done = completedCount(plan);
            const pct = Math.round((done / track.days) * 100);
            const todayCount = finished ? 0 : lessonIndicesForDay(track, cur).length;
            const vDay = Math.min(Math.max(viewedDay ?? Math.min(cur, track.days), 1), track.days);
            const vLessons = lessonIndicesForDay(track, vDay);
            const vCompleted = !!plan.completions[vDay];
            const isCurrent = vDay === cur && !finished;
            const completedToday = Object.values(plan.completions).includes(new Date().toISOString().slice(0, 10));
            const vStatus = vCompleted ? "Completed" : isCurrent ? "Today" : vDay > cur ? "Upcoming" : "Day";
            return (
              <>
                <div className="page-head">
                  <span className="eyebrow"><Target size={13} /> {track.name}</span>
                  <h1>{finished ? "Plan complete — Glückwunsch!" : `Day ${cur} of ${track.days}`}</h1>
                  <p>{finished ? "You’ve worked through every scheduled day. Keep your words fresh in Practice, or start a new plan." : `${todayCount} lesson${todayCount === 1 ? "" : "s"} today · about ${track.minutesPerDay}.`}</p>
                </div>
                <div className="plan-stats">
                  <div className="pstat"><span className="pstat-ic"><Zap size={16} /></span><div><strong>{totalXp.toLocaleString()}</strong><span>XP</span></div></div>
                  <div className="pstat"><span className="pstat-ic"><Check size={16} /></span><div><strong>{done}/{track.days}</strong><span>days done</span></div></div>
                  <div className="pstat"><span className="pstat-ic"><Flame size={16} /></span><div><strong>{planStreak(plan)}</strong><span>day streak</span></div></div>
                  <div className="pstat"><span className="pstat-ic"><Trophy size={16} /></span><div><strong>{pct}%</strong><span>complete</span></div></div>
                </div>
                <div className="mastery-bar" aria-hidden="true"><div className="seg known" style={{ width: `${pct}%` }} /></div>

                <div className="today-card">
                  <div className="day-nav">
                    <button className="day-nav-btn" disabled={vDay <= 1} onClick={() => setViewedDay(vDay - 1)} aria-label="Previous day"><ChevronLeft size={18} /></button>
                    <div className="day-nav-label">
                      <span className="eyebrow">{vStatus} · Day {vDay} of {track.days}</span>
                      <strong>{vLessons.length ? `${vLessons.length} lesson${vLessons.length === 1 ? "" : "s"} · ~${track.minutesPerDay}` : "Lighter day — review your due words"}</strong>
                    </div>
                    <button className="day-nav-btn" disabled={vDay >= track.days} onClick={() => setViewedDay(vDay + 1)} aria-label="Next day"><ChevronRight size={18} /></button>
                  </div>
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
                  {isCurrent ? (
                    completedToday ? (
                      <div className="next-day-countdown"><Clock size={16} /> Done for today — next day in <Countdown /></div>
                    ) : (
                      <div className="today-actions">
                        <button className="btn btn-ghost" onClick={() => go("practice")}><Dumbbell size={16} /> Practice today’s words</button>
                        <button className="btn btn-primary" onClick={() => completePlanDay(cur)}><Check size={16} /> Mark day complete</button>
                      </div>
                    )
                  ) : (
                    <div className="day-status">{vCompleted ? <><Check size={15} /> Completed</> : vDay > cur ? "Upcoming — finish earlier days first" : "Not completed yet"}</div>
                  )}
                  {viewedDay != null && viewedDay !== cur && (
                    <button className="text-button day-back" onClick={() => setViewedDay(null)}>← Back to today</button>
                  )}
                </div>

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

      {view === "practice" && (
        <main className="wrap">
          <div className="page-head">
            <span className="eyebrow"><Dumbbell size={13} /> Vocabulary practice</span>
            <h1>Practice &amp; drills</h1>
            <p>Flashcards, multiple choice, type-it, der/die/das, listening and match pairs — on the exact words from the lessons. Set how far you’ve studied and only those words appear.</p>
          </div>
          <Practice focus={focus} onFocusHandled={() => setFocus(null)} planIndex={planIndex} />
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
            <span className="brand-mark">D</span>
            <div>
              <strong>Deutsch Start</strong>
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
