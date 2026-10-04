import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useAppState();

  if (toasts.length === 0) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none'
      }}
    >
      {toasts.map(toast => {
        const isCritical = toast.type === 'error' || toast.type === 'warning';

        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 size={16} color="var(--color-ink-black)" />;
            case 'warning':
              return <AlertTriangle size={16} color="var(--color-sienna-brown)" />;
            case 'error':
              return <AlertCircle size={16} color="var(--color-sienna-brown)" />;
            default:
              return <Info size={16} color="var(--color-slate-gray)" />;
          }
        };

        return (
          <div 
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              backgroundColor: isCritical ? 'var(--color-blush-peach)' : 'var(--color-paper-white)',
              border: isCritical ? '1px solid rgba(93, 42, 26, 0.2)' : '1px solid rgba(4, 23, 43, 0.08)',
              borderRadius: 'var(--radius-inputs)',
              boxShadow: 'var(--shadow-subtle-2)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              transition: 'all 0.2s ease',
              animation: 'slideInRight 0.2s ease-out',
              color: isCritical ? 'var(--color-sienna-brown)' : 'var(--color-ink-black)'
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              {getIcon()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  color: isCritical ? 'var(--color-sienna-brown)' : 'var(--color-ink-black)' 
                }}>
                  {toast.title}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  color: isCritical ? 'rgba(93, 42, 26, 0.7)' : 'var(--color-ash-gray)' 
                }}>
                  {toast.timestamp}
                </span>
              </div>
              <p style={{ 
                fontSize: '12px', 
                color: isCritical ? 'var(--color-sienna-brown)' : 'var(--color-slate-gray)', 
                marginTop: '4px', 
                lineHeight: 1.4 
              }}>
                {toast.message}
              </p>
            </div>
            <button 
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'transparent',
                border: 'none',
                color: isCritical ? 'var(--color-sienna-brown)' : 'var(--color-slate-gray)',
                padding: '4px',
                borderRadius: '9999px',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

