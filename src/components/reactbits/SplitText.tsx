import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  style?: React.CSSProperties;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 0,
  stagger = 0.035,
  style = {},
  tag: Tag = 'div',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-10% 0px -10% 0px' });

  const words = text.split(' ');

  return (
    <Tag ref={ref as any} className={className} style={{ display: 'inline-block', ...style }}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.28em' }}>
          {word.split('').map((char, charIndex) => {
            const index = wordIndex * 5 + charIndex;
            return (
              <motion.span
                key={charIndex}
                style={{ display: 'inline-block' }}
                initial={{ opacity: 0, y: '35%', rotateX: -30 }}
                animate={isInView ? { opacity: 1, y: '0%', rotateX: 0 } : { opacity: 0, y: '35%', rotateX: -30 }}
                transition={{
                  duration: 0.65,
                  delay: delay + index * stagger,
                  ease: [0.215, 0.61, 0.355, 1], // Cubic-out
                }}
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
};
