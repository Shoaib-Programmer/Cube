"use client";

import React, { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { SimpleRubiksCube } from "@/components/rubik-s-cube/simple-rubik-s-cube";
import { RubiksCubeRef, CubeColor, Axis } from "@/types/rubik-s-cube";

import Link from "next/link";
import { History } from "lucide-react";

export default function SolverPage() {
  const cubeRef = useRef<RubiksCubeRef>(null);
  const [selectedColor, setSelectedColor] = useState<CubeColor>("red");
  const [isSolving, setIsSolving] = useState(false);
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);
  const [solveTime, setSolveTime] = useState<number | null>(null);

  const colorMap: Record<CubeColor, string> = {
    white: "#ffffff",
    yellow: "#ffff00",
    red: "#ff0000",
    orange: "#ff8000",
    blue: "#0000ff",
    green: "#00ff00",
    black: "#000000",
  };

  const resetCube = () => {
    if (!cubeRef.current) return;
    cubeRef.current.reset();
  };

  const rotateFace = (axis: Axis, layer: number, direction: 1 | -1) => {
    if (!cubeRef.current?.controls) return;
    cubeRef.current.controls.rotateFace(axis, layer, direction);
  };

  const rotateCube = (x: number = 0, y: number = 0, z: number = 0) => {
    if (!cubeRef.current?.controls) return;
    cubeRef.current.controls.rotateCube(x, y, z);
  };

  const solveCube = async () => {
    if (!cubeRef.current?.controls) return;

    setIsSolving(true);
    try {
      const result = await cubeRef.current.controls.solveCube();
      setSolutionMoves(result.solution);
      setSolveTime(result.solve_time_ms);
      console.log(
        `Solution found in ${result.move_count} moves:`,
        result.solution,
      );
      console.log(`Solve time: ${result.solve_time_ms}ms`);
    } catch (error) {
      alert("Failed to solve cube. " + error);
    } finally {
      setIsSolving(false);
    }
  };

  const debugCubeState = () => {
    if (!cubeRef.current?.controls) return;
    cubeRef.current.controls.getCurrentState();
  };

  const ColorPicker = () => {
    const colors: CubeColor[] = [
      "white",
      "yellow",
      "red",
      "orange",
      "blue",
      "green",
      "black",
    ];
    return (
      <div className="mb-4">
        <p className="text-xs font-semibold mb-2 text-gray-300">Select Color</p>
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-6 h-6 rounded-lg border-2 transition-all duration-150 ${selectedColor === color ? "border-white scale-110" : "border-gray-700"}`}
              style={{ backgroundColor: colorMap[color] }}
              title={color}
            />
          ))}
        </div>
      </div>
    );
  };

  const Controls = () => (
    <div className="mb-4">
      <p className="text-xs font-semibold mb-2 text-gray-300">Face Rotations</p>
      <div className="grid grid-cols-3 gap-1 mb-3">
        <button
          onClick={() => rotateFace("x", 1, 1)}
          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg"
        >
          R
        </button>
        <button
          onClick={() => rotateFace("x", 1, -1)}
          className="px-2 py-1 bg-red-800 hover:bg-red-900 text-white text-xs rounded-lg"
        >
          R'
        </button>
        <button
          onClick={() => rotateFace("x", -1, 1)}
          className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-lg"
        >
          L
        </button>
        <button
          onClick={() => rotateFace("x", -1, -1)}
          className="px-2 py-1 bg-orange-800 hover:bg-orange-900 text-white text-xs rounded-lg"
        >
          L'
        </button>
        <button
          onClick={() => rotateFace("y", 1, 1)}
          className="px-2 py-1 bg-white text-black text-xs rounded-lg"
        >
          U
        </button>
        <button
          onClick={() => rotateFace("y", 1, -1)}
          className="px-2 py-1 bg-gray-200 text-black text-xs rounded-lg"
        >
          U'
        </button>
        <button
          onClick={() => rotateFace("y", -1, 1)}
          className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-xs rounded-lg"
        >
          D
        </button>
        <button
          onClick={() => rotateFace("y", -1, -1)}
          className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-black text-xs rounded-lg"
        >
          D'
        </button>
        <button
          onClick={() => rotateFace("z", 1, 1)}
          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg"
        >
          F
        </button>
        <button
          onClick={() => rotateFace("z", 1, -1)}
          className="px-2 py-1 bg-green-800 hover:bg-green-900 text-white text-xs rounded-lg"
        >
          F'
        </button>
        <button
          onClick={() => rotateFace("z", -1, 1)}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg"
        >
          B
        </button>
        <button
          onClick={() => rotateFace("z", -1, -1)}
          className="px-2 py-1 bg-blue-800 hover:bg-blue-900 text-white text-xs rounded-lg"
        >
          B'
        </button>
      </div>
      <p className="text-xs font-semibold mb-2 text-gray-300">Cube Rotation</p>
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={() => rotateCube(0, Math.PI / 6, 0)}
          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg"
        >
          ↻ Y
        </button>
        <button
          onClick={() => rotateCube(0, -Math.PI / 6, 0)}
          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg"
        >
          ↺ Y
        </button>
        <button
          onClick={() => rotateCube(Math.PI / 6, 0, 0)}
          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg"
        >
          ↻ X
        </button>
        <button
          onClick={() => rotateCube(-Math.PI / 6, 0, 0)}
          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg"
        >
          ↺ X
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen relative flex bg-gray-900 overflow-hidden">
      {/* Sidebar for controls */}
      <div className="w-1/3 flex flex-col justify-start items-start p-6 z-10 bg-black/10 backdrop-blur-sm text-balance min-h-full overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-4">
          Rubik&apos;s Cube Solver
        </h1>
        <ColorPicker />
        <Controls />
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={solveCube}
            disabled={isSolving}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isSolving ? "Solving..." : "Solve"}
          </button>
          <button
            onClick={debugCubeState}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            Debug
          </button>
          <button
            onClick={resetCube}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Reset Cube
          </button>
        </div>
        {solutionMoves.length > 0 && (
          <div className="w-full p-3 bg-white/10 rounded-lg mb-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-white">
                Solution ({solutionMoves.length} moves):
              </h3>
              {solveTime && (
                <span className="text-xs text-gray-300">
                  Solved in {solveTime}ms
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {solutionMoves.map((move, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-700 text-white rounded text-xs"
                >
                  {move}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-auto text-xs text-gray-400">
          <p>
            Use mouse to rotate view • Click faces to color them • Use controls
            to rotate cube faces
          </p>
        </div>
      </div>
      {/* Main area for 3D cube */}
      <div className="w-2/3 flex items-center justify-center relative">
        <div className="w-full h-full">
          <Canvas
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1,
            }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} />
            <directionalLight position={[-10, -10, -5]} intensity={0.4} />
            <pointLight position={[0, 0, 10]} intensity={0.3} />
            <PerspectiveCamera
              makeDefault
              fov={50}
              position={[4, 4, 6]}
              near={0.1}
              far={1000}
            />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={3}
              maxDistance={15}
              autoRotate={false}
            />
            <Suspense fallback={null}>
              <SimpleRubiksCube
                ref={cubeRef}
                selectedColor={selectedColor}
                position={[0, 0, 0]}
                scale={1.2}
              />
            </Suspense>
          </Canvas>
        </div>
        {/* Floating history button */}
        <Link
          href="/history"
          className="absolute top-6 right-6 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors group"
          title="View solve history"
        >
          <History
            size={24}
            className="text-white group-hover:text-blue-300 transition-colors"
          />
        </Link>
      </div>
    </div>
  );
}
