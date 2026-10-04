import React, { createContext, useContext, useEffect, useState, useRef, useMemo, type ReactNode } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: (event?: React.MouseEvent | { clientX: number; clientY: number }) => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'smart-campus-theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paramTheme = urlParams.get('theme');
      if (paramTheme === 'dark' || paramTheme === 'light') {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, paramTheme);
        } catch {}
        return paramTheme;
      }
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  const isTransitioningRef = useRef(false);

  const applyThemeToDOM = (nextTheme: Theme) => {
    const isDark = nextTheme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // ignore storage access restrictions
    }
  };

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    applyThemeToDOM(nextTheme);
  };

  const toggleTheme = (event?: React.MouseEvent | { clientX: number; clientY: number }) => {
    // Prevent overlapping rapid clicks during active view transition
    if (isTransitioningRef.current) return;

    // Determine next theme using current DOM state to guarantee freshness
    const currentIsDark = document.documentElement.classList.contains('dark');
    const nextTheme: Theme = currentIsDark ? 'light' : 'dark';

    // Check if reduced motion is requested by the user
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Feature detection for View Transitions API
    const hasViewTransitions = typeof document !== 'undefined' &&
      typeof (document as any).startViewTransition === 'function';

    if (!hasViewTransitions || prefersReducedMotion) {
      // Graceful fallback: switch immediately
      applyThemeToDOM(nextTheme);
      setThemeState(nextTheme);
      return;
    }

    // Determine circular reveal origin (fast CSS variable set on root, no stylesheet invalidation)
    if (event && 'clientX' in event && typeof event.clientX === 'number') {
      document.documentElement.style.setProperty('--theme-reveal-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--theme-reveal-y', `${event.clientY}px`);
    } else {
      document.documentElement.style.setProperty('--theme-reveal-x', '50%');
      document.documentElement.style.setProperty('--theme-reveal-y', '50%');
    }

    isTransitioningRef.current = true;

    const unlock = () => {
      isTransitioningRef.current = false;
    };

    // Safety timeout ensures lock is always released even if compositor pauses (e.g. background tab or headless)
    const safetyTimer = setTimeout(unlock, 600);

    try {
      const transition = (document as any).startViewTransition(() => {
        // Synchronously apply theme class to DOM and flush React state so new snapshot is immediate
        applyThemeToDOM(nextTheme);
        flushSync(() => {
          setThemeState(nextTheme);
        });
      });

      transition.finished
        .finally(() => {
          clearTimeout(safetyTimer);
          unlock();
        });
    } catch {
      // Fallback if execution throws
      clearTimeout(safetyTimer);
      applyThemeToDOM(nextTheme);
      setThemeState(nextTheme);
      unlock();
    }
  };

  const isDark = theme === 'dark';

  const contextValue = useMemo(() => ({
    theme,
    isDark,
    toggleTheme,
    setTheme,
  }), [theme, isDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
