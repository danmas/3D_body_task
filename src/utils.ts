import { CelestialBody, Vector3Tuple } from "./types";
import * as THREE from "three";

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
  const com = new THREE.Vector3();

  // First pass: generate masses and positions
  for (let i = 0; i < count; i++) {
    const isStar = i === 0;
    const mass = isStar ? 500 : Math.random() * 5 + 1; // Heavy star, small planets
    totalMass += mass;
    const radius = isStar ? 3 : Math.cbrt(mass) * 0.5;
    
    // Star in the center, planets spread out
    const pos = isStar ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(
      (Math.random() - 0.5) * 400,
      (Math.random() - 0.5) * 10, // Very flat system
      (Math.random() - 0.5) * 400
    );
    
    // Prevent planets from being too close to the star
    if (!isStar && pos.length() < 30) {
      pos.normalize().multiplyScalar(30 + Math.random() * 50);
    }

    bodies.push({
      id: `body-${i}-${Date.now()}`,
      mass,
      radius,
      initialPosition: [pos.x, pos.y, pos.z],
      initialVelocity: [0, 0, 0],
      color: isStar ? "#fbbf24" : COLORS[i % COLORS.length],
    });

    com.add(pos.clone().multiplyScalar(mass));
  }
  
  // Calculate center of mass
  com.divideScalar(totalMass);

  // Second pass: assign orbital velocities around the center of mass
  const G = 50 * gravityScale; // Gravitational constant used in the simulation
  const up = new THREE.Vector3(0, 1, 0).normalize(); // Orbit plane normal

  for (let i = 0; i < count; i++) {
    const b = bodies[i];
    const pos = new THREE.Vector3(...b.initialPosition);
    const rVec = pos.clone().sub(com);
    const r = rVec.length();

    if (r === 0) continue;

    // Approximate circular orbit velocity magnitude: v = sqrt(G * M / r)
    // We scale it a bit for a more elliptical/stable look with multiple bodies
    const vMag = Math.sqrt((G * totalMass) / r) * 0.85 * velocityScale;

    // Velocity direction perpendicular to distance vector and up vector
    const vDir = new THREE.Vector3().crossVectors(up, rVec).normalize();
    
    // Add a tiny bit of random tilt to the orbit
    vDir.add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2
    )).normalize();

    const vel = vDir.multiplyScalar(vMag);

    b.initialVelocity = [vel.x, vel.y, vel.z];
  }
  
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
    
    const radius = Math.cbrt(mass) * 0.5;
    
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
