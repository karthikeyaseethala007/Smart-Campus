import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Radio, Wind, Flame, RotateCcw } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

export const PillarDetectRadar: React.FC = () => {
  const { triggerRestrictedMotion, triggerSmokeAlert } = useAppState();
  
  // Radar state
  const [hasMotion, setHasMotion] = useState<boolean>(false);
  const [motionBlip, setMotionBlip] = useState<{ x: number; y: number; label: string; dist: string } | null>(null);

  // MQ-2 Telemetry state
  const [gasPpm, setGasPpm] = useState<number>(42);
  const [isGasAlarm, setIsGasAlarm] = useState<boolean>(false);

  // Canvas ref for high-performance radar rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const angleRef = useRef<number>(0);

  // Radar Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) - 16;

      // Dark background with slight phosphor trail fade
      ctx.fillStyle = 'rgba(16, 24, 32, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Radar Concentric Rings
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const r = (radius / 4) * i;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = i === 4 ? 'rgba(255, 130, 0, 0.4)' : 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();
      }

      // Crosshairs & Diagonal vectors
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Rotating Scanner Beam
      angleRef.current += 0.035;
      const angle = angleRef.current;

      // Gradient Sweep Wedge
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(255, 130, 0, 0.4)');
      gradient.addColorStop(1, 'rgba(255, 130, 0, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle - 0.45, angle, false);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Scanner Leading Edge
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.strokeStyle = '#ff8200';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      // Draw Motion Blip if active
      if (hasMotion && motionBlip) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx + motionBlip.x, cy + motionBlip.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ff8200';
        ctx.shadowColor = '#ff8200';
        ctx.shadowBlur = 14;
        ctx.fill();

        // Target ping ring
        ctx.beginPath();
        ctx.arc(cx + motionBlip.x, cy + motionBlip.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 130, 0, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [hasMotion, motionBlip]);

  // Motion Trigger Handler
  const handleSimulateMotion = () => {
    setHasMotion(true);
    setMotionBlip({
      x: 48,
      y: -36,
      label: 'Zone 02 · Hallway South',
      dist: '14.2m · 315°',
    });
    triggerRestrictedMotion('Zone 02 · Hallway South', 'simulation');

    setTimeout(() => {
      setHasMotion(false);
      setMotionBlip(null);
    }, 4500);
  };

  // Smoke & Gas Spike Handler
  const handleSimulateSmoke = () => {
    setIsGasAlarm(true);
    setGasPpm(380);
    triggerSmokeAlert('Zone 04 · Science Lab', 'simulation');
  };

  const handleResetSmoke = () => {
    setIsGasAlarm(false);
    setGasPpm(42);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        alignItems: 'center',
        backgroundColor: 'var(--color-paper-white)',
        borderRadius: '1.5rem',
        padding: '36px',
        border: 'var(--border-hairline)',
        boxShadow: 'var(--shadow-subtle-2)',
      }}
    >
      {/* Left: Interactive 360° Radar Canvas Display */}
      <div
        style={{
          backgroundColor: '#101820',
          borderRadius: '1.25rem',
          padding: '24px',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          position: 'relative',
        }}
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={14} color="#ff8200" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff' }}>
              PIR RADAR SWEEP ARRAY
            </span>
          </div>

          <div
            style={{
              padding: '3px 8px',
              borderRadius: '9999px',
              backgroundColor: hasMotion ? 'rgba(255, 130, 0, 0.2)' : 'rgba(34, 197, 94, 0.2)',
              color: hasMotion ? '#ff8200' : '#22c55e',
              fontSize: '0.688rem',
              fontWeight: 600,
            }}
          >
            {hasMotion ? 'MOTION DETECTED' : 'SCANNING'}
          </div>
        </div>

        {/* Canvas Display */}
        <div style={{ position: 'relative', width: '260px', height: '260px' }}>
          <canvas
            ref={canvasRef}
            width={260}
            height={260}
            style={{
              borderRadius: '50%',
              backgroundColor: '#0a0f14',
              display: 'block',
            }}
          />

          {/* Range Labels */}
          <span style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
            20m
          </span>
          <span style={{ position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
            15m
          </span>
          <span style={{ position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
            10m
          </span>
        </div>

        {/* Radar Telemetry Footer */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '0.5rem',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <div>
            Status: <strong style={{ color: hasMotion ? '#ff8200' : '#ffffff' }}>{hasMotion ? 'Blip Tracked' : 'Sector Clear'}</strong>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#ff8200' }}>
            {motionBlip ? motionBlip.dist : 'RANGE: 20M'}
          </div>
        </div>

        {/* Simulate Motion Button */}
        <button
          onClick={handleSimulateMotion}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '9999px',
            backgroundColor: hasMotion ? '#ff8200' : 'rgba(255,255,255,0.08)',
            color: hasMotion ? '#000000' : '#ffffff',
            border: 'none',
            fontSize: '0.813rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s var(--ease-out)',
          }}
        >
          {hasMotion ? 'Target Tracking Active' : 'Simulate PIR Motion Intrusion'}
        </button>
      </div>

      {/* Right: MQ-2 Gas / Smoke Sensor Telemetry Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-sienna-brown)',
              fontWeight: 600,
            }}
          >
            Pillar 02 · DETECT
          </span>
          <span style={{ color: 'var(--color-smoke-gray)' }}>/</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-gray)' }}>
            MQ-2 & PIR Sensing
          </span>
        </div>

        <h3
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            color: 'var(--color-ink-black)',
          }}
        >
          Continuous Atmospheric & Motion Telemetry
        </h3>

        <p
          style={{
            fontSize: '0.938rem',
            color: 'var(--color-slate-gray)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Multi-spectral sensing combines high-sensitivity PIR micro-radar with optical MQ-2 gas chambers. Obscuration levels are sampled every 500ms to detect early combustion before open flame ignition.
        </p>

        {/* MQ-2 Gas Meter Display */}
        <div
          style={{
            backgroundColor: isGasAlarm ? 'rgba(255, 0, 0, 0.05)' : 'var(--color-fog-white)',
            border: isGasAlarm ? '1px solid #ff0000' : 'var(--border-hairline)',
            borderRadius: '1.25rem',
            padding: '24px',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wind size={16} color={isGasAlarm ? '#ff0000' : 'var(--color-sienna-brown)'} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-ink-black)' }}>
                MQ-2 Gas / Obscuration
              </span>
            </div>

            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: isGasAlarm ? '#ff0000' : '#22c55e',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isGasAlarm ? '#ff0000' : '#22c55e',
                }}
              />
              {isGasAlarm ? 'CRITICAL AEROSOL (> 250 PPM)' : 'NOMINAL (< 100 PPM)'}
            </span>
          </div>

          {/* Large PPM Metric */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
            <motion.span
              key={gasPpm}
              initial={{ opacity: 0.6, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontSize: '3rem',
                fontWeight: 300,
                color: isGasAlarm ? '#ff0000' : 'var(--color-ink-black)',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {gasPpm}
            </motion.span>
            <span style={{ fontSize: '1rem', color: 'var(--color-slate-gray)', fontWeight: 500 }}>
              PPM
            </span>
          </div>

          {/* Threshold Progress Bar */}
          <div
            style={{
              height: '10px',
              backgroundColor: 'var(--color-primary-100)',
              borderRadius: '9999px',
              overflow: 'hidden',
              position: 'relative',
              marginBottom: '10px',
            }}
          >
            {/* Critical Threshold Marker at 250 PPM (approx 41% of 600) */}
            <div
              style={{
                position: 'absolute',
                left: '41.6%',
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: 'rgba(255, 0, 0, 0.6)',
                zIndex: 2,
              }}
              title="Critical Alarm Threshold (250 PPM)"
            />

            <motion.div
              animate={{ width: `${Math.min((gasPpm / 600) * 100, 100)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              style={{
                height: '100%',
                backgroundColor: isGasAlarm ? '#ff0000' : '#ff8200',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-slate-gray)' }}>
            <span>0 PPM (Clean Air)</span>
            <span style={{ color: '#ff0000', fontWeight: 600 }}>250 PPM (Alarm Threshold)</span>
            <span>600 PPM</span>
          </div>
        </div>

        {/* Action Controls for MQ-2 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSimulateSmoke}
            style={{
              flex: 1,
              padding: '10px 18px',
              borderRadius: '9999px',
              backgroundColor: isGasAlarm ? '#ff0000' : 'var(--color-ink-black)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.813rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s var(--ease-out)',
            }}
          >
            <Flame size={14} />
            <span>Simulate Smoke (380 PPM)</span>
          </button>

          {isGasAlarm && (
            <button
              onClick={handleResetSmoke}
              style={{
                padding: '10px 18px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-primary-100)',
                color: 'var(--color-ink-black)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.813rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
