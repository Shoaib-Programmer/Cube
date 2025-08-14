"use client";

import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useCallback,
  useMemo,
} from "react";
import * as THREE from "three";
import {
  CubeState,
  RubiksCubeRef,
  FaceColors,
  CubeColor,
  Axis,
} from "@/types/rubik-s-cube";

interface SimpleRubiksCubeProps
  extends React.ComponentPropsWithoutRef<"group"> {
  selectedColor?: CubeColor;
}

export const SimpleRubiksCube = forwardRef<
  RubiksCubeRef,
  SimpleRubiksCubeProps
>(({ selectedColor = "red", ...groupProps }, ref) => {
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const [cubes, setCubes] = useState<CubeState[]>([]);

  // Direct cube state tracking - 6 faces × 3×3 grid
  // Face order: [Up, Right, Front, Down, Left, Back]
  const [cubeState, setCubeState] = useState<number[][][]>([
    [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ], // Up (white)
    [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ], // Right (red)
    [
      [2, 2, 2],
      [2, 2, 2],
      [2, 2, 2],
    ], // Front (green)
    [
      [3, 3, 3],
      [3, 3, 3],
      [3, 3, 3],
    ], // Down (yellow)
    [
      [4, 4, 4],
      [4, 4, 4],
      [4, 4, 4],
    ], // Left (orange)
    [
      [5, 5, 5],
      [5, 5, 5],
      [5, 5, 5],
    ], // Back (blue)
  ]);

  // Color mapping
  const colors: Record<CubeColor, string> = {
    white: "#ffffff",
    yellow: "#ffff00",
    red: "#ff0000",
    orange: "#ff8000",
    blue: "#0000ff",
    green: "#00ff00",
    black: "#222222",
  };

  // Color to number mapping for API
  const colorToNumber: Record<CubeColor, number> = useMemo(
    () => ({
      white: 0, // Up face
      red: 1, // Right face
      green: 2, // Front face
      yellow: 3, // Down face
      orange: 4, // Left face
      blue: 5, // Back face
      black: -1, // Not a face color (internal cubes)
    }),
    [],
  );

  // Helper: compute cube state from current cube transforms and sticker colors
  const computeCubeStateFromCubes = useCallback(
    (allCubes: CubeState[]): number[][][] => {
      // Face order: [Up, Right, Front, Down, Left, Back]
      const faces: number[][][] = Array.from({ length: 6 }, () =>
        Array.from({ length: 3 }, () => Array(3).fill(-1)),
      );

      const faceIndexMap = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 } as const;

      const localNormals: Record<keyof FaceColors, THREE.Vector3> = {
        right: new THREE.Vector3(1, 0, 0),
        left: new THREE.Vector3(-1, 0, 0),
        top: new THREE.Vector3(0, 1, 0),
        bottom: new THREE.Vector3(0, -1, 0),
        front: new THREE.Vector3(0, 0, 1),
        back: new THREE.Vector3(0, 0, -1),
      };

      const toIndex = (v: number) => Math.max(0, Math.min(2, v + 1)); // -1->0, 0->1, 1->2

      allCubes.forEach((cube) => {
        const pos = cube.position.clone();
        // Ensure integer grid after animations
        pos.set(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z));

        (Object.keys(cube.faceColors) as (keyof FaceColors)[]).forEach(
          (faceKey) => {
            const colorName = cube.faceColors[faceKey];
            if (colorName === "black") return;

            const local = localNormals[faceKey].clone();
            const world = local.applyMatrix4(cube.rotationMatrix).normalize();

            const absx = Math.abs(world.x);
            const absy = Math.abs(world.y);
            const absz = Math.abs(world.z);

            let faceLabel: keyof typeof faceIndexMap;
            if (absy >= absx && absy >= absz) {
              faceLabel = world.y > 0 ? "U" : "D";
            } else if (absx >= absy && absx >= absz) {
              faceLabel = world.x > 0 ? "R" : "L";
            } else {
              faceLabel = world.z > 0 ? "F" : "B";
            }

            const faceIdx = faceIndexMap[faceLabel];

            const x = Math.round(pos.x);
            const y = Math.round(pos.y);
            const z = Math.round(pos.z);

            let row = 0;
            let col = 0;
            switch (faceLabel) {
              case "U":
                // Viewed from +Y looking down; top row corresponds to z=+1
                row = 1 - z; // z: +1->0, 0->1, -1->2
                col = toIndex(x);
                break;
              case "D":
                // Viewed from -Y looking up; top row corresponds to z=-1
                row = z + 1; // z: -1->0, 0->1, +1->2
                col = toIndex(x);
                break;
              case "F":
                // Viewed from +Z; top row is y=+1
                row = 1 - y; // y: +1->0, 0->1, -1->2
                col = toIndex(x);
                break;
              case "B":
                // Viewed from -Z; mirror horizontally
                row = 1 - y; // y: +1->0, 0->1, -1->2
                col = 1 - x; // x: -1->2, 0->1, +1->0
                break;
              case "R":
                // Viewed from +X; left-to-right goes from -Z to +Z
                row = 1 - y;
                col = 1 - z; // z: -1->2, 0->1, +1->0
                break;
              case "L":
                // Viewed from -X; left-to-right goes from +Z to -Z
                row = 1 - y;
                col = z + 1; // z: -1->0, 0->1, +1->2
                break;
            }

            faces[faceIdx][row][col] = colorToNumber[colorName];
          },
        );
      });

      return faces;
    },
    [colorToNumber],
  );

  // Initialize 3x3x3 cube with standard colors
  const initializeCubes = useCallback((): CubeState[] => {
    const cubes: CubeState[] = [];
    const positions = [-1, 0, 1];

    for (const x of positions) {
      for (const y of positions) {
        for (const z of positions) {
          cubes.push({
            position: new THREE.Vector3(x, y, z),
            rotationMatrix: new THREE.Matrix4().identity(),
            id: `cube-${x}-${y}-${z}`,
            originalCoords: { x, y, z },
            faceColors: {
              front: z === 1 ? "green" : "black", // Front face: green
              back: z === -1 ? "blue" : "black", // Back face: blue
              right: x === 1 ? "red" : "black", // Right face: red
              left: x === -1 ? "orange" : "black", // Left face: orange
              top: y === 1 ? "white" : "black", // Top face: white
              bottom: y === -1 ? "yellow" : "black", // Bottom face: yellow
            },
          });
        }
      }
    }
    return cubes;
  }, []);

  // Handle face click to color faces
  const handleFaceClick = useCallback(
    (cubeId: string, face: keyof FaceColors) => {
      setCubes((prevCubes) =>
        prevCubes.map((cube) =>
          cube.id === cubeId
            ? {
                ...cube,
                faceColors: { ...cube.faceColors, [face]: selectedColor },
              }
            : cube,
        ),
      );
    },
    [selectedColor],
  );

  // Helper: get cubes in a specific layer
  const getCubesInLayer = useCallback(
    (axis: Axis, layer: number): CubeState[] => {
      return cubes.filter((cube) => {
        const coord =
          axis === "x"
            ? cube.position.x
            : axis === "y"
              ? cube.position.y
              : cube.position.z;
        return Math.abs(coord - layer) < 0.1;
      });
    },
    [cubes],
  );

  // Rotate a face/layer and update cube state
  const rotateFace = useCallback(
    async (axis: Axis, layer: number, direction: 1 | -1) => {
      const layerCubes = getCubesInLayer(axis, layer);
      const angle = (Math.PI / 2) * direction;

      // Create rotation matrix
      const rotationMatrix = new THREE.Matrix4();
      if (axis === "x") {
        rotationMatrix.makeRotationX(angle);
      } else if (axis === "y") {
        rotationMatrix.makeRotationY(angle);
      } else {
        rotationMatrix.makeRotationZ(angle);
      }

      // Update cube positions and rotations
      setCubes((prevCubes) =>
        prevCubes.map((cube) => {
          if (layerCubes.some((layerCube) => layerCube.id === cube.id)) {
            // Apply rotation to position and rotation matrix
            const newPosition = cube.position
              .clone()
              .applyMatrix4(rotationMatrix);
            const newRotationMatrix = new THREE.Matrix4().multiplyMatrices(
              rotationMatrix,
              cube.rotationMatrix,
            );

            // Round position to avoid floating point errors
            newPosition.set(
              Math.round(newPosition.x),
              Math.round(newPosition.y),
              Math.round(newPosition.z),
            );

            return {
              ...cube,
              position: newPosition,
              rotationMatrix: newRotationMatrix,
            };
          }
          return cube;
        }),
      );

      // Cube state now derived from cubes; no manual facelet mutation here
      // It will be recomputed in the useEffect reacting to `cubes` changes.
    },
    [getCubesInLayer],
  );

  // Rotate the entire cube
  const rotateCube = useCallback(
    (x: number = 0, y: number = 0, z: number = 0) => {
      if (mainGroupRef.current) {
        mainGroupRef.current.rotation.x += x;
        mainGroupRef.current.rotation.y += y;
        mainGroupRef.current.rotation.z += z;
      }
    },
    [],
  );

  // Execute a sequence of moves
  const executeSequence = useCallback(
    async (moves: Array<{ axis: Axis; layer: number; direction: 1 | -1 }>) => {
      for (const move of moves) {
        rotateFace(move.axis, move.layer, move.direction);
        // Small delay between moves to see the progression
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    },
    [rotateFace],
  );

  // Convert cube state to API format
  const getCubeStateForAPI = useCallback(() => {
    // Derive directly from current cubes to avoid drift
    return computeCubeStateFromCubes(cubes);
  }, [cubes, computeCubeStateFromCubes]);

  // Validate cube state before sending to API
  const validateCubeState = useCallback((faces: number[][][]) => {
    // Check dimensions
    if (faces.length !== 6) {
      return { valid: false, error: "Cube must have exactly 6 faces" };
    }

    // Count colors
    const colorCounts: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
      const face = faces[faceIdx];
      if (face.length !== 3) {
        return { valid: false, error: `Face ${faceIdx} must have 3 rows` };
      }

      for (let row = 0; row < 3; row++) {
        if (face[row].length !== 3) {
          return {
            valid: false,
            error: `Face ${faceIdx}, row ${row} must have 3 cells`,
          };
        }

        for (let col = 0; col < 3; col++) {
          const color = face[row][col];
          if (color < 0 || color > 5) {
            return {
              valid: false,
              error: `Invalid color value: ${color}. Must be 0-5`,
            };
          }
          colorCounts[color]++;
        }
      }
    }

    // Check color counts - each color should appear exactly 9 times
    for (let color = 0; color < 6; color++) {
      if (colorCounts[color] !== 9) {
        return {
          valid: false,
          error: `Color ${color} appears ${colorCounts[color]} times, should be 9. Color counts: ${JSON.stringify(colorCounts)}`,
        };
      }
    }

    // Check center squares are unique
    const centerColors = [];
    for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
      centerColors.push(faces[faceIdx][1][1]);
    }

    if (new Set(centerColors).size !== 6) {
      return {
        valid: false,
        error: `Center squares must be unique colors. Found centers: ${centerColors}`,
      };
    }

    return { valid: true, error: null };
  }, []);

  // Solve cube using API
  const solveCube = useCallback(async () => {
    try {
      const cubeState = getCubeStateForAPI();

      // Validate cube state before sending
      const validation = validateCubeState(cubeState);
      if (!validation.valid) {
        throw new Error(`Invalid cube state: ${validation.error}`);
      }

      // Debug: Log the cube state
      console.log("Cube state being sent to API:", cubeState);
      console.log("Current cubes positions and colors:");
      cubes.forEach((cube) => {
        console.log(
          `Cube ${cube.id}: pos(${cube.position.x}, ${cube.position.y}, ${cube.position.z})`,
          cube.faceColors,
        );
      });

      const response = await fetch("http://localhost:8000/solve/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cube: cubeState,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`;
          }
        } catch {
          // If we can't parse as JSON, use the raw text
          if (errorText) {
            errorMessage = errorText;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.status === "success") {
        console.log("Solution found:", result.solution);
        console.log("Move count:", result.move_count);
        console.log("Solve time:", result.solve_time_ms, "ms");
        console.log("Facelet string:", result.facelet_string);
        return result;
      } else {
        const errorMessage =
          result.error || result.message || "Solver returned error";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error solving cube:", error);
      throw error;
    }
  }, [getCubeStateForAPI, cubes, validateCubeState]);

  // Get current cube state for debugging
  const getCurrentState = useCallback(() => {
    const cubeStateForAPI = computeCubeStateFromCubes(cubes);
    console.log("Current cube state:", cubeStateForAPI);
    console.log("Cube state summary:");
    const faceNames = [
      "Up (White)",
      "Right (Red)",
      "Front (Green)",
      "Down (Yellow)",
      "Left (Orange)",
      "Back (Blue)",
    ];
    cubeStateForAPI.forEach((face: number[][], faceIdx: number) => {
      console.log(`${faceNames[faceIdx]}:`);
      face.forEach((row: number[], rowIdx: number) => {
        console.log(`  Row ${rowIdx}: [${row.join(", ")}]`);
      });
    });

    console.log("Internal cube state tracking:");
    cubeState.forEach((face: number[][], faceIdx: number) => {
      console.log(`${faceNames[faceIdx]}:`);
      face.forEach((row: number[], rowIdx: number) => {
        console.log(`  Row ${rowIdx}: [${row.join(", ")}]`);
      });
    });

    console.log("Current cubes detailed info:");
    cubes.forEach((cube) => {
      const pos = cube.position;
      console.log(
        `${cube.id}: pos(${pos.x}, ${pos.y}, ${pos.z})`,
        "faces:",
        cube.faceColors,
        "rotation matrix elements:",
        cube.rotationMatrix.elements
          .slice(0, 12)
          .map((v) => Math.round(v * 1000) / 1000),
      );
    });
    return cubeStateForAPI;
  }, [cubes, computeCubeStateFromCubes, cubeState]);

  // Reset function
  const resetCube = useCallback(() => {
    setCubes(initializeCubes());
    setCubeState([
      [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ], // Up (white)
      [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ], // Right (red)
      [
        [2, 2, 2],
        [2, 2, 2],
        [2, 2, 2],
      ], // Front (green)
      [
        [3, 3, 3],
        [3, 3, 3],
        [3, 3, 3],
      ], // Down (yellow)
      [
        [4, 4, 4],
        [4, 4, 4],
        [4, 4, 4],
      ], // Left (orange)
      [
        [5, 5, 5],
        [5, 5, 5],
        [5, 5, 5],
      ], // Back (blue)
    ]);
    if (mainGroupRef.current) {
      mainGroupRef.current.rotation.set(0, 0, 0);
    }
  }, [initializeCubes]);

  // Single cube component with click handlers
  const CubeComponent = ({ cube }: { cube: CubeState }) => {
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(
      cube.rotationMatrix,
    );

    return (
      <group
        position={[
          cube.position.x * 0.81,
          cube.position.y * 0.81,
          cube.position.z * 0.81,
        ]}
        quaternion={quaternion}
      >
        {/* Main cube body */}
        <mesh>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshLambertMaterial color={colors.black} />
        </mesh>

        {/* Face stickers */}
        {cube.faceColors.right !== "black" && (
          <mesh position={[0.401, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.7, 0.7]} />
            <meshLambertMaterial color={colors[cube.faceColors.right]} />
          </mesh>
        )}

        {cube.faceColors.left !== "black" && (
          <mesh position={[-0.401, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.7, 0.7]} />
            <meshLambertMaterial color={colors[cube.faceColors.left]} />
          </mesh>
        )}

        {cube.faceColors.top !== "black" && (
          <mesh position={[0, 0.401, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.7, 0.7]} />
            <meshLambertMaterial color={colors[cube.faceColors.top]} />
          </mesh>
        )}

        {cube.faceColors.bottom !== "black" && (
          <mesh position={[0, -0.401, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.7, 0.7]} />
            <meshLambertMaterial color={colors[cube.faceColors.bottom]} />
          </mesh>
        )}

        {cube.faceColors.front !== "black" && (
          <mesh position={[0, 0, 0.401]}>
            <planeGeometry args={[0.7, 0.7]} />
            <meshLambertMaterial color={colors[cube.faceColors.front]} />
          </mesh>
        )}

        {cube.faceColors.back !== "black" && (
          <mesh position={[0, 0, -0.401]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.7, 0.7]} />
            <meshLambertMaterial color={colors[cube.faceColors.back]} />
          </mesh>
        )}

        {/* Invisible click handlers for each face */}
        <mesh
          position={[0.5, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          onClick={() => handleFaceClick(cube.id, "right")}
        >
          <planeGeometry args={[0.8, 0.8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        <mesh
          position={[-0.5, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          onClick={() => handleFaceClick(cube.id, "left")}
        >
          <planeGeometry args={[0.8, 0.8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        <mesh
          position={[0, 0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={() => handleFaceClick(cube.id, "top")}
        >
          <planeGeometry args={[0.8, 0.8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        <mesh
          position={[0, -0.5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          onClick={() => handleFaceClick(cube.id, "bottom")}
        >
          <planeGeometry args={[0.8, 0.8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        <mesh
          position={[0, 0, 0.5]}
          onClick={() => handleFaceClick(cube.id, "front")}
        >
          <planeGeometry args={[0.8, 0.8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        <mesh
          position={[0, 0, -0.5]}
          onClick={() => handleFaceClick(cube.id, "back")}
        >
          <planeGeometry args={[0.8, 0.8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    );
  };

  // Expose API through ref
  React.useImperativeHandle(
    ref,
    () => ({
      reset: resetCube,
      group: mainGroupRef.current,
      controls: {
        rotateFace,
        rotateCube,
        executeSequence,
        isManuallyControlled: () => true,
        solveCube,
        getCurrentState,
      },
    }),
    [
      resetCube,
      rotateFace,
      rotateCube,
      executeSequence,
      solveCube,
      getCurrentState,
    ],
  );

  // Initialize cubes on mount
  useEffect(() => {
    setCubes(initializeCubes());
  }, [initializeCubes]);

  // Keep cubeState derived from current cubes/stickers to stay in sync with visuals
  useEffect(() => {
    if (cubes.length) {
      setCubeState(computeCubeStateFromCubes(cubes));
    }
  }, [cubes, computeCubeStateFromCubes]);

  return (
    <group ref={mainGroupRef} {...groupProps}>
      {cubes.map((cube) => (
        <CubeComponent key={cube.id} cube={cube} />
      ))}
    </group>
  );
});

SimpleRubiksCube.displayName = "SimpleRubiksCube";
