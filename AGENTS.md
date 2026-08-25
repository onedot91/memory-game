# PROJECT KNOWLEDGE BASE

**Generated:** 2026-08-26
**Commit:** 51516a6
**Branch:** main

## OVERVIEW

RETRO CLOZE is a Korean arcade-style memorization SPA built with React 19, TypeScript, Vite 6, Tailwind CSS 4, and browser-native Web Audio. There is no active backend or API route; gameplay, persistence, and rendering run entirely in the browser.

## STRUCTURE

```text
memory-game/
├── index.html          # Korean HTML shell; loads /src/main.tsx
├── src/
│   ├── main.tsx        # React StrictMode mount
│   ├── App.tsx         # Entire game UI, state, events, persistence
│   ├── data.ts         # Category data, answer normalization/matching
│   ├── audio.ts        # Web Audio SoundEngine singleton
│   └── index.css       # Tailwind import plus global kitsch/CRT styles
├── vite.config.ts      # React/Tailwind plugins and AI Studio HMR switch
├── tsconfig.json       # Bundler-mode, no-emit TypeScript configuration
├── metadata.json       # AI Studio app metadata; not runtime wiring
├── bun.lock            # Tracked lockfile
└── package.json        # Vite lifecycle scripts
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| App bootstrap | `index.html`, `src/main.tsx` | Flow: HTML → `main.tsx` → `App` |
| Game UI/state | `src/App.tsx` | Single 1,164-line component; highest blast radius |
| Correct/wrong flow | `src/App.tsx:393` | `handleSubmitActiveSlot` drives match, sound, reveal, progress |
| Answer rules | `src/data.ts:220` | `stripEmojis` → `normalizeAnswer` → `isMatch` |
| Topic/category content | `src/data.ts:20` | Static Korean civil-service and 00–99 datasets |
| Sound behavior | `src/audio.ts:8` | Browser Web Audio; exported singleton is `sound` |
| Theme/animation | `src/index.css` | Tailwind utilities coexist with global `kitsch-*` classes |
| Dev/HMR behavior | `vite.config.ts:15` | `DISABLE_HMR=true` disables HMR and file watching |
| Runtime metadata | `.env.example`, `metadata.json` | Gemini/Cloud Run declarations are currently unused by `src/` |

## CODE MAP

CodeGraph found 32 symbols across the core files. LSP was unavailable during generation; reference counts below are CodeGraph/import-based.

| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `App` | function/component | `src/App.tsx:50` | entry | Owns all visible UI and browser state |
| `handleSubmitActiveSlot` | function | `src/App.tsx:394` | UI event | Main answer-submission state machine |
| `CategoryData` | interface | `src/data.ts:7` | 4 | Category boundary shared by data and UI |
| `TOPIC_GROUPS` | constant | `src/data.ts:20` | App import | Top-level navigation metadata |
| `normalizeAnswer` | function | `src/data.ts:233` | 1 | Canonicalizes Korean/English input |
| `isMatch` | function | `src/data.ts:246` | App call | Alias, parentheses, and particle-aware grading |
| `SoundEngine` | class | `src/audio.ts:8` | 1 | Synthesizes all interaction sounds |
| `sound` | singleton | `src/audio.ts:329` | App import | Shared audio facade |

Core call path:

```text
App.handleSubmitActiveSlot
└── isMatch
    └── normalizeAnswer
        └── stripEmojis
```

## CONVENTIONS

- Keep local source imports relative (`./data`, `./audio`); the configured `@/*` alias is currently unused.
- JSX uses Tailwind utility classes; repeated visual effects and animations use global `kitsch-*` CSS classes.
- Persistent data uses versioned `retro_cloze_*` localStorage keys. Preserve migration behavior when changing names or item order.
- `src/data.ts` exports both domain interfaces and immutable category datasets; answer grading stays with the data boundary.
- Audio is lazy-initialized after interaction through one exported `sound` instance.
- Type checking is the script named `lint`; no ESLint/Biome configuration exists.

## ANTI-PATTERNS (THIS PROJECT)

- Do not modify the `DISABLE_HMR` watch guard casually; its explicit purpose is preventing flicker and excess CPU during agent edits.
- Do not assume `.env.example` values, `@google/genai`, Express, or `metadata.json` imply a working server. No source imports or API routes currently exist.
- Do not introduce SSR assumptions without isolating direct `window`, `localStorage`, and Web Audio access.
- Do not change localStorage key versions or name/index restoration precedence without a migration plan.
- Do not run `npm run clean` as routine validation; it executes `rm -rf dist server.js`.
- Do not treat generated `dist/` or `node_modules/` as source; both are ignored.
- Avoid adding more responsibilities to `App.tsx`; it already combines UI, persistence, timers, keyboard controls, drag/drop, and game logic.

## UNIQUE STYLES

- Visual language is intentionally dense neon/CRT/neo-brutalist rather than a neutral component system.
- Keyboard operation is primary: Enter submits, Tab advances, Escape resets, and Alt shortcuts switch topics/categories.
- The second consecutive wrong answer reveals the answer and advances automatically; this is core game behavior.
- Progress, custom order, active topic, failed history, and mute state persist independently in localStorage.
- Fonts load from Google Fonts in `index.html`; offline rendering falls back to local monospace fonts.

## COMMANDS

```bash
npm install       # Generates/updates package-lock.json; bun.lock is also tracked
npm run dev       # Vite on 0.0.0.0:3000; selects another port if occupied
npm run lint      # tsc --noEmit
npm run build     # Production bundle in ignored dist/
npm run preview   # Serve the production bundle locally
```

There is no test script, test runner, test directory, or CI workflow. Current minimum verification is `npm run lint` plus `npm run build`, followed by a browser smoke test of the affected game flow.

## NOTES

- Both `bun.lock` and an untracked `package-lock.json` currently exist; do not silently rewrite or delete either lockfile.
- `package.json` is named `react-example`, while the user-facing app name comes from `index.html` and `metadata.json`.
- `vite` is declared in both dependencies and devDependencies; unused manifest packages include the current server/Gemini stack.
- Timer-driven focus, feedback, and auto-advance callbacks in `App.tsx` are sensitive to category changes and unmounts.
- The app expects a browser environment; Web Audio activation may require a user gesture.
