import { deckAtIndex, practiceStreak, totalDecks } from "@/lib/practice";

export type Track = {
  id: string;
  name: string;
  blurb: string;
  scope: number; // last curriculum index covered (65 = A1 only, 142 = A1→B1)
  days: number;
  lessonsLabel: string;
  minutesPerDay: string;
};

export const TRACKS: Track[] = [
  { id: "a1-30", name: "A1 Sprint", blurb: "A solid A1 foundation in about a month — the first 65 lessons.", scope: 65, days: 30, lessonsLabel: "~2 lessons/day", minutesPerDay: "45–60 min/day" },
  { id: "ab1-90", name: "A1 → B1 · 90 days", blurb: "The full 142-lesson journey to B1 at an intensive pace.", scope: totalDecks, days: 90, lessonsLabel: "1–2 lessons/day", minutesPerDay: "75–100 min/day" },
  { id: "ab1-180", name: "A1 → B1 · relaxed", blurb: "The full journey over about six months, with lighter days.", scope: totalDecks, days: 180, lessonsLabel: "~1 lesson/day", minutesPerDay: "30–40 min/day" },
];

export function trackById(id: string | null): Track | null {
  return TRACKS.find((t) => t.id === id) ?? null;
}

/** Lessons that should be completed by the end of `day` (even Bresenham spread). */
export function cumulativeByDay(track: Track, day: number): number {
  if (day <= 0) return 0;
  if (day >= track.days) return track.scope;
  return Math.floor((day * track.scope) / track.days);
}

/** Curriculum indices (1-based) scheduled for a given plan day. */
export function lessonIndicesForDay(track: Track, day: number): number[] {
  const start = cumulativeByDay(track, day - 1) + 1;
  const end = cumulativeByDay(track, day);
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

export type PlanState = {
  trackId: string | null;
  startDate: string | null;
  completions: Record<number, string>; // plan day -> ISO date completed
};

const PLAN_KEY = "deutsch-start-plan-v1";
export const initialPlanState = (): PlanState => ({ trackId: null, startDate: null, completions: {} });

export function loadPlanState(): PlanState {
  if (typeof window === "undefined") return initialPlanState();
  try {
    const raw = window.localStorage.getItem(PLAN_KEY);
    if (!raw) return initialPlanState();
    const p = JSON.parse(raw) as Partial<PlanState>;
    return { trackId: p.trackId ?? null, startDate: p.startDate ?? null, completions: p.completions ?? {} };
  } catch {
    return initialPlanState();
  }
}

export function savePlanState(s: PlanState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAN_KEY, JSON.stringify(s));
}

export const XP_PER_DAY = 50;

export function completedCount(plan: PlanState): number {
  return Object.keys(plan.completions).length;
}
export function planXp(plan: PlanState): number {
  return completedCount(plan) * XP_PER_DAY;
}
export function planStreak(plan: PlanState): number {
  return practiceStreak(Object.values(plan.completions));
}

/** First day not yet completed (or days+1 once finished). */
export function currentDay(plan: PlanState, track: Track): number {
  for (let d = 1; d <= track.days; d++) if (!plan.completions[d]) return d;
  return track.days + 1;
}
export function isFinished(plan: PlanState, track: Track): boolean {
  return currentDay(plan, track) > track.days;
}

/** Highest curriculum index the learner may practise under the plan (today inclusive). */
export function planUnlockedIndex(plan: PlanState, track: Track): number {
  const d = Math.min(currentDay(plan, track), track.days);
  return cumulativeByDay(track, d);
}

export function startTrack(track: Track): PlanState {
  return { trackId: track.id, startDate: new Date().toISOString().slice(0, 10), completions: {} };
}
export function markDay(plan: PlanState, day: number): PlanState {
  return { ...plan, completions: { ...plan.completions, [day]: new Date().toISOString().slice(0, 10) } };
}
export function unmarkDay(plan: PlanState, day: number): PlanState {
  const completions = { ...plan.completions };
  delete completions[day];
  return { ...plan, completions };
}

export { deckAtIndex };
