uniform sampler2D tDiffuse;
uniform sampler2D tBloom;
uniform float exposure;
uniform float bloomStrength;
uniform float bloomThreshold;
uniform float bloomRadius;

varying vec2 vUv;

#include <common>
#include <lights_pars_begin>
#include <fog_pars_fragment>
#include <batching_pars_fragment>

void main() {
  vec4 diffuseColor = texture2D(tDiffuse, vUv);
  vec4 bloomColor = texture2D(tBloom, vUv);
  
  // Exposure tone mapping
  vec3 color = diffuseColor.rgb * exposure;
  
  // Bloom
  vec3 bloom = bloomColor.rgb * bloomStrength;
  
  // Threshold
  bloom = max(bloom - bloomThreshold, vec3(0.0));
  
  // Combine
  color += bloom;
  
  // Output
  gl_FragColor = vec4(color, diffuseColor.a);
} 