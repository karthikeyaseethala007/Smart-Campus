import React, { useState } from 'react';
import { Clock, ShieldCheck, Activity, Zap, CheckCircle2, AlertTriangle, ArrowRight, FileText } from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import { AnimatedList, AnimatedListItem } from '../ui/animated-list';

interface RecentActivityFeedProps {
  onViewAudit?: () => void;
  maxItems?: number;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  onViewAudit,
  maxItems = 6,
}) => {
  const { events, auditLog, setActiveTab } = useAppState();
  const [activeMode, setActiveMode] = useState<'activity' | 'audit'>('activity');

  const handleOpenAudit = () => {
    if (onViewAudit) {
      onViewAudit();
    } else {
      setActiveTab('incidents');
    }
  };

  const displayEvents = events.slice(0, maxItems);
  const displayAudits = auditLog.slice(0, maxItems);

  const getEventIcon = (eventType: string, severity: string) => {
    if (severity === 'critical') return <AlertTriangle size={13} color="#FF0000" />;
    if (severity === 'warning') return <AlertTriangle size={13} color="#FF8200" />;
    if (eventType.toLowerCase().includes('access') || eventType.toLowerCase().includes('pin')) return <ShieldCheck size={13} color="#22c55e" />;
    if (eventType.toLowerCase().includes('energy') || eventType.toLowerCase().includes('lights')) return <Zap size={13} color="#FF8200" />;
    if (eventType.toLowerCase().includes('gas') || eventType.toLowerCase().includes('sensor')) return <CheckCircle2 size={13} color="#22c55e" />;
    return <Activity size={13} color="var(--color-ink-black)" />;
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'SUCCESS':
        return { bg: 'rgba(34, 197, 94, 0.08)', color: '#22c55e', text: 'SUCCESS' };
      case 'DENIED':
        return { bg: 'rgba(255, 130, 0, 0.08)', color: '#FF8200', text: 'DENIED' };
      case 'ESCALATED':
        return { bg: 'rgba(255, 0, 0, 0.08)', color: '#FF0000', text: 'ESCALATED' };
      default:
        return { bg: 'rgba(16, 24, 32, 0.06)', color: 'var(--color-slate-gray)', text: result };
    }
  };

  return (
    <div
      role="region"
      aria-label="Recent Operational Activity & Compliance Audit Feed"
      style={{
        backgroundColor: 'var(--color-paper-white, #FFFFFF)',
        borderRadius: '16px',
        padding: '28px 32px',
        border: '1px solid rgba(16, 24, 32, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(16, 24, 32, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      {/* Header with Mode Toggle: Activity vs Audit */}
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
              color: 'var(--color-slate-gray)',
              marginBottom: '4px',
            }}
          >
            <Clock size={13} color="var(--color-ink-black)" />
            <span>OPERATIONAL TIMELINE</span>
            <span style={{ color: 'var(--color-slate-gray)', opacity: 0.5 }}>·</span>
            <span>REALTIME TELEMETRY</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
            <button
              onClick={() => setActiveMode('activity')}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0',
                borderBottom: activeMode === 'activity' ? '2px solid #FF8200' : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: '1.25rem',
                fontWeight: activeMode === 'activity' ? 700 : 500,
                color: activeMode === 'activity' ? 'var(--color-ink-black)' : 'var(--color-slate-gray)',
                transition: 'all 0.15s ease',
              }}
            >
              Live Activity Feed
            </button>

            <span style={{ color: 'var(--color-slate-gray)', opacity: 0.4, fontSize: '1.25rem' }}>/</span>

            <button
              onClick={() => setActiveMode('audit')}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0',
                borderBottom: activeMode === 'audit' ? '2px solid #FF8200' : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: '1.25rem',
                fontWeight: activeMode === 'audit' ? 700 : 500,
                color: activeMode === 'audit' ? 'var(--color-ink-black)' : 'var(--color-slate-gray)',
                transition: 'all 0.15s ease',
              }}
            >
              Compliance Audit Trail
            </button>
          </div>
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
            color: 'var(--color-slate-gray)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-ink-black)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-slate-gray)')}
        >
          <span>FULL AUDIT LEDGER</span>
          <ArrowRight size={12} color="#FF8200" />
        </button>
      </div>

      {/* MODE 1: LIVE ACTIVITY FEED (What is happening) */}
      {activeMode === 'activity' && (
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
                        color: 'var(--color-ink-black)',
                        letterSpacing: '0.04em',
                        width: '72px',
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
                            color: 'var(--color-ink-black)',
                          }}
                        >
                          {evt.eventType}
                        </span>
                        <span style={{ color: 'var(--color-slate-gray)', opacity: 0.5, fontSize: '0.75rem' }}>·</span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: '0.688rem',
                            color: 'var(--color-slate-gray)',
                          }}
                        >
                          {evt.location}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '0.688rem',
                          color: 'var(--color-slate-gray)',
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

                  {/* Right: Status Pill */}
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
      )}

      {/* MODE 2: COMPLIANCE AUDIT TRAIL (Who did what, when, from where) */}
      {activeMode === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayAudits.map((rec) => {
            const badge = getResultBadge(rec.result);

            return (
              <div
                key={rec.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  backgroundColor: '#FCFCFD',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 24, 32, 0.06)',
                  gap: '16px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {/* Left: Timestamp + Actor + Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-ink-black)',
                      letterSpacing: '0.04em',
                      width: '72px',
                      flexShrink: 0,
                    }}
                  >
                    {rec.timestamp}
                  </span>

                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(16, 24, 32, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={13} color="var(--color-ink-black)" />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: '0.688rem',
                          fontWeight: 700,
                          color: '#FF8200',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {rec.actor}
                      </span>
                      <span style={{ color: '#8C8C8C', fontSize: '0.75rem' }}>·</span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: '0.688rem',
                          color: 'var(--color-slate-gray)',
                        }}
                      >
                        ACTION: {rec.action}
                      </span>
                      {rec.zone && (
                        <>
                          <span style={{ color: '#8C8C8C', fontSize: '0.75rem' }}>·</span>
                          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', color: '#8C8C8C' }}>
                            {rec.zone}
                          </span>
                        </>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: '0.688rem',
                        color: 'var(--color-slate-gray)',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {rec.details}
                    </span>
                  </div>
                </div>

                {/* Right: Result Tag */}
                <div style={{ flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {badge.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
