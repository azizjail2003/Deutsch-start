import { deckAtIndex, totalDecks } from "@/lib/practice";

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

/** Lessons completed by the end of `day` (even Bresenham spread). */
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
  anchorDate: string | null; // streak/cadence anchor (resets on a missed day)
  anchorDone: number; // completed count at the anchor
};

const PLAN_KEY = "deutsch-start-plan-v1";
const DAY_MS = 86400000;

/** Local calendar date (YYYY-MM-DD), so it lines up with the midnight countdown. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function diffDays(aISO: string, bISO: string): number {
  const a = new Date(`${aISO}T00:00:00`).getTime();
  const b = new Date(`${bISO}T00:00:00`).getTime();
  return Math.round((b - a) / DAY_MS);
}

export const initialPlanState = (): PlanState => ({ trackId: null, startDate: null, completions: {}, anchorDate: null, anchorDone: 0 });

export function loadPlanState(): PlanState {
  if (typeof window === "undefined") return initialPlanState();
  try {
    const raw = window.localStorage.getItem(PLAN_KEY);
    if (!raw) return initialPlanState();
    const p = JSON.parse(raw) as Partial<PlanState>;
    const completions = p.completions ?? {};
    return {
      trackId: p.trackId ?? null,
      startDate: p.startDate ?? null,
      completions,
      anchorDate: p.anchorDate ?? p.startDate ?? null,
      anchorDone: p.anchorDone ?? Object.keys(completions).length, // migrate: assume caught up
    };
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

/** Next lesson day to do (first not completed), or days+1 once finished. */
export function currentDay(plan: PlanState, track: Track): number {
  for (let d = 1; d <= track.days; d++) if (!plan.completions[d]) return d;
  return track.days + 1;
}
export function isFinished(plan: PlanState, track: Track): boolean {
  return currentDay(plan, track) > track.days;
}

/** Highest curriculum index the learner may practise under the plan (current day inclusive). */
export function planUnlockedIndex(plan: PlanState, track: Track): number {
  const d = Math.min(currentDay(plan, track), track.days);
  return cumulativeByDay(track, d);
}

export type PlanStatus = {
  finished: boolean;
  completed: number;
  currentDay: number;
  due: boolean; // a day is owed today (deadline = midnight)
  covered: boolean; // done/banked for today — rest
  behind: boolean; // a midnight passed uncompleted — streak should reset
  daysAhead: number; // banked buffer
  streak: number; // consecutive calendar days kept "covered"
};

export function planStatus(plan: PlanState, track: Track): PlanStatus {
  const completed = completedCount(plan);
  const finished = completed >= track.days;
  const cur = Math.min(completed + 1, track.days);
  const anchor = plan.anchorDate ?? plan.startDate ?? todayISO();
  const daysSinceAnchor = Math.max(0, diffDays(anchor, todayISO()));
  const progress = completed - (plan.anchorDone ?? 0);
  const credit = progress - daysSinceAnchor - 1; // >=0 covered/ahead, -1 due today, <=-2 behind
  const due = !finished && credit < 0;
  const covered = finished || credit >= 0;
  const behind = !finished && credit <= -2;
  const daysAhead = Math.max(0, credit);
  const streak = behind ? 0 : credit >= 0 || finished ? daysSinceAnchor + 1 : daysSinceAnchor;
  return { finished, completed, currentDay: cur, due, covered, behind, daysAhead, streak };
}

export function startTrack(track: Track): PlanState {
  const today = todayISO();
  return { trackId: track.id, startDate: today, completions: {}, anchorDate: today, anchorDone: 0 };
}
export function markDay(plan: PlanState, day: number): PlanState {
  return { ...plan, completions: { ...plan.completions, [day]: todayISO() } };
}
export function unmarkDay(plan: PlanState, day: number): PlanState {
  const completions = { ...plan.completions };
  delete completions[day];
  return { ...plan, completions };
}
/** Called when a day was missed: roll the cadence anchor to today (streak restarts). */
export function resetAnchorToToday(plan: PlanState): PlanState {
  return { ...plan, anchorDate: todayISO(), anchorDone: completedCount(plan) };
}

export { deckAtIndex };
