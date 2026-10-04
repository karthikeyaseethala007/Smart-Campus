import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion';

export interface RollingTextProps {
  /** The text string to animate */
  text?: string;
  /** Fallback children if text is passed as child */
  children?: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Inline CSS styles */
  style?: React.CSSProperties;
  /** Stagger delay per distance step from center in seconds (default: 0.038) */
  stagger?: number;
  /** Initial delay before animation begins in seconds (default: 0.15) */
  delay?: number;
  /** Animation duration per character in seconds (default: 0.55) */
  duration?: number;
  /** Viewport threshold to trigger animation (default: 0.35) */
  viewportAmount?: number | 'some' | 'all';
  /** Animate only once upon viewport entry (default: true) */
  once?: boolean;
}

/**
 * RollingText (Skiper27 Style)
 *
 * Recreates the official Skiper27 rolling text interaction:
 * - Symmetrical CENTER -> EDGES stagger propagation:
 *     centerIndex = (N - 1) / 2
 *     distanceFromCenter = Math.abs(index - centerIndex)
 *     delay = baseDelay + distanceFromCenter * stagger
 *   Center characters roll first, cascading outward to both edges.
 * - Dual-layer vertical rolling reel:
 *     Layer 1 (initial glyph) rolls up and away with cylinder curvature (rotateX: 0 -> -55deg).
 *     Layer 2 (incoming duplicate glyph) rolls up from below (rotateX: 55deg -> 0deg) into place.
 *     Characters visibly ROLL vertically into place rather than fading upward.
 * - Natural typography preservation:
 *     Zero flexbox across characters, zero gap, zero letter-spacing distortion.
 *     An invisible in-flow placeholder reserves exact Source Serif 4 glyph geometry.
 *     Spaces are rendered as natural text nodes without artificial width.
 * - Viewport trigger & above-the-fold support:
 *     Triggers immediately if in viewport on page load; otherwise triggers on scroll entry.
 *     Runs once and settles permanently into stable typography.
 * - Full prefers-reduced-motion accessibility support.
 */
export const RollingText: React.FC<RollingTextProps> = ({
  text,
  children,
  className = '',
  style = {},
  stagger = 0.038,
  delay = 0.15,
  duration = 0.55,
  viewportAmount = 0.35,
  once = true,
}) => {
  const content = text ?? (typeof children === 'string' ? children : '');
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const hasTriggeredRef = useRef(false);

  const isInView = useInView(containerRef, {
    once,
    amount: viewportAmount,
  });

  useEffect(() => {
    if (shouldReduceMotion) return;
    if (hasTriggeredRef.current) return;

    const startAnimation = () => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      setIsRolling(true);
    };

    // If in view or mounted above the fold on initial load: animate immediately
    const el = containerRef.current;
    const vh = typeof window !== 'undefined' ? (window.innerHeight || 800) : 800;
    const isAboveFold = el ? el.getBoundingClientRect().top < vh : true;

    if (isInView || isAboveFold) {
      startAnimation();
      return;
    }
  }, [isInView, shouldReduceMotion]);

  // Accessibility: render static text immediately when reduced motion is preferred
  if (shouldReduceMotion) {
    return (
      <span className={className} style={{ display: 'inline', ...style }}>
        {content}
      </span>
    );
  }

  const characters = content.split('');
  const N = characters.length;
  const centerIndex = (N - 1) / 2;

  // Layer 1: Outgoing glyph (rolls up and curves away over the top of the cylinder)
  const topLayerVariants: Variants = {
    initial: {
      y: '0%',
      rotateX: 0,
      opacity: 1,
    },
    animate: (distanceFromCenter: number) => ({
      y: '-115%',
      rotateX: -55,
      opacity: 0,
      transition: {
        duration,
        delay: delay + distanceFromCenter * stagger,
        ease: [0.33, 1, 0.68, 1],
        opacity: {
          duration: duration * 0.45,
          delay: delay + distanceFromCenter * stagger + duration * 0.55,
          ease: 'linear',
        },
      },
    }),
  };

  // Layer 2: Incoming duplicate glyph (rolls up from below, curving forward into resting position)
  const bottomLayerVariants: Variants = {
    initial: {
      y: '115%',
      rotateX: 55,
      opacity: 0,
    },
    animate: (distanceFromCenter: number) => ({
      y: '0%',
      rotateX: 0,
      opacity: 1,
      transition: {
        duration,
        delay: delay + distanceFromCenter * stagger,
        ease: [0.33, 1, 0.68, 1],
        opacity: {
          duration: duration * 0.4,
          delay: delay + distanceFromCenter * stagger,
          ease: 'linear',
        },
      },
    }),
  };

  return (
    <span
      ref={containerRef}
      className={`rolling-text ${className}`.trim()}
      aria-label={content}
      style={{
        display: 'inline',
        ...style,
      }}
    >
      {characters.map((char, index) => {
        if (char === ' ') {
          return (
            <span key={index} style={{ display: 'inline', whiteSpace: 'pre-wrap' }}>
              {' '}
            </span>
          );
        }

        const distanceFromCenter = Math.abs(index - centerIndex);

        return (
          <span
            key={index}
            className="rolling-character"
            style={{
              display: 'inline-block',
              position: 'relative',
              overflow: 'hidden',
              verticalAlign: 'baseline',
              perspective: '800px',
            }}
          >
            {/* Layer 0: Invisible in-flow glyph to reserve exact native typography geometry */}
            <span
              aria-hidden="true"
              style={{
                visibility: 'hidden',
                display: 'inline-block',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              {char}
            </span>

            {/* Layer 1: Outgoing primary glyph */}
            <motion.span
              aria-hidden="true"
              variants={topLayerVariants}
              initial="initial"
              animate={isRolling ? 'animate' : 'initial'}
              custom={distanceFromCenter}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                display: 'inline-block',
                transformOrigin: '50% 100%',
                backfaceVisibility: 'hidden',
                pointerEvents: 'none',
                userSelect: 'none',
                willChange: 'transform, opacity',
              }}
            >
              {char}
            </motion.span>

            {/* Layer 2: Incoming duplicate glyph */}
            <motion.span
              aria-hidden="true"
              variants={bottomLayerVariants}
              initial="initial"
              animate={isRolling ? 'animate' : 'initial'}
              custom={distanceFromCenter}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                display: 'inline-block',
                transformOrigin: '50% 0%',
                backfaceVisibility: 'hidden',
                willChange: 'transform, opacity',
              }}
            >
              {char}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
};

export default RollingText;
