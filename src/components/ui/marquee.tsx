import { type ComponentPropsWithoutRef, type CSSProperties } from 'react';
import { cn } from '../../lib/utils';

export interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  /**
   * Optional CSS class name to apply custom styles
   */
  className?: string;
  /**
   * Whether to reverse the animation direction
   * @default false
   */
  reverse?: boolean;
  /**
   * Whether to pause the animation on hover
   * @default false
   */
  pauseOnHover?: boolean;
  /**
   * Content to be displayed in the marquee
   */
  children: React.ReactNode;
  /**
   * Whether to animate vertically instead of horizontally
   * @default false
   */
  vertical?: boolean;
  /**
   * Number of times to repeat the content for seamless looping
   * @default 4
   */
  repeat?: number;
}

/**
 * Marquee Component (Magic UI compatible)
 * 
 * An infinite continuous scrolling component that gracefully moves content horizontally
 * or vertically with pause-on-hover capability and seamless mathematical looping.
 */
export function Marquee({
  className = '',
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  style,
  ...props
}: MarqueeProps) {
  // Extract arbitrary CSS variable values from className if supplied (e.g. "[--duration:32s]", "[--gap:1.5rem]")
  const durationMatch = className.match(/\[--duration:([^\]]+)\]/);
  const gapMatch = className.match(/\[--gap:([^\]]+)\]/);

  const customStyle: CSSProperties = {
    ...(durationMatch ? { ['--duration' as any]: durationMatch[1] } : {}),
    ...(gapMatch ? { ['--gap' as any]: gapMatch[1] } : {}),
    ...style,
  };

  return (
    <div
      {...props}
      style={customStyle}
      className={cn(
        'magicui-marquee group flex gap-[var(--gap)] overflow-hidden p-2 [--duration:32s] [--gap:24px]',
        vertical ? 'magicui-marquee-col flex-col' : 'magicui-marquee-row flex-row',
        reverse && 'magicui-marquee-reverse',
        pauseOnHover && 'magicui-marquee-pause-hover',
        className
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn(
              'magicui-marquee-content flex shrink-0 justify-around gap-[var(--gap)]',
              vertical ? 'magicui-marquee-content-vertical flex-col' : 'magicui-marquee-content-horizontal flex-row',
              reverse && 'marquee-reverse-dir',
              pauseOnHover && 'group-hover:[animation-play-state:paused]'
            )}
            aria-hidden={i > 0 ? true : undefined}
          >
            {children}
          </div>
        ))}
    </div>
  );
}

export default Marquee;
