import React, { type ReactNode } from 'react';
import { LayoutDashboard, Video, Lock, FileText, Search } from 'lucide-react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ToastContainer } from '../common/ToastContainer';
import { CommandCenterStatusBanner } from './CommandCenterStatusBanner';
import { GlobalSimulationDock } from '../simulation/GlobalSimulationDock';
import { CommandPaletteModal } from '../common/CommandPaletteModal';
import { useAppState } from '../../services/stateContext';
import './commandCenter.css';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { activeTab, setActiveTab, incidents, setIsCommandPaletteOpen } = useAppState();
  const openIncidentsCount = incidents.filter(i => i.status === 'open').length;

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
        <main className="app-main-stage">
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

      {/* Mobile Sticky Operational Bottom Bar (<840px) */}
      <nav aria-label="Mobile Navigation" className="mobile-nav-bar">
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            color: activeTab === 'overview' ? '#101820' : '#8A8F8D',
            fontWeight: activeTab === 'overview' ? 600 : 400,
            fontSize: '10px',
            fontFamily: "var(--font-mono, monospace)",
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <LayoutDashboard size={18} color={activeTab === 'overview' ? '#101820' : '#8A8F8D'} />
          <span>OVERVIEW</span>
        </button>

        <button
          onClick={() => setActiveTab('monitoring')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            color: activeTab === 'monitoring' ? '#101820' : '#8A8F8D',
            fontWeight: activeTab === 'monitoring' ? 600 : 400,
            fontSize: '10px',
            fontFamily: "var(--font-mono, monospace)",
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <Video size={18} color={activeTab === 'monitoring' ? '#101820' : '#8A8F8D'} />
          <span>SURVEIL</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            color: activeTab === 'security' ? '#101820' : '#8A8F8D',
            fontWeight: activeTab === 'security' ? 600 : 400,
            fontSize: '10px',
            fontFamily: "var(--font-mono, monospace)",
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <Lock size={18} color={activeTab === 'security' ? '#101820' : '#8A8F8D'} />
          <span>ACCESS</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            color: activeTab === 'incidents' ? '#101820' : '#8A8F8D',
            fontWeight: activeTab === 'incidents' ? 600 : 400,
            fontSize: '10px',
            fontFamily: "var(--font-mono, monospace)",
            cursor: 'pointer',
            padding: '4px',
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative' }}>
            <FileText size={18} color={activeTab === 'incidents' ? '#101820' : '#8A8F8D'} />
            {openIncidentsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-6px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#FF0000',
                  color: '#FFFFFF',
                  fontSize: '8px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {openIncidentsCount}
              </span>
            )}
          </div>
          <span>ALERTS</span>
        </button>

        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            color: '#FF8200',
            fontWeight: 600,
            fontSize: '10px',
            fontFamily: "var(--font-mono, monospace)",
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <Search size={18} color="#FF8200" />
          <span>⌘K</span>
        </button>
      </nav>

      {/* Global Modals & Notifications */}
      <ConfirmDialog />
      <ToastContainer />
      <GlobalSimulationDock />
      <CommandPaletteModal />
    </div>
  );
};
