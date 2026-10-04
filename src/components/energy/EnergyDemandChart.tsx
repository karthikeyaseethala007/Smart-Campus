import React, { useRef, useId, type FC } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

export interface EnergyDemandChartProps {
  /** Optional container style override */
  style?: React.CSSProperties;
  /** Optional CSS class name */
  className?: string;
  /** Optional badge text override, defaults to "Sub-Metered" */
  badgeText?: string;
  /** Whether simulation tag should be displayed */
  isSimulation?: boolean;
}

/**
 * EnergyDemandChart — 24-Hour Campus Demand Profile
 *
 * An editorial analytics visualization with a calm, progressive entrance animation:
 * 1. Sienna Brown demand curve draws from 00:00 to 23:59 via SVG pathLength.
 * 2. Warm Blush Peach (#fbe1d1) area fill reveals progressively beneath the curve.
 * 3. Milestones (08:00 Ramp, 13:00 Peak, 18:00 Lecture End) reveal as the curve arrives.
 * 4. Timeline labels settle at the bottom.
 * 5. Full prefers-reduced-motion accessibility support (skips motion and renders immediately).
 */
export const EnergyDemandChart: FC<EnergyDemandChartProps> = ({
  style,
  className = 'floating-artifact',
  badgeText = 'Sub-Metered',
  isSimulation = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const shouldReduceMotion = useReducedMotion();

  const id = useId().replace(/:/g, '');
  const gradId = `energy-grad-${id}`;
  const clipId = `energy-clip-${id}`;

  // Calm, editorial timing curve (easeInOut)
  const curveDuration = 1.8;
  const curveEase = [0.42, 0, 0.58, 1.0] as const;

  // Reduced motion bypasses all duration and delay
  const activeMotion = isInView || shouldReduceMotion;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        padding: '36px',
        backgroundColor: 'var(--color-paper-white)',
        borderRadius: 'var(--radius-elevatedcards, 20px)',
        border: 'var(--border-hairline, 1px solid rgba(23, 25, 28, 0.08))',
        boxShadow: 'var(--shadow-subtle-3, 0 8px 24px -4px rgba(0, 0, 0, 0.06))',
        ...style,
      }}
    >
      {/* Header — Strictly Static Badges and Typography */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-signifier)',
              fontSize: '18px',
              fontWeight: 400,
              color: 'var(--color-ink-black)',
              margin: 0,
            }}
          >
            24-Hour Campus Demand Profile
          </h4>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-ash-gray)',
              marginTop: '4px',
              display: 'inline-block',
            }}
          >
            Power draw aggregated across Engineering, Science, and Library blocks
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isSimulation && (
            <span
              className="pill-badge pill-badge-peach"
              style={{ fontSize: '11px', textTransform: 'uppercase' }}
            >
              SOURCE · SIMULATION
            </span>
          )}
          <span className="pill-badge pill-badge-ink" style={{ fontSize: '11px' }}>
            {badgeText}
          </span>
        </div>
      </div>

      {/* Responsive SVG Chart Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: '20px 0',
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox="0 0 800 200"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            overflow: 'visible',
          }}
          role="img"
          aria-label="24-Hour Campus Demand Profile curve displaying power draw from 00:00 to 23:59"
        >
          <defs>
            {/* Steep Blush Peach Soft Area Gradient (light, soft, editorial) */}
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbe1d1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#fbe1d1" stopOpacity="0.04" />
            </linearGradient>

            {/* Left-to-Right Progressive Reveal Clip Path */}
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <motion.rect
                x="0"
                y="0"
                height="200"
                initial={shouldReduceMotion ? { width: 800 } : { width: 0 }}
                animate={activeMotion ? { width: 800 } : { width: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: curveDuration, delay: 0.08, ease: curveEase }
                }
              />
            </clipPath>
          </defs>

          {/* Area Fill beneath the curve — Progressive reveal with soft opacity */}
          <motion.path
            d="M 20,160 Q 120,150 200,120 T 400,60 T 600,80 T 780,140 L 780,180 L 20,180 Z"
            fill={`url(#${gradId})`}
            clipPath={`url(#${clipId})`}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={activeMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.4, delay: 0.08, ease: 'easeOut' }
            }
          />

          {/* Main Demand Curve in Steep Sienna Brown (adapts in dark mode) */}
          <motion.path
            d="M 20,160 Q 120,150 200,120 T 400,60 T 600,80 T 780,140"
            fill="none"
            stroke="var(--color-sienna-brown)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={activeMotion ? { pathLength: 1 } : { pathLength: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: curveDuration, ease: curveEase }
            }
          />

          {/* ===================================================================
              Milestone 1: 08:00 Ramp (cx=200, cy=120)
              =================================================================== */}
          <motion.circle
            cx="200"
            cy="120"
            fill="var(--color-sienna-brown)"
            initial={shouldReduceMotion ? { r: 4, opacity: 1 } : { r: 0, opacity: 0 }}
            animate={activeMotion ? { r: 4, opacity: 1 } : { r: 0, opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.35, delay: 0.46, ease: 'easeOut' }
            }
          />
          <motion.text
            x="200"
            y="108"
            fontSize="11"
            fontFamily="var(--font-sohne)"
            fill="var(--color-slate-gray)"
            textAnchor="middle"
            initial={shouldReduceMotion ? { opacity: 1, y: 108 } : { opacity: 0, y: 114 }}
            animate={activeMotion ? { opacity: 1, y: 108 } : { opacity: 0, y: 114 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.35, delay: 0.54, ease: 'easeOut' }
            }
          >
            08:00 Ramp
          </motion.text>

          {/* ===================================================================
              Milestone 2: 13:00 Peak (48 kW) (cx=400, cy=60) — Primary Event Point
              =================================================================== */}
          {/* Subtle concentric accent ring for primary peak */}
          <motion.circle
            cx="400"
            cy="60"
            fill="none"
            stroke="var(--color-sienna-brown)"
            strokeWidth="1"
            initial={shouldReduceMotion ? { r: 7.5, opacity: 0.35 } : { r: 0, opacity: 0 }}
            animate={activeMotion ? { r: 7.5, opacity: 0.35 } : { r: 0, opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.4, delay: 0.90, ease: 'easeOut' }
            }
          />
          <motion.circle
            cx="400"
            cy="60"
            fill="var(--color-sienna-brown)"
            initial={shouldReduceMotion ? { r: 4.5, opacity: 1 } : { r: 0, opacity: 0 }}
            animate={activeMotion ? { r: 4.5, opacity: 1 } : { r: 0, opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.35, delay: 0.90, ease: 'easeOut' }
            }
          />
          <motion.text
            x="400"
            y="46"
            fontSize="11"
            fontFamily="var(--font-sohne)"
            fill="var(--color-sienna-brown)"
            fontWeight="600"
            textAnchor="middle"
            initial={shouldReduceMotion ? { opacity: 1, y: 46 } : { opacity: 0, y: 52 }}
            animate={activeMotion ? { opacity: 1, y: 46 } : { opacity: 0, y: 52 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.35, delay: 0.98, ease: 'easeOut' }
            }
          >
            13:00 Peak (48 kW)
          </motion.text>

          {/* ===================================================================
              Milestone 3: 18:00 Lecture End (cx=600, cy=80)
              =================================================================== */}
          <motion.circle
            cx="600"
            cy="80"
            fill="var(--color-sienna-brown)"
            initial={shouldReduceMotion ? { r: 4, opacity: 1 } : { r: 0, opacity: 0 }}
            animate={activeMotion ? { r: 4, opacity: 1 } : { r: 0, opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.35, delay: 1.35, ease: 'easeOut' }
            }
          />
          <motion.text
            x="600"
            y="68"
            fontSize="11"
            fontFamily="var(--font-sohne)"
            fill="var(--color-slate-gray)"
            textAnchor="middle"
            initial={shouldReduceMotion ? { opacity: 1, y: 68 } : { opacity: 0, y: 74 }}
            animate={activeMotion ? { opacity: 1, y: 68 } : { opacity: 0, y: 74 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.35, delay: 1.43, ease: 'easeOut' }
            }
          >
            18:00 Lecture End
          </motion.text>
        </svg>
      </div>

      {/* Bottom Timeline Metadata — Soft fade-in settling at end of curve */}
      <motion.div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(23, 25, 28, 0.06)',
          paddingTop: '16px',
          fontSize: '12px',
          color: 'var(--color-ash-gray)',
          fontFamily: 'var(--font-sohne)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={activeMotion ? { opacity: 1 } : { opacity: 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.4, delay: 1.8, ease: 'easeOut' }
        }
      >
        <span>00:00 Night Standby (12 kW)</span>
        <span>12:00 Midday Operations (45 kW)</span>
        <span>23:59 Vacant Hold (14 kW)</span>
      </motion.div>
    </div>
  );
};

export default EnergyDemandChart;
