import React from 'react';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';

export interface FooterRedesignProps {
  onScrollTo?: (id: string) => void;
}

export const FooterRedesign: React.FC<FooterRedesignProps> = ({ onScrollTo }) => {
  const { startOperationsTransition } = usePageTransition();

  const handleScrollTop = () => {
    if (onScrollTo) {
      onScrollTo('top');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'HOME', action: () => handleScrollTop() },
    { label: 'SYSTEM', action: () => (onScrollTo ? onScrollTo('system-section') : document.getElementById('system-section')?.scrollIntoView({ behavior: 'smooth' })) },
    { label: 'SECURITY', action: () => (onScrollTo ? onScrollTo('surveillance-section') : document.getElementById('surveillance-section')?.scrollIntoView({ behavior: 'smooth' })) },
    { label: 'AUTOMATION', action: () => (onScrollTo ? onScrollTo('access-section') : document.getElementById('access-section')?.scrollIntoView({ behavior: 'smooth' })) },
    { label: 'COMMAND CENTER', action: () => startOperationsTransition('overview'), isExternal: true },
  ];

  return (
    <footer
      id="site-footer"
      style={{
        position: 'relative',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        padding: 'clamp(96px, 12vh, 160px) clamp(24px, 6vw, 96px) clamp(48px, 6vh, 80px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* Top Control Bar: Status + Navigation + Scroll To Top */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '32px',
            paddingBottom: 'clamp(48px, 8vh, 80px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Small System Status with subtle orange indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#FF8200',
                boxShadow: '0 0 10px rgba(255, 130, 0, 0.8)',
                display: 'inline-block',
                animation: 'pulse 2.5s infinite',
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.75rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                fontWeight: 500,
              }}
            >
              SYSTEM OPERATIONAL
            </span>
          </div>

          {/* Minimal Navigation */}
          <nav
            aria-label="Footer Navigation"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 'clamp(20px, 3vw, 40px)',
            }}
          >
            {navLinks.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: '0.813rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: item.isExternal ? '#FF8200' : 'rgba(255, 255, 255, 0.65)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = item.isExternal ? '#FF8200' : 'rgba(255, 255, 255, 0.65)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>{item.label}</span>
                {item.isExternal && <ArrowUpRight size={13} style={{ color: '#FF8200' }} />}
              </button>
            ))}
          </nav>

          {/* Scroll to Top Interaction */}
          <button
            onClick={handleScrollTop}
            aria-label="Scroll to top"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '9999px',
              padding: '10px 20px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#FFFFFF',
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              transition: 'background-color 0.25s ease, border-color 0.25s ease, transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 130, 0, 0.12)';
              e.currentTarget.style.borderColor = '#FF8200';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>BACK TO TOP</span>
            <ArrowUp size={14} color="#FF8200" />
          </button>
        </div>

        {/* Massive Editorial Wordmark */}
        <div
          style={{
            padding: 'clamp(64px, 12vh, 120px) 0 clamp(48px, 8vh, 80px) 0',
            userSelect: 'none',
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(4.2rem, 16vw, 15rem)',
              fontWeight: 500,
              letterSpacing: '-0.05em',
              lineHeight: 0.88,
              margin: 0,
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.95)' }}>SMART</span>
            <span
              style={{
                color: 'transparent',
                WebkitTextStroke: '1px rgba(255, 255, 255, 0.35)',
                transition: 'color 0.3s ease, -webkit-text-stroke 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.webkitTextStroke = '0px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'transparent';
                e.currentTarget.style.webkitTextStroke = '1px rgba(255, 255, 255, 0.35)';
              }}
            >
              CAMPUS
            </span>
          </h2>
        </div>

        {/* Bottom Legal & Security Specification */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '28px',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: '0.688rem',
            letterSpacing: '0.12em',
            color: 'rgba(255, 255, 255, 0.45)',
            textTransform: 'uppercase',
          }}
        >
          <div>SMART CAMPUS OS · AUTONOMIC PHYSICAL ARCHITECTURE</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span>SECURE PROTOCOL SHA-256</span>
            <span>ZERO TRUST RUNTIME</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterRedesign;
