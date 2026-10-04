import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';

export const EditorialScene: React.FC = () => {
  const { startOperationsTransition } = usePageTransition();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const [activeTick, setActiveTick] = useState(1);

  useEffect(() => {
    const unsub = scrollYProgress.on('change', (p) => {
      if (p < 0.50) {
        setActiveTick(1);
      } else {
        setActiveTick(2);
      }
    });
    return () => unsub();
  }, [scrollYProgress]);

  // Stage A: Active in range 0.00 -> 0.48 (peaking at 0.08 -> 0.42)
  const stageAOpacity = useTransform(scrollYProgress, [0.0, 0.08, 0.42, 0.50], [0, 1, 1, 0]);
  const stageAY = useTransform(scrollYProgress, [0.0, 0.08, 0.42, 0.50], [25, 0, 0, -25]);

  // Stage B: Active in range 0.48 -> 1.00 (peaking at 0.56 -> 0.90)
  const stageBOpacity = useTransform(scrollYProgress, [0.48, 0.56, 0.90, 0.98], [0, 1, 1, 0]);
  const stageBY = useTransform(scrollYProgress, [0.48, 0.56, 0.90, 0.98], [25, 0, 0, -25]);

  // Circular halo subtle pulse & scale
  const haloScale = useTransform(scrollYProgress, [0.05, 0.45, 0.85], [0.95, 1.04, 0.97]);

  return (
    <div
      ref={containerRef}
      id="editorial-scene"
      style={{
        position: 'relative',
        height: '240vh',
        backgroundColor: 'transparent',
      }}
    >
      {/* Sticky 100vh Viewport Stage */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 clamp(24px, 6vw, 96px)',
          boxSizing: 'border-box',
        }}
      >
        {/* =========================================================================
            STAGE A ATMOSPHERE: CLEAR GLOBE DESKTOP AVIF (Exact Ground Truth ref_10.5s.png)
            Frosted circle with dual warm amber blooms at upper-left and lower-right
            ========================================================================= */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            x: '-50%',
            y: '-50%',
            width: 'clamp(580px, 62vw, 860px)',
            height: 'clamp(580px, 62vw, 860px)',
            pointerEvents: 'none',
            zIndex: 1,
            scale: haloScale,
            opacity: stageAOpacity,
          }}
        >
          <img
            src="/assets/atmosphere/clear-globe-desktop.avif"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </motion.div>

        {/* =========================================================================
            STAGE B ATMOSPHERE: IDEAS BLUR SUN GLOW (Exact Ground Truth ref_13.5s.png)
            Warm luminous amber sun positioned at top center behind the circle
            ========================================================================= */}
        <motion.div
          style={{
            position: 'absolute',
            top: '36%',
            left: '50%',
            x: '-50%',
            y: '-50%',
            width: 'clamp(360px, 42vw, 540px)',
            height: 'clamp(360px, 42vw, 540px)',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: stageBOpacity,
          }}
        >
          <img
            src="/assets/atmosphere/ideas-blur-2.avif"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'contrast(1.1)',
            }}
          />
        </motion.div>

        {/* Ambient Ring Border during Stage B */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(580px, 62vw, 840px)',
            height: 'clamp(580px, 62vw, 840px)',
            borderRadius: '50%',
            border: '1px solid rgba(255, 130, 0, 0.15)',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: stageBOpacity,
          }}
        />

        {/* =========================================================================
            STAGE A: "ONE CAMPUS. ONE CONNECTED RESPONSE." (ref_10.5s.png)
            ========================================================================= */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            x: '-50%',
            y: stageAY,
            opacity: stageAOpacity,
            width: '100%',
            maxWidth: '1080px',
            textAlign: 'center',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(3.2rem, 6.2vw, 6.2rem)',
              fontWeight: 400,
              letterSpacing: '-0.04em',
              lineHeight: 1.04,
              color: '#101820',
              margin: '0 0 24px 0',
            }}
          >
            One Campus.
            <br />
            <span>One Connected Response.</span>
          </h2>

          <p
            style={{
              maxWidth: '640px',
              fontSize: 'clamp(0.95rem, 1.25vw, 1.15rem)',
              color: '#5B6871',
              lineHeight: 1.55,
              margin: '0 0 32px 0',
              fontWeight: 400,
            }}
          >
            Every signal has an immediate response. We unify surveillance, sensor telemetry, and automation to protect lives, secure infrastructure, and optimize energy.
          </p>

          <button
            onClick={() => startOperationsTransition('overview')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '13px 28px',
              borderRadius: '9999px',
              backgroundColor: '#101820',
              color: '#FFFFFF',
              fontSize: '0.813rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: '1px solid #101820',
              cursor: 'pointer',
              boxShadow: '0 8px 24px -4px rgba(16, 24, 32, 0.28)',
              transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF8200';
              e.currentTarget.style.borderColor = '#FF8200';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#101820';
              e.currentTarget.style.borderColor = '#101820';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>ENTER COMMAND CENTER</span>
            <ArrowUpRight size={15} color="#FF8200" />
          </button>
        </motion.div>

        {/* =========================================================================
            STAGE B: "FROM DETECTION TO AUTONOMOUS ACTION." (ref_13.5s.png)
            Clean, editorial, no cards, no pills
            ========================================================================= */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            x: '-50%',
            y: stageBY,
            opacity: stageBOpacity,
            width: '100%',
            maxWidth: '1080px',
            textAlign: 'center',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(3.2rem, 6.2vw, 6.2rem)',
              fontWeight: 400,
              letterSpacing: '-0.04em',
              lineHeight: 1.04,
              color: '#101820',
              margin: '0 0 24px 0',
            }}
          >
            From Detection to
            <br />
            <span>Autonomous Action.</span>
          </h2>

          <p
            style={{
              maxWidth: '640px',
              fontSize: 'clamp(0.95rem, 1.25vw, 1.15rem)',
              color: '#5B6871',
              lineHeight: 1.55,
              margin: '0 0 32px 0',
              fontWeight: 400,
            }}
          >
            Every project begins with telemetry. We detect, analyze, and automate until every zone is safeguarded.
          </p>
        </motion.div>

        {/* Stage Progress Indicator Tick Marks at Bottom Center (MDX Ground Truth) */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 4,
            pointerEvents: 'none',
          }}
        >
          {[0, 1, 2, 3].map((idx) => {
            const isHighlighted = idx === activeTick;
            return (
              <div
                key={idx}
                style={{
                  width: '1px',
                  height: isHighlighted ? '20px' : '10px',
                  backgroundColor: isHighlighted ? '#FF8200' : 'rgba(16, 24, 32, 0.22)',
                  transition: 'all 0.3s ease',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
