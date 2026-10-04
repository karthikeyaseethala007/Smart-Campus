import React from 'react';
import { motion } from 'framer-motion';

interface BlurHighlightProps {
  color?: string;
  size?: number | string;
  blur?: number;
  opacity?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const BlurHighlight: React.FC<BlurHighlightProps> = ({
  color = 'rgba(255, 130, 0, 0.18)',
  size = 500,
  blur = 60,
  opacity = 1,
  style = {},
  className = '',
}) => {
  return (
    <motion.div
      className={className}
      style={{
        position: 'absolute',
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        pointerEvents: 'none',
        opacity,
        zIndex: 0,
        ...style,
      }}
    />
  );
};
