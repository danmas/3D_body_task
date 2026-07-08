## Why

The project was scaffolded in Google AI Studio, leaving behind unused AI dependencies, AI Studio-specific `.env` comments, and a license header that don't belong in this simulation. Additionally, all simulation state lives in `App.tsx` (9 `useState` hooks + a `useRef`) making it hard to extend, and physics constants (`G=50`, star mass `500`, softening etc.) are scattered across files with no single source of truth.

## What Changes

- Remove `@google/genai` from `package.json` dependencies (unused — no imports in source)
- Remove AI Studio comments and `GEMINI_API_KEY` / `APP_URL` from `.env.example` and `.env.local`
- Remove `SPDX-License-Identifier: Apache-2.0` header comment from `App.tsx`
- Extract all magic simulation numbers into `src/constants.ts`
- Move all simulation state out of `App.tsx` into a Zustand store (`src/store.ts`)

## Capabilities

### New Capabilities

- `simulation-constants`: A single `src/constants.ts` file that centralises all physics and rendering magic numbers (G, star mass, orbit distances, camera defaults, etc.)
- `simulation-store`: A Zustand store (`src/store.ts`) that owns all simulation state currently held in `App.tsx`, exposing actions alongside state

### Modified Capabilities

_(none — no existing specs)_

## Impact

- `package.json`: remove `@google/genai`
- `.env.example`, `.env.local`: remove AI Studio keys and comments
- `src/App.tsx`: remove license header, replace all `useState`/`useRef` with store selectors; becomes a thin render shell
- `src/utils.ts`: import constants from `src/constants.ts` instead of local literals
- `src/components/ControlsPanel.tsx` (and siblings): may read store directly instead of receiving props, or continue via props — to be decided in design
- New files: `src/constants.ts`, `src/store.ts`
- New dependency: `zustand`
