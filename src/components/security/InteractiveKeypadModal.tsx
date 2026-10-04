import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, KeyRound } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

export interface InteractiveKeypadModalProps {
  isOpen: boolean;
  portalId: string;
  portalName: string;
  onClose: () => void;
}

export const InteractiveKeypadModal: React.FC<InteractiveKeypadModalProps> = ({
  isOpen,
  portalId,
  portalName,
  onClose,
}) => {
  const { submitKeypadPin } = useAppState();
  const [pin, setPin] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const handleDigit = (digit: string) => {
    if (feedback !== 'idle') return;
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleClear = () => {
    if (feedback !== 'idle') return;
    setPin('');
  };

  const handleSubmit = async () => {
    if (pin.length === 0) return;

    const result = await submitKeypadPin(portalId, pin, 'simulation');
    if (result.success) {
      setFeedback('granted');
      setFeedbackMsg('ACCESS GRANTED · SOLENOID RELEASED');
      setTimeout(() => {
        setPin('');
        setFeedback('idle');
        onClose();
      }, 1500);
    } else {
      setFeedback('denied');
      setFeedbackMsg('ACCESS DENIED · INVALID CREDENTIAL');
      setTimeout(() => {
        setPin('');
        setFeedback('idle');
      }, 1500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(16, 24, 32, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: '#101820',
              color: '#f5f7fa',
              borderRadius: '1.3135rem',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#ffa13d',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  <KeyRound size={12} />
                  <span>Portal Reader Telemetry</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff' }}>
                  {portalName}
                </h3>
              </div>

              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7c9ec0',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* PIN Display Screen */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0.6567rem',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                }}
              >
                {[0, 1, 2, 3].map((idx) => {
                  const hasChar = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '9999px',
                        backgroundColor: hasChar
                          ? feedback === 'granted'
                            ? '#22c55e'
                            : feedback === 'denied'
                            ? '#ef4444'
                            : '#ffa13d'
                          : 'rgba(255, 255, 255, 0.15)',
                        boxShadow: hasChar
                          ? feedback === 'granted'
                            ? '0 0 10px #22c55e'
                            : feedback === 'denied'
                            ? '0 0 10px #ef4444'
                            : '0 0 8px #ffa13d'
                          : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  );
                })}
              </div>

              {/* Status Message */}
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  fontFamily: 'monospace',
                  color:
                    feedback === 'granted'
                      ? '#22c55e'
                      : feedback === 'denied'
                      ? '#ef4444'
                      : '#adc2d6',
                }}
              >
                {feedbackMsg || 'ENTER 4-DIGIT PIN (DEMO: 1234)'}
              </div>
            </div>

            {/* Numeric Keypad Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'ENT'].map((val) => {
                const isSpecial = val === 'CLR' || val === 'ENT';
                return (
                  <button
                    key={val}
                    onClick={() => {
                      if (val === 'CLR') handleClear();
                      else if (val === 'ENT') handleSubmit();
                      else handleDigit(val);
                    }}
                    style={{
                      height: '52px',
                      borderRadius: '0.6567rem',
                      backgroundColor:
                        val === 'ENT'
                          ? '#ffa13d'
                          : isSpecial
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.05)',
                      color: val === 'ENT' ? '#101820' : '#ffffff',
                      fontWeight: 600,
                      fontSize: isSpecial ? '0.75rem' : '1.15rem',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        val === 'ENT' ? '#ff8200' : 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        val === 'ENT'
                          ? '#ffa13d'
                          : isSpecial
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    {val}
                  </button>
                );
              })}
            </div>

            {/* Security Notice */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.7rem',
                color: '#7c9ec0',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                paddingTop: '14px',
              }}
            >
              <Lock size={12} />
              <span>Wiegand-26 Encrypted Bus · Tamper Circuit Armed</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
