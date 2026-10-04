import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';
import { 
  generateEnergyParticulates,
  generateSafetyParticulates,
  generateSecurityCoreSphereParticulates,
  createParticulateShaderMaterial,
  createSoftCoreShaderMaterial,
  PARTICLE_COUNT
} from './particulateSculptures';
import { createMdxPowderDustCloud, setupMdxStudioLighting } from './sculpturalMaterial';

export type SculpturalSubject = 'camera' | 'energy' | 'portal';

export interface CampusHeroCamera3DProps {
  className?: string;
  style?: React.CSSProperties;
  activeSculpture?: SculpturalSubject;
  onSculptureChange?: (subject: SculpturalSubject) => void;
}

export const CampusHeroCamera3D: React.FC<CampusHeroCamera3DProps> = ({
  className = '',
  style = {},
  activeSculpture = 'camera',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const targetModeRef = useRef<SculpturalSubject>(activeSculpture);
  useEffect(() => {
    targetModeRef.current = activeSculpture;
  }, [activeSculpture]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 700;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 1000);
    camera.position.set(0, 0.8, 18.5);
    camera.lookAt(0, 0.2, 0);

    // 3. Renderer with high anti-aliasing
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // 4. Broad Studio Diffuse Lighting
    setupMdxStudioLighting(scene);

    // 5. Ambient Powder Dust Cloud (280 weightless suspended grains)
    const dustCloud = createMdxPowderDustCloud(280, 22);
    scene.add(dustCloud);

    // Master rig group
    const masterRig = new THREE.Group();
    scene.add(masterRig);

    // =========================================================================
    // PROCEDURAL PARTICULATE DATASETS FOR ALL 3 SCULPTURAL SUBJECTS
    // =========================================================================
    const coreSphereData = generateSecurityCoreSphereParticulates(PARTICLE_COUNT);
    const energyData = generateEnergyParticulates(PARTICLE_COUNT);
    const safetyData = generateSafetyParticulates(PARTICLE_COUNT);

    const datasets: Record<SculpturalSubject, typeof coreSphereData> = {
      camera: coreSphereData,
      energy: energyData,
      portal: safetyData,
    };

    // BufferGeometry for the 42,000 Particulate Powder Sculpture
    const particleGeo = new THREE.BufferGeometry();
    const currentPositions = new Float32Array(coreSphereData.positions);
    const currentNormals = new Float32Array(coreSphereData.normals);
    const targetPositions = new Float32Array(coreSphereData.positions);
    const targetNormals = new Float32Array(coreSphereData.normals);

    particleGeo.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    particleGeo.setAttribute('normal', new THREE.BufferAttribute(currentNormals, 3));
    particleGeo.setAttribute('aTargetPosition', new THREE.BufferAttribute(targetPositions, 3));
    particleGeo.setAttribute('aTargetNormal', new THREE.BufferAttribute(targetNormals, 3));
    particleGeo.setAttribute('aSeed', new THREE.BufferAttribute(coreSphereData.seeds, 1));

    // Custom GLSL Particulate Shader Material
    const particleMat = createParticulateShaderMaterial({
      pointSize: 4.2,
      opacity: 0.92,
    });

    const particleMesh = new THREE.Points(particleGeo, particleMat);
    masterRig.add(particleMesh);

    // =========================================================================
    // SUB-SURFACE SOFT CORES (Fresnel inverted-alpha: zero silhouette knife lines)
    // =========================================================================
    const softCoreMat = createSoftCoreShaderMaterial();

    // Central Security Core soft core sphere mesh
    const cameraCoreGeo = new THREE.SphereGeometry(2.35, 32, 32);
    const cameraCoreMesh = new THREE.Mesh(cameraCoreGeo, softCoreMat);
    cameraCoreMesh.position.set(0, 0, 0);
    masterRig.add(cameraCoreMesh);

    // Energy soft core mesh
    const energySplinePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const u = (i / 60) * Math.PI * 2;
      const r = 3.3 + Math.sin(u * 3) * 0.9;
      energySplinePoints.push(new THREE.Vector3(
        r * Math.sin(u),
        r * Math.cos(u) * 0.9 + Math.sin(u * 2) * 0.7,
        Math.sin(u * 3) * 1.7
      ));
    }
    const energyCurve = new THREE.CatmullRomCurve3(energySplinePoints, true);
    const energyCoreGeo = new THREE.TubeGeometry(energyCurve, 60, 0.45, 8, true);
    const energyCoreMesh = new THREE.Mesh(energyCoreGeo, softCoreMat);
    energyCoreMesh.visible = false;
    masterRig.add(energyCoreMesh);

    // Portal soft core mesh
    const portalCoreGeo = new THREE.TorusGeometry(2.1, 0.55, 16, 32, Math.PI);
    const portalCoreMesh = new THREE.Mesh(portalCoreGeo, softCoreMat);
    portalCoreMesh.position.set(0, 0.9, 0);
    portalCoreMesh.visible = false;
    masterRig.add(portalCoreMesh);

    const coreMeshes: Record<SculpturalSubject, THREE.Mesh> = {
      camera: cameraCoreMesh,
      energy: energyCoreMesh,
      portal: portalCoreMesh,
    };

    // =========================================================================
    // SEAMLESS PARTICLE MORPHING STATE
    // =========================================================================
    let currentSubject: SculpturalSubject = 'camera';
    let targetSubject: SculpturalSubject = 'camera';
    let morphProgress = 0.0;
    let isMorphing = false;

    const setMorphTarget = (newSubject: SculpturalSubject) => {
      if (newSubject === targetSubject && !isMorphing) return;

      // Finish any pending interpolation into currentPositions
      if (isMorphing) {
        const curAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
        const normAttr = particleGeo.getAttribute('normal') as THREE.BufferAttribute;
        const curArr = curAttr.array as Float32Array;
        const normArr = normAttr.array as Float32Array;
        const tgtArr = (particleGeo.getAttribute('aTargetPosition') as THREE.BufferAttribute).array as Float32Array;
        const tgtNormArr = (particleGeo.getAttribute('aTargetNormal') as THREE.BufferAttribute).array as Float32Array;

        for (let i = 0; i < curArr.length; i++) {
          curArr[i] = curArr[i] + (tgtArr[i] - curArr[i]) * morphProgress;
          normArr[i] = normArr[i] + (tgtNormArr[i] - normArr[i]) * morphProgress;
        }
        curAttr.needsUpdate = true;
        normAttr.needsUpdate = true;
      }

      currentSubject = targetSubject;
      targetSubject = newSubject;
      morphProgress = 0.0;
      isMorphing = true;

      // Update target attributes
      const targetData = datasets[newSubject];
      const targetPosAttr = particleGeo.getAttribute('aTargetPosition') as THREE.BufferAttribute;
      const targetNormAttr = particleGeo.getAttribute('aTargetNormal') as THREE.BufferAttribute;

      (targetPosAttr.array as Float32Array).set(targetData.positions);
      (targetNormAttr.array as Float32Array).set(targetData.normals);

      targetPosAttr.needsUpdate = true;
      targetNormAttr.needsUpdate = true;

      // Update soft core visibility
      (Object.keys(coreMeshes) as SculpturalSubject[]).forEach((key) => {
        coreMeshes[key].visible = key === newSubject || key === currentSubject;
      });
    };

    // Mouse parallax tracking
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetParallaxX = x * 0.38;
      targetParallaxY = y * 0.28;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 800;
      height = container.clientHeight || 700;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // =========================================================================
    // ANIMATION LOOP: Weightless floating, slow organic drift, particle morph
    // =========================================================================
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Check for external subject changes
      if (targetModeRef.current !== targetSubject) {
        setMorphTarget(targetModeRef.current);
      }

      // Progress morph interpolation
      if (isMorphing) {
        morphProgress += delta * 1.6; // ~0.65s transition
        if (morphProgress >= 1.0) {
          morphProgress = 1.0;
          isMorphing = false;

          // Commit target positions to current
          const curAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
          const normAttr = particleGeo.getAttribute('normal') as THREE.BufferAttribute;
          const targetData = datasets[targetSubject];

          (curAttr.array as Float32Array).set(targetData.positions);
          (normAttr.array as Float32Array).set(targetData.normals);
          curAttr.needsUpdate = true;
          normAttr.needsUpdate = true;

          currentSubject = targetSubject;
          morphProgress = 0.0;

          (Object.keys(coreMeshes) as SculpturalSubject[]).forEach((key) => {
            coreMeshes[key].visible = key === targetSubject;
          });
        }

        particleMat.uniforms.uMorph.value = morphProgress;
      }

      particleMat.uniforms.uTime.value = elapsedTime;

      if (!shouldReduceMotion) {
        // Damped mouse parallax
        currentParallaxX += (targetParallaxX - currentParallaxX) * 0.045;
        currentParallaxY += (targetParallaxY - currentParallaxY) * 0.045;

        // Weightless vertical breathing oscillation
        const breathY = Math.sin(elapsedTime * 0.65) * 0.16;
        const breathScale = 1.0 + Math.sin(elapsedTime * 0.45) * 0.012;

        masterRig.position.y = breathY + currentParallaxY * 0.7;
        masterRig.position.x = currentParallaxX * 0.7;
        masterRig.scale.set(breathScale, breathScale, breathScale);

        // Very slow, weightless organic rotation
        if (targetSubject === 'camera') {
          masterRig.rotation.y = -0.32 + Math.sin(elapsedTime * 0.28) * 0.08 + currentParallaxX * 0.35;
          masterRig.rotation.x = 0.12 + Math.cos(elapsedTime * 0.22) * 0.05 + currentParallaxY * 0.28;
          masterRig.rotation.z = Math.sin(elapsedTime * 0.18) * 0.02;
        } else if (targetSubject === 'energy') {
          masterRig.rotation.y = elapsedTime * 0.22 + currentParallaxX * 0.4;
          masterRig.rotation.x = Math.sin(elapsedTime * 0.25) * 0.22 + currentParallaxY * 0.3;
          masterRig.rotation.z = Math.cos(elapsedTime * 0.18) * 0.15;
        } else {
          masterRig.rotation.y = Math.sin(elapsedTime * 0.22) * 0.14 + currentParallaxX * 0.3;
          masterRig.rotation.x = 0.08 + Math.cos(elapsedTime * 0.3) * 0.04;
          masterRig.rotation.z = 0;
        }

        // Ambient powder dust particle drift
        dustCloud.rotation.y = elapsedTime * 0.032;
        dustCloud.rotation.x = Math.sin(elapsedTime * 0.02) * 0.04;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      softCoreMat.dispose();
      cameraCoreGeo.dispose();
      energyCoreGeo.dispose();
      portalCoreGeo.dispose();
    };
  }, [shouldReduceMotion]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full flex items-center justify-center ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...style,
      }}
    >
      {/* Soft MDX Dreamlike Center Atmospheric Glow */}
      <div 
        style={{
          position: 'absolute',
          inset: '10% 12%',
          background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(255, 236, 218, 0.45) 0%, rgba(246, 242, 235, 0.55) 48%, rgba(245, 247, 250, 0) 100%)',
          filter: 'blur(34px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* 3D WebGL Particulate Canvas */}
      <canvas 
        ref={canvasRef} 
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
};
