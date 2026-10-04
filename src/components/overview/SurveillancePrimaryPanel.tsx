import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Video, Camera } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

interface SurveillancePrimaryPanelProps {
  onExpand?: () => void;
}

export const SurveillancePrimaryPanel: React.FC<SurveillancePrimaryPanelProps> = ({ onExpand }) => {
  const { cameras, setActiveTab } = useAppState();

  const mainGateCam = cameras.find((c) => c.id === 'CAM-01') || {
    id: 'CAM-01',
    name: 'Main Gate & Entry Barrier',
    location: 'Perimeter North Post',
    status: 'live',
    resolution: '1920x1080',
    fps: 30,
    streamUrl: '/assets/cctv_main_gate.jpg',
  };

  const handleOpenMonitoring = () => {
    if (onExpand) {
      onExpand();
    } else {
      setActiveTab('monitoring');
    }
  };

  return (
    <div
      onClick={handleOpenMonitoring}
      role="region"
      aria-label="Primary Surveillance Feed - Main Gate"
      style={{
        position: 'relative',
        backgroundColor: '#101820',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 30px rgba(16, 24, 32, 0.16)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '440px',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 24, 32, 0.24)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(16, 24, 32, 0.16)';
      }}
    >
      {/* CCTV VIEWPORT SURFACE */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          minHeight: '360px',
          overflow: 'hidden',
          backgroundColor: '#0a0f14',
        }}
      >
        {/* Background Image / Stream */}
        <img
          src={mainGateCam.streamUrl || '/assets/cctv_main_gate.jpg'}
          alt="Main Gate CCTV Optical Surveillance Stream"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: 0.92,
            filter: 'contrast(1.04) brightness(0.96)',
            transition: 'transform 0.4s ease',
          }}
        />

        {/* Subtle Architectural Scanlines overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(16, 24, 32, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
            backgroundSize: '100% 4px',
            pointerEvents: 'none',
            opacity: 0.45,
          }}
        />

        {/* Corner Reticle Brackets (Technical Industrial Control HUD) */}
        {/* Top-Left Reticle */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            width: '20px',
            height: '20px',
            borderTop: '2px solid rgba(255, 255, 255, 0.65)',
            borderLeft: '2px solid rgba(255, 255, 255, 0.65)',
            pointerEvents: 'none',
          }}
        />
        {/* Top-Right Reticle */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '20px',
            height: '20px',
            borderTop: '2px solid rgba(255, 255, 255, 0.65)',
            borderRight: '2px solid rgba(255, 255, 255, 0.65)',
            pointerEvents: 'none',
          }}
        />
        {/* Bottom-Left Reticle */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            width: '20px',
            height: '20px',
            borderBottom: '2px solid rgba(255, 255, 255, 0.65)',
            borderLeft: '2px solid rgba(255, 255, 255, 0.65)',
            pointerEvents: 'none',
          }}
        />
        {/* Bottom-Right Reticle */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            width: '20px',
            height: '20px',
            borderBottom: '2px solid rgba(255, 255, 255, 0.65)',
            borderRight: '2px solid rgba(255, 255, 255, 0.65)',
            pointerEvents: 'none',
          }}
        />

        {/* TOP OVERLAY HUD: CAMERA METADATA & TELEMETRY */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '24px',
            right: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {/* Camera ID & Name Tag */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(16, 24, 32, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Camera size={13} color="#FF8200" />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                }}
              >
                MAIN GATE
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: '0.688rem',
                  fontWeight: 600,
                  color: '#8A8F8D',
                }}
              >
                CAM-01
              </span>
            </div>
          </div>

          {/* Right Status Badges: LIVE + REC + 1080p */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* LIVE Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(16, 24, 32, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(34, 197, 94, 0.4)',
              }}
            >
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 6px #22c55e',
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: '0.688rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#22c55e',
                }}
              >
                LIVE
              </span>
            </div>

            {/* REC Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(16, 24, 32, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 0, 0, 0.4)',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#FF0000',
                  boxShadow: '0 0 6px #FF0000',
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: '0.688rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#FF0000',
                }}
              >
                REC
              </span>
            </div>

            {/* Resolution Tag */}
            <div
              style={{
                backgroundColor: 'rgba(16, 24, 32, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.688rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#EFFFFF',
              }}
            >
              1080p · 30 FPS
            </div>
          </div>
        </div>

        {/* BOTTOM OVERLAY HUD: TECHNICAL STATUS STRIP */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '24px',
            right: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.688rem',
              color: 'rgba(255, 255, 255, 0.75)',
              backgroundColor: 'rgba(16, 24, 32, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span>NORTH GATE ENTRY BARRIER #1</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
            <span>LATENCY: 14ms</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
            <span style={{ color: '#22c55e' }}>ENCRYPTED TLS 1.3</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(16, 24, 32, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.688rem',
              color: '#FF8200',
              fontWeight: 600,
            }}
          >
            <span>SURVEILLANCE GRID</span>
            <Maximize2 size={11} color="#FF8200" />
          </div>
        </div>
      </div>

      {/* COMPACT INDUSTRIAL SUB-FRAME FOOTER */}
      <div
        style={{
          padding: '12px 20px',
          backgroundColor: '#101820',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#8A8F8D',
          fontSize: '0.75rem',
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Video size={13} color="#FF8200" />
          <span style={{ color: '#FCFCFD', fontWeight: 600 }}>PRIMARY SURVEILLANCE FEED</span>
          <span style={{ color: '#5B6871' }}>·</span>
          <span>AUTONOMOUS PTZ LOCK</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8A8F8D' }}>
          <span>CLICK TO OPEN FULL 7-CHANNEL MATRIX</span>
          <span style={{ color: '#FF8200' }}>→</span>
        </div>
      </div>
    </div>
  );
};
