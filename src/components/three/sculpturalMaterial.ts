import * as THREE from 'three';

/**
 * Procedural ultra-fine granular powder texture for MDX-style chalk/sculptural finish.
 * Generates an organic micro-particulate surface without external assets.
 */
let cachedNoiseTexture: THREE.CanvasTexture | null = null;

export function getMdxPowderNoiseTexture(): THREE.CanvasTexture {
  if (cachedNoiseTexture) return cachedNoiseTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Fill with fine multi-frequency granular noise
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        
        // Multi-layered pseudo-random grain
        const n1 = Math.sin(x * 0.25) * Math.cos(y * 0.25) * 0.5 + 0.5;
        const n2 = Math.sin(x * 1.3 + y * 0.7) * 0.5 + 0.5;
        const n3 = Math.random();
        
        const combined = n1 * 0.2 + n2 * 0.3 + n3 * 0.5;
        const val = Math.floor(215 + combined * 40); // 215 to 255 (pale off-white tones)
        
        // Micro tint variation: slight warm peach/cream shift
        data[i] = Math.min(255, val + 2);     // R (slightly warmer)
        data[i + 1] = Math.min(255, val);     // G
        data[i + 2] = Math.max(0, val - 3);   // B (warmer off-white)
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  cachedNoiseTexture = texture;
  return texture;
}

/**
 * Creates the primary MDX sculptural material:
 * Pale cream / off-white, matte, powdery, granular, diffuse scattering, zero gloss, zero metallics.
 */
export function createMdxSculpturalMaterial(options?: {
  color?: number;
  roughness?: number;
  bumpScale?: number;
  sheenColor?: number;
  transparent?: boolean;
  opacity?: number;
}): THREE.MeshPhysicalMaterial {
  const noise = getMdxPowderNoiseTexture();

  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(options?.color ?? 0xf6f3eb), // Pale off-white / alabaster
    roughness: options?.roughness ?? 0.94,             // High roughness: powdery matte
    metalness: 0.0,                                    // Strictly non-metallic
    bumpMap: noise,
    bumpScale: options?.bumpScale ?? 0.018,            // Fine tactile particulate relief
    roughnessMap: noise,
    sheen: 0.85,                                       // Soft velvet / dust surface scattering
    sheenColor: new THREE.Color(options?.sheenColor ?? 0xffedd8), // Subtle warm peach dawn glow
    sheenRoughness: 0.8,
    clearcoat: 0.0,                                    // Zero gloss
    reflectivity: 0.1,                                 // Extremely subtle ambient reflection
    transparent: options?.transparent ?? false,
    opacity: options?.opacity ?? 1.0,
  });
}

/**
 * Creates a slightly recessed / shadowed sculptural material for carved indentations
 * like lens basins and inner portal arches.
 */
export function createMdxRecessMaterial(options?: {
  color?: number;
  bumpScale?: number;
}): THREE.MeshPhysicalMaterial {
  const noise = getMdxPowderNoiseTexture();

  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(options?.color ?? 0xeee7dc), // Slightly warmer, deeper cream
    roughness: 0.96,
    metalness: 0.0,
    bumpMap: noise,
    bumpScale: options?.bumpScale ?? 0.014,
    sheen: 0.7,
    sheenColor: new THREE.Color(0xffd5ad),
    sheenRoughness: 0.85,
    clearcoat: 0.0,
  });
}

/**
 * Generates an ambient cloud of floating micro-particulate powder dust
 * to give that dreamlike, weightless, powdery MDX atmosphere.
 */
export function createMdxPowderDustCloud(count = 280, spread = 18): THREE.Points {
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Spherical / ellipsoidal cloud distribution
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * (spread * 0.5);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.8;
    const z = r * Math.cos(phi) * 0.7;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    scales[i] = Math.random() * 0.12 + 0.04;
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

  // Circular soft dust point texture
  const pCanvas = document.createElement('canvas');
  pCanvas.width = 32;
  pCanvas.height = 32;
  const pCtx = pCanvas.getContext('2d');
  if (pCtx) {
    const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 245, 235, 0.9)');
    grad.addColorStop(0.5, 'rgba(255, 230, 210, 0.4)');
    grad.addColorStop(1, 'rgba(255, 230, 210, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 32, 32);
  }
  const pTexture = new THREE.CanvasTexture(pCanvas);

  const mat = new THREE.PointsMaterial({
    color: 0xffeedd,
    size: 0.35,
    map: pTexture,
    transparent: true,
    opacity: 0.45,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });

  return new THREE.Points(geom, mat);
}

/**
 * Broad diffuse studio lighting tailored specifically for pale chalk sculptures:
 * Illuminates softly from broad angles without harsh rims or metallic hot spots.
 */
export function setupMdxStudioLighting(scene: THREE.Scene): {
  ambientLight: THREE.AmbientLight;
  keyLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  coreWarmLight: THREE.PointLight;
} {
  // Broad, luminous ambient field: fills shadows so they never become black
  const ambientLight = new THREE.AmbientLight(0xfcf9f2, 2.4);
  scene.add(ambientLight);

  // Soft key light from top-front-right: gentle warm white
  const keyLight = new THREE.DirectionalLight(0xfffbf5, 1.4);
  keyLight.position.set(12, 18, 14);
  scene.add(keyLight);

  // Soft fill light from bottom-front-left: cool airy tone
  const fillLight = new THREE.DirectionalLight(0xedf2f7, 0.9);
  fillLight.position.set(-14, -8, 10);
  scene.add(fillLight);

  // Subtle warm center bounce: radiates soft peach glow from within
  const coreWarmLight = new THREE.PointLight(0xffcca0, 1.5, 30, 1.2);
  coreWarmLight.position.set(0, 0.5, 4);
  scene.add(coreWarmLight);

  return { ambientLight, keyLight, fillLight, coreWarmLight };
}
