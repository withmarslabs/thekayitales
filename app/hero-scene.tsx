"use client";

import { Float, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

function createDustPositions() {
  const values = new Float32Array(450);
  let seed = 2719;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let index = 0; index < 150; index += 1) {
    values[index * 3] = (random() - 0.5) * 11;
    values[index * 3 + 1] = (random() - 0.5) * 7;
    values[index * 3 + 2] = (random() - 0.5) * 4;
  }
  return values;
}
const DUST_POSITIONS = createDustPositions();

function BotanicalPlanes() {
  const texture = useTexture("/images/botanical-sprig.webp");
  const group = useRef<THREE.Group>(null);
  useFrame((state) => { if (!group.current) return; group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x * 0.12, 0.035); group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.06, 0.035); });
  const placements = [[-3.9, 1.1, -1.2, 1.35, -0.45], [4.15, 0.5, -0.5, 1.1, 0.6], [-4.25, -2.25, 0.2, 0.9, -0.9], [4.35, -2.35, -1.4, 1.45, 0.42], [2.9, 2.7, -2.1, 0.72, 0.25]];
  return <group ref={group}>{placements.map(([x, y, z, scale, rotation], index) => <Float key={index} speed={0.55 + index * 0.08} rotationIntensity={0.16} floatIntensity={0.25}><mesh position={[x, y, z]} rotation={[0, 0, rotation]} scale={scale}><planeGeometry args={[1.65, 2.5]} /><meshBasicMaterial map={texture} transparent opacity={index === 1 ? 0.72 : 0.45} depthWrite={false} toneMapped={false} /></mesh></Float>)}</group>;
}

function GoldDust() {
  const points = useRef<THREE.Points>(null);
  useFrame((state, delta) => { if (!points.current) return; points.current.rotation.y += delta * 0.014; points.current.position.x = THREE.MathUtils.lerp(points.current.position.x, state.pointer.x * 0.22, 0.025); points.current.position.y = THREE.MathUtils.lerp(points.current.position.y, state.pointer.y * 0.12, 0.025); });
  return <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[DUST_POSITIONS, 3]} /></bufferGeometry><pointsMaterial color="#b99558" size={0.026} transparent opacity={0.72} sizeAttenuation depthWrite={false} /></points>;
}

export function HeroScene() {
  const [enabled] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches && window.innerWidth >= 768);
  if (!enabled) return null;
  return <div className="hero-webgl" aria-hidden="true"><Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7.5], fov: 48 }} gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}><BotanicalPlanes /><GoldDust /></Canvas></div>;
}
