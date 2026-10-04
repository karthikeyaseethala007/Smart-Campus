import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Shield, Eye, BellRing, Zap } from 'lucide-react';
import type { LandingMasterTimeline } from './useLandingMasterTimeline';

interface UnifiedPinnedLightStageProps {
  timeline: LandingMasterTimeline;
  onEnterCommandCenter?: () => void;
}

export const UnifiedPinnedLightStage: React.FC<UnifiedPinnedLightStageProps> = ({
  timeline,
  onEnterCommandCenter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [initialFrameLoaded, setInitialFrameLoaded] = useState(false);
  const framesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const lastDrawnFrameRef = useRef<number>(1);
  const targetFrameRef = useRef<number>(1);

  // Four Pillars active pill state
  const [activePillar, setActivePillar] = useState<'PROTECT' | 'DETECT' | 'RESPOND' | 'AUTOMATE'>('PROTECT');

  const TOTAL_FRAMES = 240;
  const getFrameUrl = (idx: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_FRAMES, idx));
    const pad = String(clamped).padStart(4, '0');
    return `/assets/hero/frames_alpha/frame_${pad}.png`;
  };

  const drawFrame = (frameNum: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let img = framesRef.current.get(frameNum);
    if (!img || !img.complete || img.naturalWidth === 0) {
      let bestDist = Infinity;
      let fallbackImg: HTMLImageElement | null = null;
      for (const [idx, cached] of framesRef.current.entries()) {
        if (cached.complete && cached.naturalWidth > 0) {
          const dist = Math.abs(idx - frameNum);
          if (dist < bestDist) {
            bestDist = dist;
            fallbackImg = cached;
          }
        }
      }
      img = fallbackImg ?? undefined;
    }

    if (img && img.complete && img.naturalWidth > 0) {
      if (canvas.width !== 1920 || canvas.height !== 1080) {
        canvas.width = 1920;
        canvas.height = 1080;
      }
      ctx.clearRect(0, 0, 1920, 1080);
      ctx.drawImage(img, 0, 0, 1920, 1080);
      lastDrawnFrameRef.current = frameNum;
      setInitialFrameLoaded(true);
    }
  };

  // Progressive frame preloading
  useEffect(() => {
    let isCancelled = false;

    const preloadFrame = (index: number) => {
      const cached = framesRef.current.get(index);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        if (index === 1) {
          setInitialFrameLoaded(true);
          drawFrame(1);
        }
        return;
      }

      const img = cached ?? new Image();
      img.onload = () => {
        if (!isCancelled) {
          framesRef.current.set(index, img);
          if (index === 1) {
            setInitialFrameLoaded(true);
            drawFrame(1);
          } else if (Math.abs(targetFrameRef.current - index) < 3) {
            drawFrame(targetFrameRef.current);
          }
        }
      };
      if (!cached) {
        img.src = getFrameUrl(index);
        framesRef.current.set(index, img);
      }
      if (img.complete && img.naturalWidth > 0) {
        if (!isCancelled) {
          framesRef.current.set(index, img);
          if (index === 1) {
            setInitialFrameLoaded(true);
            drawFrame(1);
          }
        }
      }
    };

    // 1. Immediately preload frame 1
    preloadFrame(1);

    // 2. Preload coarse keyframes (every 6th frame) for responsive initial scrubbing
    const timer1 = setTimeout(() => {
      if (isCancelled) return;
      for (let f = 1; f <= TOTAL_FRAMES; f += 6) {
        preloadFrame(f);
      }
    }, 40);

    // 3. Preload all remaining intermediate frames in small batches
    const timer2 = setTimeout(() => {
      if (isCancelled) return;
      let f = 2;
      const loadNextBatch = () => {
        if (isCancelled || f > TOTAL_FRAMES) return;
        const end = Math.min(TOTAL_FRAMES, f + 16);
        for (; f <= end; f++) {
          preloadFrame(f);
        }
        setTimeout(loadNextBatch, 20);
      };
      loadNextBatch();
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Frame scrubbing synchronization driven by master timeline heroVideoTime [0.0 - 10.0s]
  useEffect(() => {
    let animId: number;

    const updateFromVideoTime = (timeSec: number) => {
      const normalized = Math.max(0, Math.min(1, timeSec / 10.0));
      const target = Math.round(normalized * (TOTAL_FRAMES - 1)) + 1;
      targetFrameRef.current = target;
    };

    updateFromVideoTime(timeline.heroVideoTime.get());

    const unsub = timeline.heroVideoTime.on('change', (targetSec) => {
      updateFromVideoTime(targetSec);
    });

    let currentRendered = -1;
    const loop = () => {
      if (targetFrameRef.current !== currentRendered) {
        drawFrame(targetFrameRef.current);
        currentRendered = targetFrameRef.current;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      unsub();
      cancelAnimationFrame(animId);
    };
  }, [timeline.heroVideoTime]);

  // Four Pillars dynamic selection based on floatingProgress [0, 1]
  useEffect(() => {
    const unsub = timeline.floatingProgress.on('change', (v) => {
      if (v < 0.25) setActivePillar('PROTECT');
      else if (v < 0.5) setActivePillar('DETECT');
      else if (v < 0.75) setActivePillar('RESPOND');
      else setActivePillar('AUTOMATE');
    });
    return () => unsub();
  }, [timeline.floatingProgress]);

  const pillars = [
    { id: 'PROTECT', label: 'PROTECT', icon: Shield, x: '-28vw', y: '-14vh', desc: 'Biometric Access & Perimeter Isolation' },
    { id: 'DETECT', label: 'DETECT', icon: Eye, x: '28vw', y: '-14vh', desc: 'Neural CCTV & Sensor Telemetry Mesh' },
    { id: 'RESPOND', label: 'RESPOND', icon: BellRing, x: '-26vw', y: '16vh', desc: 'Immediate Autonomous Lockdown Dispatch' },
    { id: 'AUTOMATE', label: 'AUTOMATE', icon: Zap, x: '26vw', y: '16vh', desc: 'Self-Optimizing Grid & HVAC Regulation' },
  ];

  return (
    <div
      className="pinned-light-stage"
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(80px, 11vh, 120px) clamp(24px, 5vw, 64px) clamp(36px, 5vh, 52px)',
        boxSizing: 'border-box',
      }}
    >
      {/* =========================================================================
          PERSISTENT 3D PARTICLE HERO CANVAS (Continuous Scrub, Zero State Jumps)
          Spatially anchored at top: 46%, left: 58%
          100% Seamless Physical Transparency (Zero Background Box)
          ========================================================================= */}
      <motion.div
        className="hero-3d-object-wrapper"
        style={{
          position: 'absolute',
          top: timeline.heroY,
          left: timeline.heroX,
          x: '-50%',
          y: '-50%',
          width: 'clamp(720px, 66vw, 1160px)',
          aspectRatio: '16/9',
          pointerEvents: 'none',
          zIndex: 2,
          mixBlendMode: 'normal',
          scale: timeline.heroScale,
          opacity: timeline.heroOpacity,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Dynamic Ground Contact Shadow (Localized subtle shadow beneath particle object) */}
          <motion.div
            style={{
              position: 'absolute',
              top: '74%',
              left: '50%',
              x: '-50%',
              y: '-50%',
              width: timeline.heroShadowWidth,
              height: '24px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(16, 24, 32, 0.28) 0%, rgba(16, 24, 32, 0.12) 35%, transparent 70%)',
              filter: 'blur(8px)',
              pointerEvents: 'none',
              zIndex: 1,
              opacity: timeline.heroShadowOpacity,
            }}
          />

          {/* Dynamic Internal Orange Energy & Floor Light Bounce */}
          <motion.div
            style={{
              position: 'absolute',
              top: '74%',
              left: '50%',
              x: '-50%',
              y: '-50%',
              width: 'clamp(360px, 36vw, 500px)',
              height: '48px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(255, 130, 0, 0.24) 0%, rgba(255, 130, 0, 0.06) 40%, transparent 75%)',
              filter: 'blur(14px)',
              pointerEvents: 'none',
              zIndex: 0,
              opacity: timeline.heroOrangeEnergy,
            }}
          />

          {/* Instant fallback transparent poster (Frame 1 - Globe) */}
          <img
            src="/assets/hero/poster.png"
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
              opacity: initialFrameLoaded ? 0 : 1,
              transition: 'opacity 0.2s ease',
              zIndex: 2,
            }}
          />

          {/* Real Blender Frame Sequence Canvas (100% physically transparent, zero rectangular box) */}
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              background: 'transparent',
              opacity: 1,
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
        </div>
      </motion.div>

      {/* Spacer top to balance fixed header */}
      <div style={{ height: '40px' }} />

      {/* =========================================================================
          HERO BOTTOM CONTENT (Phase 0.00 - 0.25)
          Drifts up and fades out cleanly before Editorial Scene 01 arrives
          ========================================================================= */}
      <div
        className="hero-bottom-content"
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 'clamp(24px, 4vw, 64px)',
          flexWrap: 'wrap',
          pointerEvents: 'none',
        }}
      >
        {/* Bottom Left Column */}
        <motion.div
          style={{
            maxWidth: '480px',
            pointerEvents: 'auto',
            opacity: timeline.heroHeadlineOpacity,
            y: timeline.heroHeadlineY,
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(2.2rem, 3.5vw, 3.4rem)',
              fontWeight: 450,
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
              color: '#101820',
              margin: '0 0 16px 0',
            }}
          >
            Security that sees.
            <br />
            <span style={{ fontWeight: 400, color: '#5B6871' }}>
              Safety that responds.
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.875rem, 1vw, 0.95rem)',
              color: '#5B6871',
              lineHeight: 1.55,
              margin: '0 0 20px 0',
              fontWeight: 400,
              maxWidth: '420px',
            }}
          >
            A connected campus security and automation platform integrating surveillance, access control, sensors, and emergency response into one system.
          </p>

          <div>
            <button
              onClick={onEnterCommandCenter}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 22px',
                borderRadius: '9999px',
                backgroundColor: '#101820',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                border: '1px solid #101820',
                cursor: 'pointer',
                boxShadow: '0 4px 16px -2px rgba(16, 24, 32, 0.2)',
                transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF8200';
                e.currentTarget.style.borderColor = '#FF8200';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px -2px rgba(255, 130, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#101820';
                e.currentTarget.style.borderColor = '#101820';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(16, 24, 32, 0.2)';
              }}
            >
              <span>ENTER COMMAND CENTER</span>
              <ArrowUpRight size={14} color="#FF8200" />
            </button>
          </div>
        </motion.div>

        {/* Bottom Right Column - Editorial Status & Refined Capabilities */}
        <motion.div
          style={{
            maxWidth: '420px',
            pointerEvents: 'auto',
            opacity: timeline.heroSupportingOpacity,
            y: timeline.heroSupportingY,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#7A8994',
              marginBottom: '12px',
            }}
          >
            <span style={{ color: '#FF8200' }}>01 / 04</span>
            <span style={{ color: 'rgba(16, 24, 32, 0.25)' }}>·</span>
            <span>PERSISTENT TELEMETRY</span>
          </div>

          <p
            style={{
              fontSize: 'clamp(0.85rem, 0.95vw, 0.9rem)',
              color: '#5B6871',
              lineHeight: 1.55,
              margin: '0 0 16px 0',
              fontWeight: 400,
              maxWidth: '380px',
            }}
          >
            Whether through neural CCTV monitoring, biometric access gates, or autonomous hazard containment, every signal triggers an immediate physical response.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.688rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#60707D',
            }}
          >
            <span>SURVEILLANCE</span>
            <span style={{ color: 'rgba(16, 24, 32, 0.25)' }}>·</span>
            <span>ACCESS CONTROL</span>
            <span style={{ color: 'rgba(16, 24, 32, 0.25)' }}>·</span>
            <span>SENSORS</span>
            <span style={{ color: 'rgba(16, 24, 32, 0.25)' }}>·</span>
            <span>EMERGENCY</span>
          </div>
        </motion.div>
      </div>

      {/* =========================================================================
          EDITORIAL STATEMENT 01 (Phase 0.18 - 0.32)
          Huge centered display statement, massive whitespace, diffuse halo
          ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      >
        <motion.div
          className="editorial-statement-01"
          style={{
            position: 'relative',
            width: 'min(1100px, 92vw)',
            textAlign: 'center',
            pointerEvents: 'auto',
            opacity: timeline.editorial1Opacity,
            y: timeline.editorial1Y,
            scale: timeline.editorial1Scale,
          }}
        >
          {/* Subtle oversized circular luminous stage */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(540px, 62vw, 920px)',
              height: 'clamp(540px, 62vw, 920px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.65) 50%, transparent 75%)',
              filter: 'blur(32px)',
              pointerEvents: 'none',
              zIndex: -1,
            }}
          />

          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(3.4rem, 6.4vw, 6.6rem)',
              fontWeight: 400,
              letterSpacing: '-0.04em',
              lineHeight: 1.04,
              color: '#101820',
              margin: '0 0 24px 0',
            }}
          >
            Every Signal Begins
            <br />
            With a Response.
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.15vw, 1.1rem)',
              color: '#5B6871',
              lineHeight: 1.6,
              maxWidth: '560px',
              margin: '0 auto 36px auto',
              fontWeight: 400,
            }}
          >
            A connected campus turns every anomaly into an immediate coordinated defense. Surveillance, sensors, and access interlocks unite into a singular autonomic response.
          </p>

          <button
            onClick={onEnterCommandCenter}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              borderRadius: '9999px',
              backgroundColor: '#101820',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px -2px rgba(16, 24, 32, 0.2)',
              transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF8200';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#101820';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>ABOUT PLATFORM</span>
            <ArrowUpRight size={14} color="#FF8200" />
          </button>
        </motion.div>
      </div>

      {/* =========================================================================
          EDITORIAL STATEMENT 02 (Phase 0.32 - 0.44)
          "From Detection to Autonomous Action."
          ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      >
        <motion.div
          className="editorial-statement-02"
          style={{
            position: 'relative',
            width: 'min(1100px, 92vw)',
            textAlign: 'center',
            pointerEvents: 'auto',
            opacity: timeline.editorial2Opacity,
            y: timeline.editorial2Y,
            scale: timeline.editorial2Scale,
          }}
        >
          {/* Luminous Stage Halo */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(540px, 62vw, 920px)',
              height: 'clamp(540px, 62vw, 920px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.65) 50%, transparent 75%)',
              filter: 'blur(32px)',
              pointerEvents: 'none',
              zIndex: -1,
            }}
          />

          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(3.4rem, 6.4vw, 6.6rem)',
              fontWeight: 400,
              letterSpacing: '-0.04em',
              lineHeight: 1.04,
              color: '#101820',
              margin: '0 0 24px 0',
            }}
          >
            From Detection to
            <br />
            Autonomous Action.
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.15vw, 1.1rem)',
              color: '#5B6871',
              lineHeight: 1.6,
              maxWidth: '560px',
              margin: '0 auto',
              fontWeight: 400,
            }}
          >
            Sub-second telemetry processing that bridges digital threat modeling with physical campus actuators until every zone is safeguarded.
          </p>
        </motion.div>
      </div>

      {/* =========================================================================
          CINEMATIC STAGE (Phase 0.44 - 0.58)
          Giant dark rounded rectangle dominating viewport with centered trigger
          ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        <motion.div
          className="cinematic-stage-container"
          style={{
            width: 'min(1360px, 94vw)',
            pointerEvents: 'auto',
            opacity: timeline.cinematicStageOpacity,
            y: timeline.cinematicStageY,
            scale: timeline.cinematicStageScale,
          }}
        >
          <motion.div
            onClick={onEnterCommandCenter}
            style={{
              position: 'relative',
              width: '100%',
              height: 'clamp(520px, 74vh, 760px)',
              backgroundColor: '#070707',
              borderRadius: timeline.cinematicStageRadius,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 32px 80px -16px rgba(0, 0, 0, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            {/* Centered Minimal Play Trigger (Exact MDX: Outlined play triangle | WATCH SHOWREEL) */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '24px',
                userSelect: 'none',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M14 10L30 20L14 30V10Z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
              </svg>

              <div
                style={{
                  width: '1px',
                  height: '32px',
                  backgroundColor: 'rgba(255, 255, 255, 0.35)',
                }}
              />

              <span
                style={{
                  fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                  fontSize: 'clamp(1.3rem, 2.2vw, 2.2rem)',
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                }}
              >
                EXPLORE CAMPUS SYSTEM
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* =========================================================================
          FOUR-PILLAR FLOATING SYSTEM (Phase 0.65 - 0.76)
          Center particle object + 4 floating translucent capsules in spatial orbit
          ========================================================================= */}
      <motion.div
        className="four-pillars-stage"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 6,
          opacity: timeline.floatingOpacity,
          scale: timeline.floatingScale,
        }}
      >
        {/* Top Header */}
        <div
          style={{
            position: 'absolute',
            top: '11vh',
            left: 'clamp(24px, 5vw, 64px)',
            right: 'clamp(24px, 5vw, 64px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            pointerEvents: 'auto',
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(2.2rem, 3.8vw, 3.6rem)',
              fontWeight: 450,
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
              color: '#101820',
              margin: 0,
            }}
          >
            Made with Intention.
            <br />
            <span style={{ color: '#5B6871', fontWeight: 400 }}>Built to Protect.</span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.85rem, 1vw, 0.92rem)',
              color: '#5B6871',
              maxWidth: '380px',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            From the way signals coordinate to how actuators fire, every part of the infrastructure is engineered to safeguard campus life.
          </p>
        </div>

        {/* 4 Spatial Floating Capsules */}
        <div
          style={{
            position: 'absolute',
            top: '52%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {pillars.map((pill) => {
            const isActive = activePillar === pill.id;
            const pillOpacity =
              pill.id === 'PROTECT'
                ? timeline.pill1Opacity
                : pill.id === 'DETECT'
                ? timeline.pill2Opacity
                : pill.id === 'RESPOND'
                ? timeline.pill3Opacity
                : timeline.pill4Opacity;
            const pillY =
              pill.id === 'PROTECT'
                ? timeline.pill1Y
                : pill.id === 'DETECT'
                ? timeline.pill2Y
                : pill.id === 'RESPOND'
                ? timeline.pill3Y
                : timeline.pill4Y;

            return (
              <motion.div
                key={pill.id}
                style={{
                  position: 'absolute',
                  top: `calc(50% + ${pill.y})`,
                  left: `calc(50% + ${pill.x})`,
                  x: '-50%',
                  y: '-50%',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  opacity: pillOpacity,
                  translateY: pillY,
                  transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                }}
                onClick={() => setActivePillar(pill.id as any)}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 22px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? '#FF8200' : 'rgba(255, 255, 255, 0.85)',
                    color: isActive ? '#FFFFFF' : '#101820',
                    border: `1px solid ${isActive ? '#FF8200' : 'rgba(16, 24, 32, 0.12)'}`,
                    boxShadow: isActive
                      ? '0 8px 24px -4px rgba(255, 130, 0, 0.4)'
                      : '0 4px 16px -2px rgba(16, 24, 32, 0.08)',
                    backdropFilter: 'blur(12px)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <pill.icon size={15} color={isActive ? '#FFFFFF' : '#FF8200'} />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {pill.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom active pill description */}
        <div
          style={{
            position: 'absolute',
            bottom: '68px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: '0.8rem',
              color: '#5B6871',
              fontWeight: 500,
              letterSpacing: '0.04em',
            }}
          >
            <span style={{ color: '#FF8200', fontWeight: 600 }}>● {activePillar}: </span>
            {pillars.find((p) => p.id === activePillar)?.desc}
          </span>
        </div>
      </motion.div>

      {/* =========================================================================
          STAGE PROGRESS INDICATOR TICKET MARKS (Bottom Center)
          Lightweight 4 tick marks with active highlighted in orange
          ========================================================================= */}
      <div
        className="stage-tick-indicators"
        style={{
          position: 'absolute',
          bottom: '22px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 7,
          pointerEvents: 'none',
        }}
      >
        {[0, 1, 2, 3].map((idx) => {
          const isActive = idx === timeline.activeStageIndex;
          return (
            <div
              key={idx}
              style={{
                width: '1px',
                height: isActive ? '20px' : '10px',
                backgroundColor: isActive ? '#FF8200' : 'rgba(16, 24, 32, 0.22)',
                transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
