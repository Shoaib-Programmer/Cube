import * as THREE from "three";

// Rubik's cube colors
export type CubeColor =
  | "white"
  | "yellow"
  | "red"
  | "orange"
  | "blue"
  | "green"
  | "black";

// Face colors for each cube
export interface FaceColors {
  front: CubeColor; // +Z
  back: CubeColor; // -Z
  right: CubeColor; // +X
  left: CubeColor; // -X
  top: CubeColor; // +Y
  bottom: CubeColor; // -Y
}

// Type for each small cube's state
export interface CubeState {
  position: THREE.Vector3;
  rotationMatrix: THREE.Matrix4;
  id: string;
  originalCoords: { x: number; y: number; z: number };
  faceColors: FaceColors;
}

// Type for the axis of rotation
export type Axis = "x" | "y" | "z";

// Type for a move definition
export interface Move {
  axis: Axis;
  layer: number;
  direction: 1 | -1;
}

// Type for the currently executing move
export interface CurrentMove extends Move {
  rotationAngle: number;
}

// Type for device-specific rendering settings
export interface DeviceSettings {
  smoothness: number;
  castShadow: boolean;
  receiveShadow: boolean;
}

// Type for manual cube control API
export interface CubeControlAPI {
  // Rotate a face of the cube
  rotateFace: (axis: Axis, layer: number, direction: 1 | -1) => Promise<void>;
  // Rotate the entire cube
  rotateCube: (x?: number, y?: number, z?: number) => void;
  // Execute a sequence of moves
  executeSequence: (moves: Move[]) => Promise<void>;
  // Check if the cube is currently being controlled manually
  isManuallyControlled: () => boolean;
  // Solve the cube using API
  solveCube: () => Promise<{
    solution: string[];
    move_count: number;
    status: string;
    solve_time_ms: number;
    facelet_string: string;
  }>;
  // Get current cube state for debugging
  getCurrentState: () => number[][][];
}

// Type for the imperative handle ref exposed by the RubiksCubeModel
export interface RubiksCubeRef {
  reset: () => void;
  group: THREE.Group | null;
  // Control API (only available when animate is false)
  controls?: CubeControlAPI;
}
