# Rubik's Cube Control API

The `RubiksCubeModel` component now supports manual control when `animate={false}`. This allows you to programmatically control cube rotations and face moves without interfering with the automatic animation system.

## Usage

```tsx
import { RubiksCubeModel } from "@/components/rubik-s-cube/rubik-s-cube";
import { RubiksCubeRef } from "@/types/rubik-s-cube";

const cubeRef = useRef<RubiksCubeRef>(null);

// Use the cube with manual control
<RubiksCubeModel
  ref={cubeRef}
  animate={false} // Important: disable auto-animation
  position={[0, 0, 0]}
  scale={1}
/>;
```

## API Reference

### `CubeControlAPI`

The control API is available through `cubeRef.current?.controls` when `animate={false}`.

#### Methods

##### `rotateFace(axis: Axis, layer: number, direction: 1 | -1): Promise<void>`

Rotates a specific face of the cube.

- **axis**: `"x"` | `"y"` | `"z"` - The axis of rotation
- **layer**: `-1` | `0` | `1` - Which layer to rotate
- **direction**: `1` (clockwise) | `-1` (counter-clockwise)

```tsx
// Rotate right face clockwise
await cubeRef.current?.controls?.rotateFace("x", 1, 1);

// Rotate top face counter-clockwise
await cubeRef.current?.controls?.rotateFace("y", 1, -1);
```

##### `rotateCube(x?: number, y?: number, z?: number): void`

Rotates the entire cube around its center.

- **x**: Rotation around X-axis (radians)
- **y**: Rotation around Y-axis (radians)
- **z**: Rotation around Z-axis (radians)

```tsx
// Rotate cube 45 degrees around Y-axis
cubeRef.current?.controls?.rotateCube(0, Math.PI / 4, 0);
```

##### `executeSequence(moves: Move[]): Promise<void>`

Executes a sequence of moves in order.

```tsx
const moves = [
  { axis: "x", layer: 1, direction: 1 }, // R
  { axis: "y", layer: 1, direction: 1 }, // U
  { axis: "x", layer: 1, direction: -1 }, // R'
  { axis: "y", layer: 1, direction: -1 }, // U'
];

await cubeRef.current?.controls?.executeSequence(moves);
```

##### `isManuallyControlled(): boolean`

Returns whether the cube is currently being controlled manually.

```tsx
const isControlled = cubeRef.current?.controls?.isManuallyControlled();
```

## Coordinate System

### Axes

- **X-axis**: Left (-) to Right (+)
- **Y-axis**: Down (-) to Up (+)
- **Z-axis**: Back (-) to Front (+)

### Layers

- **-1**: Left/Bottom/Back layer
- **0**: Middle layer
- **1**: Right/Top/Front layer

### Directions

- **1**: Clockwise rotation (when looking at the face)
- **-1**: Counter-clockwise rotation

## Standard Cube Notation Mapping

| Notation | Axis | Layer | Direction | Description                  |
| -------- | ---- | ----- | --------- | ---------------------------- |
| R        | x    | 1     | 1         | Right face clockwise         |
| R'       | x    | 1     | -1        | Right face counter-clockwise |
| L        | x    | -1    | 1         | Left face clockwise          |
| L'       | x    | -1    | -1        | Left face counter-clockwise  |
| U        | y    | 1     | 1         | Up face clockwise            |
| U'       | y    | 1     | -1        | Up face counter-clockwise    |
| D        | y    | -1    | 1         | Down face clockwise          |
| D'       | y    | -1    | -1        | Down face counter-clockwise  |
| F        | z    | 1     | 1         | Front face clockwise         |
| F'       | z    | 1     | -1        | Front face counter-clockwise |
| B        | z    | -1    | 1         | Back face clockwise          |
| B'       | z    | -1    | -1        | Back face counter-clockwise  |

## Important Notes

1. **Animation Compatibility**: The control API only works when `animate={false}`. When `animate={true}`, the cube uses automatic animation and manual control is disabled.

2. **Async Operations**: Face rotations and sequences are asynchronous operations. Always await them or handle the promises properly.

3. **No Interference**: The manual control system is completely separate from the automatic animation system, so you can switch between them without conflicts.

4. **Performance**: Manual control uses the same optimized animation system as automatic animation, so performance is consistent.

## Example Implementation

See `ControllableCube.tsx` and `CubeControlExample.tsx` for complete working examples.

```tsx
const executeMoves = async () => {
  if (!cubeRef.current?.controls) return;

  // Execute R U R' U' algorithm
  await cubeRef.current.controls.executeSequence([
    { axis: "x", layer: 1, direction: 1 }, // R
    { axis: "y", layer: 1, direction: 1 }, // U
    { axis: "x", layer: 1, direction: -1 }, // R'
    { axis: "y", layer: 1, direction: -1 }, // U'
  ]);
};
```

This API provides full programmatic control over the Rubik's cube while maintaining the smooth animations and performance optimizations of the original system.
