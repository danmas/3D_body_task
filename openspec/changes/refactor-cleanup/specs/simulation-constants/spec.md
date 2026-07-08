## ADDED Requirements

### Requirement: Single constants file owns all simulation literals
All physics and rendering magic numbers SHALL be defined in `src/constants.ts` and imported from there. No numeric literal that controls simulation behaviour or rendering appearance SHALL appear inline in `src/utils.ts` or `src/App.tsx`.

#### Scenario: Physics constants centralised
- **WHEN** a developer searches for `G =` or `= 500` across `src/`
- **THEN** the only match is the definition in `src/constants.ts`

#### Scenario: Rendering constants centralised
- **WHEN** a developer searches for camera position, Stars count, or `fov` in `src/App.tsx`
- **THEN** no numeric literals are found — only named constant imports

### Requirement: Constants are typed named exports
`src/constants.ts` SHALL export named `const` values. Each constant MUST be grouped by a comment block (`// PHYSICS`, `// GENERATION`, `// RENDERING`). No default export, no class, no enum.

#### Scenario: Tree-shaking friendly
- **WHEN** `src/utils.ts` imports only `PHYSICS_G` and `STAR_MASS`
- **THEN** the bundler can exclude unused constants from that chunk

### Requirement: Mandatory constants list
`src/constants.ts` MUST define at minimum:

**Physics group:**
- `PHYSICS_G = 50` — base gravitational constant
- `ORBIT_VELOCITY_FACTOR = 0.85` — circular-orbit speed scale

**Generation group:**
- `STAR_MASS = 500` — mass assigned to the first (star) body
- `STAR_RADIUS = 3` — visual radius of the star
- `PLANET_RADIUS_FACTOR = 0.5` — coefficient in `Math.cbrt(mass) * factor`
- `MIN_ORBIT_DISTANCE = 30` — minimum distance a planet may be from the star
- `PLANET_SPREAD = 400` — XZ extent of the random position range
- `SYSTEM_FLAT_Y = 10` — Y-axis spread (flat disc)

**Rendering group:**
- `CAMERA_POSITION: [0, 150, 250]` — default Three.js camera position
- `CAMERA_FOV = 45`
- `CAMERA_FAR = 50000`
- `STARS_RADIUS = 500`
- `STARS_DEPTH = 200`
- `STARS_COUNT = 10000`
- `STARS_FACTOR = 6`
- `ORBIT_MAX_DISTANCE = 10000` — OrbitControls maxDistance

#### Scenario: All listed constants present
- **WHEN** `src/constants.ts` is imported
- **THEN** every constant in the list above is exported and resolves to its specified value
