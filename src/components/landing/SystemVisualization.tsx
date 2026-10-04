import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Key, Radio, Flame, Cpu, Zap, Siren, Activity } from 'lucide-react';
import { TiltedCard } from '../reactbits/TiltedCard';

interface SystemNode {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  rate: string;
  status: string;
  description: string;
  metric: string;
}

const NODES: SystemNode[] = [
  {
    id: 'cctv',
    name: 'CCTV VISION MESH',
    category: 'OPTICAL INTELLIGENCE',
    icon: Video,
    rate: '30 FPS · 1080p',
    status: '6 STREAMS ACTIVE',
    description: 'Neural edge cameras analyze zone ingress, dwell duration, and crowd density patterns.',
    metric: '99.98% OBJECT CLASSIFICATION',
  },
  {
    id: 'access',
    name: 'ACCESS INTERLOCKS',
    category: 'PERIMETER SECURITY',
    icon: Key,
    rate: '< 150ms LATENCY',
    status: 'SOLENOID LOCKED',
    description: 'Turnstiles, magnetic locks, and biometric keypads interlock on credential verification.',
    metric: '1,420 VALIDATED ENTRIES / DAY',
  },
  {
    id: 'pir',
    name: 'PIR MOTION MATRIX',
    category: 'SPATIAL TELEMETRY',
    icon: Radio,
    rate: '100ms SAMPLING',
    status: 'OCCUPANCY MAPPED',
    description: 'Passive infrared sensors detect directional motion through restricted corridors.',
    metric: 'ZONE OCCUPANCY: 42 PERSONS',
  },
  {
    id: 'mq2',
    name: 'MQ-2 GAS & HAZARD',
    category: 'ATMOSPHERIC SENSORS',
    icon: Flame,
    rate: 'CONTINUOUS ADC',
    status: '42 PPM · NORMAL',
    description: 'Electrochemical sensors continuously evaluate smoke and volatile hydrocarbon PPM.',
    metric: 'SPIKE THRESHOLD: > 350 PPM',
  },
  {
    id: 'energy',
    name: 'ENERGY MONITORING',
    category: 'INFRASTRUCTURE POWER',
    icon: Zap,
    rate: 'SUB-SECOND CT SAMPLES',
    status: '54.85 kW DEMAND',
    description: 'Digital power meters detect phase imbalances and regulate automated circuit breakers.',
    metric: 'PEAK DEMAND REDUCED 18%',
  },
  {
    id: 'iot',
    name: 'IoT RELAY FLEET',
    category: 'PHYSICAL ACTUATORS',
    icon: Cpu,
    rate: 'MQTT / Z-WAVE',
    status: '16 DEVICES ONLINE',
    description: 'Smart relays toggle high-voltage lighting, emergency exhaust dampers, and backup sirens.',
    metric: '100% HARDWARE HEALTH',
  },
  {
    id: 'emergency',
    name: 'EMERGENCY DISPATCH',
    category: 'ESCALATION PROTOCOLS',
    icon: Siren,
    rate: 'ZERO-DELAY TRIGGER',
    status: 'STANDBY READY',
    description: 'Instant automated broadcasts, zone seals, and municipal emergency notifications.',
    metric: 'MEAN RESPONSE TIME < 3s',
  },
];

export const SystemVisualization: React.FC = () => {
  const [activeNode, setActiveNode] = useState<SystemNode>(NODES[0]);

  return (
    <section
      id="system-visualization-section"
      style={{
        position: 'relative',
        backgroundColor: '#FFFFFF',
        color: '#101820',
        padding: 'clamp(80px, 12vh, 160px) clamp(24px, 6vw, 96px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {/* Editorial Subtitle */}
        <div style={{ marginBottom: 'clamp(40px, 6vh, 64px)' }}>
          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#FF8200',
              marginBottom: '16px',
            }}
          >
            INTERCONNECTED TOPOLOGY · ARCHITECTURAL DIAGRAM
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(2.2rem, 4vw, 3.8rem)',
              fontWeight: 450,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              margin: '0 0 16px 0',
              color: '#101820',
            }}
          >
            All Signals Converge at
            <br />
            <span style={{ color: '#5B6871' }}>Campus Intelligence.</span>
          </h2>

          <p style={{ fontSize: '0.95rem', color: '#5B6871', maxWidth: '640px', lineHeight: 1.6, margin: 0 }}>
            Every sensor, optical feed, and door actuator streams into a singular nervous system. Select any node below to inspect its data flow.
          </p>
        </div>

        {/* Interactive Architectural Canvas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(32px, 4vw, 56px)',
            alignItems: 'center',
          }}
        >
          {/* Left: Node Selector Matrix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {NODES.map((node) => {
              const isSelected = activeNode.id === node.id;
              const Icon = node.icon;
              return (
                <motion.div
                  key={node.id}
                  onClick={() => setActiveNode(node)}
                  whileHover={{ x: 6 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor: isSelected ? '#101820' : 'rgba(16, 24, 32, 0.03)',
                    color: isSelected ? '#FFFFFF' : '#101820',
                    border: `1px solid ${isSelected ? '#101820' : 'rgba(16, 24, 32, 0.08)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? 'rgba(255, 130, 0, 0.2)' : 'rgba(16, 24, 32, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? '#FF8200' : '#5B6871',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                          fontSize: '0.625rem',
                          letterSpacing: '0.12em',
                          color: isSelected ? '#FF8200' : '#7C8A96',
                        }}
                      >
                        {node.category}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                          fontSize: '1rem',
                          fontWeight: 500,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {node.name}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: '0.688rem',
                      color: isSelected ? '#ADC2D6' : '#7C8A96',
                    }}
                  >
                    {node.rate}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Central Intelligence Hub Plate */}
          <TiltedCard
            maxAngle={8}
            scaleOnHover={1.02}
            style={{
              backgroundColor: '#101820',
              color: '#FFFFFF',
              borderRadius: '28px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: 'clamp(36px, 5vw, 56px)',
              boxShadow: '0 32px 80px -16px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Live Hub Telemetry Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#FF8200" />
                <span
                  style={{
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.688rem',
                    letterSpacing: '0.14em',
                    color: '#8C9BA5',
                  }}
                >
                  AUTONOMIC ROUTER · SYNAPSE MESH
                </span>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: '0.625rem',
                  color: '#22C55E',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22C55E' }} />
                SYNCHRONIZED
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeNode.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.75rem',
                    color: '#FF8200',
                    letterSpacing: '0.12em',
                    marginBottom: '12px',
                  }}
                >
                  {activeNode.category}
                </div>

                <h3
                  style={{
                    fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                    fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
                    fontWeight: 500,
                    letterSpacing: '-0.03em',
                    margin: '0 0 16px 0',
                    lineHeight: 1.1,
                    color: '#FFFFFF',
                  }}
                >
                  {activeNode.name}
                </h3>

                <p
                  style={{
                    fontSize: '1rem',
                    color: '#ADC2D6',
                    lineHeight: 1.6,
                    marginBottom: '32px',
                    maxWidth: '480px',
                  }}
                >
                  {activeNode.description}
                </p>

                {/* Live Node Signal Specs */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px',
                    padding: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        fontSize: '0.625rem',
                        color: '#7C8A96',
                        letterSpacing: '0.1em',
                        marginBottom: '6px',
                      }}
                    >
                      CURRENT NODE STATUS
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        fontSize: '0.85rem',
                        color: '#FFFFFF',
                        fontWeight: 600,
                      }}
                    >
                      {activeNode.status}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        fontSize: '0.625rem',
                        color: '#7C8A96',
                        letterSpacing: '0.1em',
                        marginBottom: '6px',
                      }}
                    >
                      INTELLIGENCE BENCHMARK
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        fontSize: '0.85rem',
                        color: '#FF8200',
                        fontWeight: 600,
                      }}
                    >
                      {activeNode.metric}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Subtle background glow */}
            <div
              style={{
                position: 'absolute',
                top: '-30%',
                right: '-30%',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 130, 0, 0.15) 0%, transparent 70%)',
                filter: 'blur(50px)',
                pointerEvents: 'none',
              }}
            />
          </TiltedCard>
        </div>
      </div>
    </section>
  );
};
