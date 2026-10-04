import React from 'react';
import type { NavigationTab } from '../../types';
import { usePageTransition } from '../layout/PageTransition';

interface FooterProps {
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  const { startOperationsTransition } = usePageTransition();

  const handleNav = (tab: NavigationTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      startOperationsTransition(tab);
    }
  };

  return (
    <footer
      id="footer"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#000000',
        color: '#FFFFFF',
        padding: 'clamp(80px, 12vh, 140px) clamp(24px, 5vw, 64px) clamp(40px, 6vh, 60px)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top: Large Custom Smart Campus Wordmark Treatment */}
        <div style={{ marginBottom: 'clamp(48px, 8vh, 80px)' }}>
          <div 
            style={{
              fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
              fontSize: 'clamp(3.2rem, 11vw, 9.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.05em',
              lineHeight: 0.9,
              color: '#FFFFFF',
              userSelect: 'none',
              textTransform: 'uppercase',
            }}
          >
            SMART CAMPUS
          </div>
          <div 
            style={{
              marginTop: '16px',
              fontSize: 'clamp(0.813rem, 1.1vw, 1.05rem)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#8A8F8D',
              fontWeight: 500,
            }}
          >
            AUTONOMOUS PERIMETER · CONNECTED SAFETY · PREDICTIVE AUTOMATION
          </div>
        </div>

        {/* Middle: 3 Navigation Groups */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            paddingTop: '48px',
            marginBottom: '64px',
          }}
        >
          {/* Group 1: PLATFORM */}
          <div>
            <div 
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#FF8200',
                marginBottom: '20px',
              }}
            >
              PLATFORM
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Command Center', tab: 'overview' as NavigationTab },
                { label: 'Access Control', tab: 'security' as NavigationTab },
                { label: 'Surveillance', tab: 'monitoring' as NavigationTab },
                { label: 'Sensors', tab: 'devices' as NavigationTab },
                { label: 'Incidents', tab: 'incidents' as NavigationTab },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => handleNav(item.tab)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.72)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'color 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.72)')}
                  >
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Group 2: AUTOMATION */}
          <div>
            <div 
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#FF8200',
                marginBottom: '20px',
              }}
            >
              AUTOMATION
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Emergency Response', tab: 'safety' as NavigationTab },
                { label: 'Energy Optimization', tab: 'energy' as NavigationTab },
                { label: 'IoT Devices', tab: 'automation' as NavigationTab },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => handleNav(item.tab)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.72)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.72)')}
                  >
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Group 3: SYSTEM */}
          <div>
            <div 
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#FF8200',
                marginBottom: '20px',
              }}
            >
              SYSTEM
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Audit Log', tab: 'incidents' as NavigationTab },
                { label: 'Users & Roles', tab: 'users' as NavigationTab },
                { label: 'Settings', tab: 'settings' as NavigationTab },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => handleNav(item.tab)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.72)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.72)')}
                  >
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Signature Line */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '0.75rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#8A8F8D',
          }}
        >
          {/* Exact Brand Line */}
          <div style={{ color: '#FFFFFF', fontWeight: 600, letterSpacing: '0.18em' }}>
            <span>PROTECT.</span>{' '}
            <span style={{ color: '#FF8200' }}>DETECT.</span>{' '}
            <span>RESPOND.</span>{' '}
            <span style={{ color: '#FF8200' }}>AUTOMATE.</span>
          </div>

          <div>
            © {new Date().getFullYear()} SMART CAMPUS PLATFORM · ALL RIGHTS RESERVED
          </div>
        </div>
      </div>
    </footer>
  );
};
