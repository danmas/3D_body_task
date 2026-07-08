import React, { useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { NBodySystem } from './components/NBodySystem';
import { ControlsPanel } from './components/ControlsPanel';
import * as THREE from 'three';
import {
  CAMERA_POSITION,
  CAMERA_FOV,
  CAMERA_FAR,
  STARS_RADIUS,
  STARS_DEPTH,
  STARS_COUNT,
  STARS_FACTOR,
  ORBIT_MAX_DISTANCE,
} from './constants';
import { useSimStore } from './store';

export default function App() {
  const bodies = useSimStore(s => s.bodies);
  const bodyCount = useSimStore(s => s.bodyCount);
  const isRunning = useSimStore(s => s.isRunning);
  const showTrajectories = useSimStore(s => s.showTrajectories);
  const showVelocities = useSimStore(s => s.showVelocities);
  const timeScale = useSimStore(s => s.timeScale);
  const velocityScale = useSimStore(s => s.velocityScale);
  const gravityScale = useSimStore(s => s.gravityScale);
  const fragmentOnCollision = useSimStore(s => s.fragmentOnCollision);
  const gameOverOnCollision = useSimStore(s => s.gameOverOnCollision);
  const isGameOver = useSimStore(s => s.isGameOver);
  const selectedBodyId = useSimStore(s => s.selectedBodyId);

  const generate = useSimStore(s => s.generate);
  const perturb = useSimStore(s => s.perturb);
  const togglePlay = useSimStore(s => s.togglePlay);
  const toggleTrajectories = useSimStore(s => s.toggleTrajectories);
  const toggleVelocities = useSimStore(s => s.toggleVelocities);
  const setBodyCount = useSimStore(s => s.setBodyCount);
  const setTimeScale = useSimStore(s => s.setTimeScale);
  const setVelocityScale = useSimStore(s => s.setVelocityScale);
  const setGravityScale = useSimStore(s => s.setGravityScale);
  const setSelectedBodyId = useSimStore(s => s.setSelectedBodyId);
  const setFragmentOnCollision = useSimStore(s => s.setFragmentOnCollision);
  const setGameOverOnCollision = useSimStore(s => s.setGameOverOnCollision);
  const updateMass = useSimStore(s => s.updateMass);
  const handleCollision = useSimStore(s => s.handleCollision);

  const physicsActions = useRef<{ updateVelocity: (id: string, mag: number) => void }>({ updateVelocity: () => {} });

  // Initialize on first mount
  useEffect(() => {
    generate();
  }, []);

  // When body count changes, regenerate
  useEffect(() => {
    if (bodies.length > 0 && bodies.length !== bodyCount && bodies.every(b => !b.id.startsWith('frag'))) {
      generate();
    }
  }, [bodyCount]);

  const updateVelocity = (id: string, newVelocity: number) => {
    physicsActions.current.updateVelocity(id, newVelocity);
    useSimStore.setState(s => ({
      bodies: s.bodies.map(b => {
        if (b.id !== id) return b;
        const currentMag = Math.sqrt(b.initialVelocity[0] ** 2 + b.initialVelocity[1] ** 2 + b.initialVelocity[2] ** 2);
        if (currentMag < 0.0001) return b;
        const scale = newVelocity / currentMag;
        return {
          ...b,
          initialVelocity: [
            b.initialVelocity[0] * scale,
            b.initialVelocity[1] * scale,
            b.initialVelocity[2] * scale,
          ] as [number, number, number],
        };
      }),
    }));
  };

  const onCollision = (
    id1: string,
    id2: string,
    pos1: THREE.Vector3,
    vel1: THREE.Vector3,
    pos2: THREE.Vector3,
    vel2: THREE.Vector3,
  ) => handleCollision(id1, id2, pos1, vel1, pos2, vel2);

  return (
    <div className="w-full h-screen bg-slate-950 flex overflow-hidden font-sans">
      <div className="flex-1 relative">
        <Canvas camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV, far: CAMERA_FAR }}>
          <color attach="background" args={['#020617']} />
          <ambientLight intensity={0.2} />
          <pointLight position={[100, 100, 100]} intensity={1} />
          <Stars radius={STARS_RADIUS} depth={STARS_DEPTH} count={STARS_COUNT} factor={STARS_FACTOR} saturation={0} fade speed={1} />

          <Suspense fallback={null}>
            <Physics gravity={[0, 0, 0]} timeStep={1/60 * timeScale} paused={!isRunning}>
              <NBodySystem
                bodies={bodies}
                isRunning={isRunning}
                showTrajectories={showTrajectories}
                showVelocities={showVelocities}
                gravityScale={gravityScale}
                onCollision={onCollision}
                selectedBodyId={selectedBodyId}
                physicsActions={physicsActions}
              />
            </Physics>
          </Suspense>

          <OrbitControls makeDefault maxDistance={ORBIT_MAX_DISTANCE} />
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
              onClick={generate}
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
        gravityScale={gravityScale}
        setGravityScale={setGravityScale}
        fragmentOnCollision={fragmentOnCollision}
        setFragmentOnCollision={setFragmentOnCollision}
        gameOverOnCollision={gameOverOnCollision}
        setGameOverOnCollision={setGameOverOnCollision}
        selectedBodyId={selectedBodyId}
        onSelectBody={setSelectedBodyId}
        onTogglePlay={togglePlay}
        onGenerate={generate}
        onPerturb={perturb}
        onToggleTrajectories={toggleTrajectories}
        onToggleVelocities={toggleVelocities}
        onUpdateMass={updateMass}
        onUpdateVelocity={updateVelocity}
      />
    </div>
  );
}
