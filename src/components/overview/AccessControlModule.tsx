import React from 'react';
import { Lock, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import { AnimatedNumber } from '../reactbits/AnimatedNumber';

interface AccessControlModuleProps {
  onNavigate?: () => void;
}

export const AccessControlModule: React.FC<AccessControlModuleProps> = ({ onNavigate }) => {
  const { doors, setActiveTab } = useAppState();

  const handleOpenAccess = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      setActiveTab('security');
    }
  };

  const lockedCount = doors.filter((d) => d.lockStatus === 'locked').length;
  const totalDoors = doors.length;

  return (
    <div
      onClick={handleOpenAccess}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleOpenAccess()}
      style={{
        backgroundColor: 'var(--color-paper-white, #FFFFFF)',
        borderRadius: '16px',
        padding: '24px 28px',
        border: '1px solid rgba(16, 24, 32, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(16, 24, 32, 0.04)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 28px -4px rgba(16, 24, 32, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(16, 24, 32, 0.04)';
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 24, 32, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={14} color="#101820" />
          </div>
          <div>
            <span
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.688rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#5B6871',
              }}
            >
              ACCESS CONTROL
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8C8C8C', fontSize: '0.75rem', fontFamily: "var(--font-mono, monospace)" }}>
          <span>{lockedCount}/{totalDoors} SECURED</span>
          <ChevronRight size={13} />
        </div>
      </div>

      {/* Main KPI Row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
        <div>
          <div
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(2.6rem, 3.8vw, 3.4rem)',
              fontWeight: 700,
              lineHeight: 1,
              color: '#101820',
              letterSpacing: '-0.04em',
            }}
          >
            <AnimatedNumber value={128} decimals={0} />
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#5B6871',
              marginTop: '6px',
            }}
          >
            AUTHORIZED TODAY
          </div>
        </div>

        {/* Small Metrics Cluster */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '10px 16px',
            backgroundColor: '#FCFCFD',
            borderRadius: '10px',
            border: '1px solid rgba(16, 24, 32, 0.06)',
          }}
        >
          {/* Attempts */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1.125rem', fontWeight: 600, color: '#101820', lineHeight: 1 }}>
              8
            </span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.625rem', color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
              Attempts
            </span>
          </div>

          <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(16, 24, 32, 0.08)' }} />

          {/* Denied */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1.125rem', fontWeight: 600, color: '#FF8200', lineHeight: 1 }}>
              2
            </span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.625rem', color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
              Denied
            </span>
          </div>

          <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(16, 24, 32, 0.08)' }} />

          {/* Alert */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1.125rem', fontWeight: 600, color: '#FF0000', lineHeight: 1 }}>
              1
            </span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.625rem', color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
              Alert
            </span>
          </div>
        </div>
      </div>

      {/* Compact Visual Indicator: Distribution Segment Bar & Solenoid Portals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            height: '6px',
            borderRadius: '9999px',
            overflow: 'hidden',
            backgroundColor: 'rgba(16, 24, 32, 0.06)',
            gap: '2px',
          }}
        >
          {/* Authorized 128 ratio */}
          <div style={{ flex: 128, backgroundColor: '#101820', borderRadius: '9999px 0 0 9999px' }} title="128 Authorized" />
          {/* Denied 2 ratio */}
          <div style={{ flex: 4, backgroundColor: '#FF8200' }} title="2 Denied" />
          {/* Alert 1 ratio */}
          <div style={{ flex: 2, backgroundColor: '#FF0000', borderRadius: '0 9999px 9999px 0' }} title="1 Alert" />
        </div>

        {/* Portal status micro dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.688rem', fontFamily: "var(--font-mono, monospace)", color: '#5B6871', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={12} color="#22c55e" />
            <span>SOLENOIDS ACTIVE · KEYPAD PIN: 1234</span>
          </div>
          <span style={{ color: '#FF8200', fontWeight: 600 }}>MANAGE ACCESS →</span>
        </div>
      </div>
    </div>
  );
};
