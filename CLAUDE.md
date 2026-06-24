# CLAUDE.md — Deutsch Start

Project context for AI coding assistants. Read this before making changes.

## What this is

**Deutsch Start** is a free, open web app for learning German from **A1 to B1**.
It presents a 142-lesson roadmap, an in-browser vocabulary trainer, and curated
links to the best free resources. No backend, no account, no tracking — all
state lives in the browser's `localStorage`.

Stack: **Next.js (App Router) · React · TypeScript · pnpm**. No database, no
server routes. Deployed as a static-ish Next app (e.g. Vercel).

## Layout

- `app/page.tsx` — the whole UI. A single client component with four views
  switched in state: **Home / Lessons / Practice / Resources**. Contains the
  header/nav, footer (author credit + sources + disclaimer), and renders
  `<Practice />`.
- `app/layout.tsx` — metadata (title, description, author, OpenGraph) and the
  **`referrer: "no-referrer"`** policy (do not remove — see Audio below).
- `app/globals.css` — all styles. Warm **gold / ink** identity (Fraunces +
  Inter). Responsive rules live in `@media` blocks at the end.
- `data/german.ts` — the curriculum: `lessons` (A1 65 + A2 50 + B1 27 = 142,
  each tagged with `level`), `levels`, `skills`, `resources`. Lesson/vocabulary
  URLs point to learngermanoriginal.com.
- `data/flashcards.ts` — `lessonDecks` (per level+lesson), `allCards`, and
  helpers (`cardsUpToIndex`, `deckIndexOf`, `clozeFor`, `articleOf`,
  `headword`). ~1,080 cards. Curriculum order is A1 → A2 → B1.
- `lib/practice.ts` — practice engine: spaced repetition (Leitner boxes +
  due dates), session selection, mastery, XP/streak/badges, the audio
  (`speakGerman`) and Web-Audio sound effects (`playEffect`).
- `components/Practice.tsx` — the practice UI: 8 modes (flashcards, choice,
  type-it, cloze, dictation, der/die/das, listening, match), review-due queue,
  stats, badges, toasts.
- `components/SoundControl.tsx` — navbar/settings popover for mute + volume.

## Important conventions / constraints

- **Grounded content only.** Lesson topics and vocabulary mirror the real Learn
  German Original A1/A2/B1 courses. Do **not** invent arbitrary quotas or
  vocabulary; keep German correct (nouns with article + plural, real examples).
- **Audio.** German pronunciation is fetched from an online TTS endpoint and
  played through an `<audio>` element. The endpoint 404s when a `Referer` header
  is present, so the document sets `referrer: no-referrer` in `app/layout.tsx`.
  **Keep that.** Web-Speech is only a fallback. Sound effects are generated
  locally with the Web Audio API (no files).
- **Identity.** Adult, clean, editorial. Gold/red/ink, serif display headings.
  No childish/claymorphism styling.
- **Mobile.** Must stay 100% usable on phones/tablets. The header wraps to two
  rows with a scrollable nav on small screens — never hide nav items.
- **No backend.** Keep it static; progress is `localStorage` only.

## Commands

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm typecheck  # tsc --noEmit
pnpm build      # production build (what Vercel runs)
```

If pnpm's pre-run checks get in the way, call the binaries directly:
`./node_modules/.bin/tsc --noEmit` and `./node_modules/.bin/next build`.

Always run typecheck + build before committing.

## Sources & disclaimer

Lessons follow Learn German Original (A1–B1); listening/speaking/writing/exam
resources are independently curated and link to their official pages. This is an
independent educational project, not affiliated with any linked provider.
