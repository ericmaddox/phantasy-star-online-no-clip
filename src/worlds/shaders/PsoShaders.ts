import * as THREE from 'three';

/**
 * Custom Shaders for PSO visual effects
 */
export class PsoShaders {
  /**
   * Hologram Scanline & Rim Glow Material
   */
  public static createHologramMaterial(color = new THREE.Color(0x00f0ff), opacity = 0.75): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: color },
        uOpacity: { value: opacity }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          vUv = uv;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          
          // Fresnel rim glow
          float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
          
          // Scanlines
          float scanline = sin(vUv.y * 120.0 + uTime * 4.0) * 0.5 + 0.5;
          
          // Glitch flicker
          float flicker = sin(uTime * 15.0) * 0.05 + 0.95;
          
          float alpha = (fresnel * 0.8 + scanline * 0.3) * uOpacity * flicker;
          vec3 finalColor = uColor + vec3(fresnel * 0.5);
          
          gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  /**
   * Flowing Water Shader Material
   */
  public static createWaterMaterial(color = new THREE.Color(0x00a8d6)): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: color }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform float uTime;
        void main() {
          vUv = uv;
          vNormal = normal;
          vec3 pos = position;
          pos.z += sin(pos.x * 0.5 + uTime * 2.0) * 0.2;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          float wave1 = sin(vUv.x * 20.0 + uTime * 3.0) * cos(vUv.y * 20.0 + uTime * 2.0);
          float wave2 = cos(vUv.x * 15.0 - uTime * 2.0) * sin(vUv.y * 15.0 + uTime * 1.5);
          float foam = clamp(pow((wave1 + wave2) * 0.5 + 0.5, 4.0), 0.0, 1.0);
          
          vec3 col = mix(uColor, vec3(0.9, 1.0, 1.0), foam * 0.7);
          gl_FragColor = vec4(col, 0.82);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  /**
   * Molten Lava Shader Material for Caves & Dragon Lair
   */
  public static createLavaMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.y += sin(pos.x * 0.2 + uTime) * cos(pos.z * 0.2 + uTime) * 0.4;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv * 6.0;
          float n = sin(uv.x + sin(uv.y + uTime * 0.8)) * cos(uv.y + cos(uv.x + uTime * 0.6));
          
          vec3 deepRed = vec3(0.5, 0.05, 0.0);
          vec3 brightOrange = vec3(1.0, 0.4, 0.0);
          vec3 coreYellow = vec3(1.0, 0.9, 0.2);
          
          float t = clamp((n + 1.0) * 0.5, 0.0, 1.0);
          vec3 col = mix(deepRed, brightOrange, t);
          col = mix(col, coreYellow, pow(t, 3.0));
          
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
  }

  /**
   * Warp Portal Swirling Ring Material
   */
  public static createWarpMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          vec2 centered = vUv - vec2(0.5);
          float dist = length(centered);
          float angle = atan(centered.y, centered.x);
          
          float swirl = sin(angle * 6.0 + dist * 25.0 - uTime * 5.0);
          float ring = smoothstep(0.48, 0.35, dist) * smoothstep(0.05, 0.2, dist);
          
          vec3 cyan = vec3(0.0, 0.94, 1.0);
          vec3 white = vec3(1.0, 1.0, 1.0);
          
          vec3 col = mix(cyan, white, swirl * 0.5 + 0.5);
          float alpha = ring * (0.6 + swirl * 0.4);
          
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }
}
