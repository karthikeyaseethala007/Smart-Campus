import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';
import { 
  generateEnergyParticulates,
  createParticulateShaderMaterial,
  createSoftCoreShaderMaterial,
} from './particulateSculptures';
import { createMdxPowderDustCloud, setupMdxStudioLighting } from './sculpturalMaterial';

export interface CampusEnergySymbol3DProps {
  className?: string;
  style?: React.CSSProperties;
}

export const CampusEnergySymbol3D: React.FC<CampusEnergySymbol3DProps> = ({
  className = '',
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || 500;
    let height = container.clientHeight || 500;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    camera.position.set(0, 0, 16);
    camera.lookAt(0, 0, 0);

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

    // Soft Studio Lighting Rig
    setupMdxStudioLighting(scene);

    // Ambient floating powder dust cloud
    const dustCloud = createMdxPowderDustCloud(180, 16);
    scene.add(dustCloud);

    const masterRig = new THREE.Group();
    scene.add(masterRig);

    // =========================================================================
    // MDX SCULPTURAL ELECTRICITY FORM: 38,000 PARTICULATE GRAINS
    // Continuous flowing 3D energy loop / kinetic Mobius waveform.
    // Pale powdery chalk, granular surface, warm peach inner radiance.
    // Strictly NO orbit rings, NO circular outlines, NO flat lightning icons.
    // =========================================================================
    const energyData = generateEnergyParticulates(38000);

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(energyData.positions, 3));
    particleGeo.setAttribute('normal', new THREE.BufferAttribute(energyData.normals, 3));
    particleGeo.setAttribute('aTargetPosition', new THREE.BufferAttribute(energyData.positions, 3));
    particleGeo.setAttribute('aTargetNormal', new THREE.BufferAttribute(energyData.normals, 3));
    particleGeo.setAttribute('aSeed', new THREE.BufferAttribute(energyData.seeds, 1));

    const particleMat = createParticulateShaderMaterial({
      pointSize: 4.0,
      opacity: 0.90,
    });

    const particleMesh = new THREE.Points(particleGeo, particleMat);
    masterRig.add(particleMesh);

    // Sub-surface soft core mesh (Inverted Fresnel edge dissolve)
    const softCoreMat = createSoftCoreShaderMaterial();
    const splinePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const u = (i / 60) * Math.PI * 2;
      const r = 3.3 + Math.sin(u * 3) * 0.9;
      splinePoints.push(new THREE.Vector3(
        r * Math.sin(u),
        r * Math.cos(u) * 0.9 + Math.sin(u * 2) * 0.7,
        Math.sin(u * 3) * 1.7
      ));
    }
    const energyCurve = new THREE.CatmullRomCurve3(splinePoints, true);
    const energyCoreGeo = new THREE.TubeGeometry(energyCurve, 60, 0.45, 8, true);
    const energyCoreMesh = new THREE.Mesh(energyCoreGeo, softCoreMat);
    masterRig.add(energyCoreMesh);

    // Parallax mouse tracking
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetParallaxX = x * 0.35;
      targetParallaxY = y * 0.25;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 500;
      height = container.clientHeight || 500;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      particleMat.uniforms.uTime.value = elapsedTime;

      if (!shouldReduceMotion) {
        currentParallaxX += (targetParallaxX - currentParallaxX) * 0.045;
        currentParallaxY += (targetParallaxY - currentParallaxY) * 0.045;

        // Weightless vertical breathing
        const breathY = Math.sin(elapsedTime * 0.7) * 0.16;
        const breathScale = 1.0 + Math.sin(elapsedTime * 0.4) * 0.012;

        masterRig.position.y = breathY + currentParallaxY * 0.6;
        masterRig.position.x = currentParallaxX * 0.6;
        masterRig.scale.set(breathScale, breathScale, breathScale);

        // Hypnotic 3-axis continuous rotation
        masterRig.rotation.y = elapsedTime * 0.2 + currentParallaxX * 0.35;
        masterRig.rotation.x = Math.sin(elapsedTime * 0.25) * 0.22 + currentParallaxY * 0.3;
        masterRig.rotation.z = Math.cos(elapsedTime * 0.18) * 0.14;

        // Powder dust particle drift
        dustCloud.rotation.y = elapsedTime * 0.03;
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
      energyCoreGeo.dispose();
    };
  }, [shouldReduceMotion]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full flex items-center justify-center ${className}`}
      style={{
        height: '440px',
        position: 'relative',
        ...style,
      }}
    >
      {/* Soft MDX Dreamlike Peach Atmosphere */}
      <div 
        style={{
          position: 'absolute',
          inset: '14%',
          background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(255, 235, 215, 0.42) 0%, rgba(246, 243, 237, 0.52) 46%, rgba(245, 247, 250, 0) 100%)',
          filter: 'blur(32px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <canvas 
        ref={canvasRef} 
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          position: 'relative',
          zIndex: 1,
        }}
      />
    </div>
  );
};
