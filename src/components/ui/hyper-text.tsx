import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ComponentType,
  type RefAttributes,
  type ReactNode,
  isValidElement,
} from 'react';
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type MotionProps,
} from 'framer-motion';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

type CharacterSet = string[] | readonly string[];

const motionElements = {
  article: motion.article,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
  li: motion.li,
  p: motion.p,
  section: motion.section,
  span: motion.span,
} as const;

export type MotionElementType = keyof typeof motionElements;

type HyperTextMotionComponent = ComponentType<
  Omit<HTMLMotionProps<'div'>, 'ref'> & RefAttributes<HTMLElement>
>;

export interface HyperTextProps extends Omit<MotionProps, 'children'> {
  /** The text content to be animated. Supports strings or editorial markup like <em> */
  children: ReactNode;
  /** Optional className for styling */
  className?: string;
  /** Duration of the animation in milliseconds */
  duration?: number;
  /** Delay before animation starts in milliseconds */
  delay?: number;
  /** Component to render as - defaults to div */
  as?: MotionElementType;
  /** Whether to start animation when element comes into view */
  startOnView?: boolean;
  /** Whether to trigger animation on hover */
  animateOnHover?: boolean;
  /** Custom character set for scramble effect */
  characterSet?: CharacterSet;
  /** Custom inline style */
  style?: React.CSSProperties;
  /** Optional element ID */
  id?: string;
  /** Accessibility label */
  'aria-label'?: string;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
}

interface ParsedSegment {
  text: string;
  isItalic: boolean;
  startIndex: number;
  endIndex: number;
  className?: string;
}

function parseChildrenSegments(children: ReactNode): {
  fullText: string;
  segments: ParsedSegment[];
} {
  const segments: ParsedSegment[] = [];
  let fullText = '';

  const processNode = (node: ReactNode, isItalic = false, className?: string) => {
    if (node === null || node === undefined || typeof node === 'boolean') {
      return;
    }
    if (typeof node === 'string' || typeof node === 'number') {
      const str = String(node);
      const startIndex = fullText.length;
      fullText += str;
      segments.push({
        text: str,
        isItalic,
        startIndex,
        endIndex: fullText.length,
        className,
      });
    } else if (isValidElement(node)) {
      const isNodeItalic =
        isItalic ||
        node.type === 'em' ||
        node.type === 'i' ||
        (typeof (node.props as Record<string, unknown>).className === 'string' &&
          ((node.props as Record<string, unknown>).className as string).includes('italic'));
      const nodeClassName = (node.props as Record<string, unknown>).className as string | undefined;
      const nodeChildren = (node.props as Record<string, unknown>).children as ReactNode;

      if (Array.isArray(nodeChildren)) {
        nodeChildren.forEach((child: ReactNode) =>
          processNode(child, isNodeItalic, nodeClassName)
        );
      } else if (nodeChildren !== undefined) {
        processNode(nodeChildren, isNodeItalic, nodeClassName);
      }
    } else if (Array.isArray(node)) {
      node.forEach((child) => processNode(child, isItalic, className));
    }
  };

  processNode(children);

  return { fullText, segments };
}

const DEFAULT_UPPER_SET = Object.freeze(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
) as readonly string[];

const DEFAULT_LOWER_SET = Object.freeze(
  'abcdefghijklmnopqrstuvwxyz'.split('')
) as readonly string[];

const getRandomInt = (max: number): number => Math.floor(Math.random() * max);

function getRandomChar(targetChar: string, customSet?: CharacterSet): string {
  if (customSet && customSet.length > 0) {
    return customSet[getRandomInt(customSet.length)];
  }
  // Preserve spaces to maintain stable word geometry and prevent typography jump
  if (targetChar === ' ') return ' ';
  // Preserve punctuation for natural editorial reading
  if (targetChar === '.' || targetChar === ',' || targetChar === '!' || targetChar === '?') {
    return targetChar;
  }
  // Preserve character casing for typographic harmony in serif fonts
  if (targetChar === targetChar.toUpperCase() && targetChar !== targetChar.toLowerCase()) {
    return DEFAULT_UPPER_SET[getRandomInt(DEFAULT_UPPER_SET.length)];
  }
  return DEFAULT_LOWER_SET[getRandomInt(DEFAULT_LOWER_SET.length)];
}

export function HyperText({
  children,
  className,
  duration = 800,
  delay = 0,
  as: Component = 'div',
  startOnView = false,
  animateOnHover = true,
  characterSet,
  style,
  id,
  'aria-label': ariaLabel,
  onMouseEnter,
  ...props
}: HyperTextProps) {
  const MotionComponent = (motionElements[Component] || motion.div) as HyperTextMotionComponent;
  const prefersReducedMotion = useReducedMotion();

  const { fullText, segments } = parseChildrenSegments(children);
  const [displayText, setDisplayText] = useState<string>(fullText);
  const [isAnimating, setIsAnimating] = useState(false);
  const iterationCount = useRef(0);
  const elementRef = useRef<HTMLElement | null>(null);

  // Synchronize text when children change and not animating
  useEffect(() => {
    if (!isAnimating) {
      setDisplayText(fullText);
    }
  }, [fullText, isAnimating]);

  const handleAnimationTrigger = useCallback(() => {
    if (prefersReducedMotion) return;
    if (animateOnHover && !isAnimating) {
      iterationCount.current = 0;
      setIsAnimating(true);
    }
  }, [animateOnHover, isAnimating, prefersReducedMotion]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    handleAnimationTrigger();
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  // Optional start-on-view trigger
  useEffect(() => {
    if (!startOnView || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timeout = setTimeout(() => {
            setIsAnimating(true);
          }, delay);
          observer.disconnect();
          return () => clearTimeout(timeout);
        }
      },
      { threshold: 0.1, rootMargin: '-30% 0px -30% 0px' }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay, prefersReducedMotion, startOnView]);

  // Scramble character animation frame loop
  useEffect(() => {
    let animationFrameId: number | null = null;

    if (isAnimating && !prefersReducedMotion) {
      const maxIterations = fullText.length;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        iterationCount.current = progress * maxIterations;

        let scrambled = '';
        for (let i = 0; i < fullText.length; i++) {
          const targetChar = fullText[i];
          if (targetChar === ' ') {
            scrambled += ' ';
          } else if (i <= iterationCount.current) {
            scrambled += targetChar;
          } else {
            scrambled += getRandomChar(targetChar, characterSet);
          }
        }

        setDisplayText(scrambled);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          setDisplayText(fullText);
          setIsAnimating(false);
        }
      };

      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [characterSet, duration, fullText, isAnimating, prefersReducedMotion]);

  // At rest or when reduced motion is preferred, render pure static semantic markup
  if (!isAnimating || prefersReducedMotion) {
    return (
      <MotionComponent
        ref={elementRef}
        id={id}
        className={cn(className)}
        style={style}
        onMouseEnter={handleMouseEnter}
        aria-label={ariaLabel || fullText}
        {...props}
      >
        {children}
      </MotionComponent>
    );
  }

  // During active scramble animation, project scrambled characters into their respective typographic segments
  return (
    <MotionComponent
      ref={elementRef}
      id={id}
      className={cn(className)}
      style={style}
      onMouseEnter={handleMouseEnter}
      aria-label={ariaLabel || fullText}
      {...props}
    >
      {segments.map((segment, idx) => {
        const segmentScrambledText = displayText.slice(segment.startIndex, segment.endIndex);
        if (segment.isItalic) {
          return (
            <em key={idx} className={segment.className} style={{ fontStyle: 'italic' }}>
              {segmentScrambledText}
            </em>
          );
        }
        return <React.Fragment key={idx}>{segmentScrambledText}</React.Fragment>;
      })}
    </MotionComponent>
  );
}

export default HyperText;
