export type Vector3Tuple = [number, number, number];

export interface CelestialBody {
  id: string;
  mass: number;
  initialPosition: Vector3Tuple;
  initialVelocity: Vector3Tuple;
  color: string;
  radius: number;
}
