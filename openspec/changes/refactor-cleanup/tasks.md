## 1. AI Studio cleanup

- [x] 1.1 Remove `@google/genai` from `dependencies` in `package.json` and delete it from `node_modules` (`npm uninstall @google/genai`)
- [x] 1.2 Rewrite `.env.example` and `.env.local`: remove `GEMINI_API_KEY` and `APP_URL` entries plus all AI Studio comments
- [x] 1.3 Remove the `@license / SPDX-License-Identifier: Apache-2.0` header comment from `src/App.tsx`

## 2. Constants file

- [x] 2.1 Create `src/constants.ts` with all PHYSICS, GENERATION, and RENDERING groups as per spec (G, ORBIT_VELOCITY_FACTOR, STAR_MASS, STAR_RADIUS, PLANET_RADIUS_FACTOR, MIN_ORBIT_DISTANCE, PLANET_SPREAD, SYSTEM_FLAT_Y, CAMERA_POSITION, CAMERA_FOV, CAMERA_FAR, STARS_*, ORBIT_MAX_DISTANCE)
- [x] 2.2 Update `src/utils.ts` to import and use constants from `src/constants.ts` (replace inline `50`, `500`, `3`, `0.5`, `30`, `400`, `10`, `0.85`)
- [x] 2.3 Update `src/App.tsx` to import and use rendering constants from `src/constants.ts` (camera position/fov/far, Stars props, OrbitControls maxDistance)

## 3. Zustand store

- [x] 3.1 Install `zustand`: `npm install zustand`
- [x] 3.2 Create `src/store.ts` with a Zustand store containing all state fields (`bodies`, `bodyCount`, `isRunning`, `showTrajectories`, `showVelocities`, `timeScale`, `velocityScale`, `gravityScale`, `fragmentOnCollision`, `gameOverOnCollision`, `isGameOver`, `selectedBodyId`) and all actions (`generate`, `perturb`, `togglePlay`, `toggleTrajectories`, `toggleVelocities`, `setBodyCount`, `setTimeScale`, `setVelocityScale`, `setGravityScale`, `setSelectedBodyId`, `setFragmentOnCollision`, `setGameOverOnCollision`, `updateMass`, `handleCollision`)
- [x] 3.3 Refactor `src/App.tsx`: remove all `useState` and `useEffect` calls, replace with individual `useSimStore` selectors; keep `physicsActions` as `useRef`; props passed to children remain unchanged
- [x] 3.4 Run `npm run lint` and fix any TypeScript errors
