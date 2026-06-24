# Contributing to Deutsch Start

Thanks for wanting to help! Deutsch Start is a free, open home base for learning
German A1–B1. Contributions of all sizes are welcome — fixing a typo in a
lesson, correcting German, improving the UI, or adding a genuinely useful free
resource.

## Ground rules

- **German must be correct.** If you touch lesson text, vocabulary, or example
  sentences, double-check grammar, gender, and spelling.
- **Resources and tasks must be real and grounded.** Link to actual, free,
  reputable materials. Don't invent arbitrary quotas ("do 5 exercises") or
  fabricate links.
- **Keep the design identity** — a warm, adult, editorial learning tool. No
  childish styling.
- **No backend.** All learner progress stays in the browser's `localStorage`.
  Please don't add servers, accounts, or third-party/cookie-based trackers. The
  site uses Vercel Web Analytics for privacy-friendly, cookieless aggregate
  visit counts only — no profiling or personal data.

## Setup

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

This project uses **Node 22** and **pnpm 11** (see `package.json`).

## Before you open a pull request

Run both checks and make sure they pass — CI runs the same two on every PR:

```bash
pnpm typecheck
pnpm build
```

Then:

1. Fork the repo and create a branch (`git checkout -b fix-a1-articles`).
2. Make your change. Keep PRs focused — one topic per PR is easiest to review.
3. Open a pull request against `main` with a short description of *what* and
   *why*.

## Adding dependencies

Please **avoid adding new dependencies** unless there's a clear need. If you
think one is necessary, mention it in your PR description and explain why — it
keeps the app fast and the supply chain small. PRs that add unexplained
dependencies may be asked to remove them.

## Questions

Open a regular issue for bugs or ideas. For anything security-related, see
[SECURITY.md](./SECURITY.md) instead — don't file it publicly.
