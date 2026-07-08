## Context

The project was generated from a Google AI Studio template. Three structural problems have accumulated:

1. **AI Studio debris**: `@google/genai` listed in `package.json` but never imported anywhere in source; `.env.example`/`.env.local` contain `GEMINI_API_KEY` and `APP_URL` with AI Studio-specific prose; `App.tsx` carries an Apache-2.0 SPDX header from the template.

2. **Monolithic state**: `App.tsx` owns 9 `useState` calls and 1 `useRef` (`physicsActions`). All simulation controls — body list, running state, display toggles, scales, collision mode, game-over flag, selection — live at the root component. Every child that needs to read or mutate state must receive it as props, making the prop surface wide and threading brittle.

3. **Scattered magic numbers**: Physics (`G=50`, star mass `500`, orbital factor `0.85`, min-distance `30`) and rendering (`camera [0,150,250]`, Stars count `10000`, `fov 45`) are inline literals across `utils.ts` and `App.tsx` with no single place to tune them.

## Goals / Non-Goals

**Goals:**
- Remove all AI Studio debris (package, env keys, license header)
- Create `src/constants.ts` as the single source of truth for all simulation and rendering literals
- Introduce a Zustand store (`src/store.ts`) that owns all simulation state currently in `App.tsx`
- `App.tsx` becomes a thin render shell; state reads/writes go through the store

**Non-Goals:**
- Refactoring business logic in `utils.ts` (physics algorithms unchanged)
- Migrating child components to read from the store directly — they keep receiving props for now
- Adding new features or changing any visible behaviour
- Replacing Tailwind classes or UI structure

## Decisions

### 1. Zustand for state management

**Decision**: Add `zustand` as a dependency; define one flat store in `src/store.ts`.

**Why over alternatives**:
- *Redux Toolkit*: too much boilerplate for a project of this size.
- *React Context*: fine for simple toggles but causes full subtree re-renders for fast-updating state (bodies list changes on every collision/fragment event).
- *Jotai/Recoil*: atom-per-value approach is fine but doesn't offer meaningful advantages here over Zustand's slice pattern.

Zustand is minimal (~1 KB), integrates trivially with React 19, and allows selective subscriptions that prevent unnecessary renders.

### 2. Flat store, not sliced

**Decision**: One store object with all state and actions, no split slices.

The state set is small (< 15 fields) and there are no independent sub-domains. Splitting into slices adds indirection without payoff at this scale.

### 3. Props unchanged for child components

**Decision**: `App.tsx` reads from the store and passes down props as before — child components are NOT refactored to call `useStore` directly.

**Why**: Minimum blast radius. The goal of this change is cleanup, not a full component refactor. Child components can be migrated to direct store access in a follow-up if needed.

### 4. Constants file is plain TypeScript exports, not an enum or class

**Decision**: `src/constants.ts` exports named `const` values grouped by comments (PHYSICS, RENDERING, GENERATION).

Plain exports are tree-shakeable, type-safe without extra ceremony, and easier to grep than nested objects or enums.

## Risks / Trade-offs

- **Zustand bundle size**: +~1 KB gzipped. Negligible.
- **Store re-render granularity**: If `App.tsx` subscribes to the entire store it will re-render on every state change. Mitigation: use individual selectors (`useSimStore(s => s.bodies)`) rather than destructuring the whole store.
- **physicsActions ref**: currently a `useRef` in `App.tsx` that gets mutated by `NBodySystem`. Moving it into a Zustand store would work but mixes a mutable ref with reactive state. Decision: keep `physicsActions` as a `useRef` in `App.tsx` and pass it as a prop, unchanged.

## Migration Plan

1. Install `zustand`
2. Create `src/constants.ts` — no other files change yet
3. Update `src/utils.ts` to import from `src/constants.ts`
4. Update `src/App.tsx` inline literals to use constants
5. Create `src/store.ts` with Zustand store mirroring current `App.tsx` state
6. Replace `useState`/`useEffect` in `App.tsx` with store selectors and actions
7. Remove `@google/genai` from `package.json` + clean `.env` files + remove SPDX header
8. Run `npm install` and verify `npm run lint` passes
