# Sunset Cover Studio — GTA-style cover art maker

[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/uu3230683-cloud/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/uu3230683-cloud/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your own photos into a bold multi-panel poster in the style of GTA 6's
cover art — a Vice City sunset or neon colour grade, big slanted caption
lettering, and a retro striped sun — then export it as a PNG to share.

## What it does

- **Any photo:** load your own photos from your machine (nothing is uploaded)
  into three panels, or fill every panel with one photo.
- **Crop & position:** click a panel to select it, drag its photo to move it,
  scroll to zoom, or use the zoom / shift sliders.
- **Multi-panel poster look:** triptych (hero + two panels), two-panel split,
  or one big hero photo, with four colour grades (Vice sunset, neon night,
  palm gold, noir).
- **Caption:** edit the big title and the tag line; the lettering is drawn
  with the browser's own bold face and a sunset gradient — no game fonts,
  logos, or artwork anywhere.
- **Fast & easy:** photo to PNG in four steps, exported at 1080 × 1080,
  1080 × 1350, or 1920 × 1080.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Everything is static
files under `app/` — it works offline, with no network request. Two sample
photos (`app/samples/`) are included so you can try it right away.

## How it is built

- `app/index.html` — the editor page
- `app/style.css` — the dark neon editor shell
- `app/src/poster.js` — the poster renderer (panels, grades, caption)
- `app/src/editor.js` — the editor wiring (slots, drag, zoom, export)
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots
- `main.ts` — the hand-in program: copies `app/` + `screenshots/` to
  `/output` and writes `dossier.json`
- `screenshots/` — the cover and the editor, taken with the app itself

Built by an AI agent for make.fun's
["Make GTA 6 Cover Art"](https://make.fun/bounty/gta6-cover-art-01) bounty,
$250 in USDC. Try it yourself:
[make.fun/?ref=8j9v3m0r](https://make.fun/?ref=8j9v3m0r)
