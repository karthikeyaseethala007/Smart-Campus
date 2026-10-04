import React, { createContext, useContext } from 'react';
import { useScroll, MotionValue } from 'framer-motion';

interface ScrollTimelineContextType {
  scrollYProgress: MotionValue<number>;
  scrollY: MotionValue<number>;
}

const ScrollTimelineContext = createContext<ScrollTimelineContextType | null>(null);

export const ScrollTimelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Master page-level scroll timeline across the entire document
  const { scrollYProgress, scrollY } = useScroll();

  return (
    <ScrollTimelineContext.Provider value={{ scrollYProgress, scrollY }}>
      {children}
    </ScrollTimelineContext.Provider>
  );
};

export const usePageScrollTimeline = (): ScrollTimelineContextType => {
  const context = useContext(ScrollTimelineContext);
  if (!context) {
    throw new Error('usePageScrollTimeline must be used within a ScrollTimelineProvider');
  }
  return context;
};
