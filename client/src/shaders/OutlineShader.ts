import * as THREE from 'three';

export const OutlineShader = {
  vertexShader: `
    uniform float outlineThickness;
    
    void main() {
      vec4 pos = modelViewMatrix * vec4(position + normal * outlineThickness, 1.0);
      gl_Position = projectionMatrix * pos;
    }
  `,
  
  fragmentShader: `
    uniform vec3 outlineColor;
    uniform float outlineAlpha;
    
    void main() {
      gl_FragColor = vec4(outlineColor, outlineAlpha);
    }
  `
};

export const createOutlineMaterial = (color: number = 0xFFD700, thickness: number = 0.001, alpha: number = 1.0) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      outlineThickness: { value: thickness },
      outlineColor: { value: new THREE.Color(color) },
      outlineAlpha: { value: alpha }
    },
    vertexShader: OutlineShader.vertexShader,
    fragmentShader: OutlineShader.fragmentShader,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
}; 