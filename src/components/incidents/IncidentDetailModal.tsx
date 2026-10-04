import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Cpu, 
  CheckCheck
} from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import { InteractiveHoverButton } from '../ui/interactive-hover-button';


export const IncidentDetailModal: React.FC = () => {
  const { 
    selectedIncident, 
    setSelectedIncident, 
    acknowledgeIncident, 
    resolveIncident, 
    canManageIncidents 
  } = useAppState();

  if (!selectedIncident) return null;

  const isEmergency = selectedIncident.severity === 'critical';

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(23, 25, 28, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="floating-artifact"
        style={{
          maxWidth: '680px',
          width: '100%',
          padding: 0,
          borderRadius: 'var(--radius-cards)',
          boxShadow: 'var(--shadow-subtle-2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          backgroundColor: 'var(--color-paper-white)'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '24px 32px',
            backgroundColor: isEmergency ? 'var(--color-blush-peach)' : 'var(--color-mist-gray)',
            borderBottom: 'var(--border-hairline)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'monospace', color: 'var(--color-ink-black)' }}>
                {selectedIncident.id}
              </span>
              <span className={`pill-badge ${selectedIncident.severity === 'critical' ? 'pill-badge-peach' : 'pill-badge-neutral'}`} style={{ backgroundColor: '#ffffff' }}>
                {selectedIncident.severity.toUpperCase()}
              </span>
              {selectedIncident.source === 'simulation' && (
                <span className="pill-badge pill-badge-peach" style={{ backgroundColor: '#ffffff' }}>
                  Simulation
                </span>
              )}
              <span className="pill-badge pill-badge-neutral" style={{ backgroundColor: '#ffffff' }}>
                {selectedIncident.status.toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-signifier)', fontSize: '24px', fontWeight: 400, color: isEmergency ? 'var(--color-sienna-brown)' : 'var(--color-ink-black)' }}>
              {selectedIncident.event}
            </h2>
          </div>

          <button 
            onClick={() => setSelectedIncident(null)}
            aria-label="Close modal"
            style={{ color: isEmergency ? 'var(--color-sienna-brown)' : 'var(--color-slate-gray)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Metadata Grid */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              padding: '16px',
              backgroundColor: 'var(--color-mist-gray)',
              borderRadius: 'var(--radius-smallcards)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={16} color="var(--color-ink-black)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>Location</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                  {selectedIncident.location}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={16} color="var(--color-ink-black)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>Reported At</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                  {selectedIncident.timestamp}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={16} color="var(--color-ink-black)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>Assigned Officer</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                  {selectedIncident.assignedOfficer || 'Auto-Dispatch'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={16} color="var(--color-ink-black)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>Campus Zone</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                  {selectedIncident.zone}
                </div>
              </div>
            </div>
          </div>

          {/* Description & Context */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-signifier)', fontSize: '18px', fontWeight: 400, color: 'var(--color-ink-black)', marginBottom: '8px' }}>
              Summary & Context
            </h4>
            <p style={{ fontSize: '15px', color: 'var(--color-slate-gray)', lineHeight: 1.6 }}>
              {selectedIncident.description}
            </p>
          </div>

          {/* Raw Telemetry Data Box */}
          {selectedIncident.telemetry && (
            <div>
              <h4 style={{ fontFamily: 'var(--font-signifier)', fontSize: '18px', fontWeight: 400, color: 'var(--color-ink-black)', marginBottom: '10px' }}>
                Sensor Telemetry Snapshot
              </h4>
              <div 
                style={{
                  backgroundColor: 'var(--color-mist-gray)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-smallcards)',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--color-ink-black)',
                  lineHeight: 1.7
                }}
              >
                {Object.entries(selectedIncident.telemetry).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-slate-gray)' }}>{k}:</span>
                    <strong>{String(v)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chronological Audit Trail */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-signifier)', fontSize: '18px', fontWeight: 400, color: 'var(--color-ink-black)', marginBottom: '12px' }}>
              Chronological Audit Trail
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '18px', marginLeft: '6px' }}>
              {selectedIncident.auditTimeline.map((item, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div 
                    style={{
                      position: 'absolute',
                      left: '-23px',
                      top: '5px',
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-ink-black)'
                    }} 
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                      {item.time}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-slate-gray)' }}>
                      by {item.actor}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)', marginTop: '2px' }}>
                    {item.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div 
          style={{
            padding: '20px 32px',
            backgroundColor: 'var(--color-mist-gray)',
            borderTop: 'var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)' }}>
            Compliance Record Preserved
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSelectedIncident(null)}
              className="pill-btn-ghost"
              style={{ padding: '8px 20px' }}
            >
              Close
            </button>

            {canManageIncidents && selectedIncident.status === 'open' && (
              <InteractiveHoverButton
                onClick={() => acknowledgeIncident(selectedIncident.id)}
                variant="ghost"
                icon={<CheckCheck size={14} />}
                style={{ padding: '8px 20px', borderColor: 'var(--color-ink-black)' }}
              >
                Acknowledge
              </InteractiveHoverButton>
            )}

            {canManageIncidents && selectedIncident.status !== 'resolved' && (
              <InteractiveHoverButton
                onClick={() => resolveIncident(selectedIncident.id)}
                variant="filled"
                icon={<CheckCircle2 size={14} />}
                style={{ padding: '8px 24px' }}
              >
                Mark as Resolved
              </InteractiveHoverButton>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
