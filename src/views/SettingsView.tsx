import React, { useState } from 'react';
import { Save, ShieldAlert, Sliders, CheckCircle } from 'lucide-react';
import { useAppState } from '../services/stateContext';

export const SettingsView: React.FC = () => {
  const { addToast } = useAppState();

  const [smokeThreshold, setSmokeThreshold] = useState('450');
  const [lockoutAttempts, setLockoutAttempts] = useState('3');
  const [vacancyTimeout, setVacancyTimeout] = useState('15');
  const [autoRelockSeconds, setAutoRelockSeconds] = useState('30');
  const [heartbeatInterval, setHeartbeatInterval] = useState('60');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Configuration Applied', 'Supervisory thresholds propagated to campus IoT gateways and local microcontrollers.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Editorial Section Heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h1 className="heading-editorial">
            System <em>parameters.</em>
          </h1>
          <p className="subhead-editorial" style={{ marginTop: '6px' }}>
            Hardware supervisory parameters, alarm trigger thresholds, and access control timers.
          </p>
        </div>

        <div className="pill-badge pill-badge-neutral">
          <CheckCircle size={15} color="var(--color-slate-gray)" />
          <span>Gateway Sync Active</span>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Environmental Safety Thresholds in Neutral Card */}
        <div className="neutral-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={18} color="var(--color-ink-black)" />
            <h3 style={{ fontFamily: 'var(--font-signifier)', fontSize: '22px', fontWeight: 400, color: 'var(--color-ink-black)' }}>
              Environmental Safety & Alarm Triggers
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)', marginBottom: '8px' }}>
                Smoke Density Trigger Threshold (PPM)
              </label>
              <input
                type="number"
                value={smokeThreshold}
                onChange={(e) => setSmokeThreshold(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-inputs)',
                  border: '1px solid #ececec',
                  backgroundColor: 'var(--color-paper-white)',
                  color: 'var(--color-ink-black)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-sohne)',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-slate-gray)', marginTop: '6px', display: 'block' }}>
                Standard threshold is 450 PPM for optical smoke detectors.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)', marginBottom: '8px' }}>
                Heartbeat Supervisory Timeout (Seconds)
              </label>
              <input
                type="number"
                value={heartbeatInterval}
                onChange={(e) => setHeartbeatInterval(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-inputs)',
                  border: '1px solid #ececec',
                  backgroundColor: 'var(--color-paper-white)',
                  color: 'var(--color-ink-black)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-sohne)',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-slate-gray)', marginTop: '6px', display: 'block' }}>
                Triggers 'Device Offline' notification when telemetry heartbeat is overdue.
              </span>
            </div>
          </div>
        </div>

        {/* Access Control & Automation Timing */}
        <div className="neutral-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={18} color="var(--color-ink-black)" />
            <h3 style={{ fontFamily: 'var(--font-signifier)', fontSize: '22px', fontWeight: 400, color: 'var(--color-ink-black)' }}>
              Access Control & Energy Automation Timing
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)', marginBottom: '8px' }}>
                Keypad Failed Attempt Lockout Count
              </label>
              <input
                type="number"
                value={lockoutAttempts}
                onChange={(e) => setLockoutAttempts(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-inputs)',
                  border: '1px solid #ececec',
                  backgroundColor: 'var(--color-paper-white)',
                  color: 'var(--color-ink-black)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-sohne)',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-slate-gray)', marginTop: '6px', display: 'block' }}>
                Locks keypad and broadcasts Security Alert after N invalid entries.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)', marginBottom: '8px' }}>
                Smart Door Auto-Relock Timeout (Seconds)
              </label>
              <input
                type="number"
                value={autoRelockSeconds}
                onChange={(e) => setAutoRelockSeconds(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-inputs)',
                  border: '1px solid #ececec',
                  backgroundColor: 'var(--color-paper-white)',
                  color: 'var(--color-ink-black)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-sohne)',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-slate-gray)', marginTop: '6px', display: 'block' }}>
                Duration before magnetic lock re-engages after remote release.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)', marginBottom: '8px' }}>
                Zone Vacancy Power-Down Delay (Minutes)
              </label>
              <input
                type="number"
                value={vacancyTimeout}
                onChange={(e) => setVacancyTimeout(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-inputs)',
                  border: '1px solid #ececec',
                  backgroundColor: 'var(--color-paper-white)',
                  color: 'var(--color-ink-black)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-sohne)',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-slate-gray)', marginTop: '6px', display: 'block' }}>
                Inactivity threshold before turning off lighting relays in vacant halls.
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="pill-btn-filled"
            style={{ padding: '12px 28px' }}
          >
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
