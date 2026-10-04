import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type CSSProperties,
} from 'react';
import {
  useAnimate,
  useInView,
  useReducedMotion,
  type AnimationOptions,
  type ValueAnimationTransition,
} from 'framer-motion';
import { cn } from '../../lib/utils';

const HAS_SEGMENTER = typeof Intl !== 'undefined' && 'Segmenter' in Intl;

const splitIntoCharacters = (text: string): string[] => {
  if (HAS_SEGMENTER) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), ({ segment }) => segment);
  }
  return Array.from(text);
};

const extractTextFromChildren = (children: React.ReactNode): string => {
  if (children == null) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }

  if (React.isValidElement(children)) {
    if (children.type === 'br') return '\n';
    const props = children.props as Record<string, unknown>;
    const childText = props.children as React.ReactNode;
    if (childText != null) {
      return extractTextFromChildren(childText);
    }
  }

  return '';
};

const ROTATION_MAP = {
  top: 'rotateX(-90deg)',
  right: 'rotateY(90deg)',
  bottom: 'rotateX(90deg)',
  left: 'rotateY(-90deg)',
} as const;

const DEFAULT_TRANSITION: ValueAnimationTransition = {
  type: 'spring',
  damping: 25,
  stiffness: 160,
};

export interface Text3DFlipProps {
  children: React.ReactNode;
  as?: ElementType;
  className?: string;
  textClassName?: string;
  style?: CSSProperties;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | number | 'random';
  transition?: ValueAnimationTransition | AnimationOptions;
  rotateDirection?: 'top' | 'right' | 'bottom' | 'left';
  once?: boolean;
  triggerOnHover?: boolean;
}

/**
 * Text3DFlip
 * 
 * An editorial text entrance animation that flips individual characters in 3D
 * while strictly preserving normal font kerning, character spacing, word spacing,
 * and text flow without any horizontal layout distribution or flexbox spacing.
 */
export function Text3DFlip({
  children,
  as: ElementTag = 'span',
  className = '',
  textClassName = '',
  style,
  staggerDuration = 0.03,
  staggerFrom = 'first',
  transition = DEFAULT_TRANSITION,
  rotateDirection = 'top',
  once = true,
  triggerOnHover = true,
  ...props
}: Text3DFlipProps) {
  const isAnimatingRef = useRef(false);
  const hasAnimatedRef = useRef(false);
  const isMountedRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const [hasEntered, setHasEntered] = useState(false);
  const [scope, animate] = useAnimate();

  const isInView = useInView(scope, {
    once,
    margin: '-20px 0px',
  });

  const text = useMemo(() => {
    try {
      return extractTextFromChildren(children);
    } catch {
      return '';
    }
  }, [children]);

  // Split by newline to preserve intentional editorial line breaks
  const lines = useMemo(() => {
    return text.split('\n').map((line) => {
      const words = line.split(' ').filter(Boolean);
      return words.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1,
      }));
    });
  }, [text]);

  // Total characters count for stagger timing
  const totalChars = useMemo(() => {
    let count = 0;
    lines.forEach((line) => {
      line.forEach((wordObj) => {
        count += wordObj.characters.length;
      });
    });
    return count;
  }, [lines]);

  const getStaggerDelay = useCallback(
    (index: number, count: number) => {
      if (staggerFrom === 'first') return index * staggerDuration;
      if (staggerFrom === 'last') return (count - 1 - index) * staggerDuration;
      if (staggerFrom === 'center') {
        const center = Math.floor(count / 2);
        return Math.abs(center - index) * staggerDuration;
      }
      if (staggerFrom === 'random') {
        const randomIndex = Math.floor(Math.random() * count);
        return Math.abs(randomIndex - index) * staggerDuration;
      }
      return Math.abs(staggerFrom - index) * staggerDuration;
    },
    [staggerFrom, staggerDuration]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      isAnimatingRef.current = false;
    };
  }, []);

  const initialTransform = ROTATION_MAP[rotateDirection];

  // Viewport entrance animation
  useEffect(() => {
    if (shouldReduceMotion) {
      setHasEntered(true);
      return;
    }

    if (isInView && !hasAnimatedRef.current && isMountedRef.current) {
      hasAnimatedRef.current = true;
      isAnimatingRef.current = true;

      animate(
        '.text-3d-flip-char',
        {
          transform: [initialTransform, 'rotateX(0deg) rotateY(0deg)'],
          opacity: [0, 1],
        },
        {
          ...transition,
          delay: (i: number) => getStaggerDelay(i, totalChars),
        }
      ).then(() => {
        if (isMountedRef.current) {
          isAnimatingRef.current = false;
          setHasEntered(true);
        }
      });
    }
  }, [isInView, shouldReduceMotion, totalChars, getStaggerDelay, initialTransform, transition, animate]);

  // Subtle hover interaction after initial entrance
  const handleHoverStart = useCallback(async () => {
    if (!triggerOnHover || isAnimatingRef.current || !hasEntered || Boolean(shouldReduceMotion)) return;
    isAnimatingRef.current = true;

    try {
      const hoverEndRotation =
        rotateDirection === 'top' || rotateDirection === 'bottom'
          ? 'rotateX(-360deg)'
          : 'rotateY(360deg)';

      await animate(
        '.text-3d-flip-char',
        { transform: ['rotateX(0deg) rotateY(0deg)', hoverEndRotation] },
        {
          ...transition,
          delay: (i: number) => getStaggerDelay(i, totalChars),
        }
      );

      if (!isMountedRef.current) return;

      await animate(
        '.text-3d-flip-char',
        { transform: 'rotateX(0deg) rotateY(0deg)' },
        { duration: 0 }
      );
    } finally {
      if (isMountedRef.current) {
        isAnimatingRef.current = false;
      }
    }
  }, [
    triggerOnHover,
    hasEntered,
    shouldReduceMotion,
    totalChars,
    getStaggerDelay,
    rotateDirection,
    transition,
    animate,
  ]);

  const isMultiLine = lines.length > 1;

  return (
    <ElementTag
      ref={scope}
      className={cn('text-3d-flip-wrapper', className)}
      style={{
        perspective: '1000px',
        WebkitPerspective: '1000px',
        display: isMultiLine ? 'block' : 'inline',
        margin: 0,
        padding: 0,
        ...style,
      }}
      onMouseEnter={handleHoverStart}
      {...props}
    >
      <span className="sr-only">{text}</span>

      <span
        aria-hidden="true"
        style={{
          display: isMultiLine ? 'block' : 'inline',
          margin: 0,
          padding: 0,
        }}
      >
        {lines.map((lineWords, lineIndex) => (
          <span
            key={lineIndex}
            className="text-3d-flip-line"
            style={{
              display: isMultiLine ? 'block' : 'inline',
              margin: 0,
              padding: 0,
            }}
          >
            {lineWords.map((wordObj, wordIndex) => (
              <React.Fragment key={wordIndex}>
                <span
                  className="text-3d-flip-word"
                  style={{
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    margin: 0,
                    padding: 0,
                  }}
                >
                  {wordObj.characters.map((char, charIndex) => (
                    <span
                      key={charIndex}
                      className={cn('text-3d-flip-char', textClassName)}
                      style={{
                        display: 'inline-block',
                        transformStyle: 'preserve-3d',
                        WebkitTransformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transformOrigin: '50% 50%',
                        transform: hasEntered || Boolean(shouldReduceMotion) ? 'none' : initialTransform,
                        opacity: hasEntered || Boolean(shouldReduceMotion) ? 1 : 0,
                        margin: 0,
                        padding: 0,
                        lineHeight: 'inherit',
                        letterSpacing: 'inherit',
                        verticalAlign: 'baseline',
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
                {wordObj.needsSpace && ' '}
              </React.Fragment>
            ))}
          </span>
        ))}
      </span>
    </ElementTag>
  );
}

Text3DFlip.displayName = 'Text3DFlip';

export default Text3DFlip;
