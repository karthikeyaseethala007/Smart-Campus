import React, { type ReactNode } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ToastContainer } from '../common/ToastContainer';
import { CommandCenterStatusBanner } from './CommandCenterStatusBanner';
import { GlobalSimulationDock } from '../simulation/GlobalSimulationDock';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-canvas)' }}>
      {/* Topmost Technical Telemetry Status Banner */}
      <CommandCenterStatusBanner />

      {/* Top Header */}
      <TopBar />

      {/* Main Workspace Stage */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Minimalist Sidebar */}
        <Sidebar />

        {/* Scrollable Main Operations Stage */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: '48px 48px 96px 48px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--surface-canvas)'
          }}
        >
          <div 
            style={{ 
              maxWidth: 'var(--page-max-width)', 
              width: '100%', 
              margin: '0 auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 'var(--section-gap)' 
            }}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <ConfirmDialog />
      <ToastContainer />
      <GlobalSimulationDock />
    </div>
  );
};
