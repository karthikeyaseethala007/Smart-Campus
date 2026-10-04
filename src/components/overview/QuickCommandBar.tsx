import React from 'react';
import { Lock, Video, ShieldAlert, AlertOctagon, Terminal } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

interface QuickCommandBarProps {
  onTriggerEmergency?: () => void;
}

export const QuickCommandBar: React.FC<QuickCommandBarProps> = ({ onTriggerEmergency }) => {
  const { setActiveTab, campusStatus } = useAppState();
  const isEmergency = campusStatus === 'EMERGENCY';

  const commands = [
    {
      id: 'access',
      label: 'ACCESS CONTROL',
      subtitle: 'Keypads & Portals',
      icon: <Lock size={14} color="#101820" />,
      action: () => setActiveTab('security'),
      variant: 'default' as const,
    },
    {
      id: 'cameras',
      label: 'VIEW CAMERAS',
      subtitle: '7-Channel Optical Grid',
      icon: <Video size={14} color="#101820" />,
      action: () => setActiveTab('monitoring'),
      variant: 'default' as const,
    },
    {
      id: 'incidents',
      label: 'VIEW INCIDENTS',
      subtitle: 'Compliance Ledger',
      icon: <ShieldAlert size={14} color="#FF8200" />,
      action: () => setActiveTab('incidents'),
      variant: 'default' as const,
    },
    {
      id: 'emergency',
      label: 'EMERGENCY RESPONSE',
      subtitle: isEmergency ? 'Protocol Active' : 'Dispatch & Relays',
      icon: <AlertOctagon size={14} color="#FF0000" />,
      action: () => {
        if (onTriggerEmergency) {
          onTriggerEmergency();
        } else {
          setActiveTab('safety');
        }
      },
      variant: 'emergency' as const,
    },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Campus Quick Command Bar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
        <Terminal size={13} color="#5B6871" />
        <span
          style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: '0.688rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#5B6871',
          }}
        >
          COMMAND DISPATCH · QUICK ACTIONS
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {commands.map((cmd) => {
          const isEmerg = cmd.variant === 'emergency';

          return (
            <button
              key={cmd.id}
              onClick={cmd.action}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                backgroundColor: isEmerg && isEmergency
                  ? 'rgba(255, 0, 0, 0.08)'
                  : '#FFFFFF',
                border: isEmerg
                  ? isEmergency
                    ? '1px solid #FF0000'
                    : '1px solid rgba(255, 0, 0, 0.3)'
                  : '1px solid rgba(16, 24, 32, 0.1)',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 2px 8px rgba(16, 24, 32, 0.02)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 24, 32, 0.06)';
                if (isEmerg) {
                  e.currentTarget.style.borderColor = '#FF0000';
                } else {
                  e.currentTarget.style.borderColor = '#101820';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 24, 32, 0.02)';
                if (isEmerg) {
                  e.currentTarget.style.borderColor = isEmergency ? '#FF0000' : 'rgba(255, 0, 0, 0.3)';
                } else {
                  e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.1)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    backgroundColor: isEmerg ? 'rgba(255, 0, 0, 0.08)' : 'rgba(16, 24, 32, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {cmd.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: isEmerg ? (isEmergency ? '#FF0000' : '#101820') : '#101820',
                    }}
                  >
                    {cmd.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.688rem',
                      color: isEmerg ? '#FF0000' : '#8A8F8D',
                      marginTop: '1px',
                    }}
                  >
                    {cmd.subtitle}
                  </span>
                </div>
              </div>

              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: '0.75rem',
                  color: isEmerg ? '#FF0000' : '#5B6871',
                  fontWeight: 600,
                }}
              >
                ↵
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
