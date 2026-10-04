import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import type { LandingMasterTimeline } from './useLandingMasterTimeline';

interface AtmosphereProps {
  intensity?: number;
  timeline?: LandingMasterTimeline;
}

export const Atmosphere: React.FC<AtmosphereProps> = ({ intensity = 1, timeline }) => {
  const { scrollYProgress } = useScroll();

  // Fallback local transforms if timeline not provided
  const fallbackHeroGlowOpacity = useTransform(scrollYProgress, [0, 0.12, 0.22], [0.34 * intensity, 0.25 * intensity, 0]);
  const fallbackHeroGlowScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.08]);
  const fallbackHeroGlowY = useTransform(scrollYProgress, [0, 0.22], ['0%', '12%']);

  const heroGlowOpacity = timeline ? timeline.atmosphereWarmthOpacity : fallbackHeroGlowOpacity;
  const heroGlowScale = timeline ? timeline.atmosphereWarmthScale : fallbackHeroGlowScale;
  const heroGlowX = timeline ? timeline.atmosphereWarmthX : '58%';
  const heroGlowY = timeline ? timeline.atmosphereWarmthY : fallbackHeroGlowY;

  // Subtle ambient drift for secondary warm lights
  const driftY1 = useTransform(timeline ? timeline.smoothProgress : scrollYProgress, [0, 1], ['0%', '-15%']);
  const driftY2 = useTransform(timeline ? timeline.smoothProgress : scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <div 
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* 1. Base Studio Environment: Soft warm off-white studio floor falloff */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #FAFAFC 0%, #EDEDF0 35%, #E6E7EA 75%, #EEEEF1 100%)',
        }}
      />

      {/* Studio Cyclorama Lighting Backdrop (Physical Studio Horizon) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/assets/atmosphere/studio-cyclorama.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.55,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />

      {/* 2. MDX Optical Lightmap: Hero Center Ellipse (Driven by Master Timeline) */}
      <motion.div
        style={{
          position: 'absolute',
          top: heroGlowY,
          left: heroGlowX,
          x: '-50%',
          y: '-50%',
          width: 'clamp(700px, 68vw, 1100px)',
          height: 'clamp(700px, 68vw, 1100px)',
          opacity: heroGlowOpacity,
          scale: heroGlowScale,
          pointerEvents: 'none',
          mixBlendMode: 'normal',
        }}
      >
        <img
          src="/assets/atmosphere/hero-center-ell.avif"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'contrast(1.05)',
          }}
        />
      </motion.div>

      {/* 2b. MDX Services / Editorial Lateral Lightmap (services-ell) */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: useTransform(
            timeline ? timeline.smoothProgress : scrollYProgress,
            [0.15, 0.20, 0.38, 0.58, 0.72],
            [0, 0.85, 0.70, 0.85, 0]
          ),
          pointerEvents: 'none',
          mixBlendMode: 'normal',
        }}
      >
        <img
          src="/assets/atmosphere/services-ell.avif"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </motion.div>

      {/* 3. Upper Left Soft Ambient Warmth */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '5%',
          width: 'min(750px, 70vw)',
          height: 'min(750px, 70vh)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 130, 0, 0.05) 0%, rgba(255, 161, 61, 0.015) 45%, transparent 70%)',
          filter: 'blur(100px)',
          y: driftY1,
          opacity: 0.85 * intensity,
        }}
      />

      {/* 4. Lower Right Secondary Ambient Glow */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '5%',
          width: 'min(700px, 65vw)',
          height: 'min(700px, 65vh)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 180, 80, 0.04) 0%, transparent 65%)',
          filter: 'blur(90px)',
          y: driftY2,
          opacity: 0.7 * intensity,
        }}
      />
    </div>
  );
};
