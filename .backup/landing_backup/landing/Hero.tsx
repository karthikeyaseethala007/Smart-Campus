import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';

interface HeroProps {
  onEnterCommandCenter?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onEnterCommandCenter }) => {
  const { startOperationsTransition } = usePageTransition();
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Scroll mapping for hero animation across the viewport
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Editorial typography transitions on scroll
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0.1]);
  const headlineY = useTransform(scrollYProgress, [0, 0.45], [0, -25]);
  const videoScale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.98, 0.94]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 0.9, 0.4]);

  // Active state indicator based on scroll percentage
  const [morphPhase, setMorphPhase] = useState<'Globe' | 'Electricity' | 'Fire' | 'Lock'>('Globe');

  useEffect(() => {
    if (prefersReducedMotion) return;

    let targetTime = 0;
    let animId: number;

    const unsubscribe = scrollYProgress.on('change', (progress) => {
      const vid = videoRef.current;
      if (!vid || isNaN(vid.duration) || vid.duration === 0) return;

      // 10s video duration: 0% Globe, 25% Electricity, 50% Fire, 75-100% Lock
      targetTime = Math.min(Math.max(progress * vid.duration, 0), vid.duration);

      if (progress < 0.22) setMorphPhase('Globe');
      else if (progress < 0.48) setMorphPhase('Electricity');
      else if (progress < 0.73) setMorphPhase('Fire');
      else setMorphPhase('Lock');
    });

    // Smooth seeking loop (lerp damping) to prevent frame stutter
    const renderLoop = () => {
      const vid = videoRef.current;
      if (vid && !vid.seeking && vid.readyState >= 2) {
        const diff = targetTime - vid.currentTime;
        if (Math.abs(diff) > 0.02) {
          vid.currentTime += diff * 0.18;
        }
      }
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      unsubscribe();
      cancelAnimationFrame(animId);
    };
  }, [scrollYProgress, prefersReducedMotion]);

  const handleEnter = () => {
    if (onEnterCommandCenter) {
      onEnterCommandCenter();
    } else {
      startOperationsTransition('overview');
    }
  };

  const capabilities = ['CCTV', 'PIR SENSORS', 'MQ-2 DETECT', 'ACCESS CONTROL', 'ENERGY', 'IoT'];

  return (
    <section 
      ref={heroRef}
      id="hero"
      className="hero-viewport"
      style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(100px, 13vh, 140px) clamp(24px, 5vw, 64px) clamp(32px, 5vh, 48px)',
        zIndex: 2,
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    >
      {/* =========================================================================
          CENTRAL CINEMATIC 3D PARTICLE HERO OBJECT
          Plays authoritative 240-frame 10s Blender animation
          (Globe -> Electricity -> Fire -> Lock)
          Seamlessly blended on pure white canvas with zero container box
          ========================================================================= */}
      <motion.div
        className="hero-particle-stage"
        style={{
          width: 'clamp(360px, 46vw, 700px)',
          aspectRatio: '16/9',
          pointerEvents: 'none',
          zIndex: 1,
          scale: videoScale,
          opacity: videoOpacity,
        }}
      >
        {/* Soft atmospheric orange glow layer behind the particle object */}
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '85%',
            height: '85%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 130, 0, 0.16) 0%, rgba(255, 130, 0, 0.04) 45%, transparent 70%)',
            filter: 'blur(55px)',
            pointerEvents: 'none',
          }}
        />

        {/* Video element with smooth radial feathering mask */}
        <video
          ref={videoRef}
          src="/assets/hero/hero_particle_master_1080p.mp4"
          poster="/assets/hero/poster.png"
          muted
          playsInline
          autoPlay={prefersReducedMotion}
          loop={prefersReducedMotion}
          preload="auto"
          onLoadedData={() => setVideoLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            WebkitMaskImage: 'radial-gradient(ellipse 65% 65% at 50% 50%, #000 50%, rgba(0,0,0,0.85) 65%, transparent 80%)',
            maskImage: 'radial-gradient(ellipse 65% 65% at 50% 50%, #000 50%, rgba(0,0,0,0.85) 65%, transparent 80%)',
            opacity: videoLoaded ? 1 : 0.95,
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* Live morph status pill (restrained, technical, editorial) */}
        <div 
          style={{
            position: 'absolute',
            bottom: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(16, 24, 32, 0.08)',
            boxShadow: '0 4px 16px -2px rgba(16, 24, 32, 0.04)',
            fontSize: '0.688rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
            color: '#5B6871',
            pointerEvents: 'auto',
          }}
        >
          <span 
            style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              backgroundColor: '#FF8200',
              boxShadow: '0 0 8px #FF8200',
            }} 
          />
          <span>PHASE · {morphPhase}</span>
          <span style={{ opacity: 0.35 }}>|</span>
          <span style={{ fontSize: '0.625rem', opacity: 0.75 }}>3,200 PERSISTENT PARTICLES</span>
        </div>
      </motion.div>

      {/* =========================================================================
          HERO HEADLINE & BRANDING (Top / Upper Left Editorial Space)
          ========================================================================= */}
      <motion.div 
        className="hero-headline-block"
        style={{ 
          maxWidth: '820px', 
          zIndex: 3, 
          opacity: headlineOpacity,
          y: headlineY,
        }}
      >
        {/* Subtle Brand Eyebrow */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '18px',
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 600,
            color: '#FF8200',
          }}
        >
          <span>AUTONOMOUS SECURITY ARCHITECTURE</span>
        </div>

        {/* Primary Editorial Wordmark & Headline */}
        <h1
          style={{
            fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
            fontSize: 'clamp(3rem, 6.8vw, 6.2rem)',
            fontWeight: 300,
            letterSpacing: '-0.04em',
            lineHeight: 1.04,
            color: '#101820',
            margin: 0,
          }}
        >
          <span style={{ display: 'block', fontWeight: 700, letterSpacing: '-0.045em' }}>
            SMART CAMPUS
          </span>
          <span style={{ display: 'block', color: '#5B6871', fontSize: '0.72em', fontWeight: 300, marginTop: '8px' }}>
            Security that sees.
          </span>
          <span style={{ display: 'block', color: '#101820', fontSize: '0.72em', fontStyle: 'italic', fontFamily: "var(--font-signifier, 'Source Serif 4', Georgia, serif)", fontWeight: 400 }}>
            Safety that responds.
          </span>
        </h1>

        {/* Primary CTA (Refined, minimal capsule inspired by MDX) */}
        <div style={{ marginTop: '36px' }}>
          <button
            onClick={handleEnter}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '13px 26px',
              borderRadius: '9999px',
              backgroundColor: '#101820',
              color: '#FFFFFF',
              fontSize: '0.813rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: '1px solid #101820',
              cursor: 'pointer',
              boxShadow: '0 8px 20px -4px rgba(16, 24, 32, 0.2)',
              transition: 'all 0.22s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF8200';
              e.currentTarget.style.borderColor = '#FF8200';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(255, 130, 0, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#101820';
              e.currentTarget.style.borderColor = '#101820';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(16, 24, 32, 0.2)';
            }}
          >
            <span>ENTER COMMAND CENTER</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </motion.div>

      {/* =========================================================================
          HERO LOWER BAR (Editorial Copy & Floating Pill Tags inspired by MDX)
          ========================================================================= */}
      <div
        className="hero-lower-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '28px',
          zIndex: 3,
          borderTop: '1px solid rgba(16, 24, 32, 0.08)',
          paddingTop: '24px',
        }}
      >
        {/* Supporting text */}
        <p
          style={{
            maxWidth: '520px',
            fontSize: 'clamp(0.875rem, 1.1vw, 1.05rem)',
            color: '#5B6871',
            lineHeight: 1.6,
            margin: 0,
            fontWeight: 400,
          }}
        >
          A connected campus security and automation system bringing surveillance, sensors, access control, emergency response, and energy intelligence into one system.
        </p>

        {/* MDX-style Floating Category Tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {capabilities.map((cap) => (
            <span
              key={cap}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(16, 24, 32, 0.1)',
                fontSize: '0.688rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#5B6871',
                transition: 'all 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF8200';
                e.currentTarget.style.color = '#101820';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.1)';
                e.currentTarget.style.color = '#5B6871';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {cap}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
