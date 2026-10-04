import React from 'react';
import { ArrowUp, Shield } from 'lucide-react';
import type { NavigationTab } from '../../types';

interface MdxFooterProps {
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const MdxFooter: React.FC<MdxFooterProps> = ({ onNavigateTab }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navColumns = [
    {
      title: 'PLATFORM',
      links: [
        { label: 'Command Center', tab: 'overview' as NavigationTab },
        { label: 'Surveillance Mesh', tab: 'monitoring' as NavigationTab },
        { label: 'Access Control', tab: 'access' as NavigationTab },
        { label: 'Incident Desk', tab: 'incidents' as NavigationTab },
      ],
    },
    {
      title: 'SECURITY',
      links: [
        { label: 'Perimeter Defense', tab: 'security' as NavigationTab },
        { label: 'Biometrics & Keys', tab: 'access' as NavigationTab },
        { label: 'PIR Motion Matrix', tab: 'devices' as NavigationTab },
        { label: 'CCTV Neural AI', tab: 'monitoring' as NavigationTab },
      ],
    },
    {
      title: 'AUTOMATION',
      links: [
        { label: 'Energy Optimization', tab: 'energy' as NavigationTab },
        { label: 'Hazard & MQ-2 Gas', tab: 'safety' as NavigationTab },
        { label: 'Relay Subsystems', tab: 'automation' as NavigationTab },
        { label: 'IoT Mesh Nodes', tab: 'devices' as NavigationTab },
      ],
    },
    {
      title: 'SYSTEM',
      links: [
        { label: 'Telemetry Audit Log', tab: 'overview' as NavigationTab },
        { label: 'Role-Based Access', tab: 'users' as NavigationTab },
        { label: 'Hardware Protocols', tab: 'settings' as NavigationTab },
        { label: 'System Preferences', tab: 'settings' as NavigationTab },
      ],
    },
  ];

  return (
    <footer
      id="mdx-footer"
      style={{
        backgroundColor: '#050505',
        color: '#FFFFFF',
        position: 'relative',
        zIndex: 2,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(90px, 12vh, 140px) clamp(24px, 5vw, 64px) clamp(32px, 4vh, 48px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        {/* Top Row: Navigation Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'clamp(32px, 4vw, 56px)',
            marginBottom: 'clamp(80px, 12vh, 140px)',
          }}
        >
          {navColumns.map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontSize: '0.688rem',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginBottom: '20px',
                }}
              >
                {col.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => onNavigateTab && onNavigateTab(link.tab)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: 'clamp(0.938rem, 1.1vw, 1.05rem)',
                        fontWeight: 350,
                        color: 'rgba(255, 255, 255, 0.75)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'color 0.2s ease, transform 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Monolithic Giant SMART CAMPUS Wordmark (MDX-style massive screen-width typography) */}
        <div
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: 'clamp(24px, 4vh, 48px)',
            marginBottom: '32px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(3.6rem, 10.5vw, 11.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.045em',
              lineHeight: 0.88,
              color: '#FFFFFF',
              userSelect: 'none',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            SMART CAMPUS
          </div>
        </div>

        {/* Bottom Bar: Brand Tagline, Copyright, and SCROLL TOP Trigger */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={14} style={{ color: '#FF8200' }} />
            <span style={{ letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
              PROTECT. DETECT. RESPOND. AUTOMATE.
            </span>
          </div>

          <div>
            © 2026 SMART CAMPUS PLATFORM · ALL RIGHTS RESERVED
          </div>

          {/* Smooth Return to Top Button */}
          <button
            onClick={scrollToTop}
            style={{
              background: 'none',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '9999px',
              padding: '8px 20px',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FF8200';
              e.currentTarget.style.color = '#FF8200';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>SCROLL TOP</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default MdxFooter;
