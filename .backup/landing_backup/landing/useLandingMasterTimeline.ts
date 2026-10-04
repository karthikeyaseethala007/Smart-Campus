import type { RefObject } from 'react';
import { useEffect, useState } from 'react';
import { useScroll, useTransform, useSpring, type MotionValue } from 'framer-motion';

/**
 * MASTER TIMELINE ARCHITECTURE SPECIFICATION — MDX GROUND TRUTH PRECISION PASS
 * 
 * SCROLL POSITION (Single runway [start start] -> [end end])
 *        ↓
 * MASTER TIMELINE (useLandingMasterTimeline)
 *        ↓
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 0.00–0.24  PINNED HERO (Globe → Elec → Fire → Lock)        │
 * │ 0.22–0.36  EDITORIAL STATEMENT 01 (One Campus...)           │
 * │ 0.35–0.48  EDITORIAL STATEMENT 02 (Detection to Action)    │
 * │ 0.47–0.60  CINEMATIC STAGE (Dominant rounded box + trigger) │
 * │ 0.59–0.72  FOUR-PILLAR FLOATING SYSTEM (Staggered pills)    │
 * │ 0.72–0.85  DARK VISUAL SHOWCASE (Staggered tiles)           │
 * │ 0.85–0.93  CONTACT / ENTRY (Warm editorial form)            │
 * │ 0.93–0.97  DARK PRE-FOOTER (Signal to Response)             │
 * │ 0.97–1.00  MONOLITHIC FOOTER (SMART CAMPUS wordmark)        │
 * └─────────────────────────────────────────────────────────────┘
 */

export interface LandingMasterTimeline {
  // Master Scroll Progress
  rawProgress: MotionValue<number>;
  smoothProgress: MotionValue<number>;

  // Normalized Phase Progress Values (each strictly [0, 1] within its range)
  heroProgress: MotionValue<number>;
  editorial1Progress: MotionValue<number>;
  editorial2Progress: MotionValue<number>;
  cinematicProgress: MotionValue<number>;
  floatingProgress: MotionValue<number>;
  showcaseProgress: MotionValue<number>;
  contactProgress: MotionValue<number>;
  preFooterProgress: MotionValue<number>;
  footerProgress: MotionValue<number>;

  // 1. PINNED HERO (0.00 - 0.24) & SPATIAL ORBIT (0.59 - 0.72)
  heroVideoTime: MotionValue<number>; // Target seconds [0.0 - 10.0]
  heroScale: MotionValue<number>;
  heroOpacity: MotionValue<number>;
  heroX: MotionValue<string>;
  heroY: MotionValue<string>;
  heroHeadlineY: MotionValue<number>;
  heroHeadlineOpacity: MotionValue<number>;
  heroSupportingY: MotionValue<number>;
  heroSupportingOpacity: MotionValue<number>;
  heroTicksOpacity: MotionValue<number>;

  // Dynamic Decoupled Hero Layers
  heroOrangeEnergy: MotionValue<number>;
  heroShadowWidth: MotionValue<string>;
  heroShadowOpacity: MotionValue<number>;

  // ATMOSPHERE (Adaptive optical lightmap & halo)
  atmosphereWarmthScale: MotionValue<number>;
  atmosphereWarmthOpacity: MotionValue<number>;
  atmosphereWarmthX: MotionValue<string>;
  atmosphereWarmthY: MotionValue<string>;

  // 2. EDITORIAL STATEMENT 01 (0.22 - 0.36)
  editorial1Opacity: MotionValue<number>;
  editorial1Y: MotionValue<number>;
  editorial1Scale: MotionValue<number>;

  // 3. EDITORIAL STATEMENT 02 (0.35 - 0.48)
  editorial2Opacity: MotionValue<number>;
  editorial2Y: MotionValue<number>;
  editorial2Scale: MotionValue<number>;

  // 4. CINEMATIC STAGE (0.47 - 0.60)
  cinematicStageOpacity: MotionValue<number>;
  cinematicStageY: MotionValue<number>;
  cinematicStageScale: MotionValue<number>;
  cinematicStageRadius: MotionValue<string>;

  // 5. FOUR-PILLAR FLOATING SYSTEM (0.59 - 0.72)
  floatingOpacity: MotionValue<number>;
  floatingScale: MotionValue<number>;
  pill1Opacity: MotionValue<number>;
  pill1Y: MotionValue<number>;
  pill2Opacity: MotionValue<number>;
  pill2Y: MotionValue<number>;
  pill3Opacity: MotionValue<number>;
  pill3Y: MotionValue<number>;
  pill4Opacity: MotionValue<number>;
  pill4Y: MotionValue<number>;

  // 6. DARK TAKEOVER (0.70 - 1.00)
  darkTakeoverY: MotionValue<string>;
  darkTakeoverBorderRadius: MotionValue<string>;
  isDarkTheme: boolean;

  // Active Stage Indicator (0..3)
  activeStageIndex: number;
}

/**
 * EXACT GROUND TRUTH REMAPPING FUNCTION
 * Remaps normalized hero progress [0, 1] to Blender animation video seconds [0, 10s].
 * Preserves holds on Globe and Lock, with smooth nonlinear Hermite acceleration during morphs.
 */
export function remapHeroProgressToVideoTime(p: number): number {
  const clamped = Math.max(0, Math.min(1, p));
  // Smooth cubic Hermite interpolation for transition intervals
  const hermite = (t: number) => {
    const ct = Math.max(0, Math.min(1, t));
    return ct * ct * (3 - 2 * ct);
  };

  // Production timing ranges:
  // 1–32 (0.000s–1.333s, p: 0.000–0.133): GLOBE HOLD
  // 33–72 (1.333s–3.000s, p: 0.133–0.300): GLOBE → ELECTRICITY
  // 73–100 (3.000s–4.167s, p: 0.300–0.417): ELECTRICITY HOLD
  // 101–140 (4.167s–5.833s, p: 0.417–0.583): ELECTRICITY → FIRE
  // 141–170 (5.833s–7.083s, p: 0.583–0.708): FIRE HOLD
  // 171–210 (7.083s–8.750s, p: 0.708–0.875): FIRE → LOCK
  // 211–240 (8.750s–10.000s, p: 0.875–1.000): LOCK HOLD

  if (clamped <= 0.133) {
    // Globe Hold: Frame 1 to 32
    return (clamped / 0.133) * (32.0 / 24.0);
  } else if (clamped <= 0.300) {
    // Globe -> Electricity: Frame 33 to 72
    const t = (clamped - 0.133) / (0.300 - 0.133);
    return (32.0 / 24.0) + hermite(t) * (40.0 / 24.0);
  } else if (clamped <= 0.417) {
    // Electricity Hold: Frame 73 to 100
    const t = (clamped - 0.300) / (0.417 - 0.300);
    return (72.0 / 24.0) + t * (28.0 / 24.0);
  } else if (clamped <= 0.583) {
    // Electricity -> Fire: Frame 101 to 140
    const t = (clamped - 0.417) / (0.583 - 0.417);
    return (100.0 / 24.0) + hermite(t) * (40.0 / 24.0);
  } else if (clamped <= 0.708) {
    // Fire Hold: Frame 141 to 170
    const t = (clamped - 0.583) / (0.708 - 0.583);
    return (140.0 / 24.0) + t * (30.0 / 24.0);
  } else if (clamped <= 0.875) {
    // Fire -> Lock: Frame 171 to 210
    const t = (clamped - 0.708) / (0.875 - 0.708);
    return (170.0 / 24.0) + hermite(t) * (40.0 / 24.0);
  } else {
    // Lock Hold: Frame 211 to 240
    const t = (clamped - 0.875) / (1.000 - 0.875);
    return (210.0 / 24.0) + t * (30.0 / 24.0);
  }
}

export function useLandingMasterTimeline(runwayRef?: RefObject<HTMLElement | null>): LandingMasterTimeline {
  // 1. SINGLE MASTER SCROLL OBSERVER
  const { scrollYProgress: rawProgress } = useScroll(
    runwayRef
      ? {
          target: runwayRef as RefObject<HTMLElement>,
          offset: ['start start', 'end end'],
        }
      : {}
  );

  // 2. PHYSICS DAMPENING / SMOOTH INTERPOLATION
  const smoothProgress = useSpring(rawProgress, {
    damping: 32,
    stiffness: 140,
    mass: 0.18,
    restDelta: 0.0001,
  });

  // 3. NORMALIZED PHASE PROGRESS VALUES [0, 1] WITH SEAMLESS EDITORIAL OVERLAPS
  // Light Stage (0.00 - 0.72)
  const heroProgress = useTransform(smoothProgress, (v) => clampProgress(v, 0.00, 0.24));
  const editorial1Progress = useTransform(smoothProgress, (v) => clampProgress(v, 0.22, 0.36));
  const editorial2Progress = useTransform(smoothProgress, (v) => clampProgress(v, 0.35, 0.48));
  const cinematicProgress = useTransform(smoothProgress, (v) => clampProgress(v, 0.47, 0.60));
  const floatingProgress = useTransform(smoothProgress, (v) => clampProgress(v, 0.59, 0.72));

  // Dark Stage (0.72 - 1.00)
  const showcaseProgress = useTransform(smoothProgress, (v) => clampProgress(v, 0.72, 0.85));
  const contactProgress = useTransform(smoothProgress, (v) => clampProgress(v, 0.85, 0.93));
  const preFooterProgress = useTransform(smoothProgress, (v) => clampProgress(v, 0.93, 0.97));
  const footerProgress = useTransform(smoothProgress, (v) => clampProgress(v, 0.97, 1.00));

  // 4. PINNED HERO CHOREOGRAPHY & DECOUPLED MOTION CURVES
  // Continuously maps heroProgress through the measured Hermite piecewise function
  const heroVideoTime = useTransform(heroProgress, (p) => remapHeroProgressToVideoTime(p));

  // Spatial anchoring: exactly centered horizontally in hero and four pillars
  const heroX = useTransform(smoothProgress, [0.00, 0.24, 0.58, 0.62], ['50%', '50%', '50%', '50%']);
  const heroY = useTransform(smoothProgress, [0.00, 0.24, 0.58, 0.62], ['48%', '48%', '50%', '50%']);

  // Physical Breathing Scale Curve (measured response to shape deformation)
  // Base 1.00 -> Morph 1 swell 1.042 -> Settle 1.00 -> Morph 2 flame stretch 1.048 -> Settle 1.00 -> Morph 3 lock compression 0.975 -> Settle 1.00 -> Editorial handoff 0.88 -> Center orbit 0.92
  const heroScale = useTransform(
    smoothProgress,
    [
      0.000, 0.082, 0.103, 0.116, 0.131, 0.144, 0.162, 0.194, 0.240, 0.260,
      0.580, 0.620, 0.710, 0.730,
    ],
    [
      1.000, 1.035, 1.000, 1.038, 1.000, 0.980, 1.000, 1.000, 0.880, 0.820,
      0.780, 0.880, 0.880, 0.820,
    ]
  );

  // Object Opacity: Solid through hero (0.00 - 0.22), soft optical overlap handoff during Editorial 01 (0.22 - 0.26), re-emerges for Four Pillars
  const heroOpacity = useTransform(
    smoothProgress,
    [0.00, 0.22, 0.26, 0.58, 0.62, 0.71, 0.73],
    [1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0],
    { clamp: true }
  );

  // Internal Orange Luminescence Energy Curve (rises subtly during peak deformation)
  const heroOrangeEnergy = useTransform(
    smoothProgress,
    [
      0.000, 0.082, 0.103, 0.116, 0.131, 0.144, 0.162, 0.200, 0.240, 0.280, 0.360,
    ],
    [
      0.10, 0.22, 0.12, 0.32, 0.14, 0.20, 0.10, 0.15, 0.28, 0.35, 0.00,
    ],
    { clamp: true }
  );

  // Dynamic Ground Shadow Reaction - Subtle, localized ground shadow beneath particle
  const heroShadowWidth = useTransform(
    smoothProgress,
    [0.000, 0.082, 0.103, 0.116, 0.144, 0.162, 0.220, 0.260],
    ['320px', '345px', '320px', '335px', '295px', '315px', '330px', '350px'],
    { clamp: true }
  );
  const heroShadowOpacity = useTransform(
    smoothProgress,
    [0.000, 0.082, 0.103, 0.116, 0.144, 0.162, 0.220, 0.260],
    [0.26, 0.22, 0.26, 0.20, 0.28, 0.26, 0.18, 0.00],
    { clamp: true }
  );

  // Hero Typography Motion: drifts upward and fades cleanly as Editorial 01 arrives
  const heroHeadlineY = useTransform(smoothProgress, [0.00, 0.14, 0.22], [0, 0, -36], { clamp: true });
  const heroHeadlineOpacity = useTransform(smoothProgress, [0.00, 0.12, 0.21], [1, 1, 0], { clamp: true });
  const heroSupportingY = useTransform(smoothProgress, [0.00, 0.14, 0.22], [0, 0, -28], { clamp: true });
  const heroSupportingOpacity = useTransform(smoothProgress, [0.00, 0.11, 0.20], [1, 1, 0], { clamp: true });
  const heroTicksOpacity = useTransform(smoothProgress, [0.00, 0.20, 0.23], [1, 1, 0], { clamp: true });

  // 5. ADAPTIVE ATMOSPHERE (Aura blooms and centers behind typography)
  const atmosphereWarmthScale = useTransform(smoothProgress, [0.00, 0.22, 0.32, 0.44], [1.0, 1.38, 1.48, 1.1], { clamp: true });
  const atmosphereWarmthOpacity = useTransform(
    smoothProgress,
    [0.00, 0.15, 0.24, 0.35, 0.46, 0.52],
    [0.22, 0.35, 0.45, 0.40, 0.20, 0.0],
    { clamp: true }
  );
  const atmosphereWarmthX = useTransform(smoothProgress, [0.00, 0.22, 0.38], ['58%', '50%', '50%'], { clamp: true });
  const atmosphereWarmthY = useTransform(smoothProgress, [0.00, 0.22, 0.38], ['46%', '48%', '44%'], { clamp: true });

  // 6. EDITORIAL STATEMENT 01 (0.22 - 0.36)
  // Enters subtly during hero resolution, holds in optical center, exits towards Statement 02
  const editorial1Opacity = useTransform(smoothProgress, [0.21, 0.25, 0.33, 0.37], [0, 1, 1, 0], { clamp: true });
  const editorial1Y = useTransform(smoothProgress, [0.21, 0.25, 0.33, 0.37], [32, 0, 0, -32], { clamp: true });
  const editorial1Scale = useTransform(smoothProgress, [0.21, 0.25, 0.37], [0.97, 1.0, 1.02], { clamp: true });

  // 7. EDITORIAL STATEMENT 02 (0.35 - 0.48)
  const editorial2Opacity = useTransform(smoothProgress, [0.34, 0.38, 0.45, 0.49], [0, 1, 1, 0], { clamp: true });
  const editorial2Y = useTransform(smoothProgress, [0.34, 0.38, 0.45, 0.49], [32, 0, 0, -32], { clamp: true });
  const editorial2Scale = useTransform(smoothProgress, [0.34, 0.38, 0.49], [0.97, 1.0, 1.02], { clamp: true });

  // 8. CINEMATIC STAGE (0.47 - 0.60)
  // Large dark rounded stage dominates the viewport with unified scale, opacity, and corner radius
  const cinematicStageOpacity = useTransform(smoothProgress, [0.46, 0.50, 0.57, 0.61], [0, 1, 1, 0], { clamp: true });
  const cinematicStageY = useTransform(smoothProgress, [0.46, 0.50, 0.57, 0.61], [50, 0, 0, -32], { clamp: true });
  const cinematicStageScale = useTransform(smoothProgress, [0.46, 0.51, 0.57, 0.61], [0.90, 1.0, 1.0, 0.95], { clamp: true });
  const cinematicStageRadius = useTransform(smoothProgress, [0.46, 0.51], ['48px', '32px'], { clamp: true });

  // 9. FOUR-PILLAR FLOATING SYSTEM (0.59 - 0.72)
  const floatingOpacity = useTransform(smoothProgress, [0.58, 0.62, 0.69, 0.73], [0, 1, 1, 0], { clamp: true });
  const floatingScale = useTransform(smoothProgress, [0.58, 0.62, 0.73], [0.95, 1.0, 1.02], { clamp: true });

  // Staggered Pills Entry Curves (Pill 1 -> Pill 2 -> Pill 3 -> Pill 4)
  const pill1Opacity = useTransform(floatingProgress, [0.08, 0.20], [0, 1]);
  const pill1Y = useTransform(floatingProgress, [0.08, 0.20], [22, 0]);

  const pill2Opacity = useTransform(floatingProgress, [0.16, 0.28], [0, 1]);
  const pill2Y = useTransform(floatingProgress, [0.16, 0.28], [22, 0]);

  const pill3Opacity = useTransform(floatingProgress, [0.24, 0.36], [0, 1]);
  const pill3Y = useTransform(floatingProgress, [0.24, 0.36], [22, 0]);

  const pill4Opacity = useTransform(floatingProgress, [0.32, 0.44], [0, 1]);
  const pill4Y = useTransform(floatingProgress, [0.32, 0.44], [22, 0]);

  // 10. DARK TAKEOVER (0.70 - 1.00)
  const darkTakeoverY = useTransform(smoothProgress, [0.70, 0.74], ['100%', '0%'], { clamp: true });
  const darkTakeoverBorderRadius = useTransform(smoothProgress, [0.70, 0.74], ['44px', '0px'], { clamp: true });

  // Reactive state for Discrete Stage Indicator & Theme
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const unsub = smoothProgress.on('change', (v) => {
      // Discrete stage indicator synchronized with measured morph boundaries
      if (v < 0.072) {
        // Globe (0.000 to 0.300 of hero = 0.000 to 0.072 of master scroll)
        setActiveStageIndex(0);
      } else if (v < 0.140) {
        // Electricity (0.300 to 0.583 of hero = 0.072 to 0.140 of master scroll)
        setActiveStageIndex(1);
      } else if (v < 0.210) {
        // Fire (0.583 to 0.875 of hero = 0.140 to 0.210 of master scroll)
        setActiveStageIndex(2);
      } else if (v < 0.240) {
        // Lock (0.875 to 1.000 of hero = 0.210 to 0.240 of master scroll)
        setActiveStageIndex(3);
      } else if (v < 0.36) {
        setActiveStageIndex(4);
      } else if (v < 0.48) {
        setActiveStageIndex(5);
      } else if (v < 0.60) {
        setActiveStageIndex(6);
      } else {
        setActiveStageIndex(7);
      }

      // Theme toggle at dark takeover threshold
      setIsDarkTheme(v >= 0.72);
    });

    return () => unsub();
  }, [smoothProgress]);

  return {
    rawProgress,
    smoothProgress,
    heroProgress,
    editorial1Progress,
    editorial2Progress,
    cinematicProgress,
    floatingProgress,
    showcaseProgress,
    contactProgress,
    preFooterProgress,
    footerProgress,
    heroVideoTime,
    heroScale,
    heroOpacity,
    heroX,
    heroY,
    heroHeadlineY,
    heroHeadlineOpacity,
    heroSupportingY,
    heroSupportingOpacity,
    heroTicksOpacity,
    heroOrangeEnergy,
    heroShadowWidth,
    heroShadowOpacity,
    atmosphereWarmthScale,
    atmosphereWarmthOpacity,
    atmosphereWarmthX,
    atmosphereWarmthY,
    editorial1Opacity,
    editorial1Y,
    editorial1Scale,
    editorial2Opacity,
    editorial2Y,
    editorial2Scale,
    cinematicStageOpacity,
    cinematicStageY,
    cinematicStageScale,
    cinematicStageRadius,
    floatingOpacity,
    floatingScale,
    pill1Opacity,
    pill1Y,
    pill2Opacity,
    pill2Y,
    pill3Opacity,
    pill3Y,
    pill4Opacity,
    pill4Y,
    darkTakeoverY,
    darkTakeoverBorderRadius,
    isDarkTheme,
    activeStageIndex,
  };
}

function clampProgress(val: number, start: number, end: number): number {
  if (val <= start) return 0;
  if (val >= end) return 1;
  return (val - start) / (end - start);
}
