import * as THREE from "three";
import {
  BASE_LAYER,
  BLOOM_LAYER,
  STAR_MAX,
  STAR_MIN,
} from "../../config/renderConfig";
import { starTypes } from "../../config/starDistributions";
import { clamp } from "../../utils/galaxyUtils";

// Create materials for each star type
const materials = starTypes.color.map((color) => ({
  core: new THREE.MeshBasicMaterial({
    color: color,
    transparent: false, // Solid core
    depthWrite: true, // Block objects behind
    depthTest: true, // Enable depth testing
  }),
  glow: new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 100.0, // Very high emissive intensity
    transparent: true,
    opacity: 1.0,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    metalness: 0.0,
    roughness: 0.0,
    toneMapped: false,
  }),
}));

export class Star {
  constructor(position) {
    this.position = position;
    this.starType = this.generateStarType();
    this.obj = null;
  }

  generateStarType() {
    let num = Math.random() * 100.0;
    let pct = starTypes.percentage;
    for (let i = 0; i < pct.length; i++) {
      num -= pct[i];
      if (num < 0) {
        // console.log(
        //   `Generated star type ${i} with color ${starTypes.color[i].toString(
        //     16
        //   )}`
        // );
        return i;
      }
    }
    return 0;
  }

  updateScale(camera) {
    if (!this.obj) return;

    let dist = this.position.distanceTo(camera.position);
    // console.log("Star distance from camera:", dist);

    // Remove the /250 division to keep stars larger
    let starSize = dist * starTypes.size[this.starType];
    starSize = clamp(starSize, STAR_MIN, STAR_MAX);

    // console.log(
    //   "Star size before clamp:",
    //   dist * starTypes.size[this.starType]
    // );
    // console.log("Star size after clamp:", starSize);

    this.obj.scale.set(starSize, starSize, starSize);
  }

  toThreeObject() {
    if (this.obj) return this.obj;

    // Create a group to hold both the core and glow
    const group = new THREE.Group();

    // Create the core (smaller sphere)
    const coreGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    const coreMaterial = materials[this.starType].core.clone();
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.scale.multiplyScalar(starTypes.size[this.starType]);
    core.position.copy(this.position);
    core.renderOrder = 998; // Higher render order for core
    core.layers.set(BASE_LAYER);
    group.add(core);

    // Create the glow (larger sphere)
    const glowGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const glowMaterial = materials[this.starType].glow.clone();
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.multiplyScalar(starTypes.size[this.starType]);
    glow.position.copy(this.position);
    glow.renderOrder = 997; // Lower render order for glow
    glow.layers.set(BLOOM_LAYER); // Use BLOOM_LAYER for the glow effect
    group.add(glow);

    this.obj = group;
    return group;
  }
}
