# Security Policy

Deutsch Start is a fully client-side web app: it has no backend, no database,
no accounts, and no server-side secrets. All your progress is stored locally in
your browser (`localStorage`) and never leaves your device, except that the
text-to-speech feature sends the German word being spoken to a public Google
Translate voice endpoint so it can return the audio.

Because there's no server, the realistic security surface is the source code and
its dependencies rather than a live service.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Report it privately instead:

- Use GitHub's **[Report a vulnerability](https://github.com/azizjail2003/Deutsch-start/security/advisories/new)**
  (Security → Advisories), or
- Email **jailabdelaziz@icloud.com** with the details and steps to reproduce.

I'll acknowledge your report as soon as I can, and credit you in the fix if
you'd like.

## Supported versions

This is a single actively-developed app; only the latest `main` is supported.
Security fixes land on `main` and deploy from there.
