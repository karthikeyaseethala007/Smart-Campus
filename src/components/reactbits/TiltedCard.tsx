import React, { useRef, useState, type ReactNode } from 'react';
import { motion, useSpring } from 'framer-motion';

interface TiltedCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxAngle?: number;
  scaleOnHover?: number;
  showGlare?: boolean;
}

export const TiltedCard: React.FC<TiltedCardProps> = ({
  children,
  className = '',
  style = {},
  maxAngle = 10,
  scaleOnHover = 1.025,
  showGlare = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const springConfig = { damping: 24, stiffness: 220, mass: 0.1 };
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);
  const scale = useSpring(1, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    const rotX = ((y / rect.height) - 0.5) * -maxAngle * 2;
    const rotY = ((x / rect.width) - 0.5) * maxAngle * 2;

    rotateX.set(rotX);
    rotateY.set(rotY);

    if (showGlare) {
      setGlarePos({ x: xPercent, y: yPercent, opacity: 0.15 });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    scale.set(scaleOnHover);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
    if (showGlare) {
      setGlarePos((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={className}
      data-hovered={isHovered}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
        rotateX,
        rotateY,
        scale,
        position: 'relative',
        ...style,
      }}
    >
      {children}

      {showGlare && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            background: `radial-gradient(circle 350px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${glarePos.opacity}), transparent 80%)`,
            transition: 'opacity 0.25s ease',
            zIndex: 10,
          }}
        />
      )}
    </motion.div>
  );
};
