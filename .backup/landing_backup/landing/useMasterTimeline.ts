import type { RefObject } from 'react';
import { useEffect, useState } from 'react';
import { useScroll, useTransform, useSpring, type MotionValue } from 'framer-motion';

export interface MasterHeroTimeline {
  // Raw and spring-smoothed scroll progress for the Hero stage [0, 1]
  heroProgress: MotionValue<number>;
  smoothHeroProgress: MotionValue<number>;

  // 1. Particle Video Scrubbing
  targetVideoTime: MotionValue<number>;
  morphPhase: 'Globe' | 'Electricity' | 'Fire' | 'Lock';

  // 2. 3D Object Transforms
  objectScale: MotionValue<number>;
  objectOpacity: MotionValue<number>;

  // 3. Ambient Atmospheric Lighting
  atmosphereOpacity: MotionValue<number>;
  atmosphereScale: MotionValue<number>;
  atmosphereY: MotionValue<string>;

  // 4. Headline Transforms
  headlinePosition: MotionValue<number>;
  headlineOpacity: MotionValue<number>;

  // 5. Supporting Text & Capability Pills Transforms
  supportingTextPosition: MotionValue<number>;
  supportingTextOpacity: MotionValue<number>;

  // 6. Stage Indicators
  activeStageIndex: number;
}

/**
 * MASTER TIMELINE ARCHITECTURE
 * 
 * SCROLL POSITION
 *        ↓
 * MASTER TIMELINE
 *        ↓
 * ┌─────────────────────────────┐
 * │ hero progress               │
 * │                             │
 * │ particle video time         │
 * │ object scale                │
 * │ object opacity              │
 * │ atmosphere opacity          │
 * │ headline position           │
 * │ headline opacity            │
 * │ supporting text             │
 * │ stage indicators            │
 * └─────────────────────────────┘
 */
export function useMasterTimeline(containerRef?: RefObject<HTMLElement | null>): MasterHeroTimeline {
  // 1. SCROLL POSITION INPUT
  const { scrollYProgress } = useScroll(
    containerRef
      ? {
          target: containerRef as RefObject<HTMLElement>,
          offset: ['start start', 'end end'],
        }
      : {}
  );

  // 2. MASTER TIMELINE: Smoothed progression with physics dampening
  const smoothHeroProgress = useSpring(scrollYProgress, {
    damping: 28,
    stiffness: 120,
    mass: 0.2,
  });

  // 3. DERIVED METRICS ACCORDING TO ARCHITECTURAL SPECIFICATION

  // Video scrub time normalized (0.0 to 1.0)
  const targetVideoTime = useTransform(smoothHeroProgress, [0, 1], [0, 1]);

  // Morph phase identification across scrub timeline
  const [morphPhase, setMorphPhase] = useState<'Globe' | 'Electricity' | 'Fire' | 'Lock'>('Globe');
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => {
      // Morph state mapping across hero scrub progress matching MDX reference
      if (v < 0.287) {
        setMorphPhase('Globe');
      } else if (v < 0.449) {
        setMorphPhase('Electricity');
      } else if (v < 0.564) {
        setMorphPhase('Fire');
      } else {
        setMorphPhase('Lock');
      }

      // Stage indicators progression:
      // 0.0 - 0.5: Hero resting -> active
      // 0.5 - 1.0: Transitioning toward stage 1
      if (v < 0.6) {
        setActiveStageIndex(0);
      } else {
        setActiveStageIndex(1);
      }
    });

    return () => unsub();
  }, [scrollYProgress]);

  // Object 3D Scale & Opacity
  // Gentle tactile swell from 1.0 -> 1.05, then contracts to 0.98 on exit
  const objectScale = useTransform(smoothHeroProgress, [0, 0.45, 1], [1.0, 1.045, 0.98]);
  // Crisp resting opacity, smoothly fading as it yields to Editorial Scene 1
  const objectOpacity = useTransform(smoothHeroProgress, [0, 0.85, 1], [1, 1, 0]);

  // Atmosphere Opacity & Parallax drift
  const atmosphereOpacity = useTransform(smoothHeroProgress, [0, 0.5, 0.95], [0.34, 0.24, 0]);
  const atmosphereScale = useTransform(smoothHeroProgress, [0, 0.6], [1.0, 1.08]);
  const atmosphereY = useTransform(smoothHeroProgress, [0, 1], ['0%', '14%']);

  // Headline Position (translateY) & Opacity
  // Fully opaque and locked at resting position (0 to 0.15)
  // Drifts upward with subtle parallax and fades out (0.15 to 0.40)
  const headlinePosition = useTransform(smoothHeroProgress, [0, 0.15, 0.45], [0, 0, -32]);
  const headlineOpacity = useTransform(smoothHeroProgress, [0, 0.12, 0.38], [1, 1, 0]);

  // Supporting Text & Category Pills Position & Opacity
  // Synchronized subtle exit right after headline initiates motion
  const supportingTextPosition = useTransform(smoothHeroProgress, [0, 0.15, 0.45], [0, 0, -24]);
  const supportingTextOpacity = useTransform(smoothHeroProgress, [0, 0.1, 0.35], [1, 1, 0]);

  return {
    heroProgress: scrollYProgress,
    smoothHeroProgress,
    targetVideoTime,
    morphPhase,
    objectScale,
    objectOpacity,
    atmosphereOpacity,
    atmosphereScale,
    atmosphereY,
    headlinePosition,
    headlineOpacity,
    supportingTextPosition,
    supportingTextOpacity,
    activeStageIndex,
  };
}
