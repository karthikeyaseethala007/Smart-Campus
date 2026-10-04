import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';

interface ShowcaseTile {
  id: string;
  category: 'SECURITY' | 'SAFETY' | 'AUTOMATION' | 'ENERGY';
  categoryTag: string;
  title: string;
  description: string;
  imageSrc: string;
  aspectRatio: string;
  spanCol?: number;
}

export const CapabilityExperience: React.FC = () => {
  const { startOperationsTransition } = usePageTransition();
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = [
    'ALL',
    'SECURITY',
    'SAFETY',
    'AUTOMATION',
    'ENERGY',
  ];

  const tiles: ShowcaseTile[] = [
    {
      id: 'surveillance-mesh',
      category: 'SECURITY',
      categoryTag: 'SURVEILLANCE / NEURAL VISION',
      title: 'Neural CCTV Optical Mesh',
      description: 'Encrypted optical tracking and occupancy intelligence continuously verifying 24 campus zones.',
      imageSrc: '/assets/trail/optical-surveillance.jpg',
      aspectRatio: '16/10',
    },
    {
      id: 'access-interlock',
      category: 'SECURITY',
      categoryTag: 'ACCESS CONTROL / BIOMETRICS',
      title: 'Decentralized Perimeter Interlock',
      description: 'Continuous biometric validation and portal locking with sub-second cryptographic authentication.',
      imageSrc: '/assets/trail/keypad-control.jpg',
      aspectRatio: '4/3',
    },
    {
      id: 'hazard-sensor',
      category: 'SAFETY',
      categoryTag: 'EMERGENCY / ATMOSPHERIC SENSORS',
      title: 'Hazard Containment & Aerodynamic Matrix',
      description: 'Sub-second atmospheric threshold evaluation with automated physical damper isolation.',
      imageSrc: '/assets/trail/safety-sensor.jpg',
      aspectRatio: '4/3',
    },
    {
      id: 'energy-grid',
      category: 'ENERGY',
      categoryTag: 'ENERGY / AUTOMATED RELAYS',
      title: 'Adaptive Substation Grid Regulation',
      description: 'Dynamic bus relay telemetry eliminating standby consumption across vacant lecture halls.',
      imageSrc: '/assets/trail/energy-automation.jpg',
      aspectRatio: '16/10',
    },
    {
      id: 'campus-core',
      category: 'AUTOMATION',
      categoryTag: 'CORE SYSTEM / AUTONOMOUS OS',
      title: 'Unified Command Center Infrastructure',
      description: 'Distributed sensor telemetry convergence uniting 127 physical subsystems into one autonomic system.',
      imageSrc: '/assets/trail/campus-architecture.jpg',
      aspectRatio: '16/9',
      spanCol: 2,
    },
  ];

  const filteredTiles = activeCategory === 'ALL'
    ? tiles
    : tiles.filter((tile) => tile.category === activeCategory);

  return (
    <section
      id="dark-showcase"
      style={{
        position: 'relative',
        backgroundColor: '#070707',
        color: '#FFFFFF',
        minHeight: '100vh',
        borderTopLeftRadius: 'clamp(28px, 4vw, 56px)',
        borderTopRightRadius: 'clamp(28px, 4vw, 56px)',
        marginTop: '-32px',
        boxShadow: '0 -30px 80px rgba(0, 0, 0, 0.55)',
        padding: 'clamp(96px, 12vh, 140px) clamp(24px, 5vw, 64px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      {/* Dark Takeover Atmospheric Ambient Light */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(1200px, 90vw)',
          height: '600px',
          background: 'radial-gradient(ellipse at top, rgba(255, 130, 0, 0.08) 0%, rgba(255, 130, 0, 0.015) 50%, transparent 75%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* =========================================================================
            HEADER & CATEGORY FILTER PILLS (Matching MDX 21.5s: Our Craft, Your Expression.)
            ========================================================================= */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            marginBottom: 'clamp(48px, 6vh, 72px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '24px',
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                  fontSize: 'clamp(2.4rem, 4.4vw, 4.2rem)',
                  fontWeight: 450,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.08,
                  color: '#FFFFFF',
                  margin: 0,
                }}
              >
                Our Architecture, Your Protection.
              </h2>
            </div>

            <button
              onClick={() => startOperationsTransition('overview')}
              style={{
                background: 'none',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '9999px',
                padding: '8px 20px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF8200';
                e.currentTarget.style.color = '#FF8200';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              }}
            >
              <span>VIEW ALL SUBSYSTEMS</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Category Filter Pills (Exact MDX: ALL, SECURITY, SAFETY, AUTOMATION, ENERGY) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? '#FF8200' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)',
                    border: isActive ? '1px solid #FF8200' : '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                    }
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            EDITORIAL VISUAL SHOWCASE ASYMMETRICAL GRID (Original Architectural Imagery)
            ========================================================================= */}
        <motion.div
          layout
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))',
            gap: 'clamp(36px, 5vw, 56px)',
          }}
        >
          <AnimatePresence>
            {filteredTiles.map((tile) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                key={tile.id}
                onClick={() => startOperationsTransition('overview')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  cursor: 'pointer',
                  gridColumn: tile.spanCol && tile.spanCol > 1 ? '1 / -1' : undefined,
                }}
              >
                {/* Large Media Region with Architectural Aspect Ratio */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: tile.aspectRatio,
                    backgroundColor: '#121212',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 24px 56px -12px rgba(0, 0, 0, 0.6)',
                    transition: 'all 0.35s cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 130, 0, 0.45)';
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    const img = e.currentTarget.querySelector('img');
                    if (img) img.style.transform = 'scale(1.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    const img = e.currentTarget.querySelector('img');
                    if (img) img.style.transform = 'scale(1)';
                  }}
                >
                  <img
                    src={tile.imageSrc}
                    alt={tile.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'contrast(1.04) brightness(0.92)',
                      transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                    }}
                  />

                  {/* Subtle inner gradient shade */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(7, 7, 7, 0.4) 0%, transparent 60%)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>

                {/* Media Metadata Row: Category & Title with Orange Arrow */}
                <div>
                  <div
                    style={{
                      fontSize: '0.688rem',
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgba(255, 255, 255, 0.45)',
                      marginBottom: '8px',
                    }}
                  >
                    {tile.categoryTag}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                      fontSize: 'clamp(1.3rem, 1.9vw, 1.75rem)',
                      fontWeight: 450,
                      letterSpacing: '-0.025em',
                      color: '#FFFFFF',
                      marginBottom: '6px',
                    }}
                  >
                    <span>{tile.title}</span>
                    <ArrowUpRight size={18} color="#FF8200" />
                  </div>

                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'rgba(255, 255, 255, 0.55)',
                      lineHeight: 1.5,
                      margin: 0,
                      maxWidth: '560px',
                    }}
                  >
                    {tile.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default CapabilityExperience;
