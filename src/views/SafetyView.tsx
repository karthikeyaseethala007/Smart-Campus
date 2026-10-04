import React from 'react';
import { 
  Flame, 
  AlertOctagon, 
  CheckCheck,
  ShieldCheck,
  Radio,
  Volume2,
  VolumeX,
  Wind,
  RotateCcw
} from 'lucide-react';
import { useAppState } from '../services/stateContext';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';

export const SafetyView: React.FC = () => {
  const { 
    campusStatus, 
    alerts, 
    devices, 
    incidents, 
    setSelectedIncident, 
    setActiveTab, 
    acknowledgeAlert,
    isSimulationActive,
    isAlarmRinging,
    isAlarmMuted,
    audioAutoplayBlocked,
    enableAlarmAudio,
    silenceAlarm,
    triggerSmokeAlert,
    triggerFireAlert,
    resetSimulation,
    canRunSimulations
  } = useAppState();

  const isEmergency = campusStatus === 'EMERGENCY';
  const smokeSensors = devices.filter(d => d.category === 'smoke' || d.category === 'fire');
  const fireAlert = alerts.find(a => 
    a.title.toLowerCase().includes('smoke') || 
    a.title.toLowerCase().includes('fire')
  );
  const fireIncident = incidents.find(i => 
    i.event.toLowerCase().includes('smoke') || 
    i.event.toLowerCase().includes('fire')
  );

  const isFireType = fireIncident?.event.toLowerCase().includes('fire') || fireAlert?.title.toLowerCase().includes('fire');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Editorial Section Heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h1 className="heading-editorial">
            Environmental <em>fire & safety.</em>
          </h1>
          <p className="subhead-editorial" style={{ marginTop: '6px' }}>
            Autonomous smoke obscuration monitoring, thermal delta detection, and automated ventilation dampers.
          </p>
        </div>

        {/* System State Pill */}
        <div className="pill-badge pill-badge-neutral" style={{ padding: '8px 16px', fontSize: '13px' }}>
          <ShieldCheck size={16} color="var(--color-slate-gray)" />
          <span>
            {isEmergency 
              ? (isFireType 
                  ? 'CRITICAL: Thermal fire rise threshold exceeded in Engineering Block' 
                  : 'CRITICAL: Smoke obscuration threshold exceeded in Science Block') 
              : '48 building sectors streaming nominal obscuration'}
          </span>
        </div>
      </div>

      {/* Hero Safety Banner: Accent Peach Card during emergency, Neutral Card when quiet */}
      {isEmergency ? (
        <div className="accent-peach-card" style={{ padding: '36px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '720px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <span className="pill-badge pill-badge-ink" style={{ backgroundColor: 'var(--color-sienna-brown)', fontSize: '12px' }}>
                  Critical Emergency
                </span>

                {isSimulationActive && (
                  <span className="pill-badge pill-badge-neutral" style={{ backgroundColor: 'rgba(255,255,255,0.4)', fontSize: '12px', color: 'var(--color-sienna-brown)' }}>
                    <Radio size={12} />
                    SOURCE · SIMULATION
                  </span>
                )}

                {/* Audible Alarm Controls & Autoplay Notification */}
                {audioAutoplayBlocked ? (
                  <button
                    onClick={enableAlarmAudio}
                    className="pill-badge pill-badge-ink"
                    style={{
                      backgroundColor: 'var(--color-ink-black)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      padding: '4px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Click to enable browser audio output for siren"
                  >
                    <Volume2 size={13} />
                    <span>ENABLE ALARM SOUND</span>
                  </button>
                ) : isAlarmRinging && !isAlarmMuted ? (
                  <button
                    onClick={silenceAlarm}
                    className="pill-badge pill-badge-neutral"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.6)',
                      color: 'var(--color-sienna-brown)',
                      border: '1px solid rgba(93, 42, 26, 0.2)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      padding: '4px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Silence audible emergency siren"
                  >
                    <VolumeX size={13} />
                    <span>Silence Siren</span>
                  </button>
                ) : isAlarmMuted ? (
                  <span
                    className="pill-badge pill-badge-neutral"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.4)',
                      color: 'var(--color-slate-gray)',
                      fontSize: '11px',
                      padding: '4px 10px'
                    }}
                  >
                    <VolumeX size={13} />
                    <span>Siren Muted (Emergency Active)</span>
                  </span>
                ) : null}
              </div>

              <h2 style={{ fontFamily: 'var(--font-signifier)', fontSize: '32px', fontWeight: 400, color: 'var(--color-sienna-brown)', marginBottom: '12px' }}>
                {isFireType ? (
                  <>FIRE DETECTED · <em>Engineering Block Floor 2</em></>
                ) : (
                  <>SMOKE DETECTED · <em>Science Block Lab 204</em></>
                )}
              </h2>

              <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--color-sienna-brown)', opacity: 0.95, marginBottom: '20px' }}>
                {isFireType ? (
                  <>
                    Thermal rise rate exceeded <strong>70°C</strong> threshold. Automated evacuation protocols broadcast. Emergency suppression interlocks armed.
                  </>
                ) : (
                  <>
                    VESDA Obscuration reading at <strong>4.8%/m</strong> (Threshold: 2.0%/m). Automated dampers have arrested corridor supply fans to suppress particulate propagation. Operational response units alerted.
                  </>
                )}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--color-sienna-brown)', opacity: 0.85, flexWrap: 'wrap' }}>
                <span>48 monitored zones</span>
                <span>•</span>
                <span>{isFireType ? 'Thermal surge verified' : '1 active smoke alert'}</span>
                <span>•</span>
                <span>HVAC isolation engaged</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignSelf: 'center' }}>
              {fireIncident && (
                <InteractiveHoverButton
                  onClick={() => {
                    setSelectedIncident(fireIncident);
                    setActiveTab('incidents');
                  }}
                  variant="sienna-filled"
                  icon={<AlertOctagon size={16} />}
                  style={{ padding: '12px 24px' }}
                >
                  Review Incident Ledger
                </InteractiveHoverButton>
              )}

              {fireAlert && !fireAlert.acknowledged && (
                <InteractiveHoverButton
                  onClick={() => acknowledgeAlert(fireAlert.id)}
                  variant="sienna"
                  icon={<CheckCheck size={16} />}
                  style={{ padding: '10px 20px' }}
                >
                  Acknowledge Alert
                </InteractiveHoverButton>
              )}

              {canRunSimulations && (
                <button
                  onClick={resetSimulation}
                  className="pill-btn-ghost"
                  style={{ 
                    padding: '8px 18px', 
                    fontSize: '13px', 
                    color: 'var(--color-sienna-brown)',
                    borderColor: 'rgba(93, 42, 26, 0.3)',
                    backgroundColor: 'rgba(255,255,255,0.4)'
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Reset Protocol</span>
                </button>
              )}
            </div>
          </div>
        </div>

      ) : (
        <div className="neutral-card" style={{ padding: '36px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span className="pill-badge pill-badge-neutral" style={{ backgroundColor: '#ffffff', fontSize: '12px' }}>
                  <span className="status-dot status-dot-safe" />
                  All Systems Clear
                </span>
              </div>

              <h2 style={{ fontFamily: 'var(--font-signifier)', fontSize: '32px', fontWeight: 400, color: 'var(--color-ink-black)', marginBottom: '10px' }}>
                All 48 Monitored Fire Sectors <em>Nominal</em>
              </h2>

              <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--color-slate-gray)', maxWidth: '720px' }}>
                Continuous dual-wavelength optical detectors and ambient thermal nodes are reporting background levels below 0.2%/m obscuration. Mechanical dampers stand ready in normal ventilation configuration.
              </p>
            </div>

            {/* Quick Operator Sensor Drill Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignSelf: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                Operator Safety Drills
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => triggerSmokeAlert('Science Block · Lab 204', 'simulation')}
                  disabled={!canRunSimulations}
                  className="pill-btn-ghost"
                  style={{ padding: '7px 16px', fontSize: '13px' }}
                  title="Test smoke sensor threshold and damper arrest"
                >
                  <Wind size={13} />
                  <span>Trigger Smoke Drill</span>
                </button>
                <button
                  onClick={() => triggerFireAlert('Engineering Block · Floor 2', 'simulation')}
                  disabled={!canRunSimulations}
                  className="pill-btn-ghost"
                  style={{ padding: '7px 16px', fontSize: '13px' }}
                  title="Test thermal fire alarm threshold and evacuation siren"
                >
                  <Flame size={13} />
                  <span>Trigger Fire Drill</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monitored Safety Zones & Detectors */}
      <div className="section-editorial">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <h2 className="heading-editorial">
              Sensor <em>telemetry nodes.</em>
            </h2>
            <p className="subhead-editorial" style={{ marginTop: '4px' }}>
              Active smoke density, thermal drift, and battery charge status.
            </p>
          </div>
          <span className="tag-category">48 physical sectors</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {smokeSensors.map(sensor => {
            const isCritical = sensor.status === 'critical';

            return (
              <div 
                key={sensor.id}
                className={isCritical ? 'accent-peach-card' : 'neutral-card'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px',
                  padding: '24px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Flame size={16} color={isCritical ? 'var(--color-sienna-brown)' : 'var(--color-ink-black)'} />
                      <span className="tag-category" style={{ color: isCritical ? 'var(--color-sienna-brown)' : undefined }}>
                        {sensor.category} node
                      </span>
                    </div>

                    <span className={`pill-badge ${isCritical ? 'pill-badge-peach' : 'pill-badge-neutral'}`} style={{ backgroundColor: isCritical ? '#ffffff' : '#ffffff' }}>
                      {sensor.status.toUpperCase()}
                    </span>
                  </div>

                  <h4 style={{ fontFamily: 'var(--font-signifier)', fontSize: '20px', fontWeight: 400, color: isCritical ? 'var(--color-sienna-brown)' : 'var(--color-ink-black)', marginBottom: '4px' }}>
                    {sensor.name}
                  </h4>
                  <div style={{ fontSize: '13px', color: isCritical ? 'var(--color-sienna-brown)' : 'var(--color-slate-gray)', opacity: 0.85 }}>
                    {sensor.location}
                  </div>
                </div>

                <div 
                  style={{
                    borderTop: 'var(--border-hairline)',
                    paddingTop: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-paper-white)', borderRadius: 'var(--radius-smallcards)' }}>
                    <span style={{ color: 'var(--color-slate-gray)', fontSize: '11px' }}>Battery</span>
                    <div style={{ fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '2px' }}>{sensor.batteryPct}%</div>
                  </div>
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-paper-white)', borderRadius: 'var(--radius-smallcards)' }}>
                    <span style={{ color: 'var(--color-slate-gray)', fontSize: '11px' }}>Signal RSSI</span>
                    <div style={{ fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '2px' }}>{sensor.signalStrength}%</div>
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

export default SafetyView;
