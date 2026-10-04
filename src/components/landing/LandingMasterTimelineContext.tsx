import React, { createContext, useContext } from 'react';
import type { LandingMasterTimeline } from './useLandingMasterTimeline';

const MasterTimelineContext = createContext<LandingMasterTimeline | null>(null);

export const MasterTimelineProvider: React.FC<{
  timeline: LandingMasterTimeline;
  children: React.ReactNode;
}> = ({ timeline, children }) => {
  return (
    <MasterTimelineContext.Provider value={timeline}>
      {children}
    </MasterTimelineContext.Provider>
  );
};

export function useMasterTimelineContext(): LandingMasterTimeline {
  const ctx = useContext(MasterTimelineContext);
  if (!ctx) {
    throw new Error('useMasterTimelineContext must be used within a MasterTimelineProvider');
  }
  return ctx;
}
