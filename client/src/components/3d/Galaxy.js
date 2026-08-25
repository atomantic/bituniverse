import * as THREE from "three";
import { gaussianRandom, spiral } from "../../utils/galaxyUtils";
import { generateGalaxyConfig } from "../../utils/galaxyConfigGenerator";
import {
  TOTAL_STARS,
  GALAXY_THICKNESS,
  CORE_X_DIST,
  OUTER_CORE_X_DIST,
  ARM_X_DIST,
  ARM_Y_DIST,
  ARM_X_MEAN,
  ARM_Y_MEAN,
  ARMS,
  SPIRAL,
  CORE_STAR_PERCENTAGE,
  OUTER_CORE_PERCENTAGE,
  ARM_STAR_PERCENTAGE,
  BLOOM_LAYER,
  BASE_LAYER,
  // Nebula configuration imports
  NEBULA_COUNT,
  NEBULA_EXTEND_FACTOR,
  NEBULA_CENTER_HOLE,
  NEBULA_MAX_OPACITY,
  NEBULA_COLORS,
  NEBULA_MIN_SIZE,
  NEBULA_MAX_SIZE,
  NEBULA_MIN_OPACITY,
  NEBULA_THICKNESS_RATIO,
  NEBULA_PATCHINESS,
  // Nebula density variation parameters
  NEBULA_DENSITY_START,
  NEBULA_DENSITY_NOISE_FREQS,
  NEBULA_DENSITY_NOISE_WEIGHTS,
  NEBULA_DENSITY_BASE_STRENGTH,
  NEBULA_DENSITY_OUTER_BOOST,
  // Secondary nebula imports
  SECONDARY_NEBULA_COUNT,
  SECONDARY_NEBULA_PATCHINESS,
  SECONDARY_NEBULA_EXTEND_FACTOR,
  SECONDARY_NEBULA_THICKNESS_RATIO,
  SECONDARY_NEBULA_MIN_SIZE,
  SECONDARY_NEBULA_MAX_SIZE,
  SECONDARY_NEBULA_MIN_OPACITY,
  SECONDARY_NEBULA_MAX_OPACITY,
  SECONDARY_NEBULA_COLORS,
} from "../../config/renderConfig";
import { starTypes } from "../../config/starDistributions";

const vertexShader = `
  attribute float size;
  varying vec3 vColor;
  
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  
  void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = length(gl_PointCoord - center);
    
    if (dist > 0.5) {
      discard;
    }
    
    // Make the stars brighter by multiplying the color
    gl_FragColor = vec4(vColor * 2.0, 1.0);
  }
`;

// Nebula cloud shader
const nebulaVertexShader = `
  attribute float size;
  attribute float opacity;
  varying vec3 vColor;
  varying float vOpacity;
  
  void main() {
    vColor = color;
    vOpacity = opacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Adjust point size scaling to be more proportional to z-distance
    // Use a smaller base scale to prevent excessive size when zoomed out
    float distanceScale = max(1500.0 / -mvPosition.z, 0.5);
    gl_PointSize = size * distanceScale;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const nebulaFragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  
  void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = length(gl_PointCoord - center);
    
    // Sharper edge falloff to make particles appear smaller
    float alpha = smoothstep(0.4, 0.1, dist);
    
    // Lower maximum opacity and multiply by a smaller factor
    gl_FragColor = vec4(vColor, min(alpha * vOpacity * 0.08, 0.2));
  }
`;

// Helper function to generate points in a sphere
function generateSphericalPoint(radius) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.random() * radius;

  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
}

export class Galaxy {
  constructor(galaxyIndex = 0) {
    this.time = 0;
    this.stars = null;
    this.nebulaClouds = null;
    this.secondaryNebulaClouds = null;
    this.config = generateGalaxyConfig(galaxyIndex);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredStarIndex = -1;
    this.selectedStarIndex = -1;
    this.onStarHover = null;
    this.onStarClick = null;

    // Memory safety check - cap at a reasonable number to prevent browser crashes
    const safeTotalStars = Math.min(TOTAL_STARS, 500000); // Reduced to 500k stars

    if (safeTotalStars < TOTAL_STARS) {
      console.warn(
        `Reducing star count from ${TOTAL_STARS} to ${safeTotalStars} to prevent memory issues`
      );
    }

    this.totalStars = safeTotalStars;

    this.generateStarData();
    this.generateNebulaClouds();
    this.generateSecondaryNebulaClouds();
  }

  generateStarType() {
    let num = Math.random() * 100.0;
    let pct = starTypes.percentage;
    for (let i = 0; i < pct.length; i++) {
      num -= pct[i];
      if (num < 0) {
        return i;
      }
    }
    return 0;
  }

  generateNebulaClouds() {
    try {
      const nebulaTotalCount = this.config.NEBULA_COUNT;
      let positions = new Float32Array(nebulaTotalCount * 3);
      let colors = new Float32Array(nebulaTotalCount * 3);
      let sizes = new Float32Array(nebulaTotalCount);
      let opacities = new Float32Array(nebulaTotalCount);

      // Convert hex colors to THREE.Color objects
      const nebulaColors = this.config.NEBULA_COLORS.map(
        (color) => new THREE.Color(color)
      );

      let currentIndex = 0;

      // Skip core particles and only generate nebula along spiral arms
      const perArm = Math.floor(nebulaTotalCount / this.config.ARMS);

      // Create a noise pattern for patchiness - use different seed than secondary
      const patchSeed = Math.random() * 2000;

      for (let j = 0; j < this.config.ARMS; j++) {
        const armOffset = (j * 2 * Math.PI) / this.config.ARMS;

        for (let i = 0; i < perArm && currentIndex < nebulaTotalCount; i++) {
          // Use non-linear distribution to place more particles in outer regions
          const armPosition = Math.pow(i / perArm, 0.5);

          // Skip particles that would be too close to the center
          if (armPosition < NEBULA_CENTER_HOLE) {
            continue;
          }

          // Calculate angle from center for wave pattern
          const angleFromCenter = Math.atan2(
            Math.sin(
              armOffset +
                (armPosition * ARM_X_DIST * this.config.SPIRAL) / ARM_X_DIST
            ),
            Math.cos(
              armOffset +
                (armPosition * ARM_X_DIST * this.config.SPIRAL) / ARM_X_DIST
            )
          );

          // Create jittery density variation
          let densityVariation = 0;
          // Only apply jitter in outer regions (after configured start point)
          if (armPosition > this.config.NEBULA_DENSITY_START) {
            // Create multiple layers of noise for more organic variation
            const noises = this.config.NEBULA_DENSITY_NOISE_FREQS.map(
              (freq, i) =>
                Math.sin(armPosition * freq + patchSeed * (i + 1)) *
                Math.cos(angleFromCenter * (freq / 4) + patchSeed * (i + 0.5))
            );

            // Combine noises with configured weights
            densityVariation = noises.reduce(
              (sum, noise, i) =>
                sum + noise * this.config.NEBULA_DENSITY_NOISE_WEIGHTS[i],
              0
            );

            // Increase variation strength in outer regions
            const outerFactor =
              (armPosition - this.config.NEBULA_DENSITY_START) /
              (1 - this.config.NEBULA_DENSITY_START);
            densityVariation *=
              this.config.NEBULA_DENSITY_BASE_STRENGTH +
              outerFactor * this.config.NEBULA_DENSITY_OUTER_BOOST;
          }

          // Combine with existing patchiness
          const noiseVal =
            Math.cos(armPosition * 25 + patchSeed) *
            Math.sin(armPosition * 12 + patchSeed * 0.5) *
            Math.cos((j + 1) * 3.5);

          // Skip points based on combined noise and patchiness
          if (
            Math.abs(noiseVal + densityVariation) <
            this.config.NEBULA_PATCHINESS
          ) {
            continue;
          }

          // Extend nebula along spiral arms
          const distance =
            armPosition * ARM_X_DIST * this.config.NEBULA_EXTEND_FACTOR;
          const angle =
            armOffset + (distance / ARM_X_DIST) * this.config.SPIRAL;

          // More spread in outer regions
          const angleSpread = 0.05 + 0.5 * armPosition;
          const widthSpread = 0.1 + 0.5 * armPosition;

          const pos = spiral(
            distance * (1.0 + (Math.random() - 0.5) * widthSpread),
            distance * 0.6 * (1.0 + (Math.random() - 0.5) * widthSpread),
            gaussianRandom(
              0,
              GALAXY_THICKNESS * this.config.NEBULA_THICKNESS_RATIO
            ),
            angle + gaussianRandom(-angleSpread, angleSpread)
          );

          // Color selection - pink to purple gradient along arms
          const colorPos = Math.min(armPosition * 1.5, 1.0);
          const colorIndex = Math.floor(colorPos * (nebulaColors.length - 1));
          const colorWeight = colorPos * (nebulaColors.length - 1) - colorIndex;

          const color1 = nebulaColors[colorIndex];
          const color2 =
            nebulaColors[Math.min(colorIndex + 1, nebulaColors.length - 1)];
          const color = new THREE.Color()
            .copy(color1)
            .lerp(color2, colorWeight);

          const idx = currentIndex * 3;
          positions[idx] = pos.x;
          positions[idx + 1] = pos.y;
          positions[idx + 2] = pos.z;
          colors[idx] = color.r;
          colors[idx + 1] = color.g;
          colors[idx + 2] = color.b;

          // Size calculation with density variation influence
          const particleSize =
            this.config.NEBULA_MIN_SIZE +
            armPosition *
              (this.config.NEBULA_MAX_SIZE - this.config.NEBULA_MIN_SIZE);
          sizes[currentIndex] =
            particleSize * (0.8 + Math.random() * 0.4) * (1 + densityVariation);

          // Opacity with density variation influence
          const baseOpacity =
            this.config.NEBULA_MIN_OPACITY +
            armPosition *
              (this.config.NEBULA_MAX_OPACITY - this.config.NEBULA_MIN_OPACITY);
          opacities[currentIndex] =
            baseOpacity * (0.85 + Math.random() * 0.3) * (1 + densityVariation);

          currentIndex++;
        }
      }

      if (currentIndex === 0) {
        console.error("No nebula particles were created");
        return;
      }

      // Create new arrays with the exact size needed
      const finalPositions = new Float32Array(currentIndex * 3);
      const finalColors = new Float32Array(currentIndex * 3);
      const finalSizes = new Float32Array(currentIndex);
      const finalOpacities = new Float32Array(currentIndex);

      // Copy data to the new arrays
      finalPositions.set(positions.subarray(0, currentIndex * 3));
      finalColors.set(colors.subarray(0, currentIndex * 3));
      finalSizes.set(sizes.subarray(0, currentIndex));
      finalOpacities.set(opacities.subarray(0, currentIndex));

      // Create optimized geometry
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(finalPositions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(finalColors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(finalSizes, 1));
      geometry.setAttribute(
        "opacity",
        new THREE.BufferAttribute(finalOpacities, 1)
      );

      geometry.computeBoundingSphere();
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
      geometry.attributes.color.usage = THREE.StaticDrawUsage;
      geometry.attributes.size.usage = THREE.StaticDrawUsage;
      geometry.attributes.opacity.usage = THREE.StaticDrawUsage;

      // Create material with hardcoded opacity values for better performance
      const material = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: nebulaVertexShader,
        fragmentShader: nebulaFragmentShader,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
      });

      // Create the nebula cloud effect
      this.nebulaClouds = new THREE.Points(geometry, material);
      this.nebulaClouds.layers.enable(BASE_LAYER);
      this.nebulaClouds.layers.enable(BLOOM_LAYER);
      this.nebulaClouds.frustumCulled = false;
      this.nebulaClouds.matrixAutoUpdate = false;
      this.nebulaClouds.matrixWorldAutoUpdate = false;
    } catch (error) {
      console.error("Error generating nebula clouds:", error);
    }
  }

  generateStarData() {
    try {
      // Pre-allocate arrays with exact sizes for all stars
      const positions = new Float32Array(this.totalStars * 3);
      const colors = new Float32Array(this.totalStars * 3);
      const sizes = new Float32Array(this.totalStars);
      const starTypeIndices = new Float32Array(this.totalStars);
      // Per-star id so the shader can highlight exactly one star
      const starIds = new Float32Array(this.totalStars);

      // Pre-calculate star types and colors
      const starTypeColors = starTypes.color.map(
        (color) => new THREE.Color(color)
      );

      let currentIndex = 0;

      // Calculate number of stars for each component
      const totalCoreStars = Math.floor(this.totalStars * CORE_STAR_PERCENTAGE);
      const totalOuterCoreStars = Math.floor(
        this.totalStars * OUTER_CORE_PERCENTAGE
      );
      const totalArmStars = Math.floor(this.totalStars * ARM_STAR_PERCENTAGE);

      // Generate core stars
      for (
        let i = 0;
        i < totalCoreStars && currentIndex < this.totalStars;
        i++
      ) {
        const pos = generateSphericalPoint(CORE_X_DIST);
        const starType = this.generateStarType();
        const color = starTypeColors[starType];
        const idx = currentIndex * 3;
        positions[idx] = pos.x;
        positions[idx + 1] = pos.y;
        positions[idx + 2] = pos.z;
        colors[idx] = color.r;
        colors[idx + 1] = color.g;
        colors[idx + 2] = color.b;
        sizes[currentIndex] = starTypes.size[starType];
        starTypeIndices[currentIndex] = starType;
        starIds[currentIndex] = currentIndex;
        currentIndex++;
      }

      // Generate outer core stars
      for (
        let i = 0;
        i < totalOuterCoreStars && currentIndex < this.totalStars;
        i++
      ) {
        const pos = generateSphericalPoint(OUTER_CORE_X_DIST);
        const starType = this.generateStarType();
        const color = starTypeColors[starType];
        const idx = currentIndex * 3;
        positions[idx] = pos.x;
        positions[idx + 1] = pos.y;
        positions[idx + 2] = pos.z;
        colors[idx] = color.r;
        colors[idx + 1] = color.g;
        colors[idx + 2] = color.b;
        sizes[currentIndex] = starTypes.size[starType];
        starTypeIndices[currentIndex] = starType;
        starIds[currentIndex] = currentIndex;
        currentIndex++;
      }

      // Generate spiral arm stars
      const starsPerArm = Math.floor(totalArmStars / this.config.ARMS);
      for (let j = 0; j < this.config.ARMS; j++) {
        const armOffset = (j * 2 * Math.PI) / this.config.ARMS;
        for (
          let i = 0;
          i < starsPerArm && currentIndex < this.totalStars;
          i++
        ) {
          const pos = spiral(
            gaussianRandom(ARM_X_MEAN, ARM_X_DIST),
            gaussianRandom(ARM_Y_MEAN, ARM_Y_DIST),
            gaussianRandom(0, GALAXY_THICKNESS),
            armOffset
          );
          const starType = this.generateStarType();
          const color = starTypeColors[starType];
          const idx = currentIndex * 3;
          positions[idx] = pos.x;
          positions[idx + 1] = pos.y;
          positions[idx + 2] = pos.z;
          colors[idx] = color.r;
          colors[idx + 1] = color.g;
          colors[idx + 2] = color.b;
          sizes[currentIndex] = starTypes.size[starType];
          starTypeIndices[currentIndex] = starType;
          starIds[currentIndex] = currentIndex;
          currentIndex++;
        }
      }

      // Fill remaining slots if any (due to rounding)
      const remainingStars = this.totalStars - currentIndex;
      if (remainingStars > 0) {
        for (let i = 0; i < remainingStars; i++) {
          const pos = spiral(
            gaussianRandom(ARM_X_MEAN, ARM_X_DIST),
            gaussianRandom(ARM_Y_MEAN, ARM_Y_DIST),
            gaussianRandom(0, GALAXY_THICKNESS),
            Math.random() * Math.PI * 2
          );
          const starType = this.generateStarType();
          const color = starTypeColors[starType];
          const idx = currentIndex * 3;
          positions[idx] = pos.x;
          positions[idx + 1] = pos.y;
          positions[idx + 2] = pos.z;
          colors[idx] = color.r;
          colors[idx + 1] = color.g;
          colors[idx + 2] = color.b;
          sizes[currentIndex] = starTypes.size[starType];
          starTypeIndices[currentIndex] = starType;
          starIds[currentIndex] = currentIndex;
          currentIndex++;
        }
      }

      // Create geometry with optimized attributes
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute(
        "starType",
        new THREE.BufferAttribute(starTypeIndices, 1)
      );
      geometry.setAttribute("starId", new THREE.BufferAttribute(starIds, 1));

      geometry.setAttribute("starId", new THREE.BufferAttribute(starIds, 1));
      geometry.attributes.starId.usage = THREE.StaticDrawUsage;

      // Store star data for hover detection
      this.starData = {
        positions: positions,
        starTypes: starTypeIndices,
      };

      // Optimize geometry - skip vertex normals as they're not needed for points
      geometry.computeBoundingSphere();
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
      geometry.attributes.color.usage = THREE.StaticDrawUsage;
      geometry.attributes.size.usage = THREE.StaticDrawUsage;
      geometry.attributes.starType.usage = THREE.StaticDrawUsage;

      const material = new THREE.ShaderMaterial({
        uniforms: {
          hoveredStarIndex: { value: -1 },
          selectedStarIndex: { value: -1 },
        },
        vertexShader: `
          attribute float size;
          attribute float starId;
          varying vec3 vColor;
          varying float vStarId;

          void main() {
            vColor = color;
            vStarId = starId;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vStarId;
          uniform float hoveredStarIndex;
          uniform float selectedStarIndex;

          void main() {
            vec2 center = vec2(0.5, 0.5);
            float dist = length(gl_PointCoord - center);

            if (dist > 0.5) {
              discard;
            }

            // Make the stars brighter by multiplying the color
            vec3 finalColor = vColor * 2.0;

            // Highlight the single selected star
            if (vStarId == selectedStarIndex) {
              finalColor = mix(finalColor, vec3(1.0), 0.7);
            }
            // Highlight the single hovered star
            else if (vStarId == hoveredStarIndex) {
              finalColor = mix(finalColor, vec3(1.0), 0.3);
            }

            gl_FragColor = vec4(finalColor, 1.0);
          }
        `,
        vertexColors: true,
        transparent: false,
        blending: THREE.NormalBlending,
        depthWrite: true,
        depthTest: true,
      });

      // Create a single points object with all stars
      this.stars = new THREE.Points(geometry, material);
      this.stars.layers.enable(BASE_LAYER);
      this.stars.layers.enable(BLOOM_LAYER);
      this.stars.frustumCulled = false;

      // Optimize for static rendering
      this.stars.matrixAutoUpdate = false;
      this.stars.matrixWorldAutoUpdate = false;
    } catch (error) {
      console.error("Error generating star data:", error);
    }
  }

  generateSecondaryNebulaClouds() {
    try {
      const nebulaTotalCount = this.config.SECONDARY_NEBULA_COUNT;
      let positions = new Float32Array(nebulaTotalCount * 3);
      let colors = new Float32Array(nebulaTotalCount * 3);
      let sizes = new Float32Array(nebulaTotalCount);
      let opacities = new Float32Array(nebulaTotalCount);

      // Convert hex colors to THREE.Color objects
      const nebulaColors = this.config.SECONDARY_NEBULA_COLORS.map(
        (color) => new THREE.Color(color)
      );

      let currentIndex = 0;

      // Skip core particles and only generate nebula along spiral arms
      const perArm = Math.floor(nebulaTotalCount / this.config.ARMS);

      // Create a noise pattern for patchiness
      const patchSeed = Math.random() * 1000;

      for (let j = 0; j < this.config.ARMS; j++) {
        const armOffset = (j * 2 * Math.PI) / this.config.ARMS;

        for (let i = 0; i < perArm && currentIndex < nebulaTotalCount; i++) {
          // Use non-linear distribution to place more particles in inner regions for orange colors
          const armPosition = Math.pow(i / perArm, 0.7); // Different distribution than primary nebula

          // Skip particles that would be too close to the center
          if (armPosition < NEBULA_CENTER_HOLE) {
            continue;
          }

          // Create patchy distribution - skip points based on noise pattern
          const noiseVal =
            Math.sin(armPosition * 20 + patchSeed) *
            Math.cos(armPosition * 15 + patchSeed * 0.7) *
            Math.sin((j + 1) * 5);

          if (Math.abs(noiseVal) < this.config.SECONDARY_NEBULA_PATCHINESS) {
            continue; // Skip this point to create patches
          }

          // Different extend factor for secondary nebula
          const distance =
            armPosition *
            ARM_X_DIST *
            this.config.SECONDARY_NEBULA_EXTEND_FACTOR;
          const angle =
            armOffset + (distance / ARM_X_DIST) * this.config.SPIRAL;

          // More randomness in the secondary layer for spottiness
          const angleSpread = 0.08 + 0.6 * armPosition;
          const widthSpread = 0.15 + 0.6 * armPosition;

          const pos = spiral(
            distance * (1.0 + (Math.random() - 0.5) * widthSpread),
            distance * 0.6 * (1.0 + (Math.random() - 0.5) * widthSpread),
            gaussianRandom(
              0,
              GALAXY_THICKNESS * this.config.SECONDARY_NEBULA_THICKNESS_RATIO
            ),
            angle + gaussianRandom(-angleSpread, angleSpread) // More variable spread
          );

          // Color selection - orange to blue gradient
          // Orange at the beginning of the arm, transitioning to blue at the edges
          const colorPos = Math.min(armPosition * 1.2, 1.0);
          const colorIndex = Math.floor(colorPos * (nebulaColors.length - 1));
          const colorWeight = colorPos * (nebulaColors.length - 1) - colorIndex;

          const color1 = nebulaColors[colorIndex];
          const color2 =
            nebulaColors[Math.min(colorIndex + 1, nebulaColors.length - 1)];
          const color = new THREE.Color()
            .copy(color1)
            .lerp(color2, colorWeight);

          const idx = currentIndex * 3;
          positions[idx] = pos.x;
          positions[idx + 1] = pos.y;
          positions[idx + 2] = pos.z;
          colors[idx] = color.r;
          colors[idx + 1] = color.g;
          colors[idx + 2] = color.b;

          // Size calculation - smaller near the center (orange area)
          const particleSize =
            this.config.SECONDARY_NEBULA_MIN_SIZE +
            armPosition *
              (this.config.SECONDARY_NEBULA_MAX_SIZE -
                this.config.SECONDARY_NEBULA_MIN_SIZE);

          // Add more randomness to sizes
          sizes[currentIndex] = particleSize * (0.7 + Math.random() * 0.6);

          // Opacity decreases from center to edge (opposite of primary nebula)
          const baseOpacity =
            this.config.SECONDARY_NEBULA_MAX_OPACITY -
            armPosition *
              (this.config.SECONDARY_NEBULA_MAX_OPACITY -
                this.config.SECONDARY_NEBULA_MIN_OPACITY);

          opacities[currentIndex] = baseOpacity * (0.7 + Math.random() * 0.3);

          currentIndex++;
        }
      }

      if (currentIndex === 0) {
        console.error("No secondary nebula particles were created");
        return;
      }

      // Create new arrays with the exact size needed
      const finalPositions = new Float32Array(currentIndex * 3);
      const finalColors = new Float32Array(currentIndex * 3);
      const finalSizes = new Float32Array(currentIndex);
      const finalOpacities = new Float32Array(currentIndex);

      // Copy data to the new arrays
      finalPositions.set(positions.subarray(0, currentIndex * 3));
      finalColors.set(colors.subarray(0, currentIndex * 3));
      finalSizes.set(sizes.subarray(0, currentIndex));
      finalOpacities.set(opacities.subarray(0, currentIndex));

      // Create optimized geometry
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(finalPositions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(finalColors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(finalSizes, 1));
      geometry.setAttribute(
        "opacity",
        new THREE.BufferAttribute(finalOpacities, 1)
      );

      geometry.computeBoundingSphere();
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
      geometry.attributes.color.usage = THREE.StaticDrawUsage;
      geometry.attributes.size.usage = THREE.StaticDrawUsage;
      geometry.attributes.opacity.usage = THREE.StaticDrawUsage;

      // Create material with same shaders but different blending
      const material = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: nebulaVertexShader,
        fragmentShader: nebulaFragmentShader,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
      });

      // Create the secondary nebula cloud effect
      this.secondaryNebulaClouds = new THREE.Points(geometry, material);
      this.secondaryNebulaClouds.layers.enable(BASE_LAYER);
      this.secondaryNebulaClouds.layers.enable(BLOOM_LAYER);
      this.secondaryNebulaClouds.frustumCulled = false;
      this.secondaryNebulaClouds.matrixAutoUpdate = false;
      this.secondaryNebulaClouds.matrixWorldAutoUpdate = false;
    } catch (error) {
      console.error("Error generating secondary nebula clouds:", error);
    }
  }

  updateScale(camera) {
    if (!this.stars) return;

    // Only update matrix when camera position changes significantly
    const distance = camera.position.distanceTo(this.stars.position);
    if (!this.lastDistance || Math.abs(distance - this.lastDistance) > 1) {
      this.stars.updateMatrix();
      this.stars.updateMatrixWorld();
      if (this.nebulaClouds) {
        this.nebulaClouds.updateMatrix();
        this.nebulaClouds.updateMatrixWorld();
      }
      if (this.secondaryNebulaClouds) {
        this.secondaryNebulaClouds.updateMatrix();
        this.secondaryNebulaClouds.updateMatrixWorld();
      }
      this.lastDistance = distance;
    }
  }

  handleMouseMove(event, camera) {
    if (!this.stars || !this.starData) return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObject(this.stars);

    if (intersects.length > 0) {
      const index = intersects[0].index;
      const starType = this.starData.starTypes[index];

      // Highlight exactly the hovered star (by id, not by type)
      if (this.hoveredStarIndex !== index) {
        this.hoveredStarIndex = index;
        this.stars.material.uniforms.hoveredStarIndex.value = index;
      }
    } else {
      if (this.hoveredStarIndex !== -1) {
        this.hoveredStarIndex = -1;
        this.stars.material.uniforms.hoveredStarIndex.value = -1;
      }
    }
  }

  handleClick(event, camera) {
    if (!this.stars || !this.starData) return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObject(this.stars);

    if (intersects.length > 0) {
      const index = intersects[0].index;
      const starType = this.starData.starTypes[index];
      const position = new THREE.Vector3(
        this.starData.positions[index * 3],
        this.starData.positions[index * 3 + 1],
        this.starData.positions[index * 3 + 2]
      );

      // Update selected star (by id, so only that star is highlighted)
      this.selectedStarIndex = index;
      this.stars.material.uniforms.selectedStarIndex.value = index;

      if (this.onStarHover) {
        this.onStarHover({
          type: starType,
          position: position,
          index: index,
        });
      }

      if (this.onStarClick) {
        this.onStarClick({
          type: starType,
          position: position,
          index: index,
        });
      }
    } else {
      // Clear selection if clicking empty space
      this.clearSelection();
    }
  }

  clearSelection() {
    this.selectedStarIndex = -1;
    this.stars.material.uniforms.selectedStarIndex.value = -1;
    if (this.onStarHover) {
      this.onStarHover(null);
    }
  }

  update(delta) {
    this.time += delta;
  }

  toThreeObject() {
    // Create a group to hold all galaxy components
    const group = new THREE.Group();

    // Add stars if they exist
    if (this.stars && this.stars instanceof THREE.Object3D) {
      group.add(this.stars);
    }

    // Add nebula clouds if they exist
    if (this.nebulaClouds && this.nebulaClouds instanceof THREE.Object3D) {
      group.add(this.nebulaClouds);
    }

    // Add secondary nebula clouds if they exist
    if (
      this.secondaryNebulaClouds &&
      this.secondaryNebulaClouds instanceof THREE.Object3D
    ) {
      group.add(this.secondaryNebulaClouds);
    }

    return group;
  }

  cleanup() {
    if (this.stars) {
      if (this.stars.geometry) {
        this.stars.geometry.dispose();
        this.stars.geometry = null;
      }
      if (this.stars.material) {
        this.stars.material.dispose();
        this.stars.material = null;
      }
      this.stars = null;
    }

    if (this.nebulaClouds) {
      if (this.nebulaClouds.geometry) {
        this.nebulaClouds.geometry.dispose();
        this.nebulaClouds.geometry = null;
      }
      if (this.nebulaClouds.material) {
        this.nebulaClouds.material.dispose();
        this.nebulaClouds.material = null;
      }
      this.nebulaClouds = null;
    }

    if (this.secondaryNebulaClouds) {
      if (this.secondaryNebulaClouds.geometry) {
        this.secondaryNebulaClouds.geometry.dispose();
        this.secondaryNebulaClouds.geometry = null;
      }
      if (this.secondaryNebulaClouds.material) {
        this.secondaryNebulaClouds.material.dispose();
        this.secondaryNebulaClouds.material = null;
      }
      this.secondaryNebulaClouds = null;
    }
  }
}
