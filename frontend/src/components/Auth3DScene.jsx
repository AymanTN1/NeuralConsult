import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GlassShape = ({ position, rotation, scale, geometryType }) => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.005;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      {geometryType === 'torus' ? (
        <torusGeometry args={[1, 0.4, 32, 64]} />
      ) : geometryType === 'sphere' ? (
        <sphereGeometry args={[1, 64, 64]} />
      ) : (
        <octahedronGeometry args={[1, 0]} />
      )}
      <meshPhysicalMaterial 
        color="#ffffff"
        transmission={0.9}
        opacity={1}
        metalness={0}
        roughness={0.1}
        ior={1.5}
        thickness={0.5}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
};

const Auth3DScene = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#3b82f6" />
        <directionalLight position={[-5, -5, -5]} intensity={1} color="#60a5fa" />
        <pointLight position={[0, 0, 0]} intensity={0.5} color="#dbeafe" />
        
        <group position={[0, 0, 0]}>
          <GlassShape geometryType="torus" position={[-1, 1, -1]} scale={[0.8, 0.8, 0.8]} rotation={[0.5, 0.2, 0]} />
          <GlassShape geometryType="sphere" position={[1.5, -0.5, -2]} scale={[1.2, 1.2, 1.2]} rotation={[0, 0, 0]} />
          <GlassShape geometryType="octahedron" position={[-1.2, -1.5, 0]} scale={[0.6, 0.6, 0.6]} rotation={[0.2, 0.8, 0.1]} />
        </group>
      </Canvas>
    </div>
  );
};

export default Auth3DScene;
