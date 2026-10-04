import React, { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  className?: string;
  background?: ReactNode;
  Icon?: React.ComponentType<{ className?: string; size?: number | string }>;
  description?: string;
  href?: string;
  cta?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
}

/**
 * BentoGrid provides a balanced editorial grid layout for bento-style cards.
 */
export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  className,
  style,
  ...props
}) => {
  return (
    <div
      className={cn('bento-grid', className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * BentoCard provides a rounded card with a background visual layer,
 * subtle hover elevation, restrained scale, and foreground interactive layer.
 */
export const BentoCard: React.FC<BentoCardProps> = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  children,
  style,
  ...props
}) => {
  return (
    <div
      className={cn('bento-card', className)}
      style={style}
      {...props}
    >
      {/* Background visual/content layer */}
      {background && <div className="bento-card-bg">{background}</div>}

      {/* Subtle radial warmth hover overlay */}
      <div className="bento-card-overlay" aria-hidden="true" />

      {/* Foreground content layer */}
      <div className="bento-card-content">
        {children ? (
          children
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', position: 'relative', zIndex: 2 }}>
            {Icon && (
              <div style={{ color: 'var(--color-ink-black)', marginBottom: '8px' }}>
                <Icon size={24} />
              </div>
            )}
            {name && (
              <h3 style={{ fontFamily: 'var(--font-signifier)', fontSize: '20px', fontWeight: 400, color: 'var(--color-ink-black)' }}>
                {name}
              </h3>
            )}
            {description && (
              <p style={{ fontSize: '14px', color: 'var(--color-slate-gray)', lineHeight: 1.5 }}>
                {description}
              </p>
            )}
            {cta && href && (
              <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                <a
                  href={href}
                  className="pill-btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{cta}</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BentoCard;
