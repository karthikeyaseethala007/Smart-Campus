import React from 'react';
import { 
  Activity, 
  Lock, 
  Unlock, 
  Flame, 
  AlertTriangle, 
  Cpu, 
  Zap, 
  Radio, 
  ShieldAlert,
  Sliders
} from 'lucide-react';
import type { CampusEvent } from '@/types';
import { cn } from '@/lib/utils';

export interface NotificationItemProps {
  event: CampusEvent;
  className?: string;
  onClick?: () => void;
}

function getEventIcon(eventType: string, severity: CampusEvent['severity']) {
  const lower = eventType.toLowerCase();

  if (lower.includes('smoke') || lower.includes('fire') || lower.includes('alarm')) {
    return <Flame size={14} aria-hidden="true" />;
  }
  if (lower.includes('unauthorized') || lower.includes('breach') || lower.includes('denied') || lower.includes('lockout')) {
    return severity === 'critical' ? <ShieldAlert size={14} aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />;
  }
  if (lower.includes('granted') || lower.includes('barrier') || lower.includes('unlock')) {
    return <Unlock size={14} aria-hidden="true" />;
  }
  if (lower.includes('motion') || lower.includes('occupancy')) {
    return <Activity size={14} aria-hidden="true" />;
  }
  if (lower.includes('light') || lower.includes('fan') || lower.includes('relay') || lower.includes('energy') || lower.includes('hvac')) {
    return <Zap size={14} aria-hidden="true" />;
  }
  if (lower.includes('sensor') || lower.includes('ping') || lower.includes('offline') || lower.includes('device')) {
    return <Cpu size={14} aria-hidden="true" />;
  }
  if (lower.includes('reset') || lower.includes('baseline')) {
    return <Radio size={14} aria-hidden="true" />;
  }
  if (lower.includes('rule') || lower.includes('automation')) {
    return <Sliders size={14} aria-hidden="true" />;
  }

  if (severity === 'critical') return <AlertTriangle size={14} aria-hidden="true" />;
  if (severity === 'warning') return <AlertTriangle size={14} aria-hidden="true" />;
  return <Activity size={14} aria-hidden="true" />;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  event,
  className,
  onClick,
}) => {
  const isCritical = event.severity === 'critical';
  const isWarning = event.severity === 'warning';
  const isSimulation = event.source === 'simulation';

  // Surface and border styling adhering to Steep Serif Analytics design tokens
  let surfaceStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-mist-gray)',
    border: 'var(--border-hairline)',
  };

  let iconStyle: React.CSSProperties = {
    backgroundColor: 'rgba(23, 25, 28, 0.05)',
    color: 'var(--color-slate-gray)',
  };

  if (isCritical) {
    surfaceStyle = {
      backgroundColor: 'rgba(251, 225, 209, 0.45)', // Warm Blush Peach accent tint
      border: '1px solid rgba(93, 42, 26, 0.22)',
    };
    iconStyle = {
      backgroundColor: 'var(--color-blush-peach)',
      color: 'var(--color-sienna-brown)',
    };
  } else if (isWarning) {
    surfaceStyle = {
      backgroundColor: 'var(--color-mist-gray)',
      border: '1px solid rgba(93, 42, 26, 0.14)',
    };
    iconStyle = {
      backgroundColor: 'rgba(93, 42, 26, 0.08)',
      color: 'var(--color-sienna-brown)',
    };
  }

  return (
    <div
      role="article"
      aria-label={`${event.eventType} in ${event.location} at ${event.time}`}
      onClick={onClick}
      className={cn('smart-campus-notification-card', className)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '16px',
        boxSizing: 'border-box',
        width: '100%',
        minWidth: 0,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...surfaceStyle,
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '1px',
          ...iconStyle,
        }}
      >
        {getEventIcon(event.eventType, event.severity)}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top Header: Title, Simulation/Live Badge, Timestamp */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span
              style={{
                fontSize: '13.5px',
                fontWeight: 500,
                color: 'var(--color-ink-black)',
                letterSpacing: '-0.1px',
                wordBreak: 'break-word',
              }}
            >
              {event.eventType}
            </span>

            {isSimulation ? (
              <span
                className="pill-badge pill-badge-peach"
                style={{
                  fontSize: '9.5px',
                  padding: '1px 6px',
                  lineHeight: 1.2,
                  letterSpacing: '0.02em',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
                title="Simulation event: Hardware drill or simulated scenario"
              >
                Simulation
              </span>
            ) : (
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--color-ash-gray)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
                title="Live physical telemetry"
              >
                <span className="status-dot status-dot-safe" style={{ width: '4.5px', height: '4.5px' }} />
                LIVE
              </span>
            )}
          </div>

          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 500,
              fontFamily: 'var(--font-sohne)',
              color: 'var(--color-slate-gray)',
              flexShrink: 0,
              marginLeft: 'auto',
            }}
          >
            {event.time}
          </span>
        </div>

        {/* Location Subtext */}
        <div
          style={{
            fontSize: '12.5px',
            color: 'var(--color-slate-gray)',
            marginTop: '2px',
            letterSpacing: '-0.05px',
          }}
        >
          {event.location}
        </div>

        {/* Resulting Action */}
        {event.resultingAction && (
          <div
            style={{
              fontSize: '12px',
              color: isCritical || isWarning ? 'var(--color-sienna-brown)' : 'var(--color-slate-gray)',
              marginTop: '4px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'baseline',
              gap: '4px',
              lineHeight: 1.35,
              wordBreak: 'break-word',
            }}
          >
            <span style={{ color: 'var(--color-ash-gray)', flexShrink: 0 }}>↳</span>
            <span>{event.resultingAction}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
