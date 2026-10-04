import React from 'react';
import { Flame, ShieldAlert, RotateCcw, AlertTriangle, Radio } from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import { InteractiveHoverButton } from '../ui/interactive-hover-button';


export const SimulationPanel: React.FC = () => {
  const { 
    simulateFire, 
    simulateSmoke,
    simulateBreach, 
    simulateRestrictedMotion,
    resetSimulation, 
    isSimulationActive, 
    activeSimulations,
    canRunSimulations,
    userRole 
  } = useAppState();

  return (
    <div 
      className="neutral-card"
      style={{
        padding: '28px 32px',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span 
              style={{ 
                fontFamily: 'var(--font-signifier)', 
                fontSize: '20px', 
                fontWeight: 400, 
                color: 'var(--color-ink-black)',
                letterSpacing: '-0.2px'
              }}
            >
              Simulation <em>Environment</em>
            </span>

            {isSimulationActive ? (
              <span className="pill-badge pill-badge-peach">
                <Radio size={12} color="var(--color-sienna-brown)" />
                <span>Simulation active</span>
              </span>
            ) : (
              <span className="pill-badge pill-badge-neutral" style={{ backgroundColor: '#ffffff' }}>
                <span className="status-dot status-dot-ink" style={{ opacity: 0.4 }} />
                <span>Standby</span>
              </span>
            )}
          </div>

          <p style={{ fontFamily: 'var(--font-sohne)', fontSize: '15px', color: 'var(--color-slate-gray)', maxWidth: '620px', lineHeight: 1.5 }}>
            Generate controlled scenario telemetry for operational verification and response drill testing.
            <strong style={{ color: 'var(--color-ink-black)', marginLeft: '4px', fontWeight: 500 }}>
              These do not represent physical sensor readings.
            </strong>
          </p>
        </div>

        {/* Steep Matched Action Buttons with InteractiveHoverButton */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <InteractiveHoverButton
            onClick={simulateFire}
            disabled={!canRunSimulations || activeSimulations.fire}
            variant={activeSimulations.fire ? 'sienna-filled' : 'sienna'}
            icon={<Flame size={14} />}
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            Simulate Fire
          </InteractiveHoverButton>

          <InteractiveHoverButton
            onClick={simulateSmoke}
            disabled={!canRunSimulations || activeSimulations.smoke}
            variant={activeSimulations.smoke ? 'sienna-filled' : 'sienna'}
            icon={<Radio size={14} />}
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            Simulate Smoke
          </InteractiveHoverButton>

          <InteractiveHoverButton
            onClick={simulateBreach}
            disabled={!canRunSimulations || activeSimulations.breach}
            variant={activeSimulations.breach ? 'filled' : 'ghost'}
            icon={<ShieldAlert size={14} />}
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            Simulate Breach
          </InteractiveHoverButton>

          <InteractiveHoverButton
            onClick={simulateRestrictedMotion}
            disabled={!canRunSimulations || activeSimulations.restrictedMotion}
            variant={activeSimulations.restrictedMotion ? 'filled' : 'ghost'}
            icon={<AlertTriangle size={14} />}
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            Restricted Motion
          </InteractiveHoverButton>

          <InteractiveHoverButton
            onClick={resetSimulation}
            disabled={!canRunSimulations || !isSimulationActive}
            variant="ghost"
            icon={<RotateCcw size={14} />}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              borderColor: 'rgba(23, 25, 28, 0.2)',
              color: 'var(--color-slate-gray)'
            }}
          >
            Reset Scenario
          </InteractiveHoverButton>
        </div>
      </div>


      {!canRunSimulations && (
        <div 
          style={{
            marginTop: '16px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-smallcards)',
            backgroundColor: 'var(--color-paper-white)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--color-slate-gray)'
          }}
        >
          <AlertTriangle size={14} color="var(--color-slate-gray)" />
          <span>
            Clearance mode: <strong style={{ color: 'var(--color-ink-black)', textTransform: 'capitalize' }}>{userRole}</strong>. Scenario triggers require Administrator or Security Officer clearance.
          </span>
        </div>
      )}
    </div>
  );
};
