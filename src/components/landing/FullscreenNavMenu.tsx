import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight } from 'lucide-react';
import type { NavigationTab } from '../../types';

export interface FullscreenNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onScrollSection: (sectionId: string) => void;
}

export const FullscreenNavMenu: React.FC<FullscreenNavMenuProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onScrollSection,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Exact Smart Campus editorial navigation items
  const menuItems: {
    num: string;
    label: string;
    action: () => void;
    category: string;
  }[] = [
    {
      num: '01',
      label: 'HOME',
      category: 'Public Editorial Overview',
      action: () => {
        onScrollSection('top');
        onClose();
      },
    },
    {
      num: '02',
      label: 'ACCESS CONTROL',
      category: 'Perimeter Doors, Gates & Security Matrix',
      action: () => {
        onNavigateTab('security');
        onClose();
      },
    },
    {
      num: '03',
      label: 'SURVEILLANCE',
      category: 'Neural Optical CCTV & Active Tracking',
      action: () => {
        onNavigateTab('monitoring');
        onClose();
      },
    },
    {
      num: '04',
      label: 'SENSOR MONITORING',
      category: 'PIR, Thermal, MQ-2 Gas & Acoustic Mesh',
      action: () => {
        onNavigateTab('monitoring');
        onClose();
      },
    },
    {
      num: '05',
      label: 'INCIDENTS',
      category: 'Real-Time Event Feed & Threat Logs',
      action: () => {
        onNavigateTab('incidents');
        onClose();
      },
    },
    {
      num: '06',
      label: 'EMERGENCY RESPONSE',
      category: 'Autonomous Lockdown & Evacuation Protocol',
      action: () => {
        onNavigateTab('safety');
        onClose();
      },
    },
    {
      num: '07',
      label: 'ENERGY MANAGEMENT',
      category: 'Smart Grid Load Balancing & Telemetry',
      action: () => {
        onNavigateTab('energy');
        onClose();
      },
    },
    {
      num: '08',
      label: 'IOT DEVICES',
      category: 'Hardware Nodes, Relays & Controllers',
      action: () => {
        onNavigateTab('devices');
        onClose();
      },
    },
    {
      num: '09',
      label: 'COMMAND CENTER',
      category: 'Unified Real-Time Operations Console',
      action: () => {
        onNavigateTab('overview');
        onClose();
      },
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#0c1015',
            color: '#f5f7fa',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'clamp(24px, 4vh, 40px) clamp(24px, 5vw, 64px)',
            overflowY: 'auto',
          }}
        >
          {/* Subtle Atmospheric Optical Ambient Background Glow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: 0.75,
              zIndex: 0,
              overflow: 'hidden',
              background: 'radial-gradient(ellipse at 80% 20%, rgba(255, 130, 0, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(40, 80, 120, 0.15) 0%, transparent 60%)',
            }}
          />

          {/* Top Bar: Wordmark + Close Button */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span
                style={{
                  fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                }}
              >
                SMART CAMPUS
              </span>
              <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    boxShadow: '0 0 8px #22c55e',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.688rem',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#8fa2b4',
                  }}
                >
                  SYSTEM DIRECTORY
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f5f7fa',
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              <span>CLOSE [ESC]</span>
              <X size={14} />
            </button>
          </div>

          {/* Center Links: Clean 2-Column Editorial Grid */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              maxWidth: '1240px',
              width: '100%',
              margin: '36px auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px 48px',
            }}
          >
            {menuItems.map((item, idx) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 + idx * 0.025, duration: 0.3 }}
                onClick={item.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.paddingLeft = '12px';
                  e.currentTarget.style.borderBottomColor = 'rgba(255, 130, 0, 0.5)';
                  const title = e.currentTarget.querySelector('.nav-label') as HTMLElement;
                  if (title) title.style.color = '#FF8200';
                  const arrow = e.currentTarget.querySelector('.nav-arrow') as HTMLElement;
                  if (arrow) {
                    arrow.style.color = '#FF8200';
                    arrow.style.transform = 'translate(2px, -2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.paddingLeft = '0';
                  e.currentTarget.style.borderBottomColor = 'rgba(255, 255, 255, 0.07)';
                  const title = e.currentTarget.querySelector('.nav-label') as HTMLElement;
                  if (title) title.style.color = '#ffffff';
                  const arrow = e.currentTarget.querySelector('.nav-arrow') as HTMLElement;
                  if (arrow) {
                    arrow.style.color = '#8fa2b4';
                    arrow.style.transform = 'translate(0, 0)';
                  }
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#FF8200',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {item.num}
                    </span>
                    <span
                      className="nav-label"
                      style={{
                        fontFamily: "var(--font-display, 'Outfit', 'Plus Jakarta Sans', sans-serif)",
                        fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)',
                        fontWeight: 450,
                        letterSpacing: '-0.02em',
                        color: '#ffffff',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#6e8294',
                      marginTop: '4px',
                      paddingLeft: '32px',
                    }}
                  >
                    {item.category}
                  </div>
                </div>

                <ArrowUpRight
                  className="nav-arrow"
                  size={18}
                  style={{ color: '#8fa2b4', transition: 'all 0.2s ease' }}
                />
              </motion.div>
            ))}
          </div>

          {/* Bottom Bar: Editorial Telemetry Metadata */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '18px',
              fontSize: '0.688rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#55697a',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <span>CONNECTED TO SMART CAMPUS KERNEL</span>
            <span>REAL-TIME SENSORS & PERIMETER SURVEILLANCE</span>
            <span>© 2026 SMART CAMPUS</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullscreenNavMenu;
