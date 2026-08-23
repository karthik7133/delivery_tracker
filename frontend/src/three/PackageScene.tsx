import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Interactive Particle Wave Grid (Logistics Data Wave)
 */
function ParticleGrid() {
  const count = 1800;
  const mesh = useRef<THREE.Points>(null!);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const color1 = new THREE.Color('#10b981'); // Emerald
    const color2 = new THREE.Color('#06b6d4'); // Cyan
    const color3 = new THREE.Color('#3b82f6'); // Royal Blue

    for (let i = 0; i < count; i++) {
      // Grid distribution
      const x = (Math.random() - 0.5) * 35;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 25 - 5;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Color gradient
      const mixRatio = Math.random();
      const mixedColor = mixRatio < 0.5 ? color1.clone().lerp(color2, mixRatio * 2) : color2.clone().lerp(color3, (mixRatio - 0.5) * 2);
      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime() * 0.4;
    const positionsAttr = mesh.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      // Wave motion calculation
      positionsAttr.setY(i, Math.sin(time + x * 0.2) * 1.2 + Math.cos(time + z * 0.3) * 0.8 - 2);
    }
    positionsAttr.needsUpdate = true;
    mesh.current.rotation.y = time * 0.05;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Futuristic Holographic Logistics Hub Nodes
 */
function CyberNode({ position, scale, color, speed }: {
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
}) {
  const outerRef = useRef<THREE.Mesh>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    outerRef.current.rotation.x += delta * speed * 0.4;
    outerRef.current.rotation.y += delta * speed * 0.6;
    innerRef.current.rotation.x -= delta * speed * 0.8;
    innerRef.current.rotation.z += delta * speed * 0.5;
  });

  return (
    <Float speed={speed * 1.5} rotationIntensity={0.8} floatIntensity={1.2}>
      <group position={position} scale={scale}>
        {/* Outer Wireframe Shield */}
        <mesh ref={outerRef}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={0.4}
          />
        </mesh>
        {/* Inner Glowing Core */}
        <mesh ref={innerRef} scale={0.4}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.5}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      </group>
    </Float>
  );
}

/**
 * Laser Connection Beams Between Hub Nodes
 */
function LaserBeams() {
  const lineRef = useRef<THREE.LineSegments>(null!);

  const linePositions = useMemo(() => {
    const points: number[] = [];
    const nodes = [
      [-7, 3, -4], [-2, -2, -2], [4, 4, -5], [7, -3, -6],
      [-5, -4, -3], [2, 1, -1], [6, 2, -4], [-1, 5, -5]
    ];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1], nodes[i][2] - nodes[j][2]);
        if (dist < 9) {
          points.push(...nodes[i], ...nodes[j]);
        }
      }
    }
    return new Float32Array(points);
  }, []);

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[linePositions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#06b6d4"
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

function Scene() {
  const nodes = useMemo(() => [
    { position: [-7, 3, -4] as [number, number, number], scale: 1.1, color: '#10b981', speed: 0.6 },
    { position: [6, -3, -5] as [number, number, number], scale: 1.4, color: '#06b6d4', speed: 0.4 },
    { position: [-4, -4, -3] as [number, number, number], scale: 0.8, color: '#38bdf8', speed: 0.8 },
    { position: [5, 4, -6] as [number, number, number], scale: 1.0, color: '#10b981', speed: 0.5 },
    { position: [0, 2, -3] as [number, number, number], scale: 0.7, color: '#34d399', speed: 0.7 },
  ], []);

  useFrame((state) => {
    // Subtle interactive mouse tilt
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.mouse.x * 0.8, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.mouse.y * 0.8, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#10b981" />
      <pointLight position={[-10, -10, -10]} intensity={1.0} color="#0ea5e9" />
      <ParticleGrid />
      <LaserBeams />
      {nodes.map((n, i) => <CyberNode key={i} {...n} />)}
    </>
  );
}

export default function PackageScene() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
