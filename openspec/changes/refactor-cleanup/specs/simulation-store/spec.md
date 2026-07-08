## ADDED Requirements

### Requirement: Zustand store owns all simulation state
A Zustand store defined in `src/store.ts` SHALL own all simulation state that currently lives as `useState` calls in `App.tsx`. `App.tsx` SHALL contain no `useState` calls after this change (the `physicsActions` useRef is exempt).

#### Scenario: State fields present in store
- **WHEN** `useSimStore` is called with a selector
- **THEN** the following state fields are accessible: `bodies`, `bodyCount`, `isRunning`, `showTrajectories`, `showVelocities`, `timeScale`, `velocityScale`, `gravityScale`, `fragmentOnCollision`, `gameOverOnCollision`, `isGameOver`, `selectedBodyId`

### Requirement: Store exposes typed actions
The store SHALL expose the following actions alongside state — all with the same signatures as the current `App.tsx` handlers:

- `generate()` — resets `isRunning` and `isGameOver`, generates new bodies using `generateRandomBodies`
- `perturb()` — pauses simulation, perturbs bodies, auto-resumes after 100 ms
- `togglePlay()` — flips `isRunning`
- `toggleTrajectories()` — flips `showTrajectories`
- `toggleVelocities()` — flips `showVelocities`
- `setBodyCount(n)` — updates `bodyCount`
- `setTimeScale(n)` — updates `timeScale`
- `setVelocityScale(n)` — updates `velocityScale`
- `setGravityScale(n)` — updates `gravityScale`
- `setSelectedBodyId(id | null)` — updates `selectedBodyId`
- `setFragmentOnCollision(v)` — updates `fragmentOnCollision`
- `setGameOverOnCollision(v)` — updates `gameOverOnCollision`
- `updateMass(id, newMass)` — updates mass and radius of a body by id
- `handleCollision(id1, id2, pos1, vel1, pos2, vel2)` — applies fragment or game-over logic

#### Scenario: generate action resets simulation
- **WHEN** `generate()` is called
- **THEN** `isRunning` becomes `false`, `isGameOver` becomes `false`, `selectedBodyId` becomes `null`, and `bodies` is replaced with a fresh set

#### Scenario: updateMass updates radius
- **WHEN** `updateMass('body-0', 200)` is called
- **THEN** the matching body's `mass` is `200` and its `radius` is `Math.cbrt(200) * PLANET_RADIUS_FACTOR`

### Requirement: App.tsx uses store selectors
`App.tsx` SHALL read each value from the store using individual selectors to avoid unnecessary re-renders. It SHALL pass values and callbacks to child components as props (no change to child component APIs).

#### Scenario: No useState in App.tsx
- **WHEN** `src/App.tsx` is read
- **THEN** no `useState` import or call is present

#### Scenario: Selectors are granular
- **WHEN** only `isRunning` changes in the store
- **THEN** only the components that subscribe to `isRunning` re-render
