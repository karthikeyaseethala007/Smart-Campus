import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';

export const DarkPreFooter: React.FC = () => {
  const { startOperationsTransition } = usePageTransition();

  const certifications = [
    { code: 'ISO 27001', label: 'Information Security' },
    { code: 'SOC 2 TYPE II', label: 'Continuous Audit' },
    { code: 'UL 2900-2', label: 'Cybersecurity for IoT' },
    { code: 'NIST SP 800-53', label: 'Federal Security Controls' },
  ];

  return (
    <section
      id="dark-prefooter"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#070707',
        color: '#FFFFFF',
        minHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(100px, 14vh, 160px) clamp(24px, 5vw, 64px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Background Soft Amber Bloom */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 'clamp(500px, 60vw, 850px)',
          height: 'clamp(500px, 60vw, 850px)',
          background: 'radial-gradient(circle, rgba(255, 130, 0, 0.07) 0%, transparent 70%)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          gap: 'clamp(48px, 8vw, 120px)',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Left Column: Huge Headline & Direct CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(2.8rem, 5.5vw, 5.2rem)',
              fontWeight: 450,
              letterSpacing: '-0.04em',
              lineHeight: 1.04,
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            FROM SIGNAL
            <br />
            <span>TO <span style={{ fontStyle: 'italic', color: '#adc2d6' }}>RESPONSE.</span></span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(1rem, 1.25vw, 1.2rem)',
              color: 'rgba(255, 255, 255, 0.65)',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: '460px',
              fontWeight: 400,
            }}
          >
            A connected campus should turn every signal into action. Zero latency from sensor detection to autonomous containment.
          </p>

          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => startOperationsTransition('overview')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 32px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                color: '#070707',
                fontSize: '0.813rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px -4px rgba(255, 255, 255, 0.2)',
                transition: 'all 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF8200';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(255, 130, 0, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.color = '#070707';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(255, 255, 255, 0.2)';
              }}
            >
              <span>OPEN COMMAND CENTER</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Column: Enterprise Certified Architecture & Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.75rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: '#FF8200',
                marginBottom: '16px',
              }}
            >
              <ShieldCheck size={16} />
              <span>ENTERPRISE CERTIFIED ARCHITECTURE</span>
            </div>

            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.1vw, 1.05rem)',
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Validated across mission-critical higher education campuses, autonomous research facilities, and municipal safety centers.
            </p>
          </div>

          {/* Minimalist Certification Badges (Matching MDX Awwwards, Webby, CSSDA row) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '24px 32px',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              paddingTop: '24px',
            }}
          >
            {certifications.map((cert) => (
              <div
                key={cert.code}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: '#FFFFFF',
                  }}
                >
                  {cert.code}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 400,
                    letterSpacing: '0.04em',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {cert.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DarkPreFooter;
