import { create } from 'zustand';
import * as THREE from 'three';
import { CelestialBody } from './types';
import { generateRandomBodies, perturbBodies, createFragments } from './utils';
import { PLANET_RADIUS_FACTOR } from './constants';

interface SimState {
  bodies: CelestialBody[];
  bodyCount: number;
  isRunning: boolean;
  showTrajectories: boolean;
  showVelocities: boolean;
  timeScale: number;
  velocityScale: number;
  gravityScale: number;
  fragmentOnCollision: boolean;
  gameOverOnCollision: boolean;
  isGameOver: boolean;
  selectedBodyId: string | null;

  generate: () => void;
  perturb: () => void;
  togglePlay: () => void;
  toggleTrajectories: () => void;
  toggleVelocities: () => void;
  setBodyCount: (n: number) => void;
  setTimeScale: (n: number) => void;
  setVelocityScale: (n: number) => void;
  setGravityScale: (n: number) => void;
  setSelectedBodyId: (id: string | null) => void;
  setFragmentOnCollision: (v: boolean) => void;
  setGameOverOnCollision: (v: boolean) => void;
  updateMass: (id: string, newMass: number) => void;
  handleCollision: (
    id1: string,
    id2: string,
    pos1: THREE.Vector3,
    vel1: THREE.Vector3,
    pos2: THREE.Vector3,
    vel2: THREE.Vector3,
  ) => void;
}

export const useSimStore = create<SimState>((set, get) => ({
  bodies: [],
  bodyCount: 3,
  isRunning: false,
  showTrajectories: true,
  showVelocities: true,
  timeScale: 1,
  velocityScale: 1,
  gravityScale: 1,
  fragmentOnCollision: true,
  gameOverOnCollision: false,
  isGameOver: false,
  selectedBodyId: null,

  generate: () => {
    const { bodyCount, velocityScale, gravityScale } = get();
    set({
      isRunning: false,
      isGameOver: false,
      selectedBodyId: null,
      bodies: generateRandomBodies(bodyCount, velocityScale, gravityScale),
    });
  },

  perturb: () => {
    set(s => ({ isRunning: false, isGameOver: false, selectedBodyId: null, bodies: perturbBodies(s.bodies, 0.05) }));
    setTimeout(() => set({ isRunning: true }), 100);
  },

  togglePlay: () => set(s => ({ isRunning: !s.isRunning })),
  toggleTrajectories: () => set(s => ({ showTrajectories: !s.showTrajectories })),
  toggleVelocities: () => set(s => ({ showVelocities: !s.showVelocities })),

  setBodyCount: (n) => set({ bodyCount: n }),
  setTimeScale: (n) => set({ timeScale: n }),
  setVelocityScale: (n) => set({ velocityScale: n }),
  setGravityScale: (n) => set({ gravityScale: n }),
  setSelectedBodyId: (id) => set({ selectedBodyId: id }),
  setFragmentOnCollision: (v) => set({ fragmentOnCollision: v }),
  setGameOverOnCollision: (v) => set({ gameOverOnCollision: v }),

  updateMass: (id, newMass) => set(s => ({
    bodies: s.bodies.map(b =>
      b.id === id ? { ...b, mass: newMass, radius: Math.cbrt(newMass) * PLANET_RADIUS_FACTOR } : b
    ),
  })),

  handleCollision: (id1, id2, pos1, vel1, pos2, vel2) => {
    const { gameOverOnCollision, fragmentOnCollision } = get();

    if (gameOverOnCollision) {
      set({ isGameOver: true, isRunning: false });
      return;
    }

    if (fragmentOnCollision) {
      set(s => {
        const idx1 = s.bodies.findIndex(b => b.id === id1);
        const idx2 = s.bodies.findIndex(b => b.id === id2);
        if (idx1 === -1 || idx2 === -1) return s;
        const b1 = s.bodies[idx1];
        const b2 = s.bodies[idx2];
        const fragments = createFragments(b1, b2, pos1, vel1, pos2, vel2);
        const remaining = s.bodies.filter(b => b.id !== id1 && b.id !== id2);
        return { bodies: [...remaining, ...fragments] };
      });
    }
  },
}));
