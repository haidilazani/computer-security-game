# CyberQuest — CSC662 Computer Security Learning Game

An interactive, level-based web game that teaches the full CSC662 Computer Security
syllabus (Chapters 1–5) by *playing* it. Slick dark "security terminal" UI, user
accounts with saved progress, and hands-on challenges — crack a Caesar cipher, forge
an unbreakable password, run a live `chmod` shell, break into a login with SQL
injection, and smash a stack buffer.

---

## Quick start

**Windows (easiest):** double-click **`run.bat`**.

**Any platform (manual):**
```bash
pip install -r requirements.txt
python app.py
```
Then open **http://127.0.0.1:5000** in your browser and click **Create an account**.

> Requires Python 3.8+. The database (`cyberquest.db`) is created automatically on
> first run — no setup needed.

---

## Features

- **Accounts & auth** — sign up with your email, log in / log out. Passwords are
  stored as one-way salted hashes (`werkzeug.security`), never in plain text.
- **Profile editing** — change your name, username and password (password change
  requires re-entering the current one).
- **Activity history** — a colour-coded audit log records every login, mission,
  level completion and profile change, with timestamps.
- **Progress & levels** — 5 missions × 4 levels each (20 total). Levels unlock in
  sequence; earn up to 3 stars + 300 XP per level; climb the rank ladder from
  *Script Kiddie* to *Cyber Sentinel*.
- **Tutorials** — every game opens with a skippable briefing, re-openable any time
  via the **Tutorial** button.

## The five games (mapped to the syllabus)

| Game | Chapter | You will… |
|------|---------|-----------|
| **CIA Command Center** | 1 · Fundamentals | Triage incidents by C/I/A, classify threats vs vulnerabilities, spot the 8 design principles, enforce Bell-LaPadula & Biba as the reference monitor |
| **Gatekeeper Protocol** | 2 · Authentication & Access Control | Sort the 3 auth factors, forge a password in a live crack-time lab, read ACLs and stamp ALLOW/DENY, tell DAC/MAC/RBAC apart, order the Kerberos flow |
| **Crypto Lab** | 3 · Cryptography | Break real ciphertext with an interactive Caesar dial, sort substitution vs transposition, pick the right key, assemble a digital signature |
| **Permission Terminal** | 4 · OS Security | Build `rwx` modes on a bit switchboard, type real `chmod` in a simulated shell, hunt a UID-0 backdoor in `/etc/passwd`, run the Windows ACE-matching algorithm |
| **Malware Hunter** | 5 · Software Security | Identify the malware zoo, break a login via SQL injection, overflow a stack buffer to overwrite the return address, prescribe the right defences |

## Tech

Pure **Flask + SQLite + vanilla JS** — no build step, no external JS frameworks.

- `app.py` — server: routes, auth, SQLite schema, progress/activity APIs.
- `templates/` — Jinja2 pages (login, register, dashboard, game, profile, history).
- `static/css/style.css` — the whole design system.
- `static/js/engine.js` — the game engine (level select, tutorial, question types,
  scoring, results). Question renderers: multiple-choice, ALLOW/DENY decision,
  classify, ordering, matching, and `custom` interactive widgets.
- `static/js/games/*.js` — one file per game; each sets `window.GAME_DEF` with its
  tutorial and levels. All game content is data, so levels are easy to add or edit.

### Adding a question
Open the relevant `static/js/games/<id>.js` and add an entry to a level's
`questions` array. Types: `mc`, `decision`, `sort`, `order`, `match`, `custom`.
Every question carries an `explain` string — that's where the teaching happens.

## Reference material
Built directly from the `CSC662_Chapter1–5_Study_Notes.pdf` files in this folder.
Every explanation traces back to those notes.
