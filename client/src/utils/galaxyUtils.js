import { Vector3 } from "three";
import { ARM_X_DIST, SPIRAL, ELLIPTICAL_FACTOR } from "../config/renderConfig";

export function gaussianRandom(mean = 0, stdev = 1) {
  let u = 1 - Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function spiral(x, y, z, offset) {
  // Apply the elliptical factor to the x-coordinate to create an elliptical shape
  const xElliptical = x / ELLIPTICAL_FACTOR;

  // Calculate the radius based on the modified coordinates
  let r = Math.sqrt(xElliptical ** 2 + y ** 2);

  // Calculate the angle based on the original coordinates
  let theta = offset;
  theta +=
    xElliptical > 0
      ? Math.atan(y / xElliptical)
      : Math.atan(y / xElliptical) + Math.PI;
  theta += (r / ARM_X_DIST) * SPIRAL;

  // Apply the elliptical factor to the x-coordinate for the output
  return new Vector3(
    r * Math.cos(theta) * ELLIPTICAL_FACTOR,
    r * Math.sin(theta),
    z
  );
}
