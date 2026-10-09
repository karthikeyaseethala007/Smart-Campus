import React, { 
  createContext, 
  useContext, 
  useState, 
  useRef, 
  useEffect, 
  type ReactNode 
} from 'react';
import { motion } from 'framer-motion';
import { useAppState } from '../../services/stateContext';
import { useTheme } from '../../services/themeContext';
import { authService } from '../../services/authService';
import type { NavigationTab } from '../../types';

export type TransitionState = 'IDLE' | 'ENTERING' | 'NAVIGATING' | 'EXITING';

interface PageTransitionContextType {
  transitionState: TransitionState;
  isTransitioning: boolean;
  startOperationsTransition: (targetRoute?: NavigationTab) => void;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

const NUM_COLUMNS = 5;
const EASE_CURVE: [number, number, number, number] = [0.76, 0, 0.24, 1]; // Editorial cubic-bezier easeInOut
const ENTER_DURATION = 0.46; // Per panel
const ENTER_STAGGER = 0.055;
const EXIT_DURATION = 0.42; // Per panel
const EXIT_STAGGER = 0.048;

export const PageTransitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setActiveTab } = useAppState();
  const [transitionState, setTransitionState] = useState<TransitionState>('IDLE');
  const transitionStateRef = useRef<TransitionState>('IDLE');
  const isNavigatingRef = useRef(false);
  const targetRouteRef = useRef<NavigationTab>('overview');

  // Keep ref synchronized for rapid event checks
  useEffect(() => {
    transitionStateRef.current = transitionState;
  }, [transitionState]);

  // Deterministic safety timeout to guarantee user is never trapped
  useEffect(() => {
    if (transitionState !== 'IDLE') {
      const safetyTimer = setTimeout(() => {
        if (transitionStateRef.current !== 'IDLE') {
          console.warn('[PageTransition] Safety timeout triggered. Resetting transition state.');
          setTransitionState('IDLE');
          isNavigatingRef.current = false;
        }
      }, 2500);
      return () => clearTimeout(safetyTimer);
    }
  }, [transitionState]);

  const startOperationsTransition = (targetRoute: NavigationTab = 'overview') => {
    // Prevent duplicate triggers if already transitioning
    if (transitionStateRef.current !== 'IDLE' || isNavigatingRef.current) {
      return;
    }

    // Route unauthenticated requests to /login
    const effectiveTarget = (!authService.isAuthenticated() && targetRoute !== 'landing')
      ? 'login'
      : targetRoute;

    targetRouteRef.current = effectiveTarget;

    // Respect prefers-reduced-motion
    const prefersReducedMotion = 
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setActiveTab(effectiveTarget);
      return;
    }

    // Phase 1 & 2: Start transition overlay
    isNavigatingRef.current = true;
    setTransitionState('ENTERING');

    // Calculate time when screen becomes completely covered:
    // Set 1 max time = (NUM_COLUMNS - 1) * ENTER_STAGGER + ENTER_DURATION = 4 * 0.055 + 0.46 = 0.68s
    // Set 2 max time = 0.12s offset + 4 * 0.055 + 0.46 = 0.80s
    // At ~0.82s, screen is 100% opaque and covered by Set 2
    const coverDurationMs = Math.round((0.12 + (NUM_COLUMNS - 1) * ENTER_STAGGER + ENTER_DURATION) * 1000) + 10;

    setTimeout(() => {
      // Phase 5 & 6: Cover complete -> Switch route to Operations or Login
      setTransitionState('NAVIGATING');
      try {
        if (typeof window !== 'undefined') {
          let newPath = '/app';
          if (targetRouteRef.current === 'landing') newPath = '/';
          else if (targetRouteRef.current === 'login') newPath = '/login';

          if (window.location.pathname !== newPath) {
            window.history.pushState(null, '', newPath);
          }
        }
        setActiveTab(targetRouteRef.current);
      } catch (err) {
        console.error('[PageTransition] Navigation failed:', err);
      }

      // Phase 7: Allow a brief frame for Operations homepage to render underneath
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Phase 8: Retract overlay / reveal Operations homepage
          setTransitionState('EXITING');

          // Phase 9: Wait for exit animation to finish, then restore IDLE
          const exitDurationMs = Math.round((0.10 + (NUM_COLUMNS - 1) * EXIT_STAGGER + EXIT_DURATION) * 1000) + 20;
          setTimeout(() => {
            setTransitionState('IDLE');
            isNavigatingRef.current = false;
          }, exitDurationMs);
        }, 80);
      });
    }, coverDurationMs);
  };

  const isTransitioning = transitionState !== 'IDLE';

  return (
    <PageTransitionContext.Provider
      value={{
        transitionState,
        isTransitioning,
        startOperationsTransition
      }}
    >
      {children}
    </PageTransitionContext.Provider>
  );
};

export const usePageTransition = (): PageTransitionContextType => {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider');
  }
  return context;
};

/**
 * Skiper UI — Double Stairs Preloader
 * Full-screen page transition overlay featuring two staggered sets of staircase panel columns.
 */
export const PageTransitionOverlay: React.FC = () => {
  const { transitionState, isTransitioning } = usePageTransition();
  const { isDark } = useTheme();

  if (!isTransitioning) {
    return null;
  }

  // Theme-aware palette from Steep Design System
  // Layer 1 (Set 1 background staircase): dark graphite/slate ink with subtle elevation
  const set1Color = isDark ? '#141619' : '#23262a';
  // Layer 2 (Set 2 foreground staircase): steep ink black
  const set2Color = isDark ? '#1a1d21' : '#17191c';

  const isExiting = transitionState === 'EXITING';

  return (
    <div
      id="double-stairs-preloader"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        pointerEvents: 'auto',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Set 1: First Staircase Panel Columns (Cascades down left-to-right) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          zIndex: 1
        }}
      >
        {Array.from({ length: NUM_COLUMNS }).map((_, i) => {
          // Enter: cascades left-to-right (0 to 4)
          const enterDelay = i * ENTER_STAGGER;
          // Exit: retracts down right-to-left (4 to 0) with slight offset
          const exitDelay = 0.08 + (NUM_COLUMNS - 1 - i) * EXIT_STAGGER;

          return (
            <motion.div
              key={`stairs-set1-${i}`}
              initial={{ y: '-100%' }}
              animate={{ y: isExiting ? '100%' : '0%' }}
              transition={{
                duration: isExiting ? EXIT_DURATION : ENTER_DURATION,
                delay: isExiting ? exitDelay : enterDelay,
                ease: EASE_CURVE
              }}
              style={{
                position: 'relative',
                flex: 1,
                height: '100%',
                backgroundColor: set1Color,
                borderRight: i < NUM_COLUMNS - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                // Overlap by 1px to prevent subpixel seam rendering gaps
                width: `calc(100% / ${NUM_COLUMNS} + 1px)`,
                marginRight: i < NUM_COLUMNS - 1 ? '-1px' : '0px',
                willChange: 'transform'
              }}
            />
          );
        })}
      </div>

      {/* Set 2: Second Staircase Panel Columns (Follows in opposite direction: cascades right-to-left) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          zIndex: 2
        }}
      >
        {Array.from({ length: NUM_COLUMNS }).map((_, i) => {
          // Enter: follows Set 1 with delay, cascading right-to-left (4 down to 0)
          const enterDelay = 0.12 + (NUM_COLUMNS - 1 - i) * ENTER_STAGGER;
          // Exit: retracts down left-to-right (0 to 4)
          const exitDelay = i * EXIT_STAGGER;

          return (
            <motion.div
              key={`stairs-set2-${i}`}
              initial={{ y: '-100%' }}
              animate={{ y: isExiting ? '100%' : '0%' }}
              transition={{
                duration: isExiting ? EXIT_DURATION : ENTER_DURATION,
                delay: isExiting ? exitDelay : enterDelay,
                ease: EASE_CURVE
              }}
              style={{
                position: 'relative',
                flex: 1,
                height: '100%',
                backgroundColor: set2Color,
                borderRight: i < NUM_COLUMNS - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                // Overlap by 1px to prevent subpixel seam rendering gaps
                width: `calc(100% / ${NUM_COLUMNS} + 1px)`,
                marginRight: i < NUM_COLUMNS - 1 ? '-1px' : '0px',
                boxShadow: '0 0 24px rgba(0, 0, 0, 0.4)',
                willChange: 'transform'
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
