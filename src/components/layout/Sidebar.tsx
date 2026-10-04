import React from 'react';
import { 
  Globe,
  LayoutDashboard, 
  Video, 
  Lock, 
  Flame, 
  Zap, 
  Cpu, 
  FileText, 
  Sliders, 
  Users, 
  Settings,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import type { NavigationTab } from '../../types';

interface NavItem {
  key: NavigationTab;
  label: string;
  icon: React.FC<{ size: number; color?: string }>;
  badge?: string | number;
  rolesAllowed: ('admin' | 'security_officer' | 'faculty' | 'student')[];
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, userRole, isSimulationActive, alerts, incidents } = useAppState();

  const openIncidentsCount = incidents.filter(i => i.status === 'open').length;
  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;

  const navItems: NavItem[] = [
    {
      key: 'landing',
      label: 'Public Landing',
      icon: Globe,
      rolesAllowed: ['admin', 'security_officer', 'faculty', 'student']
    },
    {
      key: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      rolesAllowed: ['admin', 'security_officer', 'faculty', 'student']
    },
    {
      key: 'monitoring',
      label: 'Surveillance',
      icon: Video,
      rolesAllowed: ['admin', 'security_officer', 'faculty']
    },
    {
      key: 'security',
      label: 'Access Control',
      icon: Lock,
      rolesAllowed: ['admin', 'security_officer']
    },
    {
      key: 'safety',
      label: 'Fire & Safety',
      icon: Flame,
      badge: criticalAlertsCount > 0 ? criticalAlertsCount : undefined,
      rolesAllowed: ['admin', 'security_officer', 'faculty', 'student']
    },
    {
      key: 'energy',
      label: 'Energy & Power',
      icon: Zap,
      rolesAllowed: ['admin', 'security_officer', 'faculty', 'student']
    },
    {
      key: 'automation',
      label: 'Automation',
      icon: Sliders,
      rolesAllowed: ['admin', 'security_officer', 'faculty', 'student']
    },
    {
      key: 'devices',
      label: 'Hardware Fleet',
      icon: Cpu,
      rolesAllowed: ['admin', 'security_officer', 'faculty']
    },
    {
      key: 'incidents',
      label: 'Incident Ledger',
      icon: FileText,
      badge: openIncidentsCount > 0 ? openIncidentsCount : undefined,
      rolesAllowed: ['admin', 'security_officer']
    },
    {
      key: 'users',
      label: 'Users & Roles',
      icon: Users,
      rolesAllowed: ['admin']
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      rolesAllowed: ['admin']
    }
  ];

  const filteredNavItems = navItems.filter(item => item.rolesAllowed.includes(userRole));

  return (
    <aside
      style={{
        width: '230px',
        backgroundColor: 'var(--color-paper-white)',
        borderRight: 'var(--border-hairline)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        height: 'calc(100vh - 68px)',
        position: 'sticky',
        top: '68px',
        padding: '24px 16px'
      }}
    >
      {/* Navigation Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div 
          style={{
            fontFamily: 'var(--font-sohne)',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-ash-gray)',
            padding: '6px 14px',
            marginBottom: '6px'
          }}
        >
          Navigation
        </div>

        {filteredNavItems.map(item => {
          const isActive = activeTab === item.key;
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                borderRadius: 'var(--radius-buttons)',
                backgroundColor: isActive ? 'var(--color-ink-black)' : 'transparent',
                color: isActive ? 'var(--color-paper-white)' : 'var(--color-ink-black)',
                fontWeight: isActive ? 450 : 400,
                fontSize: '14px',
                border: 'none',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon 
                  size={16} 
                  color={isActive ? 'var(--color-paper-white)' : 'var(--color-slate-gray)'} 
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span 
                  style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 500,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-blush-peach)',
                    color: isActive ? '#ffffff' : 'var(--color-sienna-brown)'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Clearance Status */}
      <div 
        style={{
          borderTop: 'var(--border-hairline)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div 
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--color-mist-gray)',
            borderRadius: 'var(--radius-smallcards)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <ShieldCheck size={16} color="var(--color-ink-black)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>
              Active Clearance
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)', textTransform: 'capitalize' }}>
              {userRole.replace('_', ' ')}
            </div>
          </div>
        </div>

        {isSimulationActive && (
          <div 
            className="pill-badge pill-badge-peach"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            <Radio size={12} color="var(--color-sienna-brown)" />
            <span>Simulation active</span>
          </div>
        )}
      </div>
    </aside>
  );
};
