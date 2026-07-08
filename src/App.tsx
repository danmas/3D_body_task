/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { NBodySystem } from './components/NBodySystem';
import { ControlsPanel } from './components/ControlsPanel';
import { generateRandomBodies, perturbBodies, createFragments } from './utils';
import { CelestialBody } from './types';
import * as THREE from 'three';

export default function App() {
  const [bodyCount, setBodyCount] = useState(3);
  const [bodies, setBodies] = useState<CelestialBody[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showVelocities, setShowVelocities] = useState(true);
  const [timeScale, setTimeScale] = useState(1);
  const [velocityScale, setVelocityScale] = useState(1);
  const [fragmentOnCollision, setFragmentOnCollision] = useState(true);
  const [gameOverOnCollision, setGameOverOnCollision] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);

  // Initialize on first mount
  useEffect(() => {
    setBodies(generateRandomBodies(bodyCount, velocityScale));
    setSelectedBodyId(null);
  }, []);

  // When body count changes, we generate a new scenario automatically
  useEffect(() => {
    // Only update if the length of main bodies changes (ignore fragments for this check)
    // Actually, generating a new scenario is fine.
    if (bodies.length > 0 && bodies.length !== bodyCount && bodies.every(b => !b.id.startsWith('frag'))) {
      handleGenerate();
    }
  }, [bodyCount]);

  const handleGenerate = () => {
    setIsRunning(false);
    setIsGameOver(false);
    setSelectedBodyId(null);
    setBodies(generateRandomBodies(bodyCount, velocityScale));
  };

  const handlePerturb = () => {
    setIsRunning(false);
    setIsGameOver(false);
    setSelectedBodyId(null);
    setBodies(prev => perturbBodies(prev, 0.05)); // Perturb by 0.05 units
    // Optional: Auto-start after a short delay
    setTimeout(() => setIsRunning(true), 100);
  };

  const updateMass = (id: string, newMass: number) => {
    setBodies(prev => prev.map(b => {
      if (b.id === id) {
        // Also update radius visually based on mass
        return { ...b, mass: newMass, radius: Math.cbrt(newMass) * 0.5 };
      }
      return b;
    }));
  };

  const handleCollision = (
    id1: string,
    id2: string,
    pos1: THREE.Vector3,
    vel1: THREE.Vector3,
    pos2: THREE.Vector3,
    vel2: THREE.Vector3
  ) => {
    if (gameOverOnCollision) {
      setIsGameOver(true);
      setIsRunning(false);
      return;
    }

    if (fragmentOnCollision) {
      setBodies(prev => {
        const idx1 = prev.findIndex(b => b.id === id1);
        const idx2 = prev.findIndex(b => b.id === id2);
        if (idx1 === -1 || idx2 === -1) return prev; // already processed

        const b1 = prev[idx1];
        const b2 = prev[idx2];
        
        const fragments = createFragments(b1, b2, pos1, vel1, pos2, vel2);
        const newBodies = prev.filter(b => b.id !== id1 && b.id !== id2);
        
        return [...newBodies, ...fragments];
      });
    }
  };

  return (
    <div className="w-full h-screen bg-slate-950 flex overflow-hidden font-sans">
      <div className="flex-1 relative">
        <Canvas camera={{ position: [0, 30, 50], fov: 45 }}>
          <color attach="background" args={['#020617']} />
          <ambientLight intensity={0.2} />
          <pointLight position={[100, 100, 100]} intensity={1} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <Suspense fallback={null}>
            <Physics gravity={[0, 0, 0]} timeStep={1/60 * timeScale} paused={!isRunning}>
              <NBodySystem 
                bodies={bodies} 
                isRunning={isRunning} 
                showTrajectories={showTrajectories}
                showVelocities={showVelocities}
                onCollision={handleCollision}
                selectedBodyId={selectedBodyId}
              />
            </Physics>
          </Suspense>
          
          <OrbitControls makeDefault />
        </Canvas>
        
        {!isRunning && !isGameOver && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur text-slate-300 px-4 py-2 rounded-full border border-slate-700/50 text-sm font-medium shadow-lg z-10">
            Simulation Paused
          </div>
        )}
        
        {isGameOver && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/90 backdrop-blur text-white px-8 py-6 rounded-2xl border border-red-500/50 text-center shadow-2xl z-20">
            <h2 className="text-3xl font-bold mb-2">Game Over</h2>
            <p className="text-red-200 mb-6">A collision occurred!</p>
            <button 
              onClick={handleGenerate}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors"
            >
              Restart Simulation
            </button>
          </div>
        )}
      </div>

      <ControlsPanel
        bodies={bodies}
        isRunning={isRunning}
        showTrajectories={showTrajectories}
        showVelocities={showVelocities}
        bodyCount={bodyCount}
        setBodyCount={setBodyCount}
        timeScale={timeScale}
        setTimeScale={setTimeScale}
        velocityScale={velocityScale}
        setVelocityScale={setVelocityScale}
        fragmentOnCollision={fragmentOnCollision}
        setFragmentOnCollision={setFragmentOnCollision}
        gameOverOnCollision={gameOverOnCollision}
        setGameOverOnCollision={setGameOverOnCollision}
        selectedBodyId={selectedBodyId}
        onSelectBody={setSelectedBodyId}
        onTogglePlay={() => setIsRunning(!isRunning)}
        onGenerate={handleGenerate}
        onPerturb={handlePerturb}
        onToggleTrajectories={() => setShowTrajectories(!showTrajectories)}
        onToggleVelocities={() => setShowVelocities(!showVelocities)}
        onUpdateMass={updateMass}
      />
    </div>
  );
}
