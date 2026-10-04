import * as THREE from 'three';

export const PARTICLE_COUNT = 42000;

/**
 * Procedural generation of 3D particulate coordinates for MDX-style sculptures.
 * Generates exact surface positions, normals, and micro-particulate jitter for:
 * 1. CCTV Security Camera Sculpture
 * 2. Energy / Electricity Waveform Sculpture
 * 3. Safety / Sensor Gateway Sculpture
 */

export interface SculptureGeometryData {
  positions: Float32Array;
  normals: Float32Array;
  seeds: Float32Array;
}

// 1. Camera Sculpture Surface Sampling
export function generateCameraParticulates(count: number = PARTICLE_COUNT): SculptureGeometryData {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  let idx = 0;

  // Sub-allocations for camera parts:
  const bodyCount = Math.floor(count * 0.48);     // ~20,160
  const visorCount = Math.floor(count * 0.22);    // ~9,240
  const lensCount = Math.floor(count * 0.16);     // ~6,720
  const armCount = Math.floor(count * 0.10);      // ~4,200

  // A. Camera Body (Aerodynamic tapered capsule)
  for (let i = 0; i < bodyCount; i++) {
    const u = Math.random(); // longitudinal
    const theta = Math.random() * Math.PI * 2;

    // z along camera body axis from -3.0 to +3.0
    const z = (u - 0.5) * 6.0;
    // Slight aerodynamic tapering: wider at center, gently rounded at rear
    const taper = 1.0 - Math.pow(Math.abs(u - 0.45) * 1.3, 2.0) * 0.18;
    const r = (2.25 * taper) + (Math.random() - 0.5) * 0.05;

    // Surface position
    const nx = Math.cos(theta);
    const ny = Math.sin(theta);
    const nz = -(u - 0.45) * 0.4;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    const normX = nx / len;
    const normY = ny / len;
    const normZ = nz / len;

    // Add fine particulate surface breakup
    const jitter = (Math.random() - 0.5) * 0.04;
    positions[idx * 3] = r * Math.cos(theta) + normX * jitter;
    positions[idx * 3 + 1] = r * Math.sin(theta) + normY * jitter;
    positions[idx * 3 + 2] = z + normZ * jitter;

    normals[idx * 3] = normX;
    normals[idx * 3 + 1] = normY;
    normals[idx * 3 + 2] = normZ;

    seeds[idx] = Math.random();
    idx++;
  }

  // B. Integrated Visor / Sunshield Hood (Sculptural crest over top)
  for (let i = 0; i < visorCount; i++) {
    const u = Math.random(); // longitudinal
    const angle = (Math.random() - 0.5) * (Math.PI * 0.88); // arched over top

    const z = (u - 0.4) * 4.6 + 0.8;
    const r = 2.58 + (Math.random() - 0.5) * 0.06;

    const normX = Math.sin(angle);
    const normY = Math.cos(angle);
    const normZ = 0.08;

    const jitter = (Math.random() - 0.5) * 0.04;
    positions[idx * 3] = r * Math.sin(angle) + normX * jitter;
    positions[idx * 3 + 1] = r * Math.cos(angle) + 0.28 + normY * jitter;
    positions[idx * 3 + 2] = z + normZ * jitter;

    normals[idx * 3] = normX;
    normals[idx * 3 + 1] = normY;
    normals[idx * 3 + 2] = normZ;

    seeds[idx] = Math.random();
    idx++;
  }

  // C. Concentric Stepped Lens Amphitheater (Front Face)
  for (let i = 0; i < lensCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const radiusFrac = Math.sqrt(Math.random()); // uniform disk
    const maxRadius = 1.95;
    const r = radiusFrac * maxRadius;

    // Stepped parabolic bowl depression
    let zOffset = 3.05;
    if (r > 1.35) {
      zOffset += 0.05; // Outer bezel step
    } else if (r > 0.65) {
      zOffset -= 0.28 * Math.cos((r / 1.35) * Math.PI * 0.5); // Middle carved bowl
    } else {
      zOffset -= 0.45; // Central recessed aperture
      if (r < 0.28) {
        zOffset += Math.sqrt(Math.max(0, 0.08 - r * r)); // Central focal bead
      }
    }

    const jitter = (Math.random() - 0.5) * 0.03;
    positions[idx * 3] = r * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(theta);
    positions[idx * 3 + 2] = zOffset + jitter;

    // Normal points largely forward (+z) with slight concavity inward
    const normX = -Math.cos(theta) * (r / maxRadius) * 0.35;
    const normY = -Math.sin(theta) * (r / maxRadius) * 0.35;
    const normZ = 0.9;
    const len = Math.sqrt(normX * normX + normY * normY + normZ * normZ);

    normals[idx * 3] = normX / len;
    normals[idx * 3 + 1] = normY / len;
    normals[idx * 3 + 2] = normZ / len;

    seeds[idx] = Math.random();
    idx++;
  }

  // D. Sculptural Cantilever Arm (Swan Neck Mount)
  for (let i = 0; i < armCount; i++) {
    const t = Math.random(); // 0 to 1 along curve
    const tubeAngle = Math.random() * Math.PI * 2;
    const tubeRadius = 0.48 + (Math.random() - 0.5) * 0.04;

    // S-curve from bottom of camera backward toward mount
    const cx = -0.2 - t * 2.8;
    const cy = -2.1 - Math.sin(t * Math.PI * 0.65) * 2.2;
    const cz = -t * 1.2;

    const px = cx + tubeRadius * Math.cos(tubeAngle);
    const py = cy + tubeRadius * Math.sin(tubeAngle);
    const pz = cz;

    positions[idx * 3] = px;
    positions[idx * 3 + 1] = py;
    positions[idx * 3 + 2] = pz;

    normals[idx * 3] = Math.cos(tubeAngle);
    normals[idx * 3 + 1] = Math.sin(tubeAngle);
    normals[idx * 3 + 2] = -0.2;

    seeds[idx] = Math.random();
    idx++;
  }

  // E. Mounting Base Medallion
  while (idx < count) {
    const theta = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 1.55;

    positions[idx * 3] = -3.2 + (Math.random() - 0.5) * 0.25;
    positions[idx * 3 + 1] = -4.1 + r * Math.sin(theta);
    positions[idx * 3 + 2] = -1.2 + r * Math.cos(theta);

    normals[idx * 3] = -1.0;
    normals[idx * 3 + 1] = 0.0;
    normals[idx * 3 + 2] = 0.0;

    seeds[idx] = Math.random();
    idx++;
  }

  return { positions, normals, seeds };
}

// 2. Energy / Electricity Sculptural Waveform Sampling
export function generateEnergyParticulates(count: number = PARTICLE_COUNT): SculptureGeometryData {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  let idx = 0;
  const mainCount = Math.floor(count * 0.72);

  // A. Primary Continuous Flowing Kinetic Trefoil / Mobius Energy Ribbon
  for (let i = 0; i < mainCount; i++) {
    const u = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;

    // Kinetic 3D parametric trefoil with angular electric kinks
    const r = 3.3 + Math.sin(u * 3.0) * 0.95;
    const cx = r * Math.sin(u);
    const cy = r * Math.cos(u) * 0.9 + Math.sin(u * 2.0) * 0.75;
    const cz = Math.sin(u * 3.0) * 1.8;

    // Tube radius with micro-faceting
    const tubeRadius = (0.55 + Math.sin(u * 6.0) * 0.12) + (Math.random() - 0.5) * 0.04;
    const px = cx + tubeRadius * Math.cos(phi);
    const py = cy + tubeRadius * Math.sin(phi);
    const pz = cz + tubeRadius * Math.sin(phi * 2.0) * 0.35;

    const normX = Math.cos(phi);
    const normY = Math.sin(phi);
    const normZ = Math.sin(phi * 2.0) * 0.4;
    const len = Math.sqrt(normX * normX + normY * normY + normZ * normZ);

    const jitter = (Math.random() - 0.5) * 0.04;
    positions[idx * 3] = px + (normX / len) * jitter;
    positions[idx * 3 + 1] = py + (normY / len) * jitter;
    positions[idx * 3 + 2] = pz + (normZ / len) * jitter;

    normals[idx * 3] = normX / len;
    normals[idx * 3 + 1] = normY / len;
    normals[idx * 3 + 2] = normZ / len;

    seeds[idx] = Math.random();
    idx++;
  }

  // B. Secondary Nested Counter-Waveform Loop
  while (idx < count) {
    const u = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;

    const r = 1.95 + Math.cos(u * 2.0) * 0.45;
    const cx = r * Math.cos(u);
    const cy = r * Math.sin(u) * 1.05;
    const cz = Math.sin(u * 2.0) * 1.15;

    const tubeRadius = 0.28 + (Math.random() - 0.5) * 0.03;
    const px = cx + tubeRadius * Math.cos(phi);
    const py = cy + tubeRadius * Math.sin(phi);
    const pz = cz;

    const normX = Math.cos(phi);
    const normY = Math.sin(phi);
    const normZ = 0.1;
    const len = Math.sqrt(normX * normX + normY * normY + normZ * normZ);

    const jitter = (Math.random() - 0.5) * 0.03;
    positions[idx * 3] = px + (normX / len) * jitter;
    positions[idx * 3 + 1] = py + (normY / len) * jitter;
    positions[idx * 3 + 2] = pz + (normZ / len) * jitter;

    normals[idx * 3] = normX / len;
    normals[idx * 3 + 1] = normY / len;
    normals[idx * 3 + 2] = normZ / len;

    seeds[idx] = Math.random();
    idx++;
  }

  return { positions, normals, seeds };
}

// 3. Safety / Sensor Monolithic Gateway Sampling
export function generateSafetyParticulates(count: number = PARTICLE_COUNT): SculptureGeometryData {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  let idx = 0;
  const archCount = Math.floor(count * 0.62);
  const innerArchCount = Math.floor(count * 0.24);

  // A. Outer Monolithic Architectural Gateway Arch
  for (let i = 0; i < archCount; i++) {
    const t = Math.random(); // along arch profile
    const depth = (Math.random() - 0.5) * 1.35; // thickness z

    let x = 0;
    let y = 0;
    let normX = 0;
    let normY = 0;

    if (t < 0.28) {
      // Left vertical pillar
      const subT = t / 0.28;
      x = -2.35 + (Math.random() - 0.5) * 0.7;
      y = -3.6 + subT * 4.6;
      normX = -1.0;
      normY = 0.0;
    } else if (t < 0.56) {
      // Right vertical pillar
      const subT = (t - 0.28) / 0.28;
      x = 2.35 + (Math.random() - 0.5) * 0.7;
      y = -3.6 + subT * 4.6;
      normX = 1.0;
      normY = 0.0;
    } else {
      // Top curved semicircular crown
      const subT = (t - 0.56) / 0.44;
      const angle = subT * Math.PI;
      const r = 2.35 + (Math.random() - 0.5) * 0.7;
      x = r * Math.cos(angle);
      y = 1.0 + r * Math.sin(angle);
      normX = Math.cos(angle);
      normY = Math.sin(angle);
    }

    const jitter = (Math.random() - 0.5) * 0.04;
    positions[idx * 3] = x + normX * jitter;
    positions[idx * 3 + 1] = y + normY * jitter;
    positions[idx * 3 + 2] = depth;

    normals[idx * 3] = normX;
    normals[idx * 3 + 1] = normY;
    normals[idx * 3 + 2] = depth > 0 ? 0.4 : -0.4;

    seeds[idx] = Math.random();
    idx++;
  }

  // B. Stepped Concentric Inner Aperture
  for (let i = 0; i < innerArchCount; i++) {
    const angle = Math.random() * Math.PI;
    const r = 1.45 + (Math.random() - 0.5) * 0.4;
    const depth = (Math.random() - 0.5) * 0.85;

    const x = r * Math.cos(angle);
    const y = 0.9 + r * Math.sin(angle);

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = depth;

    normals[idx * 3] = Math.cos(angle);
    normals[idx * 3 + 1] = Math.sin(angle);
    normals[idx * 3 + 2] = 0.3;

    seeds[idx] = Math.random();
    idx++;
  }

  // C. Central Suspended Spherical Sensor Core
  while (idx < count) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 0.72 + (Math.random() - 0.5) * 0.05;

    const px = r * Math.sin(phi) * Math.cos(theta);
    const py = 0.85 + r * Math.sin(phi) * Math.sin(theta);
    const pz = r * Math.cos(phi);

    positions[idx * 3] = px;
    positions[idx * 3 + 1] = py;
    positions[idx * 3 + 2] = pz;

    normals[idx * 3] = Math.sin(phi) * Math.cos(theta);
    normals[idx * 3 + 1] = Math.sin(phi) * Math.sin(theta);
    normals[idx * 3 + 2] = Math.cos(phi);

    seeds[idx] = Math.random();
    idx++;
  }

  return { positions, normals, seeds };
}

// 4. Central Security Core Sphere (MDX Hero Translucent Orb Reference)
export function generateSecurityCoreSphereParticulates(count: number = PARTICLE_COUNT): SculptureGeometryData {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  let idx = 0;
  const shellCount = Math.floor(count * 0.70);
  const ringCount = Math.floor(count * 0.16);

  // A. Frosted Translucent Volumetric Sphere Shell
  for (let i = 0; i < shellCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 2.65 + (Math.random() - 0.5) * 0.24;

    const nx = Math.sin(phi) * Math.cos(theta);
    const ny = Math.sin(phi) * Math.sin(theta);
    const nz = Math.cos(phi);

    const jitter = (Math.random() - 0.5) * 0.05;
    positions[idx * 3] = (r + jitter) * nx;
    positions[idx * 3 + 1] = (r + jitter) * ny;
    positions[idx * 3 + 2] = (r + jitter) * nz;

    normals[idx * 3] = nx;
    normals[idx * 3 + 1] = ny;
    normals[idx * 3 + 2] = nz;

    seeds[idx] = Math.random();
    idx++;
  }

  // B. Orbital Sensor Perimeter Latitudes
  for (let i = 0; i < ringCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const isEquator = Math.random() > 0.45;
    const ringRadius = 2.98 + (Math.random() - 0.5) * 0.08;

    let rx = ringRadius * Math.cos(angle);
    let ry = ringRadius * Math.sin(angle) * (isEquator ? 0.35 : 0.85);
    let rz = ringRadius * Math.sin(angle);

    if (!isEquator) {
      const tempY = ry * Math.cos(0.65) - rz * Math.sin(0.65);
      const tempZ = ry * Math.sin(0.65) + rz * Math.cos(0.65);
      ry = tempY;
      rz = tempZ;
    }

    positions[idx * 3] = rx;
    positions[idx * 3 + 1] = ry;
    positions[idx * 3 + 2] = rz;

    const len = Math.sqrt(rx * rx + ry * ry + rz * rz);
    normals[idx * 3] = rx / len;
    normals[idx * 3 + 1] = ry / len;
    normals[idx * 3 + 2] = rz / len;

    seeds[idx] = Math.random();
    idx++;
  }

  // C. Dense Radiant Inner Core
  while (idx < count) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.pow(Math.random(), 0.6) * 1.35;

    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);

    normals[idx * 3] = Math.sin(phi) * Math.cos(theta);
    normals[idx * 3 + 1] = Math.sin(phi) * Math.sin(theta);
    normals[idx * 3 + 2] = Math.cos(phi);

    seeds[idx] = Math.random();
    idx++;
  }

  return { positions, normals, seeds };
}

// 5. Custom GLSL Shader for the Particulate Powder Sculpture
export function createParticulateShaderMaterial(options?: {
  pointSize?: number;
  opacity?: number;
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uMorph: { value: 0.0 },
      uPointSize: { value: options?.pointSize ?? 4.0 },
      uOpacity: { value: options?.opacity ?? 0.90 },
      uCoreColor: { value: new THREE.Color(0xff8200) },     // Exact Signature Brand Orange #FF8200
      uSurfaceColor: { value: new THREE.Color(0xf6f3eb) },  // Pale alabaster/cream
      uRimColor: { value: new THREE.Color(0xfdfbf7) },      // Soft airy off-white
      uLightDir: { value: new THREE.Vector3(0.5, 1.0, 0.8).normalize() },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uMorph;
      uniform float uPointSize;

      attribute vec3 aTargetPosition;
      attribute vec3 aTargetNormal;
      attribute float aSeed;

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying float vDist;
      varying float vSeed;

      void main() {
        vSeed = aSeed;

        // Smooth particle morphing between subjects
        vec3 mixedPos = mix(position, aTargetPosition, uMorph);
        vec3 mixedNormal = normalize(mix(normal, aTargetNormal, uMorph));

        // Microscopic organic particulate suspension breathing
        float microJitter = sin(uTime * 1.6 + aSeed * 25.0) * 0.022;
        mixedPos += mixedNormal * microJitter;

        vNormal = normalize(mat3(modelMatrix) * mixedNormal);
        vec4 worldPos = modelMatrix * vec4(mixedPos, 1.0);
        vWorldPosition = worldPos.xyz;
        vDist = length(mixedPos);

        vec4 mvPosition = viewMatrix * worldPos;
        gl_Position = projectionMatrix * mvPosition;

        // Perspective-scaled fine particulate point size
        gl_PointSize = uPointSize * (280.0 / -mvPosition.z);
        gl_PointSize = clamp(gl_PointSize, 1.8, 8.5);
      }
    `,
    fragmentShader: `
      uniform vec3 uCoreColor;
      uniform vec3 uSurfaceColor;
      uniform vec3 uRimColor;
      uniform vec3 uLightDir;
      uniform float uOpacity;

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying float vDist;
      varying float vSeed;

      void main() {
        // Soft, circular chalk/powder micro-grain with anti-aliased edge
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;

        // Micro-grain softness
        float grainAlpha = smoothstep(0.5, 0.08, dist);

        // Subtle warm internal core radiance: center is warmer peach, outer is pale cream
        float depthRatio = clamp(vDist / 4.5, 0.0, 1.0);
        vec3 baseTone = mix(uCoreColor, uSurfaceColor, smoothstep(0.0, 0.65, depthRatio));

        // Broad diffuse studio lighting
        float diffuse = max(dot(vNormal, uLightDir), 0.0) * 0.35 + 0.65;

        // Soft grazing rim illumination
        vec3 viewDir = normalize(-vWorldPosition);
        float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.2);
        vec3 finalColor = mix(baseTone * diffuse, uRimColor, fresnel * 0.35);

        // Micro-particulate luminance variation
        float microVar = fract(vSeed * 137.5) * 0.05 - 0.025;
        finalColor += microVar;

        float finalAlpha = grainAlpha * uOpacity * 0.85;
        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
}

// 5. Custom GLSL Shader for the Sub-Surface Soft Core Mesh
// Inverted Fresnel creates zero polygon edge knife lines: silhouette dissolves into particles!
export function createSoftCoreShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uCoreColor: { value: new THREE.Color(0xf6f3eb) },
      uWarmGlow: { value: new THREE.Color(0xffd5ad) },
      uOpacity: { value: 0.65 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying float vDist;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vDist = length(position);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uCoreColor;
      uniform vec3 uWarmGlow;
      uniform float uOpacity;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying float vDist;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // Inverted Fresnel: edge silhouette alpha falls to ZERO so only particles define the edge!
        float NdotV = max(dot(normal, viewDir), 0.0);
        float edgeFalloff = pow(NdotV, 1.8);

        // Center warm peach glow
        float coreDepth = clamp(vDist / 3.8, 0.0, 1.0);
        vec3 tone = mix(uWarmGlow, uCoreColor, smoothstep(0.0, 0.55, coreDepth));

        gl_FragColor = vec4(tone, edgeFalloff * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,
  });
}
