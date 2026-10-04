import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';

import { remapHeroProgressToVideoTime } from './useLandingMasterTimeline';

export interface HeroRedesignProps {
  onEnterCommandCenter?: () => void;
  onExploreSystem?: () => void;
}

export const HeroRedesign: React.FC<HeroRedesignProps> = ({
  onEnterCommandCenter,
  onExploreSystem,
}) => {
  const { startOperationsTransition } = usePageTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleEnter = () => {
    if (onEnterCommandCenter) {
      onEnterCommandCenter();
    } else {
      startOperationsTransition('overview');
    }
  };

  const handleExplore = () => {
    if (onExploreSystem) {
      onExploreSystem();
    } else {
      const el = document.getElementById('manifesto-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Scroll Progress across 220vh pinned runway
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Motion transforms (1.18x target visual scale)
  const particleScale = useTransform(scrollYProgress, [0, 0.45, 0.85, 1], [1.18, 1.25, 1.18, 1.15]);
  const particleRotate = useTransform(scrollYProgress, [0, 0.5, 1], [0, 6, -3]);
  const contentY = useTransform(scrollYProgress, [0, 0.35, 0.85], [0, 0, -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.35, 0.8], [1, 1, 0]);
  const atmosphereOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.65, 0.9, 0.7]);

  // High performance RAF scrubbing of Blender video without React re-renders
  useEffect(() => {
    if (shouldReduceMotion) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video) return;

    const ctx = canvas ? canvas.getContext('2d') : null;

    let targetTime = 0;
    let currentTime = 0;
    let animId: number;

    const unsub = scrollYProgress.on('change', (progress) => {
      // Calibrated piecewise Hermite scrub with holds on Globe, Electricity, Fire, and Lock
      targetTime = remapHeroProgressToVideoTime(progress);
    });

    const scrubLoop = () => {
      const diff = targetTime - currentTime;
      if (Math.abs(diff) > 0.002) {
        currentTime += diff * 0.22;
        if (video.duration && !isNaN(video.duration) && !video.seeking) {
          const clamped = Math.max(0, Math.min(video.duration, currentTime));
          if (Math.abs(video.currentTime - clamped) > 0.02) {
            video.currentTime = clamped;
          }
        }
      }

      // Draw active transparent frame to canvas if available
      if (video.readyState >= 2 && ctx && canvas) {
        if (canvas.width !== 1920 || canvas.height !== 1080) {
          canvas.width = 1920;
          canvas.height = 1080;
        }
        ctx.clearRect(0, 0, 1920, 1080);
        ctx.drawImage(video, 0, 0, 1920, 1080);
      }

      animId = requestAnimationFrame(scrubLoop);
    };

    animId = requestAnimationFrame(scrubLoop);

    return () => {
      unsub();
      cancelAnimationFrame(animId);
    };
  }, [scrollYProgress, shouldReduceMotion]);

  const capabilities = [
    '01 CCTV NEURAL VISION',
    '02 BIOMETRIC ACCESS',
    '03 PIR & MQ-2 SENSORS',
    '04 LOCKDOWN CASCADE',
    '05 ENERGY LOAD GRID',
  ];

  return (
    <div
      ref={containerRef}
      id="hero-scene"
      style={{
        position: 'relative',
        height: '230vh',
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
          background: 'linear-gradient(180deg, #F8F9FB 0%, #EDEDF1 45%, #E6E8EB 80%, #EEEEF1 100%)',
        }}
      >
        <style>{`
          @media (max-width: 900px) {
            .hero-particle-container {
              top: 36% !important;
              left: 50% !important;
              width: 120vw !important;
            }
            .hero-bottom-grid {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }
            .hero-cta-group {
              flex-direction: column !important;
              align-items: stretch !important;
            }
          }
        `}</style>

        {/* Optical warm center bloom behind 3D object */}
        <motion.div
          style={{
            position: 'absolute',
            top: '46%',
            left: '52%',
            x: '-50%',
            y: '-50%',
            width: 'clamp(680px, 65vw, 980px)',
            height: 'clamp(680px, 65vw, 980px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 130, 0, 0.12) 0%, rgba(255, 130, 0, 0.03) 45%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: atmosphereOpacity,
          }}
        />

        {/* Central Spatially Anchored 3D Blender Particle Asset */}
        <motion.div
          className="hero-particle-container"
          style={{
            position: 'absolute',
            top: '46%',
            left: '52%',
            x: '-50%',
            y: '-50%',
            width: 'clamp(800px, 72vw, 1260px)',
            aspectRatio: '16/9',
            pointerEvents: 'none',
            zIndex: 2,
            scale: shouldReduceMotion ? 1.15 : particleScale,
            rotate: shouldReduceMotion ? 0 : particleRotate,
          }}
        >
          {/* Instant crisp initial particle render fallback */}
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
              opacity: videoLoaded ? 0 : 1,
              transition: 'opacity 0.4s ease',
              zIndex: 1,
            }}
          />

          {/* Native hardware-accelerated transparent WebM VP9 video (Zero rectangular boundary) */}
          <video
            ref={videoRef}
            src="/assets/hero/hero_particle_master_alpha.webm"
            poster="/assets/hero/poster.png"
            muted
            playsInline
            preload="auto"
            onLoadedData={() => {
              setVideoLoaded(true);
              if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
              }
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              background: 'transparent',
              opacity: videoLoaded ? 1 : 0,
              transition: 'opacity 0.4s ease',
              zIndex: 2,
            }}
          />

          {/* Canvas fallback for precise alpha preservation */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
        </motion.div>

        {/* Top Spacer for persistent Fixed Navbar */}
        <div style={{ height: '32px' }} />

        {/* HERO BOTTOM CONTENT: Editorial Headline (Left) & Narrative + CTAs (Right) */}
        <motion.div
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
            y: shouldReduceMotion ? 0 : contentY,
            opacity: shouldReduceMotion ? 1 : contentOpacity,
          }}
        >
          <div
            className="hero-bottom-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
              gap: 'clamp(32px, 5vw, 64px)',
              alignItems: 'flex-end',
            }}
          >
            {/* Left Column: Large Editorial Headline */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: '0.688rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#FF8200',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ width: '20px', height: '1.5px', backgroundColor: '#FF8200' }} />
                <span>INTELLIGENT CAMPUS DEFENSE MATRIX</span>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                  fontSize: 'clamp(2.8rem, 5.2vw, 5.8rem)',
                  fontWeight: 450,
                  letterSpacing: '-0.04em',
                  lineHeight: 0.98,
                  color: '#101820',
                  margin: 0,
                }}
              >
                SECURITY
                <br />
                THAT SEES.
                <br />
                <span style={{ color: '#101820' }}>SAFETY</span>
                <br />
                <span style={{ color: '#5B6871' }}>THAT RESPONDS.</span>
              </h1>
            </div>

            {/* Right Column: Supporting narrative, CTAs & Capability Metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <p
                style={{
                  fontSize: 'clamp(0.95rem, 1.15vw, 1.125rem)',
                  lineHeight: 1.6,
                  color: '#3A4854',
                  margin: 0,
                  maxWidth: '520px',
                  fontWeight: 400,
                }}
              >
                A connected campus security and automation system that turns surveillance, access
                control, sensors, emergency response and energy intelligence into one coordinated
                environment.
              </p>

              {/* Editorial CTAs */}
              <div
                className="hero-cta-group"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <button
                  onClick={handleEnter}
                  style={{
                    backgroundColor: '#101820',
                    color: '#FFFFFF',
                    border: '1px solid #101820',
                    borderRadius: '9999px',
                    padding: '14px 28px',
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.813rem',
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 8px 24px rgba(16, 24, 32, 0.16)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FF8200';
                    e.currentTarget.style.borderColor = '#FF8200';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(255, 130, 0, 0.28)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#101820';
                    e.currentTarget.style.borderColor = '#101820';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 24, 32, 0.16)';
                  }}
                >
                  <span>ENTER COMMAND CENTER</span>
                  <ArrowUpRight size={15} />
                </button>

                <button
                  onClick={handleExplore}
                  style={{
                    background: 'transparent',
                    color: '#101820',
                    border: '1px solid rgba(16, 24, 32, 0.2)',
                    borderRadius: '9999px',
                    padding: '14px 24px',
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.813rem',
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#101820';
                    e.currentTarget.style.backgroundColor = 'rgba(16, 24, 32, 0.05)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.2)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span>EXPLORE THE SYSTEM</span>
                  <ChevronDown size={15} />
                </button>
              </div>

              {/* Capability Metadata Strip */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px 20px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(16, 24, 32, 0.1)',
                }}
              >
                {capabilities.map((cap) => (
                  <span
                    key={cap}
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: '0.625rem',
                      letterSpacing: '0.12em',
                      color: '#5B6871',
                      textTransform: 'uppercase',
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Minimal Morph Stages Indicator (Globe -> Electricity -> Fire -> Lock) */}
        <div
          className="hidden-mobile"
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {[
            { label: 'GLOBE' },
            { label: 'ELECTRICITY' },
            { label: 'FIRE' },
            { label: 'LOCK' },
          ].map((stage, i) => (
            <div
              key={stage.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.563rem',
                letterSpacing: '0.14em',
                color: '#7C8A96',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ color: '#FF8200' }}>0{i + 1}</span>
              <span>{stage.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroRedesign;
