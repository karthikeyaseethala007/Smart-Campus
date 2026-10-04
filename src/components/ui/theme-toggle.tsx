import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../services/themeContext';

export interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}

/**
 * ThemeToggle
 *
 * Compact circular theme toggle matching Steep editorial aesthetics.
 * Features:
 * - Animated icon transition between Sun and Moon using Framer Motion.
 * - Passes click event coordinates to toggleTheme for localized View Transition ripple origin.
 * - Keyboard accessible with Space and Enter.
 * - Screen-reader accessible with dynamic aria-label.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  style = {},
  size = 34,
}) => {
  const { isDark, toggleTheme } = useTheme();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    toggleTheme(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`theme-toggle-btn ${className}`.trim()}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '9999px',
        border: 'var(--border-hairline)',
        backgroundColor: 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--color-ink-black)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-mist-gray)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <motion.div
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        {isDark ? (
          <Moon size={16} strokeWidth={1.8} />
        ) : (
          <Sun size={16} strokeWidth={1.8} />
        )}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
