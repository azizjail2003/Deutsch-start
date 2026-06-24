<div align="center">

# 🇩🇪 Deutsch Start

### A free, open home base for learning German from **A1 → B1** 🚀

One clear path through the whole curriculum, real spaced-repetition practice,
and the best free resources for every skill — no account, no ads, no tracking.

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-deutsch--start.vercel.app-22c55e?logo=vercel&logoColor=white)](https://deutsch-start.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Privacy: on-device](https://img.shields.io/badge/Privacy-100%25_on--device-blue.svg)](#-privacy--security)

</div>

---

## 📖 What it is

**Deutsch Start** maps the full **142-lesson** German curriculum (A1 → A2 → B1)
into one clear path, lets you **practise the exact words from each lesson** with
spaced-repetition flashcards, and points you to the **best free resources** for
every skill — grammar, vocabulary, listening, speaking, writing and exam prep.

> 🔒 **No account. No ads. No tracking.** Everything runs in your browser.

🔗 **Live site:** **[deutsch-start.vercel.app](https://deutsch-start.vercel.app)**

---

## 💡 Why I built it

Good German material is scattered across a dozen courses, playlists and apps, and
most "free" sites are buried in ads or locked behind sign-ups. I wanted **one
calm, well-organised place**: a clear lesson path, a way to actually *practise and
retain* the words, and honest links to the best free resources — nothing more.

Deutsch Start is that place, shared openly so it can help other learners too. ❤️

---

## ✨ Features

| | |
|---|---|
| 🗺️ **142-lesson roadmap** | Three levels (A1 · 65, A2 · 50, B1 · 27), each with its grammar focus and vocabulary. |
| 🔍 **Lesson explorer** | Live search + level filtering; jump from any lesson straight into practising its words. |
| 🃏 **Vocabulary practice** | 1,000+ flashcards across 142 decks, in **8 modes**: flashcards, multiple choice, type-it, cloze, dictation, der/die/das, listening and match pairs. |
| 🧠 **Spaced repetition** | Leitner system with a "review due" queue, mastery tracking, XP, a day streak and achievement badges. |
| 🔊 **Spoken audio** | Text-to-speech pronunciation for every card, plus sound effects with volume / mute control. |
| 🎨 **Made yours** | Light / dark mode, custom accent colour, adjustable text size — all in a Settings tab. |
| 📊 **Progress dashboard** | XP, streak, mastery bars, an activity heatmap and a focused "review your weak words" session. |
| ♿ **Accessible** | Fully responsive, keyboard-first practice, and reduced-motion aware. |
| 💾 **Your data, exportable** | Back up and restore all progress as a single file — it never leaves your device. |

---

## 🔐 Privacy & security

This is a **fully client-side** app — there's no backend, no database and no
accounts, so there's nothing to breach on a server.

- 🧳 **All your progress** (plan, practice stats, settings) lives in your browser's
  `localStorage` and **never leaves your device**, except a backup file *you*
  choose to export.
- 🗣️ The only outbound call at runtime is sending the word being spoken to a public
  text-to-speech voice so it can return the audio.
- 📈 Visitor counts use **Vercel Web Analytics** — **cookieless**, with no
  profiling or personal data.

Found a vulnerability? Please report it privately — see **[SECURITY.md](./SECURITY.md)**.

---

## 🛠️ Tech stack

**Next.js** (App Router) · **React** · **TypeScript** · **pnpm**
No backend, no database — all progress is saved in the browser's local storage.

---

## 🚀 Run locally

```bash
pnpm install
pnpm dev          # ▶ http://localhost:3000
```

Verify before pushing (CI runs the exact same checks on every PR):

```bash
pnpm typecheck    # ✅ types
pnpm build        # 📦 production build
```

> Requires **Node 22** and **pnpm 11** (see `package.json`).

---

## ☁️ Deploy

Import the repository into **[Vercel](https://vercel.com)** — the framework is
auto-detected as Next.js. **No environment variables or backend services are
required.** That's it. 🎉

---

## 🤝 Contributing

**Everyone is welcome** — beginners and experts alike! 🙌

- 🐛 **Spot a mistake?** (a wrong translation, article or example) → open an **issue**.
- 🔧 **Improve** lessons, flashcards, resources, accessibility or design → open a **pull request**.
- 💭 **Have an idea?** → suggest a feature or a new resource.

Please keep changes accurate and grounded in real sources, and run
`pnpm typecheck && pnpm build` before opening a PR. Full guidelines in
**[CONTRIBUTING.md](./CONTRIBUTING.md)**.

---

## 📚 Sources & attribution

- 🗂️ **Lessons** — the sequence and grammar/vocabulary topics follow the
  [Learn German Original](https://learngermanoriginal.com/) A1, A2 and B1 courses.
- 🌐 **Resources** — DW *Nicos Weg*, Easy German, YouGlish, Vocaroo, LanguageTool,
  Duolingo and the Goethe-Institut are independently curated and link to their
  official pages.
- 🃏 **Flashcards** — the decks are written to match each lesson's topic.
- 🔊 **Audio** — pronunciation is generated by an online text-to-speech service.

> ⚠️ **Disclaimer.** This is an independent, non-commercial educational project.
> It is **not affiliated with or endorsed by** any linked provider, and all
> trademarks belong to their respective owners. Content is provided **as is,
> without warranty** — always verify important details with the original sources.

---

## 👤 Author

Built and maintained by **Abdelaziz Jail**.

[![Email](https://img.shields.io/badge/Email-jailabdelaziz@icloud.com-d97706?logo=maildotru&logoColor=white)](mailto:jailabdelaziz@icloud.com)
[![GitHub](https://img.shields.io/badge/GitHub-azizjail2003-181717?logo=github&logoColor=white)](https://github.com/azizjail2003)

---

## 📄 License

[**MIT**](./LICENSE) © 2026 Abdelaziz Jail — the application code is MIT-licensed.

Lesson content and linked resources reference third-party materials owned by
their respective providers (see *Sources & attribution* above).

<div align="center">

⭐ **If Deutsch Start helps your German, consider starring the repo — it helps other learners find it.** ⭐

</div>
