import React from 'react';
import { Zap, TrendingUp, ChevronRight, Activity, Thermometer, Droplets, Wind, Cpu } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

interface CampusPulseGraphProps {
  onNavigate?: () => void;
}

export const CampusPulseGraph: React.FC<CampusPulseGraphProps> = ({ onNavigate }) => {
  const { setActiveTab, automations, devices } = useAppState();

  const handleOpenEnergy = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      setActiveTab('energy');
    }
  };

  // Dynamic telemetry calculations
  const submeterLoadKw = automations.reduce((sum, z) => sum + z.currentPowerKw, 0);
  const liveDemand = (54.0 + (submeterLoadKw > 0 ? 0.85 : 0.4)).toFixed(2);
  const baselineKw = 54.00;
  const deltaKw = (+liveDemand - baselineKw).toFixed(2);
  const deltaPct = (((+liveDemand - baselineKw) / baselineKw) * 100).toFixed(2);

  const activeDeviceCount = devices.filter((d) => d.status === 'online').length || 24;

  // SVG dimensions
  const width = 1000;
  const height = 180;
  const paddingX = 40;
  const paddingY = 24;

  // 24-hour curve data points (kW)
  const dataPoints = [
    { time: '00:00', val: 54.05 },
    { time: '02:00', val: 53.95 },
    { time: '04:00', val: 53.85 },
    { time: '06:00', val: 54.10 },
    { time: '07:30', val: 54.50 },
    { time: '08:30', val: +liveDemand, isCurrent: true },
    { time: '10:00', val: 54.75 },
    { time: '12:00', val: 54.80 },
    { time: '14:00', val: 54.70 },
    { time: '16:00', val: 54.60 },
    { time: '18:00', val: 54.30 },
    { time: '20:00', val: 54.15 },
    { time: '22:00', val: 54.05 },
    { time: '24:00', val: 54.00 },
  ];

  const minVal = 53.5;
  const maxVal = 55.2;

  const getX = (index: number) => {
    return paddingX + (index / (dataPoints.length - 1)) * (width - 2 * paddingX);
  };

  const getY = (val: number) => {
    return height - paddingY - ((val - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);
  };

  // Build SVG spline path
  const points = dataPoints.map((d, i) => ({ x: getX(i), y: getY(d.val), ...d }));
  const pathD = points.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[i - 1];
    const cpx = (prev.x + curr.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  const baselineY = getY(baselineKw);

  const currentPt = points.find((p) => p.isCurrent) || points[5];

  return (
    <div
      role="region"
      aria-label="Campus Pulse Energy Consumption Graph"
      style={{
        backgroundColor: 'var(--color-paper-white, #FFFFFF)',
        borderRadius: '16px',
        padding: '28px 32px',
        border: '1px solid rgba(16, 24, 32, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(16, 24, 32, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
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
              marginBottom: '6px',
            }}
          >
            <Activity size={13} color="#FF8200" />
            <span>CAMPUS PULSE</span>
            <span style={{ color: 'var(--color-slate-gray)', opacity: 0.5 }}>·</span>
            <span>24-HOUR TELEMETRY DEMAND</span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--color-ink-black)',
              margin: 0,
              letterSpacing: '-0.025em',
            }}
          >
            Campus Power & Environmental Pulse
          </h2>
        </div>

        {/* Dual Telemetry Signals: Baseline vs Occupied */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          {/* Baseline */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.625rem',
                color: '#8C8C8C',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              BASELINE
            </span>
            <span
              style={{
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: '1.625rem',
                fontWeight: 600,
                color: 'var(--color-slate-gray)',
                lineHeight: 1.1,
              }}
            >
              {baselineKw.toFixed(2)} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#8C8C8C' }}>kW</span>
            </span>
          </div>

          <div style={{ width: '1px', height: '32px', backgroundColor: 'rgba(16, 24, 32, 0.1)' }} />

          {/* Occupied / Current Signal (Highlighted with #FF8200) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: '0.625rem',
                  color: '#FF8200',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                OCCUPIED (LIVE)
              </span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#FF8200',
                  boxShadow: '0 0 6px #FF8200',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: '1.625rem',
                fontWeight: 700,
                color: 'var(--color-ink-black)',
                lineHeight: 1.1,
              }}
            >
              {liveDemand} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#FF8200' }}>kW</span>
            </span>
          </div>

          <div style={{ width: '1px', height: '32px', backgroundColor: 'rgba(16, 24, 32, 0.1)' }} />

          {/* Delta Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 130, 0, 0.08)',
              border: '1px solid rgba(255, 130, 0, 0.2)',
              color: '#FF8200',
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <TrendingUp size={13} color="#FF8200" />
            <span>+{deltaKw} kW (+{deltaPct}%)</span>
          </div>
        </div>
      </div>

      {/* RESTRAINED CUSTOM VECTOR SPLINE GRAPH */}
      <div style={{ width: '100%', position: 'relative', marginTop: '4px' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF8200" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FF8200" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Baseline line */}
          <line
            x1={paddingX}
            y1={baselineY}
            x2={width - paddingX}
            y2={baselineY}
            stroke="#8A8F8D"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.45"
          />

          {/* Baseline text marker */}
          <text
            x={paddingX + 6}
            y={baselineY - 6}
            fill="#8C8C8C"
            fontFamily="var(--font-mono, monospace)"
            fontSize="10"
            letterSpacing="0.08em"
          >
            BASELINE 54.00 kW
          </text>

          {/* Area Fill */}
          <path d={areaD} fill="url(#energyFill)" pointerEvents="none" />

          {/* Main Curve Line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-ink-black)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current Signal Highlight Marker */}
          <g>
            <line
              x1={currentPt.x}
              y1={paddingY}
              x2={currentPt.x}
              y2={height - paddingY}
              stroke="#FF8200"
              strokeWidth="1.5"
              strokeDasharray="2 3"
              opacity="0.75"
            />

            {/* Pulse Aura */}
            <circle
              cx={currentPt.x}
              cy={currentPt.y}
              r="10"
              fill="#FF8200"
              opacity="0.2"
            />

            {/* Core Marker Point */}
            <circle
              cx={currentPt.x}
              cy={currentPt.y}
              r="5"
              fill="#FF8200"
              stroke="#FFFFFF"
              strokeWidth="2"
            />

            {/* Current Tooltip Label Tag */}
            <rect
              x={currentPt.x - 52}
              y={currentPt.y - 28}
              width="104"
              height="20"
              rx="4"
              fill="var(--color-ink-black)"
            />
            <text
              x={currentPt.x}
              y={currentPt.y - 14}
              textAnchor="middle"
              fill="var(--color-paper-white)"
              fontFamily="var(--font-mono, monospace)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="0.04em"
            >
              NOW · {liveDemand} kW
            </text>
          </g>

          {/* Time Axis Labels */}
          {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'].map((timeLabel, idx) => {
            const xPos = paddingX + (idx / 6) * (width - 2 * paddingX);
            return (
              <text
                key={timeLabel}
                x={xPos}
                y={height - 2}
                textAnchor="middle"
                fill="#8C8C8C"
                fontFamily="var(--font-mono, monospace)"
                fontSize="10"
                letterSpacing="0.05em"
              >
                {timeLabel}
              </text>
            );
          })}
        </svg>
      </div>

      {/* ENVIRONMENTAL CONDITIONS & ACTIVE CIRCUITS CLUSTER (Section 6 Requirements) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: '#FCFCFD',
          borderRadius: '10px',
          border: '1px solid rgba(16, 24, 32, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Thermometer size={16} color="var(--color-ink-black)" />
          <div>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.625rem', color: 'var(--color-slate-gray)', textTransform: 'uppercase' }}>
              AMBIENT SETPOINT
            </div>
            <div style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1rem', fontWeight: 600, color: 'var(--color-ink-black)' }}>
              21.4°C · Nominal
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Droplets size={16} color="var(--color-slate-gray)" />
          <div>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.625rem', color: 'var(--color-slate-gray)', textTransform: 'uppercase' }}>
              RELATIVE HUMIDITY
            </div>
            <div style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1rem', fontWeight: 600, color: 'var(--color-ink-black)' }}>
              46% RH · Balanced
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wind size={16} color="#22c55e" />
          <div>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.625rem', color: 'var(--color-slate-gray)', textTransform: 'uppercase' }}>
              INDOOR AIR QUALITY
            </div>
            <div style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1rem', fontWeight: 600, color: '#22c55e' }}>
              18 AQI · Optimal
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={16} color="#FF8200" />
          <div>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.625rem', color: 'var(--color-slate-gray)', textTransform: 'uppercase' }}>
              MONITORED CIRCUITS
            </div>
            <div style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1rem', fontWeight: 600, color: 'var(--color-ink-black)' }}>
              {activeDeviceCount} Nodes Active
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          fontFamily: "var(--font-mono, monospace)",
          color: 'var(--color-slate-gray)',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle, rgba(16, 24, 32, 0.06))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={13} color="#FF8200" />
          <span>6 SUBMETERS MONITORED · SMART HVAC & LIGHTING RELAYS NOMINAL</span>
        </div>

        <button
          onClick={handleOpenEnergy}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--color-ink-black)',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span>ENERGY MANAGEMENT PORTAL</span>
          <ChevronRight size={13} color="#FF8200" />
        </button>
      </div>
    </div>
  );
};
