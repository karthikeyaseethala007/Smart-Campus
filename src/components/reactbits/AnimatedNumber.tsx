import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  style = {},
  className = '',
}) => {
  const spring = useSpring(value, { damping: 28, stiffness: 180 });
  const display = useTransform(spring, (latest) => `${prefix}${latest.toFixed(decimals)}${suffix}`);
  const [currentText, setCurrentText] = useState(`${prefix}${value.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsub = display.on('change', (v) => setCurrentText(v));
    return () => unsub();
  }, [display]);

  return (
    <motion.span className={className} style={{ display: 'inline-block', fontVariantNumeric: 'tabular-nums', ...style }}>
      {currentText}
    </motion.span>
  );
};
