import { type CSSProperties, type ReactNode } from 'react';

export interface CapabilityItem {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
}

export interface CapabilityCardProps {
  capability: CapabilityItem;
  className?: string;
  style?: CSSProperties;
}

/**
 * CapabilityCard
 * 
 * Individual Steep neutral card representing an operational capability of the
 * Smart Campus Security System. Preserves the mist-gray surface, Signifier serif title,
 * and subdued Slate Gray body copy.
 */
export function CapabilityCard({ capability, className = '', style }: CapabilityCardProps) {
  return (
    <div
      className={`capability-marquee-card ${className}`.trim()}
      style={style}
    >
      <div className="capability-marquee-card-icon" aria-hidden="true">
        {capability.icon}
      </div>
      <h3 className="capability-marquee-card-title">
        {capability.title}
      </h3>
      <p className="capability-marquee-card-desc">
        {capability.description}
      </p>
    </div>
  );
}

export default CapabilityCard;
