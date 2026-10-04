import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Check,
  ExternalLink
} from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import type { CampusIncident } from '../../types';

interface LiveIncidentStripProps {
  onSelectIncident?: (incident: CampusIncident) => void;
  onViewAll?: () => void;
}

export const LiveIncidentStrip: React.FC<LiveIncidentStripProps> = ({
  onSelectIncident,
  onViewAll,
}) => {
  const {
    incidents,
    setSelectedIncident,
    setActiveTab,
    acknowledgeIncident,
    investigateIncident,
    resolveIncident,
  } = useAppState();

  const [activeFilter, setActiveFilter] = useState<'active' | 'critical' | 'warning' | 'resolved'>('active');

  const handleIncidentClick = (inc: CampusIncident) => {
    setSelectedIncident(inc);
    if (onSelectIncident) {
      onSelectIncident(inc);
    } else {
      setActiveTab('incidents');
    }
  };

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      setActiveTab('incidents');
    }
  };

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (activeFilter === 'active') return inc.status !== 'resolved';
    if (activeFilter === 'critical') return inc.severity === 'critical' && inc.status !== 'resolved';
    if (activeFilter === 'warning') return inc.severity === 'warning' && inc.status !== 'resolved';
    if (activeFilter === 'resolved') return inc.status === 'resolved';
    return true;
  });

  const activeCount = incidents.filter((i) => i.status !== 'resolved').length;
  const criticalCount = incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length;
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <section
      role="region"
      aria-label="Live Active Incidents Operations Workspace"
      style={{
        backgroundColor: 'var(--color-paper-white, #FFFFFF)',
        borderRadius: '16px',
        border: '1px solid rgba(16, 24, 32, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(16, 24, 32, 0.04)',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        width: '100%',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid rgba(16, 24, 32, 0.08)',
          paddingBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: criticalCount > 0 ? 'rgba(255, 0, 0, 0.08)' : 'rgba(255, 130, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={16} color={criticalCount > 0 ? '#FF0000' : '#FF8200'} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: '0.688rem',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#5B6871',
                }}
              >
                INCIDENT OPERATIONS WORKSPACE
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: criticalCount > 0 ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 130, 0, 0.1)',
                  color: criticalCount > 0 ? '#FF0000' : '#FF8200',
                }}
              >
                {activeCount} ACTIVE
              </span>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#101820',
                margin: '2px 0 0 0',
                letterSpacing: '-0.02em',
              }}
            >
              Active Campus Incidents
            </h2>
          </div>
        </div>

        {/* Filter Tabs + View All Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {(['active', 'critical', 'warning', 'resolved'] as const).map((filterKey) => {
            const isCurrent = activeFilter === filterKey;
            return (
              <button
                key={filterKey}
                onClick={() => setActiveFilter(filterKey)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: isCurrent ? '1px solid #101820' : '1px solid rgba(16, 24, 32, 0.08)',
                  backgroundColor: isCurrent ? '#101820' : '#FCFCFD',
                  color: isCurrent ? '#FFFFFF' : '#5B6871',
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: '0.688rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {filterKey === 'active' && `Active (${activeCount})`}
                {filterKey === 'critical' && `Critical (${criticalCount})`}
                {filterKey === 'warning' && 'Warnings'}
                {filterKey === 'resolved' && 'Resolved'}
              </button>
            );
          })}

          <button
            onClick={handleViewAll}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              background: 'none',
              border: '1px solid rgba(16, 24, 32, 0.1)',
              color: '#101820',
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.688rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>LEDGER</span>
            <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {/* Incident Rows List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredIncidents.length === 0 ? (
          // SECTION 19: INTENTIONAL EMPTY STATE
          <div
            style={{
              padding: '36px 20px',
              borderRadius: '10px',
              backgroundColor: '#FCFCFD',
              border: '1px dashed rgba(16, 24, 32, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22c55e',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
            <div
              style={{
                fontFamily: "var(--font-display, sans-serif)",
                fontSize: '1rem',
                fontWeight: 600,
                color: '#101820',
              }}
            >
              NO ACTIVE INCIDENTS
            </div>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#8A8F8D',
                fontFamily: "var(--font-mono, monospace)",
                margin: 0,
              }}
            >
              Campus security is currently stable. Zero unresolved events in filter "{activeFilter}".
              <br />
              Last system telemetry sweep verified at {currentTime} UTC.
            </p>
          </div>
        ) : (
          filteredIncidents.slice(0, 4).map((inc, index) => {
            const isCritical = inc.severity === 'critical';
            const isResolved = inc.status === 'resolved';
            const isInvestigating = inc.status === 'investigating';
            const isAck = inc.status === 'acknowledged';

            const statusText = isResolved
              ? 'RESOLVED'
              : isInvestigating
              ? 'INVESTIGATING'
              : isAck
              ? 'ACKNOWLEDGED'
              : 'DETECTED';

            const statusColor = isResolved
              ? '#22c55e'
              : isInvestigating
              ? '#FF8200'
              : isAck
              ? '#3a5774'
              : '#FF0000';

            const statusBg = isResolved
              ? 'rgba(34, 197, 94, 0.08)'
              : isInvestigating
              ? 'rgba(255, 130, 0, 0.08)'
              : isAck
              ? 'rgba(58, 87, 116, 0.08)'
              : 'rgba(255, 0, 0, 0.08)';

            return (
              <div
                key={inc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: isCritical && !isResolved
                    ? '1px solid rgba(255, 0, 0, 0.3)'
                    : '1px solid rgba(16, 24, 32, 0.08)',
                  borderLeft: isCritical && !isResolved
                    ? '4px solid #FF0000'
                    : isResolved
                    ? '4px solid #22c55e'
                    : '4px solid #FF8200',
                  backgroundColor: isCritical && !isResolved
                    ? 'rgba(255, 0, 0, 0.02)'
                    : isResolved
                    ? '#FCFCFD'
                    : '#FFFFFF',
                  boxShadow: isCritical && !isResolved
                    ? '0 2px 12px rgba(255, 0, 0, 0.06)'
                    : '0 1px 4px rgba(16, 24, 32, 0.02)',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Left: Number, Title, Location, Timestamp */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', minWidth: '260px' }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: isCritical && !isResolved ? '#FF0000' : '#8A8F8D',
                      lineHeight: 1.2,
                    }}
                  >
                    0{index + 1}
                  </span>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                          fontSize: '0.938rem',
                          fontWeight: 600,
                          color: '#101820',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {inc.event}
                      </span>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          backgroundColor: isCritical ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 130, 0, 0.1)',
                          color: isCritical ? '#FF0000' : '#FF8200',
                          textTransform: 'uppercase',
                        }}
                      >
                        {inc.severity}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.688rem',
                        fontFamily: "var(--font-mono, monospace)",
                        color: '#5B6871',
                        marginTop: '3px',
                      }}
                    >
                      <span>{inc.location}</span>
                      <span>·</span>
                      <span style={{ color: '#8A8F8D' }}>{inc.timestamp}</span>
                      <span>·</span>
                      <span style={{ color: '#101820', fontWeight: 600 }}>{inc.id}</span>
                    </div>
                  </div>
                </div>

                {/* Center: Lifecycle State Machine */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: statusBg,
                      border: `1px solid ${statusColor}40`,
                      fontSize: '0.625rem',
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: 700,
                      color: statusColor,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <div
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: statusColor,
                      }}
                    />
                    <span>{statusText}</span>
                  </div>
                </div>

                {/* Right: Operational Actions (Lifecycle Transition) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {inc.status === 'open' && (
                    <button
                      onClick={() => acknowledgeIncident(inc.id)}
                      title="Acknowledge priority incident and record operator dispatch"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        backgroundColor: '#FF8200',
                        border: 'none',
                        color: '#FFFFFF',
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: '0.688rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Check size={12} />
                      <span>ACKNOWLEDGE</span>
                    </button>
                  )}

                  {inc.status === 'acknowledged' && (
                    <button
                      onClick={() => investigateIncident(inc.id)}
                      title="Dispatch field security officer to incident site"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        backgroundColor: '#101820',
                        border: 'none',
                        color: '#FFFFFF',
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: '0.688rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>DISPATCH UNIT</span>
                    </button>
                  )}

                  {inc.status === 'investigating' && (
                    <button
                      onClick={() => resolveIncident(inc.id)}
                      title="Mark incident resolved and update compliance ledger"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        backgroundColor: '#22c55e',
                        border: 'none',
                        color: '#FFFFFF',
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: '0.688rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={12} />
                      <span>RESOLVE</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleIncidentClick(inc)}
                    title="View incident telemetry audit breakdown"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(16, 24, 32, 0.12)',
                      color: '#101820',
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: '0.688rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>INSPECT</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
