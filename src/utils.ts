import { CelestialBody, Vector3Tuple } from "./types";
import * as THREE from "three";
import {
  PHYSICS_G,
  ORBIT_VELOCITY_FACTOR,
  STAR_MASS,
  STAR_RADIUS,
  PLANET_RADIUS_FACTOR,
  MIN_ORBIT_DISTANCE,
  ORBIT_SPACING,
} from "./constants";

export const COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
];

export const generateRandomBodies = (count: number, velocityScale: number = 1, gravityScale: number = 1): CelestialBody[] => {
  const bodies: CelestialBody[] = [];
  let totalMass = 0;

  const G = PHYSICS_G * gravityScale;
  const up = new THREE.Vector3(0, 1, 0);

  // First pass: generate masses and positions
  for (let i = 0; i < count; i++) {
    const isStar = i === 0;
    const mass = isStar ? STAR_MASS : Math.random() * 5 + 1;
    totalMass += mass;
    const radius = isStar ? STAR_RADIUS : Math.cbrt(mass) * PLANET_RADIUS_FACTOR;

    let pos: THREE.Vector3;
    if (isStar) {
      pos = new THREE.Vector3(0, 0, 0);
    } else {
      // Each planet gets its own orbital ring, spaced ORBIT_SPACING apart.
      // This guarantees radial separation, preventing close encounters.
      const planetIdx = i - 1; // 0-based
      const orbitRadius = MIN_ORBIT_DISTANCE + planetIdx * ORBIT_SPACING + Math.random() * 20;
      const phi = Math.random() * Math.PI * 2; // random starting angle
      pos = new THREE.Vector3(
        Math.cos(phi) * orbitRadius,
        (Math.random() - 0.5) * 2,  // nearly flat disk
        Math.sin(phi) * orbitRadius
      );
    }

    bodies.push({
      id: `body-${i}-${Date.now()}`,
      mass,
      radius,
      initialPosition: [pos.x, pos.y, pos.z],
      initialVelocity: [0, 0, 0],
      color: isStar ? "#fbbf24" : COLORS[i % COLORS.length],
    });
  }

  // Second pass: assign circular orbital velocities around the star
  const starPos = new THREE.Vector3(...bodies[0].initialPosition);

  for (let i = 1; i < count; i++) {
    const b = bodies[i];
    const pos = new THREE.Vector3(...b.initialPosition);
    const rVec = pos.clone().sub(starPos);
    const r = rVec.length();
    if (r === 0) continue;

    // Circular orbit speed: v = sqrt(G * M_star / r)
    const vMag = Math.sqrt((G * STAR_MASS) / r) * ORBIT_VELOCITY_FACTOR * velocityScale;

    // Perpendicular to rVec in the XZ orbital plane — purely tangential, no radial component
    const vDir = new THREE.Vector3().crossVectors(up, rVec).normalize();

    b.initialVelocity = vDir.multiplyScalar(vMag).toArray() as Vector3Tuple;
  }

  // Third pass: subtract centre-of-mass drift so total momentum = 0
  const comVel = new THREE.Vector3();
  bodies.forEach(b => comVel.add(new THREE.Vector3(...b.initialVelocity).multiplyScalar(b.mass)));
  comVel.divideScalar(totalMass);
  bodies.forEach(b => {
    b.initialVelocity = [
      b.initialVelocity[0] - comVel.x,
      b.initialVelocity[1] - comVel.y,
      b.initialVelocity[2] - comVel.z,
    ];
  });

  return bodies;
};

export const perturbBodies = (bodies: CelestialBody[], amount: number = 0.01): CelestialBody[] => {
  return bodies.map(b => {
    // Add a tiny random offset to position to simulate Lorenz attractor "butterfly effect"
    const newPos: Vector3Tuple = [
      b.initialPosition[0] + (Math.random() - 0.5) * amount,
      b.initialPosition[1] + (Math.random() - 0.5) * amount,
      b.initialPosition[2] + (Math.random() - 0.5) * amount,
    ];
    return {
      ...b,
      id: `body-${Math.random()}`, // Force re-render/reset
      initialPosition: newPos,
    };
  });
};

export const createFragments = (
  b1: CelestialBody,
  b2: CelestialBody,
  pos1: THREE.Vector3,
  vel1: THREE.Vector3,
  pos2: THREE.Vector3,
  vel2: THREE.Vector3
): CelestialBody[] => {
  const fragments: CelestialBody[] = [];
  const totalMass = b1.mass + b2.mass;

  // Choose 3 to 6 fragments
  const numFragments = Math.floor(Math.random() * 4) + 3; 
  
  // Center of mass for the collision
  const comPos = pos1.clone().multiplyScalar(b1.mass)
    .add(pos2.clone().multiplyScalar(b2.mass))
    .divideScalar(totalMass);
    
  // Momentum
  const momentum = vel1.clone().multiplyScalar(b1.mass)
    .add(vel2.clone().multiplyScalar(b2.mass));
    
  const comVel = momentum.divideScalar(totalMass);
  
  let remainingMass = totalMass;
  
  for (let i = 0; i < numFragments; i++) {
    let mass = (i === numFragments - 1) ? remainingMass : remainingMass * (Math.random() * 0.4 + 0.1);
    if (mass < 0.1) mass = 0.1;
    remainingMass -= mass;
    if (remainingMass <= 0 && i < numFragments - 1) {
        mass += remainingMass; // adjust if we overshoot
        remainingMass = 0;
    }
    
    if (mass <= 0.05) continue;
    
    const radius = Math.cbrt(mass) * PLANET_RADIUS_FACTOR;
    
    // Spread fragments slightly so they don't overlap completely
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    const fPos = comPos.clone().add(offset);
    
    // Explosion velocity relative to center of mass
    const fVel = offset.clone().normalize().multiplyScalar(Math.random() * 4 + 1).add(comVel);

    fragments.push({
      id: `frag-${Date.now()}-${Math.random()}`,
      mass,
      radius,
      initialPosition: [fPos.x, fPos.y, fPos.z],
      initialVelocity: [fVel.x, fVel.y, fVel.z],
      color: Math.random() > 0.5 ? b1.color : b2.color,
    });
  }
  
  return fragments;
};
