import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';

export interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerDuration?: string;
  borderRadius?: string;
  background?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * ShimmerButton
 * 
 * An editorial, restrained pill button featuring a subtle light shimmer micro-interaction
 * that glides across the surface on hover/focus.
 * Built for the Steep "Serif Analytics on Warm Paper" design system.
 */
export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = 'rgba(255, 255, 255, 0.22)',
      shimmerDuration = '1.1s',
      borderRadius = '9999px',
      background = 'var(--color-ink-black, #17191c)',
      className = '',
      style = {},
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`shimmer-button ${className}`.trim()}
        style={
          {
            borderRadius,
            backgroundColor: background,
            ...style,
          } as CSSProperties
        }
        {...props}
      >
        <span
          className="shimmer-sweep"
          style={
            {
              background: `linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.04) 38%, ${shimmerColor} 50%, rgba(255, 255, 255, 0.04) 62%, transparent 80%)`,
              animationDuration: shimmerDuration,
            } as CSSProperties
          }
          aria-hidden="true"
        />
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            lineHeight: 'inherit',
          }}
        >
          {children}
        </span>
      </button>
    );
  }
);

ShimmerButton.displayName = 'ShimmerButton';

export default ShimmerButton;
