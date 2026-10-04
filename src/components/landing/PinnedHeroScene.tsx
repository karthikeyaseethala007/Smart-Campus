import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';
import { useMasterTimeline } from './useMasterTimeline';

interface PinnedHeroSceneProps {
  onEnterCommandCenter?: () => void;
}

export const PinnedHeroScene: React.FC<PinnedHeroSceneProps> = ({ onEnterCommandCenter }) => {
  const { startOperationsTransition } = usePageTransition();
  const sceneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Render video frame to canvas for 100% reliable hardware-accelerated mix-blend-mode: multiply
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    let animId: number;
    const render = () => {
      if (video.readyState >= 2) {
        if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  // =========================================================================
  // MASTER TIMELINE: SCROLL POSITION -> MASTER TIMELINE -> HERO PROPERTIES
  // =========================================================================
  const {
    targetVideoTime,
    morphPhase,
    objectScale,
    objectOpacity,
    atmosphereOpacity,
    headlinePosition,
    headlineOpacity,
    supportingTextPosition,
    supportingTextOpacity,
    activeStageIndex,
  } = useMasterTimeline(sceneRef);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Scrub video smoothly across the master timeline
  useEffect(() => {
    if (prefersReducedMotion) return;

    let targetSeconds = 0;
    let animId: number;

    const unsubscribe = targetVideoTime.on('change', (norm) => {
      const vid = videoRef.current;
      if (!vid || isNaN(vid.duration) || vid.duration === 0) return;
      targetSeconds = norm * vid.duration;
    });

    const updateVideo = () => {
      const vid = videoRef.current;
      if (vid && !isNaN(vid.duration) && vid.duration > 0 && !vid.seeking) {
        const diff = targetSeconds - vid.currentTime;
        if (Math.abs(diff) > 0.03) {
          vid.currentTime += diff * 0.25;
        }
      }
      animId = requestAnimationFrame(updateVideo);
    };

    animId = requestAnimationFrame(updateVideo);

    return () => {
      unsubscribe();
      cancelAnimationFrame(animId);
    };
  }, [targetVideoTime, prefersReducedMotion]);

  const handleEnter = () => {
    if (onEnterCommandCenter) {
      onEnterCommandCenter();
    } else {
      startOperationsTransition('overview');
    }
  };

  const capabilities = ['CCTV', 'ACCESS CONTROL', 'PIR SENSORS', 'MQ-2 GAS', 'ENERGY', '+'];

  return (
    <div
      id="hero-scene"
      ref={sceneRef}
      data-morph-phase={morphPhase}
      style={{
        position: 'relative',
        height: '200vh',
        backgroundColor: 'transparent',
      }}
    >
      {/* Sticky 100vh Viewport Stage */}
      <div
        className="hero-viewport-stage"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(80px, 11vh, 120px) clamp(24px, 5vw, 64px) clamp(36px, 5vh, 52px)',
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #F8F8FA 0%, #EDEDF0 35%, #E6E7EA 75%, #EEEEF1 100%)',
        }}
      >
        {/* =========================================================================
            PERSISTENT CENTRAL CINEMATIC 3D PARTICLE HERO OBJECT
            Scrubbed across Globe -> Electricity -> Fire -> Lock
            Seamlessly blended on pure white canvas
            ========================================================================= */}
        <style>{`
          @media (max-width: 768px) {
            .hero-3d-object {
              left: 50% !important;
              top: 30% !important;
              width: 140vw !important;
            }
            .hero-bottom-content {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 24px !important;
              padding-top: 180px !important;
            }
          }
        `}</style>

        {/* Optical warm center bloom behind 3D object driven by master timeline atmosphereOpacity */}
        <motion.div
          style={{
            position: 'absolute',
            top: '46%',
            left: '58%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(700px, 68vw, 1000px)',
            height: 'clamp(700px, 68vw, 1000px)',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: atmosphereOpacity,
          }}
        >
          <img
            src="/assets/atmosphere/hero-center-ell.avif"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </motion.div>

        {/* =========================================================================
            PERSISTENT CENTRAL CINEMATIC 3D PARTICLE HERO OBJECT
            Scrubbed across Globe -> Electricity -> Fire -> Lock
            Spatial Anchoring matched to MDX Ground Truth (ref_01.5s.png)
            ========================================================================= */}
        <div
          className="hero-3d-object"
          style={{
            position: 'absolute',
            top: '46%',
            left: '58%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(840px, 78vw, 1320px)',
            aspectRatio: '16/9',
            pointerEvents: 'none',
            zIndex: 2,
            mixBlendMode: 'multiply',
          }}
        >
          <motion.div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              scale: objectScale,
              opacity: objectOpacity,
            }}
          >
            {/* Instant crisp initial particle render fallback */}
            <img
              src="/assets/hero/poster.png"
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'contrast(1.08) brightness(1.04)',
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
                opacity: videoLoaded ? 0 : 1,
                transition: 'opacity 0.4s ease',
                zIndex: 2,
              }}
            />

            {/* Video element (hidden, feeds into canvas for reliable multiply compositing) */}
            <video
              ref={videoRef}
              src="/assets/hero/hero_particle_master_1080p.mp4"
              poster="/assets/hero/poster.png"
              muted
              playsInline
              autoPlay
              loop
              preload="auto"
              onLoadedData={() => setVideoLoaded(true)}
              style={{
                display: 'none',
              }}
            />

            {/* Canvas with full Skia GPU accelerated multiply blend mode */}
            <canvas
              ref={canvasRef}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'contrast(1.08) brightness(1.04)',
                opacity: videoLoaded ? 1 : 0,
                transition: 'opacity 0.4s ease',
                zIndex: 3,
              }}
            />
          </motion.div>
        </div>

        {/* Spacer top to balance fixed header */}
        <div style={{ height: '40px' }} />

        {/* =========================================================================
            BOTTOM COMPOSITION (Exact MDX Layout from ref_01.5s.png)
            Bottom-Left: Headline, Subhead & Black Capsule CTA
            Bottom-Right: Supporting Paragraph & Category Capsule Pills
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
          {/* Bottom Left Column: Headline, subhead & Black Capsule CTA */}
          <motion.div
            style={{
              maxWidth: '480px',
              pointerEvents: 'auto',
              opacity: headlineOpacity,
              y: headlinePosition,
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

            {/* Black Capsule CTA Pill (Matching MDX LET'S TALK button) */}
            <div>
              <button
                onClick={handleEnter}
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

          {/* Bottom Right Column: Supporting paragraph & category pills */}
          <motion.div
            style={{
              maxWidth: '400px',
              pointerEvents: 'auto',
              opacity: supportingTextOpacity,
              y: supportingTextPosition,
            }}
          >
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {capabilities.map((cap) => (
                <span
                  key={cap}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(16, 24, 32, 0.12)',
                    fontSize: '0.656rem',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#2A343D',
                  }}
                >
                  {cap}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* MDX Stage Progress Indicator Tick Marks at Bottom Center */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
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
            const isActive = idx === activeStageIndex;
            return (
              <div
                key={idx}
                style={{
                  width: '1px',
                  height: isActive ? '20px' : '10px',
                  backgroundColor: isActive ? '#FF8200' : 'rgba(16, 24, 32, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
