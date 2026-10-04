import React from 'react';
import { Clock, ShieldCheck, Activity, Zap, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import { AnimatedList, AnimatedListItem } from '../ui/animated-list';

interface RecentActivityFeedProps {
  onViewAudit?: () => void;
  maxItems?: number;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  onViewAudit,
  maxItems = 5,
}) => {
  const { events, setActiveTab } = useAppState();

  const handleOpenAudit = () => {
    if (onViewAudit) {
      onViewAudit();
    } else {
      setActiveTab('incidents');
    }
  };

  const displayEvents = events.slice(0, maxItems);

  const getEventIcon = (eventType: string, severity: string) => {
    if (severity === 'critical') return <AlertTriangle size={13} color="#FF0000" />;
    if (severity === 'warning') return <AlertTriangle size={13} color="#FF8200" />;
    if (eventType.toLowerCase().includes('access')) return <ShieldCheck size={13} color="#22c55e" />;
    if (eventType.toLowerCase().includes('energy') || eventType.toLowerCase().includes('lights')) return <Zap size={13} color="#FF8200" />;
    if (eventType.toLowerCase().includes('gas')) return <CheckCircle2 size={13} color="#22c55e" />;
    return <Activity size={13} color="#101820" />;
  };

  return (
    <div
      role="region"
      aria-label="Recent Operational Activity Feed"
      style={{
        backgroundColor: 'var(--color-paper-white, #FFFFFF)',
        borderRadius: '16px',
        padding: '28px 32px',
        border: '1px solid rgba(16, 24, 32, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(16, 24, 32, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#5B6871',
              marginBottom: '4px',
            }}
          >
            <Clock size={13} color="#101820" />
            <span>RECENT ACTIVITY</span>
            <span style={{ color: 'rgba(16, 24, 32, 0.25)' }}>·</span>
            <span>OPERATIONAL TIMELINE</span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: '1.375rem',
              fontWeight: 600,
              color: '#101820',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Live Activity Feed
          </h2>
        </div>

        <button
          onClick={handleOpenAudit}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '0.688rem',
            fontWeight: 600,
            fontFamily: "var(--font-mono, monospace)",
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#5B6871',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#101820')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#5B6871')}
        >
          <span>AUDIT LEDGER</span>
          <ArrowRight size={12} color="#FF8200" />
        </button>
      </div>

      {/* Animated Activity Items */}
      <AnimatedList delay={0} className="w-full">
        {displayEvents.map((evt) => {
          const isWarning = evt.severity === 'warning';
          const isCritical = evt.severity === 'critical';

          return (
            <AnimatedListItem key={evt.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  backgroundColor: isCritical
                    ? 'rgba(255, 0, 0, 0.03)'
                    : isWarning
                    ? 'rgba(255, 130, 0, 0.03)'
                    : '#FCFCFD',
                  borderRadius: '10px',
                  border: isCritical
                    ? '1px solid rgba(255, 0, 0, 0.25)'
                    : isWarning
                    ? '1px solid rgba(255, 130, 0, 0.2)'
                    : '1px solid rgba(16, 24, 32, 0.06)',
                  gap: '16px',
                  transition: 'background-color 0.15s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {/* Left: Time + Icon + Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  {/* Timestamp */}
                  <span
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#101820',
                      letterSpacing: '0.04em',
                      width: '68px',
                      flexShrink: 0,
                    }}
                  >
                    {evt.time.replace(' AM', '').replace(' PM', '')}
                  </span>

                  {/* Icon Circle */}
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: isCritical
                        ? 'rgba(255, 0, 0, 0.1)'
                        : isWarning
                        ? 'rgba(255, 130, 0, 0.1)'
                        : 'rgba(16, 24, 32, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getEventIcon(evt.eventType, evt.severity)}
                  </div>

                  {/* Event Text & Location */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span
                        style={{
                          fontFamily: "var(--font-display, sans-serif)",
                          fontSize: '0.813rem',
                          fontWeight: 600,
                          color: '#101820',
                        }}
                      >
                        {evt.eventType}
                      </span>
                      <span style={{ color: '#8C8C8C', fontSize: '0.75rem' }}>·</span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: '0.688rem',
                          color: '#5B6871',
                        }}
                      >
                        {evt.location}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.688rem',
                        color: '#8A8F8D',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {evt.resultingAction}
                    </span>
                  </div>
                </div>

                {/* Right: Operational Status Pill */}
                <div style={{ flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: isCritical
                        ? 'rgba(255, 0, 0, 0.08)'
                        : isWarning
                        ? 'rgba(255, 130, 0, 0.08)'
                        : 'rgba(34, 197, 94, 0.08)',
                      color: isCritical ? '#FF0000' : isWarning ? '#FF8200' : '#22c55e',
                    }}
                  >
                    {isCritical ? 'ALERT' : isWarning ? 'ACTION LOGGED' : 'NOMINAL'}
                  </span>
                </div>
              </div>
            </AnimatedListItem>
          );
        })}
      </AnimatedList>
    </div>
  );
};
