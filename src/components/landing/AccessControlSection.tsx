import React from 'react';
import { KeyRound } from 'lucide-react';
import { InteractiveKeypad } from '../reactbits/InteractiveKeypad';

export const AccessControlSection: React.FC = () => {
  return (
    <section
      id="access-section"
      style={{
        position: 'relative',
        backgroundColor: '#050709',
        color: '#FFFFFF',
        padding: 'clamp(80px, 12vh, 160px) clamp(24px, 6vw, 96px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {/* Section Header */}
        <div style={{ marginBottom: 'clamp(48px, 8vh, 80px)', textAlign: 'center', maxWidth: '780px', margin: '0 auto clamp(48px, 8vh, 80px) auto' }}>
          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#FF8200',
              marginBottom: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <KeyRound size={14} color="#FF8200" />
            <span>PERIMETER & SOLENOID INTERLOCK DEMO</span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(2.4rem, 4.5vw, 4.2rem)',
              fontWeight: 450,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              margin: '0 0 16px 0',
              color: '#FFFFFF',
            }}
          >
            Sub-Second Access.
            <br />
            <span style={{ color: '#8C9BA5', fontWeight: 400 }}>Zero Compromise.</span>
          </h2>

          <p style={{ fontSize: '1rem', color: '#8C9BA5', lineHeight: 1.6, margin: 0 }}>
            Test the live industrial gate terminal below. Experience the instantaneous cryptographic verification and hardware solenoid trigger.
          </p>
        </div>

        {/* Industrial Interactive Terminal */}
        <InteractiveKeypad />
      </div>
    </section>
  );
};
