import React, { useState, useRef, useEffect } from 'react';
import type { NavigationTab } from '../types';
import { usePageTransition } from '../components/layout/PageTransition';
import { Atmosphere } from '../components/landing/Atmosphere';
import { Navbar } from '../components/landing/Navbar';
import { FullscreenNavMenu } from '../components/landing/FullscreenNavMenu';
import { LandingIntroLoader } from '../components/landing/LandingIntroLoader';
import { UnifiedPinnedLightStage } from '../components/landing/UnifiedPinnedLightStage';
import { CapabilityExperience } from '../components/landing/CapabilityExperience';
import { ContactEntryScene } from '../components/landing/ContactEntryScene';
import { DarkPreFooter } from '../components/landing/DarkPreFooter';
import { MdxFooter } from '../components/landing/MdxFooter';
import { useLandingMasterTimeline } from '../components/landing/useLandingMasterTimeline';
import { MasterTimelineProvider } from '../components/landing/LandingMasterTimelineContext';

export const LandingView: React.FC = () => {
  const { startOperationsTransition } = usePageTransition();
  const [isMenuOpen, setIsMenuOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.has('menu') || params.get('openMenu') === 'true';
    }
    return false;
  });
  const [showLoader, setShowLoader] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return !params.has('skipIntro');
    }
    return true;
  });

  const masterContainerRef = useRef<HTMLDivElement>(null);
  const timeline = useLandingMasterTimeline(masterContainerRef);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const scrollToVal = params.get('scrollTo');
      if (scrollToVal) {
        const y = parseInt(scrollToVal, 10);
        window.scrollTo(0, y);
      }
    }
  }, []);

  const handleScrollTo = (id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <MasterTimelineProvider timeline={timeline}>
      <div
        ref={masterContainerRef}
        style={{
          backgroundColor: 'transparent',
          minHeight: '100vh',
          color: '#101820',
          fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
          position: 'relative',
          overflowX: 'clip',
        }}
      >
        {/* 1. Minimal Editorial Preloader */}
        {showLoader && (
          <LandingIntroLoader onComplete={() => setShowLoader(false)} />
        )}

        {/* Atmospheric Ambient Lighting (Bound to Master Timeline) */}
        <Atmosphere timeline={timeline} />

        {/* 2. Minimal Persistent Fixed Navigation */}
        <Navbar
          isDark={timeline.isDarkTheme}
          onOpenMenu={() => setIsMenuOpen(true)}
          onEnterCommandCenter={() => startOperationsTransition('overview')}
        />

        {/* Fullscreen Overlay Navigation Menu */}
        <FullscreenNavMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onNavigateTab={(tab: NavigationTab) => startOperationsTransition(tab)}
          onScrollSection={handleScrollTo}
        />

        {/* UNIFIED MASTER SCROLL RUNWAY */}
        <main style={{ position: 'relative', width: '100%' }}>
          {/* =========================================================================
              PHASE 1: MASTER PINNED LIGHT STAGE (0.00 - 0.72)
              Runway height: 980vh (72% of master scroll)
              Spatially contains:
              - 0.00-0.24: Hero 3D Video Scrubbing + Left/Right Copy + Stage Ticks
              - 0.22-0.36: Editorial Statement 01 ("Every Signal Begins With a Response.")
              - 0.35-0.48: Editorial Statement 02 ("From Detection to Autonomous Action.")
              - 0.47-0.60: Cinematic Stage (Large dark rounded box + play trigger)
              - 0.59-0.72: Four-Pillar Floating Orbit (Center particle + 4 capsules)
              ========================================================================= */}
          <div
            id="light-master-runway"
            style={{
              position: 'relative',
              height: '980vh',
              width: '100%',
            }}
          >
            <UnifiedPinnedLightStage
              timeline={timeline}
              onEnterCommandCenter={() => startOperationsTransition('overview')}
            />
          </div>

          {/* =========================================================================
              PHASE 2: DARK TAKEOVER & EDITORIAL SEQUENCES (0.72 - 1.00)
              Physical cover sheet takes over screen with clamp(32px, 4vw, 56px) border radius
              - 0.72-0.85: Dark Visual Showcase (Interactive Category Pills & Project Cards)
              - 0.85-0.93: Contact / Entry (2-Column Editorial, Underlined Fields, Capsule CTA)
              - 0.93-0.97: Dark Pre-Footer (Full Black Editorial CTA + Certifications)
              - 0.97-1.00: Monolithic SMART CAMPUS Footer
              ========================================================================= */}
          <div
            id="dark-takeover-layer"
            style={{
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* SCENE 06 — DARK SHOWCASE */}
            <CapabilityExperience />

            {/* SCENE 07 — CONTACT / ENTRY */}
            <ContactEntryScene
              onEnter={() => startOperationsTransition('overview')}
            />

            {/* SCENE 08 — DARK PRE-FOOTER */}
            <DarkPreFooter />

            {/* SCENE 09 — MASSIVE FOOTER */}
            <MdxFooter
              onNavigateTab={(tab: NavigationTab) => startOperationsTransition(tab)}
            />
          </div>
        </main>
      </div>
    </MasterTimelineProvider>
  );
};

export default LandingView;
