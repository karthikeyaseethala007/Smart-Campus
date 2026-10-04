import React, { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';

interface ContactEntrySceneProps {
  onEnter?: () => void;
}

export const ContactEntryScene: React.FC<ContactEntrySceneProps> = ({ onEnter }) => {
  const { startOperationsTransition } = usePageTransition();
  const [selectedSubsystem, setSelectedSubsystem] = useState('SECURITY');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onEnter) {
      onEnter();
    } else {
      startOperationsTransition('overview');
    }
  };

  return (
    <section
      id="contact-entry"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#F7F7F9',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(80px, 10vh, 120px) clamp(24px, 5vw, 64px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Background Soft Optical Atmosphere (contact-ell) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.85,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <img
          src="/assets/atmosphere/contact-ell.avif"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Centered Large Rounded Editorial Container Panel (Matching MDX Ground Truth) */}
      <div
        style={{
          maxWidth: '1240px',
          width: '100%',
          margin: '0 auto',
          backgroundColor: '#FFFFFF',
          borderRadius: 'clamp(28px, 3.5vw, 44px)',
          padding: 'clamp(44px, 5.5vw, 72px)',
          boxShadow: '0 24px 70px -16px rgba(16, 24, 32, 0.08)',
          border: '1px solid rgba(16, 24, 32, 0.07)',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: 'clamp(48px, 6vw, 84px)',
            alignItems: 'start',
          }}
        >
          {/* =========================================================================
              LEFT COLUMN: EDITORIAL HEADLINE & CONTACT INFO
              ========================================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: '#FF8200',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#FF8200',
                }}
              />
              <span>GET STARTED</span>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: 'clamp(2.6rem, 4.4vw, 4.4rem)',
                fontWeight: 450,
                letterSpacing: '-0.035em',
                lineHeight: 1.05,
                color: '#101820',
                margin: 0,
              }}
            >
              BUILD THE
              <br />
              CONNECTED
              <br />
              CAMPUS
            </h2>

            <div style={{ width: '48px', height: '1px', backgroundColor: 'rgba(16, 24, 32, 0.15)' }} />

            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.1vw, 1.05rem)',
                color: '#5B6871',
                lineHeight: 1.6,
                margin: 0,
                maxWidth: '440px',
                fontWeight: 400,
              }}
            >
              A connected campus where surveillance, access control, sensors, emergency response and automation work as one system.
            </p>

            <div style={{ marginTop: '16px' }}>
              <a
                href="mailto:ops@smartcampus.internal"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.938rem',
                  color: '#101820',
                  textDecoration: 'none',
                  fontWeight: 500,
                  borderBottom: '1px solid rgba(16, 24, 32, 0.25)',
                  paddingBottom: '2px',
                  transition: 'border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF8200';
                  e.currentTarget.style.color = '#FF8200';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.25)';
                  e.currentTarget.style.color = '#101820';
                }}
              >
                <Mail size={16} />
                <span>ops@smartcampus.internal</span>
              </a>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: UNDERLINED EDITORIAL FORM
              ========================================================================= */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: 'clamp(1.8rem, 2.4vw, 2.4rem)',
                fontWeight: 400,
                letterSpacing: '-0.025em',
                color: '#101820',
                margin: '0 0 4px 0',
              }}
            >
              Let's connect
            </h3>

            {/* Row 1: Full name & Organization */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '24px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#8C97A0',
                    marginBottom: '8px',
                  }}
                >
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1.5px solid rgba(16, 24, 32, 0.16)',
                    padding: '8px 0',
                    fontSize: '0.95rem',
                    color: '#101820',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#FF8200'; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(16, 24, 32, 0.16)'; }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#8C97A0',
                    marginBottom: '8px',
                  }}
                >
                  Organization
                </label>
                <input
                  type="text"
                  placeholder="University / Facility"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1.5px solid rgba(16, 24, 32, 0.16)',
                    padding: '8px 0',
                    fontSize: '0.95rem',
                    color: '#101820',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#FF8200'; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(16, 24, 32, 0.16)'; }}
                />
              </div>
            </div>

            {/* Row 2: Email & Phone */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '24px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#8C97A0',
                    marginBottom: '8px',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  placeholder="name@campus.edu"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1.5px solid rgba(16, 24, 32, 0.16)',
                    padding: '8px 0',
                    fontSize: '0.95rem',
                    color: '#101820',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#FF8200'; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(16, 24, 32, 0.16)'; }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#8C97A0',
                    marginBottom: '8px',
                  }}
                >
                  Phone
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1.5px solid rgba(16, 24, 32, 0.16)',
                    padding: '8px 0',
                    fontSize: '0.95rem',
                    color: '#101820',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#FF8200'; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(16, 24, 32, 0.16)'; }}
                />
              </div>
            </div>

            {/* Row 3: Interest Pills */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#8C97A0',
                  marginBottom: '10px',
                }}
              >
                I'm interested in
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {['Security', 'Safety', 'Automation', 'Energy', 'Command Center'].map((sub) => {
                  const isActive = selectedSubsystem === sub.toUpperCase();
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubsystem(sub.toUpperCase())}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '9999px',
                        backgroundColor: isActive ? '#101820' : 'rgba(16, 24, 32, 0.04)',
                        color: isActive ? '#FFFFFF' : '#4A5560',
                        border: isActive ? '1px solid #101820' : '1px solid rgba(16, 24, 32, 0.12)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Message Field */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#8C97A0',
                  marginBottom: '8px',
                }}
              >
                Tell us about your campus deployment
              </label>
              <input
                type="text"
                placeholder="Zone count, existing CCTV or BMS systems..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1.5px solid rgba(16, 24, 32, 0.16)',
                  padding: '8px 0',
                  fontSize: '0.95rem',
                  color: '#101820',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#FF8200'; }}
                onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(16, 24, 32, 0.16)'; }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '16px 32px',
                borderRadius: '9999px',
                backgroundColor: '#101820',
                color: '#FFFFFF',
                fontSize: '0.813rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 8px 24px -4px rgba(16, 24, 32, 0.25)',
                transition: 'all 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
                marginTop: '12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF8200';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(255, 130, 0, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#101820';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(16, 24, 32, 0.25)';
              }}
            >
              <span>CONNECT TO COMMAND CENTER</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactEntryScene;
