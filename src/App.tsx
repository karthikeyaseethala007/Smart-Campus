import React from 'react';
import { ThemeProvider } from './services/themeContext';
import { StateProvider, useAppState } from './services/stateContext';
import { AppShell } from './components/layout/AppShell';
import { LandingView } from './views/LandingView';
import { LoginView } from './views/LoginView';
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

const SessionVerifyingScreen: React.FC = () => (
  <div
    role="status"
    aria-label="Verifying Security Gateway Session"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--surface-canvas, #031819)',
      color: 'var(--color-ink-black, #f5f7fa)',
      fontFamily: "var(--font-display, 'Outfit', sans-serif)",
      padding: '24px',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        backgroundColor: 'rgba(255, 130, 0, 0.1)',
        border: '1px solid rgba(255, 130, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          border: '2px solid rgba(255, 130, 0, 0.2)',
          borderTopColor: '#FF8200',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
    <div
      style={{
        fontSize: '0.75rem',
        fontFamily: "var(--font-mono, monospace)",
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#FF8200',
        marginBottom: '8px',
      }}
    >
      SECURITY GATEWAY
    </div>
    <h2
      style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        margin: '0 0 8px 0',
        color: 'var(--color-text-primary, #ffffff)',
        letterSpacing: '-0.02em',
      }}
    >
      VERIFYING SESSION
    </h2>
    <p
      style={{
        fontSize: '0.875rem',
        color: 'var(--color-slate-gray, #8A8F8D)',
        margin: 0,
        maxWidth: '360px',
        lineHeight: 1.5,
      }}
    >
      Validating institutional authority and RBAC credentials against Campus Gateway...
    </p>
  </div>
);

const AppContent: React.FC = () => {
  const { activeTab, authBootstrapState } = useAppState();

  if (activeTab === 'landing') {
    return <LandingView />;
  }

  if (activeTab === 'login') {
    return <LoginView />;
  }

  // Phase 4: Session verification bootstrap state prevents flash of unverified Command Center
  if (authBootstrapState === 'AUTHENTICATION_VERIFYING') {
    return <SessionVerifyingScreen />;
  }

  if (authBootstrapState === 'UNAUTHENTICATED') {
    return <LoginView />;
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
