import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

export type InteractiveHoverButtonVariant = 
  | 'default'
  | 'ghost' 
  | 'filled' 
  | 'sienna' 
  | 'sienna-filled';

export interface InteractiveHoverButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: InteractiveHoverButtonVariant;
  icon?: ReactNode;
  hoverIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * InteractiveHoverButton
 * 
 * An operational Steep action button featuring a restrained expanding center dot
 * and subtle arrow translation on hover. Built for meaningful user-triggered actions
 * in the Smart Campus Security System.
 */
export const InteractiveHoverButton = forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(
  (
    {
      variant = 'ghost',
      icon,
      hoverIcon = <ArrowRight size={13} />,
      className = '',
      children,
      style,
      ...props
    },
    ref
  ) => {
    const variantKey = variant === 'default' ? 'ghost' : variant;
    const variantClass = `interactive-hover-btn-${variantKey}`;

    return (
      <button
        ref={ref}
        className={`interactive-hover-btn ${variantClass} ${className}`.trim()}
        style={style}
        {...props}
      >
        {/* Idle View */}
        <span className="interactive-hover-btn-idle">
          <span className="interactive-hover-btn-dot" aria-hidden="true" />
          {icon && <span className="interactive-hover-btn-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          <span>{children}</span>
        </span>

        {/* Hover View */}
        <span className="interactive-hover-btn-hover" aria-hidden="true">
          {icon && <span className="interactive-hover-btn-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          <span>{children}</span>
          {hoverIcon}
        </span>
      </button>
    );
  }
);

InteractiveHoverButton.displayName = 'InteractiveHoverButton';

export default InteractiveHoverButton;
