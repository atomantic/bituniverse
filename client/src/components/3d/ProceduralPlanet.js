import React, { useRef, useEffect, useMemo, forwardRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { PLANET_TYPES } from "../../config/planetTypes";
import {
  toonVertexShader,
  toonFragmentShader,
  atmosphereVertexShader,
  atmosphereFragmentShader,
  ringVertexShader,
  ringFragmentShader,
  MOEBIUS_PALETTE,
} from "../../shaders/ToonShader";

// Simple noise function for terrain variation
function noise(x, y, z) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;

  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);

  const u = fade(x);
  const v = fade(y);
  const w = fade(z);

  const A = p[X] + Y;
  const AA = p[A] + Z;
  const AB = p[A + 1] + Z;
  const B = p[X + 1] + Y;
  const BA = p[B] + Z;
  const BB = p[B + 1] + Z;

  return lerp(
    w,
    lerp(
      v,
      lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
      lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))
    ),
    lerp(
      v,
      lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
      lerp(
        u,
        grad(p[AB + 1], x, y - 1, z - 1),
        grad(p[BB + 1], x - 1, y - 1, z - 1)
      )
    )
  );
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t, a, b) {
  return a + t * (b - a);
}

function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

const p = new Array(512);
const permutation = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
  36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234,
  75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237,
  56, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
  77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55,
  46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132,
  187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109,
  198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126,
  255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223,
  183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167,
  43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185,
  112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179,
  162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199,
  106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236,
  205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156,
  180,
];

for (let i = 0; i < 256; i++) p[i] = permutation[i];
for (let i = 0; i < 256; i++) p[256 + i] = p[i];

// Fractional Brownian Motion — layers noise at multiple octaves
function fbm(x, y, z, octaves = 4) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise(x * frequency, y * frequency, z * frequency);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value / maxValue;
}

const ProceduralPlanet = forwardRef(
  (
    {
      radius = 1,
      seed = 0,
      color = MOEBIUS_PALETTE.planet1,
      type = PLANET_TYPES.ROCKY,
      planetTypeConfig,
      position = [0, 0, 0],
      hasAtmosphere = true,
      atmosphereOpacity = 0.2,
      atmosphereColor,
      metalness = 0.2,
      roughness = 0.8,
      terrainExaggeration = 0.15,
      rotationSpeed = 0,
      detail = 32,
      onHover,
      onUnhover,
      onClick,
      isSelected = false,
      isHovered = false,
    },
    ref
  ) => {
    const meshRef = useRef();
    const atmosphereRef = useRef();
    const geometryRef = useRef();
    const composerRef = useRef();
    const { gl, scene, camera } = useThree();

    // Resolve planet type config for palette/rings/octaves
    const typeConfig = planetTypeConfig ?? type;
    const octaves = typeConfig?.noiseOctaves ?? 4;
    const palette = typeConfig?.colorPalette;
    const hasRings = typeConfig?.hasRings ?? false;
    const resolvedAtmosphereColor =
      atmosphereColor ?? typeConfig?.atmosphereColor ?? MOEBIUS_PALETTE.atmosphere;

    const planetMaterial = useMemo(() => {
      const hasElevation = !!palette;
      return new THREE.ShaderMaterial({
        vertexShader: toonVertexShader,
        fragmentShader: toonFragmentShader,
        uniforms: {
          color: { value: new THREE.Color(color) },
          colorLow: { value: palette?.low ?? new THREE.Color(color) },
          colorMid: { value: palette?.mid ?? new THREE.Color(color) },
          colorHigh: { value: palette?.high ?? new THREE.Color(color) },
          glowColor: { value: MOEBIUS_PALETTE.glow },
          lightPosition: { value: new THREE.Vector3(-5, 3, 5).normalize() },
          time: { value: 0 },
          useElevationColors: { value: hasElevation ? 1.0 : 0.0 },
          elevationMin: { value: 0.0 },
          elevationMax: { value: 1.0 },
        },
      });
    }, [color, palette]);

    const atmosphereMaterial = useMemo(() => {
      return new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        uniforms: {
          atmosphereColor: { value: new THREE.Color(resolvedAtmosphereColor) },
          time: { value: 0 },
        },
        transparent: true,
        side: THREE.BackSide,
      });
    }, [resolvedAtmosphereColor]);

    const ringMaterial = useMemo(() => {
      if (!hasRings) return null;
      return new THREE.ShaderMaterial({
        vertexShader: ringVertexShader,
        fragmentShader: ringFragmentShader,
        uniforms: {
          ringColor: {
            value: palette?.mid ?? new THREE.Color(color),
          },
          seed: { value: typeof seed === "number" ? seed : 0 },
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    }, [hasRings, palette, color, seed]);

    useFrame(({ clock }) => {
      const time = clock.getElapsedTime();
      planetMaterial.uniforms.time.value = time;
      atmosphereMaterial.uniforms.time.value = time;

      // Slow rotation
      if (meshRef.current && rotationSpeed > 0) {
        meshRef.current.rotation.y += 0.002 * rotationSpeed;
      }
    });

    useEffect(() => {
      if (!meshRef.current) return;

      const segments = detail;
      const geometry = new THREE.SphereGeometry(radius, segments, segments);

      // Generate unique terrain based on seed and type using fBm
      const vertices = geometry.attributes.position.array;
      let minDist = Infinity;
      let maxDist = -Infinity;

      // First pass: compute fBm heights and track min/max
      const heights = new Float32Array(vertices.length / 3);
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];
        const vector = new THREE.Vector3(x, y, z);
        vector.normalize();

        const seedVal = typeof seed === "number" ? seed : 0;
        const height = fbm(
          vector.x * 4 + seedVal,
          vector.y * 4 + seedVal,
          vector.z * 4 + seedVal,
          octaves
        );

        const dist = radius + height * terrainExaggeration;
        heights[i / 3] = dist;
        minDist = Math.min(minDist, dist);
        maxDist = Math.max(maxDist, dist);
      }

      // Second pass: apply heights
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];
        const vector = new THREE.Vector3(x, y, z);
        vector.normalize();
        vector.multiplyScalar(heights[i / 3]);

        vertices[i] = vector.x;
        vertices[i + 1] = vector.y;
        vertices[i + 2] = vector.z;
      }

      geometry.computeVertexNormals();
      geometryRef.current = geometry;
      meshRef.current.geometry = geometry;

      // Update elevation range uniforms
      planetMaterial.uniforms.elevationMin.value = minDist;
      planetMaterial.uniforms.elevationMax.value = maxDist;

      // Create atmosphere if needed
      if (hasAtmosphere && atmosphereRef.current) {
        const atmosphereGeometry = new THREE.SphereGeometry(
          radius * 1.1,
          segments,
          segments
        );
        atmosphereRef.current.geometry = atmosphereGeometry;
      }

      // Set up post-processing
      const renderPass = new RenderPass(scene, camera);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,
        0.4,
        0.85
      );
      const outputPass = new OutputPass();

      const composer = new EffectComposer(gl);
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
      composer.addPass(outputPass);

      composerRef.current = composer;

      // Cleanup function
      return () => {
        if (geometryRef.current) {
          geometryRef.current.dispose();
        }
        if (meshRef.current?.material) {
          meshRef.current.material.dispose();
        }
        if (atmosphereRef.current?.material) {
          atmosphereRef.current.material.dispose();
        }
        if (composerRef.current) {
          composerRef.current.dispose();
        }
      };
    }, [
      radius,
      seed,
      terrainExaggeration,
      hasAtmosphere,
      gl,
      scene,
      camera,
      detail,
      octaves,
      planetMaterial,
    ]);

    return (
      <group position={position}>
        <mesh
          ref={meshRef}
          material={planetMaterial}
          onPointerOver={() => onHover?.()}
          onPointerOut={() => onUnhover?.()}
          onClick={() => onClick?.()}
        >
          <sphereGeometry args={[radius, detail, detail]} />
        </mesh>
        {hasAtmosphere && (
          <mesh ref={atmosphereRef} material={atmosphereMaterial}>
            <sphereGeometry args={[radius * 1.1, detail, detail]} />
          </mesh>
        )}
        {hasRings && ringMaterial && (
          <mesh
            material={ringMaterial}
            rotation={[Math.PI / 2.5, 0, 0]}
          >
            <ringGeometry args={[radius * 1.4, radius * 2.2, 64]} />
          </mesh>
        )}
      </group>
    );
  }
);

ProceduralPlanet.displayName = "ProceduralPlanet";

export default ProceduralPlanet;
