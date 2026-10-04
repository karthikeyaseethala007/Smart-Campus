import { useReducedMotion } from 'framer-motion';
import { Flame, Lock, Sliders, Zap, Cpu, FileText } from 'lucide-react';
import { Marquee } from '../ui/marquee';
import { CapabilityCard, type CapabilityItem } from './CapabilityCard';

/**
 * Six core Smart Campus Security operational capabilities.
 * Content and icons preserved exactly from product source-of-truth.
 */
export const smartCampusCapabilities: CapabilityItem[] = [
  {
    id: 'safety-fire',
    icon: <Flame size={22} />,
    title: 'Campus Safety & Fire Readiness',
    description:
      'Continuous optical smoke and thermal monitoring. Fire triggers switch the system into high-visibility emergency mode, unlock egress doors, and guide dispatch.',
  },
  {
    id: 'access-control',
    icon: <Lock size={22} />,
    title: 'Confirmed Access Control',
    description:
      'Monitor turnstiles, laboratories, and server vaults. Remote door unlocks require explicit two-step confirmation; students are strictly excluded from door overrides.',
  },
  {
    id: 'room-automation',
    icon: <Sliders size={22} />,
    title: 'Deterministic Room Automation',
    description:
      'Occupancy signals govern lighting and ventilation automatically. Empty lecture halls transition to standby within 10 minutes without manual intervention.',
  },
  {
    id: 'energy-awareness',
    icon: <Zap size={22} />,
    title: 'Sub-Metered Energy Awareness',
    description:
      'Track real-time kWh power curves across buildings. Identify irregular night-time consumption spikes and quantify automated energy reductions.',
  },
  {
    id: 'device-health',
    icon: <Cpu size={22} />,
    title: 'Continuous Device Fleet Health',
    description:
      'Supervise 120+ IoT sensors, gateways, and cameras. Instant telemetry alerts flag low battery levels, packet loss, or disconnected hardware nodes.',
  },
  {
    id: 'incident-ledger',
    icon: <FileText size={22} />,
    title: 'Incident Accountability Ledger',
    description:
      'Every tamper event, alarm acknowledgement, and operational change is permanently recorded with timestamps, actor IDs, and resolution notes.',
  },
];

/**
 * CapabilitiesMarquee
 * 
 * Editorial two-row motion presentation for the Smart Campus capability grid.
 * - Row 1 scrolls leftward (←)
 * - Row 2 scrolls rightward (→)
 * - Restrained duration (32s) for calm, editorial pacing
 * - Pause on hover enabled on both streams
 * - Falls back to a clean static grid if prefers-reduced-motion is active
 */
export function CapabilitiesMarquee() {
  const shouldReduceMotion = useReducedMotion();

  const firstRow = smartCampusCapabilities.slice(0, 3);
  const secondRow = smartCampusCapabilities.slice(3, 6);

  // Accessible fallback when prefers-reduced-motion is enabled
  if (shouldReduceMotion) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          width: '100%',
        }}
      >
        {smartCampusCapabilities.map((capability) => (
          <CapabilityCard key={capability.id} capability={capability} />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        padding: '8px 0',
      }}
    >
      {/* Subtle Warm Paper Edge Fade Overlays */}
      <div className="marquee-edge-fade-left" aria-hidden="true" />
      <div className="marquee-edge-fade-right" aria-hidden="true" />

      {/* Two Horizontal Scrolling Streams */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Row 1: Safety & Fire Readiness, Confirmed Access Control, Deterministic Room Automation (Leftward ←) */}
        <Marquee
          pauseOnHover
          className="[--duration:32s] [--gap:24px]"
          repeat={4}
        >
          {firstRow.map((capability) => (
            <CapabilityCard
              key={capability.id}
              capability={capability}
            />
          ))}
        </Marquee>

        {/* Row 2: Sub-Metered Energy Awareness, Continuous Device Fleet Health, Incident Accountability Ledger (Rightward →) */}
        <Marquee
          reverse
          pauseOnHover
          className="[--duration:32s] [--gap:24px]"
          repeat={4}
        >
          {secondRow.map((capability) => (
            <CapabilityCard
              key={capability.id}
              capability={capability}
            />
          ))}
        </Marquee>
      </div>
    </div>
  );
}

export default CapabilitiesMarquee;
