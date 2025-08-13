"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { SpotLight as DreiSpotlight } from "@react-three/drei";

// Props for the custom EnhancedSpotlight component
interface EnhancedSpotlightProps
  extends Omit<
    React.ComponentProps<typeof DreiSpotlight>,
    "shadow-mapSize" | "color"
  > {
  depthBuffer: THREE.DepthTexture;
  color: string;
  shadowMapSize?: number; // Making it optional and number for easier use
}

export function EnhancedSpotlight(props: EnhancedSpotlightProps) {
  const light = useRef<THREE.SpotLight | null>(null);

  // To debug the light's position and direction, uncomment the following line:
  // useHelper(light, THREE.SpotLightHelper, 'red');

  useEffect(() => {
    if (light.current) {
      // The target is an object within the scene, so we make it look at the center.
      // This is crucial for the light to point correctly.
      light.current.target.position.set(0, 0, 0);
      light.current.target.updateMatrixWorld();
    }
  }, []);

  const { shadowMapSize, ...rest } = props;

  return (
    // Drei's SpotLight comes with built-in volumetric capabilities.
    // The key props are `anglePower` (for the cone edge softness)
    // and `attenuation` (for the distance falloff).
    // Note: These props are specific to this Drei component and not on the base three.js light.
    <DreiSpotlight
      castShadow
      ref={light}
      {...rest}
      // These props are what create the volumetric effect
      attenuation={30}
      anglePower={6} // This is the key prop for the soft volumetric cone
      // Standard R3F props for shadow quality
      shadow-bias={-0.0001}
      shadow-mapSize={
        shadowMapSize ? [shadowMapSize, shadowMapSize] : [2048, 2048]
      }
    />
  );
}
