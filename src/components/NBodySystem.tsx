import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, useBeforePhysicsStep } from "@react-three/rapier";
import * as THREE from "three";
import { CelestialBody } from "../types";

const G = 50; // Gravitational constant for simulation

interface TrajectoryProps {
  pointsRef: React.MutableRefObject<THREE.Vector3[]>;
  color: string;
}

const TrajectoryLine = ({ pointsRef, color }: TrajectoryProps) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useFrame(() => {
    if (geometryRef.current && pointsRef.current.length > 1) {
      geometryRef.current.setFromPoints(pointsRef.current);
    }
  });

  return (
    <line>
      <bufferGeometry ref={geometryRef} />
      <lineBasicMaterial color={color} opacity={0.6} transparent linewidth={2} />
    </line>
  );
};

const VelocityArrow = ({ bodyId, bodyRefs, color }: { bodyId: string, bodyRefs: React.MutableRefObject<Record<string, RapierRigidBody | null>>, color: string }) => {
  const arrowRef = useRef<THREE.ArrowHelper>(null);

  useFrame(() => {
    const rb = bodyRefs.current[bodyId];
    if (arrowRef.current && rb) {
      const vel = rb.linvel();
      const pos = rb.translation();
      
      const v = new THREE.Vector3(vel.x, vel.y, vel.z);
      const length = v.length();
      
      arrowRef.current.position.set(pos.x, pos.y, pos.z);
      
      if (length > 0.01) {
        arrowRef.current.setDirection(v.normalize());
        // Scale the arrow length down a bit so it's not too huge
        arrowRef.current.setLength(length * 0.5, Math.min(length * 0.1, 1), Math.min(length * 0.05, 0.5));
        arrowRef.current.visible = true;
      } else {
        arrowRef.current.visible = false;
      }
    }
  });

  return <arrowHelper ref={arrowRef} args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1, color]} />;
};

interface BodySystemProps {
  bodies: CelestialBody[];
  isRunning: boolean;
  showTrajectories: boolean;
  showVelocities?: boolean;
  onCollision?: (
    id1: string,
    id2: string,
    pos1: THREE.Vector3,
    vel1: THREE.Vector3,
    pos2: THREE.Vector3,
    vel2: THREE.Vector3
  ) => void;
}

export const NBodySystem = ({ bodies, isRunning, showTrajectories, showVelocities = true, onCollision }: BodySystemProps) => {
  const bodyRefs = useRef<Record<string, RapierRigidBody | null>>({});
  
  // Keep track of trajectories without triggering React renders
  const trajectories = useRef<Record<string, THREE.Vector3[]>>({});
  const [, setForceRender] = useState(0);

  // Initialize trajectory arrays when bodies change
  useEffect(() => {
    trajectories.current = {};
    bodies.forEach(b => {
      trajectories.current[b.id] = [new THREE.Vector3(...b.initialPosition)];
    });
    setForceRender(prev => prev + 1); // trigger re-render to mount lines
  }, [bodies]);

  useBeforePhysicsStep(() => {
    if (!isRunning) return;
    
    // Apply gravity between all pairs of bodies
    const keys = bodies.map(b => b.id);
    
    for (let i = 0; i < keys.length; i++) {
      const b1 = bodies[i];
      const rb1 = bodyRefs.current[b1.id];
      if (!rb1) continue;

      const p1 = rb1.translation();
      const pos1 = new THREE.Vector3(p1.x, p1.y, p1.z);
      
      const totalForce = new THREE.Vector3(0, 0, 0);

      for (let j = 0; j < keys.length; j++) {
        if (i === j) continue;
        const b2 = bodies[j];
        const rb2 = bodyRefs.current[b2.id];
        if (!rb2) continue;

        const p2 = rb2.translation();
        const pos2 = new THREE.Vector3(p2.x, p2.y, p2.z);

        const distVec = pos2.clone().sub(pos1);
        const distanceSq = distVec.lengthSq();
        
        // Softening parameter to avoid infinite forces at zero distance
        // Increased softening to prevent extreme slingshots when bodies get close
        const softDistSq = distanceSq + 15.0; 
        
        const forceMagnitude = (G * b1.mass * b2.mass) / softDistSq;
        const forceDir = distVec.normalize();
        
        totalForce.add(forceDir.multiplyScalar(forceMagnitude));
      }
      
      rb1.addForce(totalForce, true);
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
        const p = rb.translation();
        const points = trajectories.current[id];
        
        // Add new point. Limit max points to prevent memory leak
        points.push(new THREE.Vector3(p.x, p.y, p.z));
        if (points.length > 2000) {
          points.shift();
        }
      }
    }
  });

  return (
    <>
      {bodies.map((body) => (
        <RigidBody
          key={body.id}
          name={body.id}
          ref={(ref) => {
            bodyRefs.current[body.id] = ref;
          }}
          type={isRunning ? "dynamic" : "kinematicPosition"}
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
        <VelocityArrow key={`vel-${body.id}`} bodyId={body.id} bodyRefs={bodyRefs} color={body.color} />
      ))}
    </>
  );
};
