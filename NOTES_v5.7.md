# v5.7 - frame-by-frame mascot

- `v53.js` swaps aligned frames on top of the v52 mascot (CSS pop/jump/glow/confetti still run).
- Frames: 13 webp 256x256 at `https://aratacoder.github.io/lingo-app/assets/mascot/f/` (uploaded manually by the owner via GitHub web UI, because the agent's GitHub tool is text-only).
  - start1-3 (base / blink / ear twitch), error1-3 (base / ears droop / shy blink), win1-3 (smile / trophy up / sparkles), tired1-4 (awake / dozing / sip / steam).
- Sequences: start - ear twitch x2 then random blink; error - droops ears, shy blinks; win - trophy up + sparkle twinkle; tired - dozes, wakes, sips coffee with steam, then random dozing. Stops after 30s or when the element leaves the DOM. prefers-reduced-motion: static base frame.
- If frames fail to load, v52 static pose stays (no breakage).
- Worker index.html has `<script src="v53.js?v=1"></script>` after `v52.js?v=4`; repo index.html still needs that line (TODO on next full edit).
- Source PNGs (2048px, Photoroom cutouts) were cropped per pose with a shared bbox so frames align: start 1633x1731+183+136, error 1597x1666+219+202, win 1799x1731+118+137, tired 1471x1711+306+179 -> resize 240 -> extent 256.
