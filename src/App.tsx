import React from 'react';
import { ThemeProvider } from './services/themeContext';
import { StateProvider, useAppState } from './services/stateContext';
import { AppShell } from './components/layout/AppShell';
import { LandingView } from './views/LandingView';
import { OverviewView } from './views/OverviewView';
import { MonitoringView } from './views/MonitoringView';
import { AccessControlView } from './views/AccessControlView';
import { SafetyView } from './views/SafetyView';
import { EnergyView } from './views/EnergyView';
import { AutomationView } from './views/AutomationView';
import { DevicesView } from './views/DevicesView';
import { IncidentsView } from './views/IncidentsView';
import { UsersView } from './views/UsersView';
import { SettingsView } from './views/SettingsView';
import { IncidentDetailModal } from './components/incidents/IncidentDetailModal';
import { DeviceDetailModal } from './components/devices/DeviceDetailModal';
import { SmoothCursor } from '@/registry/magicui/smooth-cursor';
import { PageTransitionProvider, PageTransitionOverlay } from './components/layout/PageTransition';

const AppContent: React.FC = () => {
  const { activeTab } = useAppState();

  if (activeTab === 'landing') {
    return <LandingView />;
  }

  return (
    <>
      <SmoothCursor />
      <AppShell>
        {(() => {
          switch (activeTab) {
            case 'overview':
              return <OverviewView />;
            case 'monitoring':
              return <MonitoringView />;
            case 'security':
              return <AccessControlView />;
            case 'safety':
              return <SafetyView />;
            case 'energy':
              return <EnergyView />;
            case 'automation':
              return <AutomationView />;
            case 'devices':
              return <DevicesView />;
            case 'incidents':
              return <IncidentsView />;
            case 'users':
              return <UsersView />;
            case 'settings':
              return <SettingsView />;
            default:
              return <OverviewView />;
          }
        })()}
      </AppShell>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <StateProvider>
        <PageTransitionProvider>
          <AppContent />
          <PageTransitionOverlay />
          <IncidentDetailModal />
          <DeviceDetailModal />
        </PageTransitionProvider>
      </StateProvider>
    </ThemeProvider>
  );
};


export default App;
