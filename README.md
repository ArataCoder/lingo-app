# Lingo Brain

ADHD-friendly Telegram Mini App: Spanish from zero (A1) + English speaking (B1+).

- Live: https://lingo-brain-app.lingobrain.workers.dev/ (mirror: https://aratacoder.github.io/lingo-app/)
- Dark UI, 1 screen = 1 task, progress dots, hold-to-speak practice.
- 100% static (HTML/CSS/JS, no build step) + a Cloudflare Worker bot (`bot/worker.js`). Progress is saved in localStorage + Telegram CloudStorage.

Layout: `index.html` (markup), `css/`, `js/` (modules; load order is in index.html; extend screens through the hooks in `js/core.js`), `content/` (topic JSON), `assets/audio/`, `bot/`, `tests/`.

Checks: `python3 -m http.server 8080 & node tests/e2e.cjs`, `node tests/worker.test.mjs`, `node tests/worker-social.test.mjs`, `python3 validate_content.py`.

Docs for developers / AI assistants: see HANDOFF.md (architecture, changelog of every version, roadmap).
