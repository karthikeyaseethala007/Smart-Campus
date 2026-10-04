import React, { useState } from 'react';
import { 
  Eye, 
  CheckCheck
} from 'lucide-react';
import { useAppState } from '../services/stateContext';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';


export const IncidentsView: React.FC = () => {
  const { incidents, setSelectedIncident, acknowledgeIncident, canManageIncidents } = useAppState();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const filteredIncidents = incidents.filter(inc => {
    const matchesSeverity = filterSeverity === 'all' || inc.severity === filterSeverity;
    const matchesSource = filterSource === 'all' || inc.source === filterSource;
    const matchesStatus = filterStatus === 'all' || inc.status === filterStatus;
    return matchesSeverity && matchesSource && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Editorial Section Heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h1 className="heading-editorial">
            Compliance <em>incident ledger.</em>
          </h1>
          <p className="subhead-editorial" style={{ marginTop: '6px' }}>
            Permanent compliance ledger tracking safety emergencies, unauthorized attempts, and hardware anomalies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div className="pill-badge pill-badge-neutral">
            <span>Total Logged: {incidents.length}</span>
          </div>
          <div className="pill-badge pill-badge-peach">
            <span>Open: {incidents.filter(i => i.status === 'open').length}</span>
          </div>
        </div>
      </div>

      {/* Filter and View Toggle Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Severity, Source & Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-slate-gray)', marginRight: '4px' }}>Severity:</span>
          {(['all', 'critical', 'warning', 'info'] as const).map(sev => {
            const isSelected = filterSeverity === sev;
            return (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`pill-btn-sm ${isSelected ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {sev}
              </button>
            );
          })}

          <span style={{ fontSize: '13px', color: 'var(--color-slate-gray)', marginLeft: '12px', marginRight: '4px' }}>Source:</span>
          {(['all', 'live', 'simulation'] as const).map(src => {
            const isSelected = filterSource === src;
            return (
              <button
                key={src}
                onClick={() => setFilterSource(src)}
                className={`pill-btn-sm ${isSelected ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {src === 'all' ? 'All' : src}
              </button>
            );
          })}

          <span style={{ fontSize: '13px', color: 'var(--color-slate-gray)', marginLeft: '12px', marginRight: '4px' }}>Status:</span>
          {(['all', 'open', 'acknowledged', 'resolved'] as const).map(st => {
            const isSelected = filterStatus === st;
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`pill-btn-sm ${isSelected ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {st}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div 
          style={{
            display: 'flex',
            backgroundColor: 'var(--color-mist-gray)',
            padding: '3px',
            borderRadius: '9999px'
          }}
        >
          <button
            onClick={() => setViewMode('cards')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: viewMode === 'cards' ? 500 : 400,
              backgroundColor: viewMode === 'cards' ? 'var(--color-ink-black)' : 'transparent',
              color: viewMode === 'cards' ? 'var(--color-paper-white)' : 'var(--color-slate-gray)'
            }}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: viewMode === 'table' ? 500 : 400,
              backgroundColor: viewMode === 'table' ? 'var(--color-ink-black)' : 'transparent',
              color: viewMode === 'table' ? 'var(--color-paper-white)' : 'var(--color-slate-gray)'
            }}
          >
            Table
          </button>
        </div>
      </div>

      {/* Incidents Cards Grid */}
      {viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {filteredIncidents.length === 0 ? (
            <div className="neutral-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <p style={{ color: 'var(--color-slate-gray)' }}>No incident records match the active filter criteria.</p>
            </div>
          ) : (
            filteredIncidents.map(inc => {
              const isCrit = inc.severity === 'critical';
              const isWarn = inc.severity === 'warning';

              return (
                <div 
                  key={inc.id}
                  className="neutral-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '20px',
                    padding: '24px'
                  }}
                >
                  <div>
                    {/* Top line: ID and Timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'monospace', color: 'var(--color-ink-black)' }}>
                        {inc.id}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--color-slate-gray)' }}>
                        {inc.timestamp}
                      </span>
                    </div>

                    {/* Event Headline in Signifier Serif */}
                    <h3 style={{ fontFamily: 'var(--font-signifier)', fontSize: '20px', fontWeight: 400, color: 'var(--color-ink-black)', marginBottom: '4px' }}>
                      {inc.event}
                    </h3>

                    {/* Location */}
                    <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)', marginBottom: '14px' }}>
                      {inc.location}
                    </div>

                    {/* Badges row: Severity & Source */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`pill-badge ${isCrit ? 'pill-badge-peach' : isWarn ? 'pill-badge-warning' : 'pill-badge-neutral'}`} style={{ backgroundColor: '#ffffff' }}>
                        {inc.severity.toUpperCase()}
                      </span>

                      {inc.source === 'simulation' ? (
                        <span className="pill-badge pill-badge-peach">
                          Simulation
                        </span>
                      ) : (
                        <span className="pill-badge pill-badge-neutral" style={{ backgroundColor: '#ffffff' }}>
                          Live
                        </span>
                      )}

                      <span className="pill-badge pill-badge-neutral" style={{ backgroundColor: '#ffffff' }}>
                        {inc.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div 
                    style={{
                      borderTop: 'var(--border-hairline)',
                      paddingTop: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <button
                      onClick={() => setSelectedIncident(inc)}
                      className="pill-btn-ghost"
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                    >
                      <Eye size={13} />
                      <span>Telemetry</span>
                    </button>

                    {canManageIncidents && inc.status === 'open' && (
                      <InteractiveHoverButton
                        onClick={() => acknowledgeIncident(inc.id)}
                        variant="filled"
                        icon={<CheckCheck size={13} />}
                        style={{ padding: '6px 14px', fontSize: '13px' }}
                      >
                        Acknowledge
                      </InteractiveHoverButton>
                    )}
                  </div>
                </div>
              );

            })
          )}
        </div>
      ) : (
        /* Spacious Table View */
        <div className="floating-artifact" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-mist-gray)', borderBottom: 'var(--border-hairline)' }}>
                <th style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-ink-black)' }}>ID</th>
                <th style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-ink-black)' }}>Event</th>
                <th style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-ink-black)' }}>Location</th>
                <th style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-ink-black)' }}>Severity</th>
                <th style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-ink-black)' }}>Source</th>
                <th style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-ink-black)' }}>Status</th>
                <th style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-ink-black)' }}>Timestamp</th>
                <th style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-ink-black)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--color-slate-gray)' }}>
                    No incident records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map(inc => {
                  const isCrit = inc.severity === 'critical';
                  const isWarn = inc.severity === 'warning';

                  return (
                    <tr 
                      key={inc.id}
                      style={{
                        borderBottom: 'var(--border-hairline)'
                      }}
                    >
                      <td style={{ padding: '16px 20px', fontWeight: 500, fontFamily: 'monospace', color: 'var(--color-ink-black)' }}>
                        {inc.id}
                      </td>

                      <td style={{ padding: '16px 20px', fontFamily: 'var(--font-signifier)', fontSize: '16px', color: 'var(--color-ink-black)' }}>
                        {inc.event}
                      </td>

                      <td style={{ padding: '16px 20px', color: 'var(--color-slate-gray)' }}>
                        {inc.location}
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <span className={`pill-badge ${isCrit ? 'pill-badge-peach' : isWarn ? 'pill-badge-warning' : 'pill-badge-neutral'}`}>
                          {inc.severity.toUpperCase()}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        {inc.source === 'simulation' ? (
                          <span className="pill-badge pill-badge-peach">
                            Simulation
                          </span>
                        ) : (
                          <span className="pill-badge pill-badge-neutral">
                            Live
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <span className="pill-badge pill-badge-neutral">
                          {inc.status.toUpperCase()}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px', color: 'var(--color-slate-gray)' }}>
                        {inc.timestamp}
                      </td>

                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedIncident(inc)}
                            className="pill-btn-ghost"
                            style={{ padding: '4px 12px', fontSize: '12px' }}
                          >
                            Details
                          </button>

                          {canManageIncidents && inc.status === 'open' && (
                            <button
                              onClick={() => acknowledgeIncident(inc.id)}
                              className="pill-btn-filled"
                              style={{ padding: '4px 12px', fontSize: '12px' }}
                            >
                              Ack
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
