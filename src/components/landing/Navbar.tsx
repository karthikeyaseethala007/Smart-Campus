import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';

interface NavbarProps {
  onOpenMenu?: () => void;
  onEnterCommandCenter?: () => void;
  isDark?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMenu, onEnterCommandCenter, isDark: isDarkProp }) => {
  const { startOperationsTransition } = usePageTransition();
  const [isDarkSection, setIsDarkSection] = useState(false);
  const activeDark = isDarkProp !== undefined ? isDarkProp : isDarkSection;

  useEffect(() => {
    const handleScroll = () => {
      // Check if navbar (at top ~40px) is over dark sections
      const navY = 40;
      const darkSections = [
        document.getElementById('surveillance-section'),
        document.getElementById('access-section'),
        document.getElementById('sensor-intelligence-section'),
        document.getElementById('incident-response-section'),
        document.getElementById('dark-takeover-section'),
        document.getElementById('site-footer'),
      ];
      
      let dark = false;
      for (const el of darkSections) {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= navY && rect.bottom >= navY) {
            dark = true;
            break;
          }
        }
      }
      setIsDarkSection(dark);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnter = () => {
    if (onEnterCommandCenter) {
      onEnterCommandCenter();
    } else {
      startOperationsTransition('overview');
    }
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'clamp(20px, 3vh, 32px) clamp(24px, 5vw, 64px)',
        backgroundColor: 'transparent',
        pointerEvents: 'auto',
      }}
    >
      {/* Left: Brand Wordmark + Status Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: "var(--font-display, 'Outfit', sans-serif)",
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: activeDark ? '#FFFFFF' : '#101820',
            userSelect: 'none',
            transition: 'color 0.25s ease',
          }}
        >
          SMART CAMPUS
        </button>

        {/* Vertical Separator */}
        <div 
          style={{ 
            width: '1px', 
            height: '14px', 
            backgroundColor: activeDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(16, 24, 32, 0.2)',
            transition: 'background-color 0.25s ease',
          }} 
          className="hidden-mobile"
        />

        {/* Subtle Status Indicator */}
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.688rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: activeDark ? '#adc2d6' : '#5B6871',
            transition: 'color 0.25s ease',
          }}
          className="hidden-mobile"
        >
          <span 
            style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              backgroundColor: '#22c55e',
              boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)',
            }} 
          />
          <span>OPERATIONAL</span>
        </div>
      </div>

      {/* Right Controls: Command Center Link | Separator | MDX 2-line Hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button
          onClick={handleEnter}
          className="hidden-mobile"
          style={{
            background: 'none',
            border: 'none',
            color: activeDark ? '#FFFFFF' : '#101820',
            fontSize: '0.813rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: '6px 0',
            transition: 'color 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FF8200';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = activeDark ? '#FFFFFF' : '#101820';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span>COMMAND CENTER</span>
          <ArrowUpRight size={14} style={{ color: '#FF8200' }} />
        </button>

        <div 
          className="hidden-mobile"
          style={{ 
            width: '1px', 
            height: '14px', 
            backgroundColor: activeDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(16, 24, 32, 0.2)',
            transition: 'background-color 0.25s ease',
          }} 
        />

        {/* Minimal 2-Line Hamburger Menu Button (MDX Signature) */}
        <button
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 4px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '5px',
            width: '32px',
          }}
          onMouseEnter={(e) => {
            const lines = e.currentTarget.querySelectorAll('span');
            lines.forEach((l) => (l.style.backgroundColor = '#FF8200'));
          }}
          onMouseLeave={(e) => {
            const lines = e.currentTarget.querySelectorAll('span');
            lines.forEach((l) => (l.style.backgroundColor = activeDark ? '#FFFFFF' : '#101820'));
          }}
        >
          <span 
            style={{ 
              display: 'block', 
              width: '18px', 
              height: '1.5px', 
              backgroundColor: activeDark ? '#FFFFFF' : '#101820',
              transition: 'background-color 0.2s ease, width 0.2s ease',
            }} 
          />
          <span 
            style={{ 
              display: 'block', 
              width: '26px', 
              height: '1.5px', 
              backgroundColor: activeDark ? '#FFFFFF' : '#101820',
              transition: 'background-color 0.2s ease, width 0.2s ease',
            }} 
          />
        </button>
      </div>
    </header>
  );
};
export default Navbar;
