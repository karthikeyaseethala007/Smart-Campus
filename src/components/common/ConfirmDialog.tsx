import React from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

export const ConfirmDialog: React.FC = () => {
  const { confirmModal, closeConfirmModal } = useAppState();

  if (!confirmModal || !confirmModal.isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(23, 25, 28, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div 
        className="floating-artifact"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: 0,
          borderRadius: 'var(--radius-cards)',
          boxShadow: 'var(--shadow-subtle-2)',
          overflow: 'hidden',
          backgroundColor: 'var(--color-paper-white)'
        }}
      >
        <div 
          style={{
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 'var(--border-hairline)',
            backgroundColor: 'var(--color-mist-gray)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={20} color="var(--color-ink-black)" />
            <h3 id="confirm-dialog-title" style={{ fontFamily: 'var(--font-signifier)', fontSize: '20px', fontWeight: 400, color: 'var(--color-ink-black)' }}>
              {confirmModal.title}
            </h3>
          </div>
          <button 
            onClick={closeConfirmModal}
            aria-label="Close dialog"
            style={{ color: 'var(--color-slate-gray)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '32px', fontSize: '15px', color: 'var(--color-slate-gray)', lineHeight: 1.6 }}>
          {confirmModal.message}
        </div>

        <div 
          style={{
            padding: '20px 32px',
            backgroundColor: 'var(--color-mist-gray)',
            borderTop: 'var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button 
            onClick={closeConfirmModal}
            className="pill-btn-ghost"
            style={{ padding: '8px 20px', fontSize: '14px' }}
          >
            Cancel
          </button>
          <button 
            onClick={confirmModal.onConfirm}
            className="pill-btn-filled"
            style={{
              padding: '8px 24px',
              fontSize: '14px',
              backgroundColor: confirmModal.isDestructive ? 'var(--color-sienna-brown)' : 'var(--color-ink-black)',
              borderColor: confirmModal.isDestructive ? 'var(--color-sienna-brown)' : 'var(--color-ink-black)'
            }}
          >
            {confirmModal.confirmLabel || 'Confirm Action'}
          </button>
        </div>
      </div>
    </div>
  );
};
