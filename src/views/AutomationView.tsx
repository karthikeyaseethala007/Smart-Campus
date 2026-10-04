import React from 'react';
import { Clock, Zap, PowerOff } from 'lucide-react';
import { useAppState } from '../services/stateContext';

export const AutomationView: React.FC = () => {
  const { automations, triggerZoneOccupancy, triggerZoneVacancy } = useAppState();

  const steps = [
    { num: '01', name: 'SENSE', action: 'Motion detected', desc: 'PIR sensors trigger occupancy event; optical smoke monitors sample air obscuration.' },
    { num: '02', name: 'DECIDE', action: 'Rule evaluated', desc: 'Gateway parses zone occupancy state, validates schedule timers, and evaluates safety rules.' },
    { num: '03', name: 'ACT', action: 'Relays engaged', desc: 'Lighting switched ON; ventilation fans powered; electrical load adjusted to nominal.' },
    { num: '04', name: 'NOTIFY', action: 'Console broadcast', desc: 'Real-time telemetry event published to operations desk and facility monitors.' },
    { num: '05', name: 'RECORD', action: 'Ledger committed', desc: 'State transition logged to permanent compliance audit trail with microsecond timestamp.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Editorial Section Heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h1 className="heading-editorial">
            Autonomous <em>zone logic.</em>
          </h1>
          <p className="subhead-editorial" style={{ marginTop: '6px' }}>
            Closed-loop environmental IoT logic: Sense → Decide → Act → Notify → Record.
          </p>
        </div>

        <div className="pill-badge pill-badge-neutral" style={{ padding: '8px 16px', fontSize: '13px' }}>
          <span className="status-dot status-dot-safe" />
          <span>Real-time automation active</span>
        </div>
      </div>

      {/* 5-Step Telemetry Execution Flow in Steep Neutral Card */}
      <div className="neutral-card" style={{ padding: '36px 32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div className="tag-category">Pipeline Execution</div>
          <h3 style={{ fontFamily: 'var(--font-signifier)', fontSize: '24px', fontWeight: 400, marginTop: '2px' }}>
            Closed-Loop Processing Stages
          </h3>
        </div>

        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px'
          }}
        >
          {steps.map(step => (
            <div 
              key={step.num}
              style={{
                backgroundColor: 'var(--color-paper-white)',
                borderRadius: 'var(--radius-smallcards)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <span 
                style={{
                  fontFamily: 'var(--font-sohne)',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-slate-gray)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-mist-gray)',
                  width: 'fit-content'
                }}
              >
                {step.num}
              </span>

              <div style={{ fontFamily: 'var(--font-signifier)', fontSize: '18px', fontWeight: 400, color: 'var(--color-ink-black)' }}>
                {step.name}
              </div>

              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                {step.action}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--color-slate-gray)', lineHeight: 1.4 }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monitored Zones Grid */}
      <div className="section-editorial">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <h2 className="heading-editorial">
              Active <em>monitored rooms.</em>
            </h2>
            <p className="subhead-editorial" style={{ marginTop: '4px' }}>
              Real-time occupancy states, lighting interlocks, and sub-metered power loads.
            </p>
          </div>
          <span className="tag-category">{automations.length} Active Zones</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
          {automations.map(zone => {
            const isOccupied = zone.occupancy === 'occupied';

            return (
              <div 
                key={zone.id}
                className="neutral-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '20px',
                  padding: '28px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-signifier)', fontSize: '22px', fontWeight: 400, color: 'var(--color-ink-black)' }}>
                        {zone.zoneName}
                      </h3>
                      <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)', marginTop: '2px' }}>
                        {zone.building}
                      </div>
                    </div>

                    <span className="pill-badge pill-badge-neutral" style={{ backgroundColor: '#ffffff', fontSize: '12px' }}>
                      {zone.automationState === 'active' ? 'Active' : 'Standby'}
                    </span>
                  </div>

                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      padding: '16px',
                      backgroundColor: 'var(--color-paper-white)',
                      borderRadius: 'var(--radius-smallcards)',
                      marginTop: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>Occupancy</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink-black)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span className={`status-dot ${isOccupied ? 'status-dot-safe' : 'status-dot-ink'}`} style={{ opacity: isOccupied ? 1 : 0.3 }} />
                        {isOccupied ? 'Occupied' : 'Vacant'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>People Count</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '3px' }}>
                        {zone.occupantCount} occupants
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>Lighting Relay</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '3px' }}>
                        {zone.lightsState.toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>Ventilation / HVAC</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '3px' }}>
                        {zone.fansState.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Telemetry Info + Interactive Automation Controls */}
                <div 
                  style={{
                    borderTop: 'var(--border-hairline)',
                    paddingTop: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-slate-gray)' }}>
                      <Clock size={14} />
                      <span>Last motion: {zone.lastMotionTime}</span>
                    </div>
                    <div style={{ fontWeight: 500, color: 'var(--color-ink-black)' }}>
                      {zone.currentPowerKw} kW Load
                    </div>
                  </div>

                  {/* Interactive Trigger Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    {isOccupied ? (
                      <button
                        onClick={() => triggerZoneVacancy(zone.id)}
                        className="pill-btn-ghost"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        title="Simulate room vacancy timeout and automated load shedding"
                      >
                        <PowerOff size={13} />
                        <span>Simulate Vacancy (Timeout)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerZoneOccupancy(zone.id)}
                        className="pill-btn-sm active"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        title="Simulate PIR motion and automatic lighting/ventilation activation"
                      >
                        <Zap size={13} />
                        <span>Trigger Motion (Occupancy)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AutomationView;
