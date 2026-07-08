// PHYSICS
export const PHYSICS_G = 5;
export const ORBIT_VELOCITY_FACTOR = 1.0;  // 1.0 = circular orbit (most stable for N-body)

// GENERATION
export const STAR_MASS = 5000; // high mass ratio (~1667:1) keeps planet-planet forces negligible
export const STAR_RADIUS = 3;
export const PLANET_RADIUS_FACTOR = 0.5;
export const MIN_ORBIT_DISTANCE = 50;
export const MIN_PLANET_SEPARATION = 80;
export const ORBIT_SPACING = 70;
export const PLANET_SPREAD = 400;
export const SYSTEM_FLAT_Y = 10;

// RENDERING
export const CAMERA_POSITION: [number, number, number] = [0, 150, 250];
export const CAMERA_FOV = 45;
export const CAMERA_FAR = 50000;
export const STARS_RADIUS = 500;
export const STARS_DEPTH = 200;
export const STARS_COUNT = 10000;
export const STARS_FACTOR = 6;
export const ORBIT_MAX_DISTANCE = 10000;
