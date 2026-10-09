import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { AnimatedNumber } from '../reactbits/AnimatedNumber';
import { useAppState } from '../../services/stateContext';

interface HeroOperationsBandProps {
  systemHealthPct?: number;
  lockedDoorsCount?: number;
  totalDoorsCount?: number;
  onlineDevicesCount?: number;
  totalDevicesCount?: number;
  totalDemandKw?: string;
  isEmergency?: boolean;
}

export const HeroOperationsBand: React.FC<HeroOperationsBandProps> = ({
  isEmergency: propEmergency,
}) => {
  const { campusStatus, incidents, devices, isSystemDegraded, setIsSystemDegraded } = useAppState();

  const isEmergency = propEmergency !== undefined ? propEmergency : campusStatus === 'EMERGENCY';
  const openIncidentsCount = incidents.filter((i) => i.status !== 'resolved').length;
  const activeDevicesCount = devices.filter((d) => d.status === 'online').length || 24;

  return (
    <section
      aria-label="Campus Command Center Hero Operations"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        flexWrap: 'wrap',
        gap: '32px',
        padding: '36px 40px',
        backgroundColor: 'var(--color-paper-white, #FFFFFF)',
        borderRadius: '16px',
        border: '1px solid rgba(16, 24, 32, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(16, 24, 32, 0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Industrial accent strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          backgroundColor: isSystemDegraded ? '#FF8200' : isEmergency ? '#FF0000' : '#FF8200',
        }}
      />

      {/* LEFT: Command Center Intro */}
      <div style={{ maxWidth: '580px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: '0.688rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--color-slate-gray)',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isSystemDegraded ? '#FF8200' : isEmergency ? '#FF0000' : '#22c55e',
              boxShadow: isSystemDegraded
                ? '0 0 8px #FF8200'
                : isEmergency
                ? '0 0 8px #FF0000'
                : '0 0 8px #22c55e',
            }}
          />
          <span>COMMAND CENTER</span>
          <span style={{ color: 'var(--color-slate-gray)', opacity: 0.5 }}>·</span>
          <span>CAMPUS INTELLIGENCE</span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display, 'Outfit', 'Plus Jakarta Sans', sans-serif)",
            fontSize: 'clamp(2.1rem, 3.4vw, 3.1rem)',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            color: 'var(--color-ink-black)',
            margin: '0 0 16px 0',
          }}
        >
          Campus intelligence,
          <br />
          <span style={{ color: 'var(--color-slate-gray)', fontWeight: 500 }}>in one operational view.</span>
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'var(--color-slate-gray)',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: '500px',
            fontWeight: 400,
          }}
        >
          Everything happening across the campus, connected to one decision surface.
        </p>

        {isSystemDegraded && (
          <div
            style={{
              marginTop: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 130, 0, 0.08)',
              border: '1px solid rgba(255, 130, 0, 0.3)',
              color: '#FF8200',
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.75rem',
            }}
          >
            <AlertTriangle size={14} color="#FF8200" />
            <span>Realtime connection unavailable. Showing cached state.</span>
            <button
              onClick={() => setIsSystemDegraded(false)}
              style={{
                marginLeft: '8px',
                padding: '3px 10px',
                borderRadius: '4px',
                backgroundColor: '#FF8200',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.688rem',
              }}
            >
              RECONNECT
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: System Status + 4 Technical Metrics */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: '320px',
          paddingLeft: '24px',
          borderLeft: '1px solid rgba(16, 24, 32, 0.08)',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#8C8C8C',
              marginBottom: '6px',
            }}
          >
            SYSTEM STATUS
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isSystemDegraded ? '#FF8200' : isEmergency ? '#FF0000' : '#22c55e',
                boxShadow: isSystemDegraded
                  ? '0 0 10px #FF8200'
                  : isEmergency
                  ? '0 0 10px #FF0000'
                  : '0 0 10px #22c55e',
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: '1.375rem',
                fontWeight: 700,
                color: isSystemDegraded ? '#FF8200' : isEmergency ? '#FF0000' : 'var(--color-ink-black)',
                letterSpacing: '-0.02em',
              }}
            >
              {isSystemDegraded
                ? 'SYSTEM DEGRADED'
                : isEmergency
                ? 'EMERGENCY PROTOCOL'
                : 'ALL SYSTEMS OPERATIONAL'}
            </span>
          </div>
        </div>

        {/* 4 Technical Indicators with Count Up (Section 2 Layout) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px 24px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(16, 24, 32, 0.08)',
          }}
        >
          {/* Signal Networks */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span
                style={{
                  fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--color-ink-black)',
                  lineHeight: 1,
                }}
              >
                <AnimatedNumber value={6} decimals={0} />
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-slate-gray)',
                marginTop: '4px',
              }}
            >
              SIGNAL NETWORKS
            </span>
          </div>

          {/* Active Devices */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span
                style={{
                  fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--color-ink-black)',
                  lineHeight: 1,
                }}
              >
                <AnimatedNumber value={activeDevicesCount} decimals={0} />
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-slate-gray)',
                marginTop: '4px',
              }}
            >
              ACTIVE DEVICES
            </span>
          </div>

          {/* Open Incidents */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span
                style={{
                  fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: openIncidentsCount > 0 ? '#FF8200' : '#22c55e',
                  lineHeight: 1,
                }}
              >
                {openIncidentsCount < 10 ? `0${openIncidentsCount}` : openIncidentsCount}
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-slate-gray)',
                marginTop: '4px',
              }}
            >
              OPEN INCIDENTS
            </span>
          </div>

          {/* System Uptime */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span
                style={{
                  fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--color-ink-black)',
                  lineHeight: 1,
                }}
              >
                <AnimatedNumber value={isSystemDegraded ? 97.45 : 99.98} decimals={2} suffix="%" />
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-slate-gray)',
                marginTop: '4px',
              }}
            >
              SYSTEM UPTIME
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
