import React, { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, useBeforePhysicsStep, useRapier } from "@react-three/rapier";
import * as THREE from "three";
import { CelestialBody } from "../types";
import { PHYSICS_G } from "../constants";

interface TrajectoryProps {
  pointsRef: React.MutableRefObject<THREE.Vector3[]>;
  color: string;
}

const MAX_TRAJECTORY_POINTS = 500;

const TrajectoryLine = ({ pointsRef, color }: TrajectoryProps) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(MAX_TRAJECTORY_POINTS * 3), []);

  useFrame(() => {
    if (geometryRef.current && pointsRef.current.length > 0) {
      const posAttr = geometryRef.current.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const count = Math.min(pointsRef.current.length, MAX_TRAJECTORY_POINTS);
      // Take the last `count` points if we have more than MAX_TRAJECTORY_POINTS
      const startIndex = Math.max(0, pointsRef.current.length - MAX_TRAJECTORY_POINTS);
      for (let i = 0; i < count; i++) {
        const point = pointsRef.current[startIndex + i];
        posArray[i * 3] = point.x;
        posArray[i * 3 + 1] = point.y;
        posArray[i * 3 + 2] = point.z;
      }
      posAttr.needsUpdate = true;
      geometryRef.current.setDrawRange(0, count);
    }
  });

  return (
    <line>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_TRAJECTORY_POINTS}
          array={positions}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} opacity={0.6} transparent linewidth={2} />
    </line>
  );
};

const VelocityArrow = ({ body, bodyRefs, isRunning }: { body: CelestialBody, bodyRefs: React.MutableRefObject<Record<string, RapierRigidBody | null>>, isRunning: boolean }) => {
  const arrowRef = useRef<THREE.ArrowHelper>(null);

  useFrame(() => {
    const rb = bodyRefs.current[body.id];
    if (arrowRef.current && rb) {
      try {
        const pos = rb.translation();
        let v: THREE.Vector3;

        if (isRunning) {
          const vel = rb.linvel();
          v = new THREE.Vector3(vel.x, vel.y, vel.z);
        } else {
          v = new THREE.Vector3(...body.initialVelocity);
        }
        
        const length = v.length();
        
        arrowRef.current.position.set(pos.x, pos.y, pos.z);
        
        if (length > 0.01) {
          arrowRef.current.setDirection(v.clone().normalize());
          // Scale the arrow length down a bit so it's not too huge
          arrowRef.current.setLength(length * 0.5, Math.min(length * 0.1, 1), Math.min(length * 0.05, 0.5));
          arrowRef.current.visible = true;
        } else {
          arrowRef.current.visible = false;
        }
      } catch (e) {
        // Safe catch for accessing potentially destroyed bodies
      }
    }
  });

  return <arrowHelper ref={arrowRef} args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1, body.color]} />;
};

interface BodySystemProps {
  bodies: CelestialBody[];
  isRunning: boolean;
  showTrajectories: boolean;
  showVelocities?: boolean;
  gravityScale?: number;
  selectedBodyId?: string | null;
  physicsActions?: React.MutableRefObject<{ updateVelocity: (id: string, mag: number) => void }>;
  onCollision?: (
    id1: string,
    id2: string,
    pos1: THREE.Vector3,
    vel1: THREE.Vector3,
    pos2: THREE.Vector3,
    vel2: THREE.Vector3
  ) => void;
}

export const NBodySystem = ({ bodies, isRunning, showTrajectories, showVelocities = true, gravityScale = 1, selectedBodyId, onCollision, physicsActions }: BodySystemProps) => {
  const bodyRefs = useRef<Record<string, RapierRigidBody | null>>({});
  const { world } = useRapier();
  const { camera, controls } = useThree();
  
  // Keep track of trajectories without triggering React renders
  const trajectories = useRef<Record<string, THREE.Vector3[]>>({});
  const [, setForceRender] = useState(0);

  const frameCount = useRef(0);
  const hasLoggedSetup = useRef(false);

  useEffect(() => {
    if (physicsActions) {
      physicsActions.current.updateVelocity = (id: string, newMag: number) => {
        const rb = bodyRefs.current[id];
        if (rb) {
          const currentVel = rb.linvel();
          const v = new THREE.Vector3(currentVel.x, currentVel.y, currentVel.z);
          const currentMag = v.length();
          if (currentMag > 0.001) {
            v.normalize().multiplyScalar(newMag);
            rb.setLinvel(v, true);
          } else {
             // fallback to initialVelocity direction if current is zero
             const b = bodies.find(body => body.id === id);
             if (b) {
               const iv = new THREE.Vector3(...b.initialVelocity);
               if (iv.lengthSq() > 0.0001) {
                 iv.normalize().multiplyScalar(newMag);
                 rb.setLinvel(iv, true);
               } else {
                 rb.setLinvel(new THREE.Vector3(newMag, 0, 0), true);
               }
             }
          }
        }
      };
    }
  }, [physicsActions, bodies]);

  // Initialize trajectory arrays when bodies change
  useEffect(() => {
    trajectories.current = {};
    bodies.forEach(b => {
      trajectories.current[b.id] = [new THREE.Vector3(...b.initialPosition)];
    });
    setForceRender(prev => prev + 1); // trigger re-render to mount lines
  }, [bodies]);

  useBeforePhysicsStep(() => {
    if (!isRunning) {
      hasLoggedSetup.current = false;
      return;
    }

    if (!hasLoggedSetup.current) {
      console.log("=== N-BODY SIMULATION START ===");
      console.log(`System: ${bodies.length} bodies`);
      console.log(`Config: gravityScale=${gravityScale}`);
      console.log("Logging positions and velocities (approx. every 1 real-time second)...");
      console.log("===============================");
      fetch('/api/log/reset', { method: 'POST' }).catch(console.warn);
      hasLoggedSetup.current = true;
      frameCount.current = 0;
    }

    frameCount.current++;
    
    // Log every 60 steps
    if (frameCount.current % 60 === 0) {
        let logStr = `Step ${frameCount.current}: `;
        const logBodies: Array<{ id: string; mass: number; px: number; py: number; pz: number; vx: number; vy: number; vz: number }> = [];
        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i];
            const rb = bodyRefs.current[b.id];
            if (!rb) continue;
            try {
                const pos = rb.translation();
                const vel = rb.linvel();
                logStr += `[${i}] p:${pos.x.toFixed(1)},${pos.y.toFixed(1)},${pos.z.toFixed(1)} v:${vel.x.toFixed(1)},${vel.y.toFixed(1)},${vel.z.toFixed(1)} | `;
                logBodies.push({
                    id: b.id,
                    mass: parseFloat(b.mass.toFixed(2)),
                    px: parseFloat(pos.x.toFixed(2)),
                    py: parseFloat(pos.y.toFixed(2)),
                    pz: parseFloat(pos.z.toFixed(2)),
                    vx: parseFloat(vel.x.toFixed(2)),
                    vy: parseFloat(vel.y.toFixed(2)),
                    vz: parseFloat(vel.z.toFixed(2)),
                });
            } catch (e) {}
        }
        console.log(logStr);
        fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: frameCount.current, t: Date.now(), bodies: logBodies }),
        }).catch(console.warn);
    }
    
    // Apply gravity between all pairs of bodies
    const keys = bodies.map(b => b.id);
    
    for (let i = 0; i < keys.length; i++) {
      const b1 = bodies[i];
      const rb1 = bodyRefs.current[b1.id];
      if (!rb1) continue;

      try {
        const p1 = rb1.translation();
        const pos1 = new THREE.Vector3(p1.x, p1.y, p1.z);
        
        // Accumulate gravitational acceleration: a = G*m_other/r² (mass-independent)
        const totalAccel = new THREE.Vector3(0, 0, 0);

        for (let j = 0; j < keys.length; j++) {
          if (i === j) continue;
          const b2 = bodies[j];
          const rb2 = bodyRefs.current[b2.id];
          if (!rb2) continue;

          const p2 = rb2.translation();
          const pos2 = new THREE.Vector3(p2.x, p2.y, p2.z);

          const distVec = pos2.clone().sub(pos1);
          const distanceSq = distVec.lengthSq();
          const softDistSq = distanceSq + 15.0;

          const accel = (PHYSICS_G * gravityScale * b2.mass) / softDistSq;
          totalAccel.add(distVec.normalize().multiplyScalar(accel));
        }

        // Apply directly as Δv = a * dt — bypasses Rapier's internal mass entirely
        const dt = world.timestep;
        const vel = rb1.linvel();
        rb1.setLinvel({
          x: vel.x + totalAccel.x * dt,
          y: vel.y + totalAccel.y * dt,
          z: vel.z + totalAccel.z * dt,
        }, true);
      } catch (e) {
        // Safe catch for invalid rigid bodies
      }
    }
  });

  useFrame(() => {
    if (!isRunning) return;

    // Record trajectory points
    const keys = bodies.map(b => b.id);
    for (let i = 0; i < keys.length; i++) {
      const id = keys[i];
      const rb = bodyRefs.current[id];
      if (rb && trajectories.current[id]) {
        try {
          const p = rb.translation();
          const points = trajectories.current[id];
          
          // Add new point. Limit max points to prevent memory leak
          points.push(new THREE.Vector3(p.x, p.y, p.z));
          if (points.length > 2000) {
            points.shift();
          }
        } catch (e) {
          // Safe catch for invalid rigid bodies
        }
      }
    }
  });

  const bodiesRef = useRef(bodies);
  useEffect(() => {
    bodiesRef.current = bodies;
  }, [bodies]);

  const lastTargetPos = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    // Reset tracking position when selected body changes
    lastTargetPos.current = null;
  }, [selectedBodyId]);

  useFrame((state) => {
    if (selectedBodyId && controls && (controls as any).target) {
      // Prevent accessing bodies that have been removed/unmounted
      if (!bodiesRef.current.some(b => b.id === selectedBodyId)) {
        lastTargetPos.current = null;
        return;
      }

      const rb = bodyRefs.current[selectedBodyId];
      if (rb) {
        try {
          const p = rb.translation();
          const currentPos = new THREE.Vector3(p.x, p.y, p.z);
          
          if (lastTargetPos.current) {
            // Tight tracking: move camera by the exact delta the object moved
            const delta = currentPos.clone().sub(lastTargetPos.current);
            state.camera.position.add(delta);
          }
          
          // Firmly set the target to the object's position to avoid lagging
          (controls as any).target.copy(currentPos);
          (controls as any).update();
          
          lastTargetPos.current = currentPos;
        } catch (e) {
          // In case Rapier throws "recursive use of an object detected" due to unmounting
          console.warn("Could not track body:", e);
        }
      }
    } else {
      lastTargetPos.current = null;
    }
  });

  return (
    <>
      {bodies.map((body) => (
        <RigidBody
          key={body.id}
          name={body.id}
          ref={(ref) => {
            if (ref) {
              bodyRefs.current[body.id] = ref;
            } else {
              delete bodyRefs.current[body.id];
            }
          }}
          type="dynamic"
          position={body.initialPosition}
          linearVelocity={body.initialVelocity}
          mass={body.mass}
          colliders="ball"
          restitution={0.5}
          friction={0}
          onCollisionEnter={(payload) => {
            if (!isRunning) return;
            const otherId = payload.other.rigidBodyObject?.name;
            if (otherId && body.id < otherId) {
              const rb1 = bodyRefs.current[body.id];
              const rb2 = bodyRefs.current[otherId];
              if (rb1 && rb2) {
                try {
                  const p1 = rb1.translation();
                  const v1 = rb1.linvel();
                  const p2 = rb2.translation();
                  const v2 = rb2.linvel();
                  
                  onCollision?.(
                    body.id,
                    otherId,
                    new THREE.Vector3(p1.x, p1.y, p1.z),
                    new THREE.Vector3(v1.x, v1.y, v1.z),
                    new THREE.Vector3(p2.x, p2.y, p2.z),
                    new THREE.Vector3(v2.x, v2.y, v2.z)
                  );
                } catch (e) {
                  // Safe catch for bodies in destruction
                }
              }
            }
          }}
        >
          <mesh>
            <sphereGeometry args={[body.radius, 32, 32]} />
            <meshStandardMaterial 
              color={body.color} 
              emissive={body.color} 
              emissiveIntensity={2}
              roughness={0.2} 
              metalness={0.8} 
            />
            <pointLight color={body.color} intensity={body.mass * 10} distance={50} decay={2} />
          </mesh>
        </RigidBody>
      ))}

      {showTrajectories && Object.keys(trajectories.current).length > 0 && bodies.map((body) => {
        // We use a small hack to pass a stable ref to the TrajectoryLine component
        const pointsRef = { current: trajectories.current[body.id] || [] };
        return <TrajectoryLine key={`traj-${body.id}`} pointsRef={pointsRef} color={body.color} />;
      })}

      {showVelocities && bodies.map((body) => (
        <VelocityArrow key={`vel-${body.id}`} body={body} bodyRefs={bodyRefs} isRunning={isRunning} />
      ))}
    </>
  );
};
