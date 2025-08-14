"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, useDepthBuffer } from "@react-three/drei";
import * as THREE from "three";
import { SimpleRubiksCube } from "@/components/rubik-s-cube/simple-rubik-s-cube";
import { EnhancedSpotlight } from "@/components/ui/EnhancedSpotlight";

function CameraController() {
  const { camera } = useThree();

  useFrame(() => {
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function SceneContent() {
  // `useDepthBuffer` is needed for the volumetric effect to not clip through objects.
  const depthBuffer = useDepthBuffer({
    size: 2048,
    frames: Infinity, // Use Infinity for continuous updates for the animation
  });

  return (
    <>
      <EnhancedSpotlight
        depthBuffer={depthBuffer} // Pass the depth buffer here
        color="#aaaace"
        position={[3, 3, 2]}
        penumbra={1}
        distance={17}
        angle={0.9}
        intensity={1}
        shadowMapSize={2048}
      />

      <PerspectiveCamera
        makeDefault
        fov={50}
        position={[0, 0, 7]}
        near={0.1}
        far={1000}
      />

      <CameraController />

      <Suspense fallback={null}>
        <SimpleRubiksCube position={[0, 0, 0]} scale={1} />
      </Suspense>
    </>
  );
}

export function Scene() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);

    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  return (
    <div className="h-svh w-screen relative bg-black">
      <Canvas
        shadows
        gl={{
          antialias: isDesktop,
          preserveDrawingBuffer: false, // Generally better for performance
          powerPreference: isDesktop ? "high-performance" : "default",
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
      >
        <SceneContent />
        {/* <Perf /> */}
      </Canvas>
    </div>
  );
}
