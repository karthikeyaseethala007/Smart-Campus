import React, { useState } from 'react';
import { 
  Zap, 
  TrendingDown, 
  Leaf, 
  Clock,
  ArrowDown
} from 'lucide-react';
import { useAppState } from '../services/stateContext';
import { EnergyDemandChart } from '../components/energy/EnergyDemandChart';

export const EnergyView: React.FC = () => {
  const { automations, isSimulationActive } = useAppState();
  const [activeTimeframe, setActiveTimeframe] = useState<'today' | 'week' | 'month'>('today');

  const submeterLoadKw = automations.reduce((sum, z) => sum + z.currentPowerKw, 0);
  const totalDemandKw = (35.0 + submeterLoadKw).toFixed(1);
  const activeSectorsCount = automations.filter(z => z.occupancy === 'occupied' || z.currentPowerKw > 0.5).length;
  const vacantCount = automations.filter(z => z.occupancy === 'vacant').length;
  const vacancySavedKwh = (36.0 + vacantCount * 3.1).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Editorial Section Heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h1 className="heading-editorial">
            Power <em>efficiency.</em>
          </h1>
          <p className="subhead-editorial" style={{ marginTop: '6px' }}>
            Campus electrical load optimization driven by automated IoT occupancy detection.
          </p>
        </div>

        {/* Timeframe selector using Steep pill controls */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['today', 'week', 'month'] as const).map(tf => {
            const isSelected = activeTimeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`pill-btn-sm ${isSelected ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric Cards Grid — Steep Floating Stat Cards with Chart Strokes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {/* Card 1: Energy Efficiency */}
        <div className="floating-artifact" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="tag-category">Energy Efficiency</span>
            <Zap size={16} color="var(--color-ink-black)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-sohne)', fontSize: '38px', fontWeight: 500, color: 'var(--color-ink-black)', lineHeight: 1 }}>
              286
            </span>
            <span style={{ fontSize: '16px', color: 'var(--color-slate-gray)' }}>
              kWh today
            </span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-sienna-brown)', fontWeight: 500, fontSize: '14px' }}>
            <TrendingDown size={16} />
            <span>↓ 14.8% vs baseline</span>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)', lineHeight: 1.5, borderTop: 'var(--border-hairline)', paddingTop: '10px' }}>
            Automated vacancy control saved estimated energy across active academic wings.
          </div>
        </div>

        {/* Card 2: Current Demand */}
        <div className="floating-artifact" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="tag-category">Current Demand</span>
            <Clock size={16} color="var(--color-ink-black)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-sohne)', fontSize: '38px', fontWeight: 500, color: 'var(--color-ink-black)', lineHeight: 1 }}>
              {totalDemandKw}
            </span>
            <span style={{ fontSize: '16px', color: 'var(--color-slate-gray)' }}>
              kW
            </span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-ink-black)', fontWeight: 500, fontSize: '14px' }}>
            <span>{activeSectorsCount} Active Monitored Zones Drawing</span>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)', lineHeight: 1.5, borderTop: 'var(--border-hairline)', paddingTop: '10px' }}>
            Real-time submetered load dynamically calculated from active room lighting and HVAC damper relays.
          </div>
        </div>

        {/* Card 3: Vacancy Conservation */}
        <div className="floating-artifact" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="tag-category">Vacancy Offset</span>
            <Leaf size={16} color="var(--color-ink-black)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-sohne)', fontSize: '38px', fontWeight: 500, color: 'var(--color-ink-black)', lineHeight: 1 }}>
              {vacancySavedKwh}
            </span>
            <span style={{ fontSize: '16px', color: 'var(--color-slate-gray)' }}>
              kWh saved
            </span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-slate-gray)', fontWeight: 500, fontSize: '14px' }}>
            <ArrowDown size={16} />
            <span>{vacantCount} Vacant Zones Automatically Shed</span>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)', lineHeight: 1.5, borderTop: 'var(--border-hairline)', paddingTop: '10px' }}>
            Equates to ~41.2 kg CO₂e offset today through PIR-driven automatic load shedding.
          </div>
        </div>
      </div>

      {/* Shared Animated Steep Sienna Brown SVG Load Profile */}
      <EnergyDemandChart isSimulation={isSimulationActive} />

      {/* Room-Level Consumption Grid in Neutral Cards */}
      <div className="section-editorial">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <h2 className="heading-editorial">
              Sub-metered <em>zone power.</em>
            </h2>
            <p className="subhead-editorial" style={{ marginTop: '4px' }}>
              Active load distribution and automatic relay shedding by space.
            </p>
          </div>
          <span className="tag-category">Real-time Watts</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {automations.map(zone => {
            const pct = ((zone.currentPowerKw / 5.0) * 100).toFixed(0);

            return (
              <div 
                key={zone.id}
                className="neutral-card"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-sohne)', fontSize: '16px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                      {zone.zoneName}
                    </h4>
                    <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)' }}>
                      {zone.building}
                    </div>
                  </div>

                  <span className="pill-badge pill-badge-neutral" style={{ backgroundColor: '#ffffff', fontSize: '12px' }}>
                    {zone.automationState === 'active' ? 'Active' : 'Saving'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--color-paper-white)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div 
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: zone.occupancy === 'occupied' ? 'var(--color-ink-black)' : 'var(--color-slate-gray)',
                        borderRadius: '9999px',
                        transition: 'width 0.4s ease'
                      }} 
                    />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)', width: '56px', textAlign: 'right' }}>
                    {zone.currentPowerKw} kW
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
