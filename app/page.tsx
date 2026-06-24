"use client";

import {
  ArrowRight, ArrowUpRight, BookOpen, Dumbbell, GraduationCap, Headphones, Languages,
  Library, MapPin, Mic, Moon, PenLine, Play, Search, Sparkles, Sun,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  GermanLevel, lessons, lessonUrl, levels, resourcesForSkill, skills, SkillId,
  totalLessons, vocabularyUrl,
} from "@/data/german";
import { getVolume, setSoundEnabled, setVolume, soundEnabled } from "@/lib/practice";
import Practice from "@/components/Practice";
import SoundControl from "@/components/SoundControl";

const skillIcon: Record<SkillId, React.ComponentType<{ size?: number }>> = {
  grammar: BookOpen, vocabulary: Library, listening: Headphones,
  speaking: Mic, writing: PenLine, exam: GraduationCap,
};

type View = "home" | "lessons" | "practice" | "resources";
const NAV: [View, string][] = [["home", "Home"], ["lessons", "Lessons"], ["practice", "Practice"], ["resources", "Resources"]];

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<GermanLevel | "all">("all");
  const [focus, setFocus] = useState<{ level: GermanLevel; lesson: number } | null>(null);
  const [sound, setSound] = useState(true);
  const [volume, setVolumeState] = useState(0.7);

  useEffect(() => {
    setDark(localStorage.getItem("deutsch-start-theme") === "dark");
    setSound(soundEnabled());
    setVolumeState(getVolume());
  }, []);
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
          <Practice focus={focus} onFocusHandled={() => setFocus(null)} />
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
        </main>
      )}

      <footer>
        <div className="wrap">
          <div className="foot-brand">
            <span className="brand-mark">D</span>
            <span>Deutsch Start — free German A1–B1 for everyone.</span>
          </div>
          <span><Languages size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />Curated free resources · no account needed</span>
        </div>
      </footer>
    </div>
  );
}
