import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, ShieldAlert } from 'lucide-react';
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
  const { incidents, setSelectedIncident, setActiveTab } = useAppState();

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

  // Sort: critical first, then warning, then resolved/info
  const sortedIncidents = [...incidents].sort((a, b) => {
    const score = (inc: CampusIncident) => {
      if (inc.status === 'resolved') return 0;
      if (inc.severity === 'critical') return 3;
      if (inc.severity === 'warning') return 2;
      return 1;
    };
    return score(b) - score(a);
  });

  const displayIncidents = sortedIncidents.slice(0, 3);

  return (
    <div
      aria-label="Live Incidents Priority Operational Strip"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={14} color="#FF8200" />
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
            LIVE INCIDENTS
          </span>
          <span
            style={{
              fontSize: '0.688rem',
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: incidents.some((i) => i.severity === 'critical' && i.status === 'open')
                ? 'rgba(255, 0, 0, 0.1)'
                : 'rgba(255, 130, 0, 0.1)',
              color: incidents.some((i) => i.severity === 'critical' && i.status === 'open')
                ? '#FF0000'
                : '#FF8200',
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {incidents.filter((i) => i.status === 'open').length} ACTIVE
          </span>
        </div>

        <button
          onClick={handleViewAll}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 6px',
            cursor: 'pointer',
            fontSize: '0.688rem',
            fontWeight: 600,
            fontFamily: "var(--font-mono, monospace)",
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#5B6871',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#101820')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#5B6871')}
        >
          <span>INCIDENT LEDGER</span>
          <ChevronRight size={12} />
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {displayIncidents.map((inc) => {
          const isCritical = inc.severity === 'critical' && inc.status !== 'resolved';
          const isWarning = inc.severity === 'warning' && inc.status !== 'resolved';
          const isResolved = inc.status === 'resolved';

          const tagColor = isCritical ? '#FF0000' : isWarning ? '#FF8200' : '#22c55e';
          const tagBg = isCritical
            ? 'rgba(255, 0, 0, 0.08)'
            : isWarning
            ? 'rgba(255, 130, 0, 0.08)'
            : 'rgba(34, 197, 94, 0.08)';
          const borderHighlight = isCritical
            ? '1px solid rgba(255, 0, 0, 0.35)'
            : isWarning
            ? '1px solid rgba(255, 130, 0, 0.25)'
            : '1px solid rgba(16, 24, 32, 0.08)';

          const tagLabel = isResolved
            ? 'RESOLVED'
            : isCritical
            ? 'CRITICAL'
            : isWarning
            ? 'WARNING'
            : 'MONITORED';

          return (
            <div
              key={inc.id}
              onClick={() => handleIncidentClick(inc)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleIncidentClick(inc)}
              style={{
                backgroundColor: 'var(--color-paper-white, #FFFFFF)',
                border: borderHighlight,
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                boxShadow: isCritical
                  ? '0 2px 10px rgba(255, 0, 0, 0.06)'
                  : '0 2px 8px rgba(16, 24, 32, 0.03)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 24, 32, 0.07)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isCritical
                  ? '0 2px 10px rgba(255, 0, 0, 0.06)'
                  : '0 2px 8px rgba(16, 24, 32, 0.03)';
              }}
            >
              {/* Left Color Bar indicator */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '3px',
                  backgroundColor: tagColor,
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, paddingLeft: '4px' }}>
                {/* Status Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: tagColor,
                    backgroundColor: tagBg,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    flexShrink: 0,
                  }}
                >
                  {isCritical ? (
                    <AlertCircle size={10} color={tagColor} />
                  ) : isWarning ? (
                    <AlertTriangle size={10} color={tagColor} />
                  ) : (
                    <CheckCircle2 size={10} color={tagColor} />
                  )}
                  <span>[ {tagLabel} ]</span>
                </div>

                {/* Event & Location Title */}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                      fontSize: '0.813rem',
                      fontWeight: 600,
                      color: '#101820',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.25,
                    }}
                  >
                    {inc.event}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: '0.688rem',
                      color: '#5B6871',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px',
                    }}
                  >
                    {inc.location}
                  </span>
                </div>
              </div>

              {/* Timestamp & Action Hint */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: '0.688rem',
                    color: '#8C8C8C',
                  }}
                >
                  {inc.timestamp}
                </span>
                <ChevronRight size={13} color="#8C8C8C" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
