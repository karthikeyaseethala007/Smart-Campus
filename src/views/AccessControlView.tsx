import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  AlertTriangle, 
  Info,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAppState } from '../services/stateContext';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';
import { HyperText } from '../registry/magicui/hyper-text';
import { BentoCard, BentoGrid } from '../registry/magicui/bento-grid';
import { PortalBentoBackground } from '../components/access/PortalBentoBackground';
import { cn } from '../lib/utils';

export const AccessControlView: React.FC = () => {
  const { 
    doors, 
    requestUnlockDoor, 
    lockDoor, 
    submitKeypadPin,
    canManageDoors, 
    setSelectedIncident, 
    incidents, 
    setActiveTab 
  } = useAppState();

  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});
  const [pinFeedback, setPinFeedback] = useState<Record<string, { status: 'success' | 'error'; message: string } | null>>({});

  const totalLocked = doors.filter(d => d.lockStatus === 'locked').length;
  const activeAlertDoors = doors.filter(d => d.isSecurityAlert).length;

  const handlePinSubmit = async (doorId: string, testPin?: string) => {
    const pin = testPin || pinInputs[doorId] || '';
    if (!pin) return;

    const res = await submitKeypadPin(doorId, pin);
    setPinFeedback(prev => ({
      ...prev,
      [doorId]: {
        status: res.success ? 'success' : 'error',
        message: res.message
      }
    }));

    // Clear feedback after 3.5s
    setTimeout(() => {
      setPinFeedback(prev => ({ ...prev, [doorId]: null }));
    }, 3500);

    setPinInputs(prev => ({ ...prev, [doorId]: '' }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Editorial Section Heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <HyperText as="h1" className="heading-editorial">
            Perimeter <em>access control.</em>
          </HyperText>
          <p className="subhead-editorial" style={{ marginTop: '6px' }}>
            High-security barrier interlocks and magnetic doors with intentional safety confirmation.
          </p>
        </div>

        {/* Safety Notice Pill */}
        <div 
          className="pill-badge pill-badge-neutral" 
          style={{ 
            maxWidth: '460px', 
            padding: '10px 18px', 
            fontSize: '13px',
            lineHeight: 1.4,
            gap: '10px'
          }}
        >
          <Info size={16} color="var(--color-slate-gray)" style={{ flexShrink: 0 }} />
          <span>Remote barrier releases enforce a two-step confirmation dialog to prevent accidental physical disengagement.</span>
        </div>
      </div>

      {/* Floating Status Summary Artifacts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div className="floating-artifact" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lock size={15} color="var(--color-ink-black)" />
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
            {totalLocked} of {doors.length} Portals Secured
          </span>
        </div>

        <div className="floating-artifact" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="status-dot status-dot-safe" />
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
            Keypads Online (Model KP-900)
          </span>
        </div>

        {activeAlertDoors > 0 && (
          <div className="accent-peach-card" style={{ padding: '10px 20px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} color="var(--color-sienna-brown)" />
            <span style={{ fontSize: '13px', fontWeight: 500 }}>
              {activeAlertDoors} Door Security Event Active
            </span>
          </div>
        )}
      </div>

      {/* Door Cards Grid — Magic UI BentoGrid Layout (3 + 2 on Desktop) */}
      <BentoGrid>
        {doors.map((door, index) => {
          const isLocked = door.lockStatus === 'locked';
          const isAlert = door.isSecurityAlert;
          const feedback = pinFeedback[door.id];
          const bentoColClass = index < 3 ? 'bento-col-3' : 'bento-col-2';

          return (
            <BentoCard 
              key={door.id}
              className={cn(bentoColClass)}
              background={
                <PortalBentoBackground
                  doorId={door.id}
                  isAlert={isAlert}
                  isLocked={isLocked}
                />
              }
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '24px',
                padding: '28px',
                position: 'relative'
              }}
            >
              <div>
                {/* Header line: Title and Status Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-signifier)', fontSize: '22px', fontWeight: 400, color: 'var(--color-ink-black)' }}>
                      {door.name}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)', marginTop: '2px' }}>
                      {door.building} · Zone: {door.zone}
                    </div>
                  </div>

                  <span className={`pill-badge ${isAlert ? 'pill-badge-peach' : (isLocked ? 'pill-badge-neutral' : 'pill-badge-safe')}`} style={{ backgroundColor: isLocked ? '#ffffff' : undefined }}>
                    {isAlert ? 'Security Alert' : (isLocked ? 'Locked' : 'Unlocked')}
                  </span>
                </div>

                {/* Keypad Status Indicator */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-paper-white)',
                    borderRadius: 'var(--radius-smallcards)',
                    marginBottom: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="status-dot status-dot-safe" />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)' }}>Keypad KP-900</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--color-slate-gray)' }}>
                    {door.keypadStatus === 'alert' ? '🔒 High-Security Lockout' : 'Online · Ready'}
                  </span>
                </div>

                {/* Interactive Keypad Authentication Input & Quick Test Bar */}
                <div 
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-smallcards)',
                    backgroundColor: 'var(--color-mist-gray)',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-slate-gray)', fontWeight: 500 }}>
                      Keypad PIN Authentication
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-slate-gray)', fontFamily: 'monospace' }}>
                      Valid: 4821
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="password"
                      placeholder="Enter 4-digit PIN"
                      maxLength={6}
                      value={pinInputs[door.id] || ''}
                      onChange={(e) => setPinInputs(prev => ({ ...prev, [door.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePinSubmit(door.id);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '13px',
                        borderRadius: 'var(--radius-inputs)',
                        border: 'var(--border-hairline)',
                        backgroundColor: 'var(--color-paper-white)',
                        color: 'var(--color-ink-black)',
                        outline: 'none',
                        fontFamily: 'monospace'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handlePinSubmit(door.id)}
                      className="pill-btn-sm active"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      Verify PIN
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handlePinSubmit(door.id, '4821')}
                      className="pill-btn-ghost"
                      style={{ padding: '3px 10px', fontSize: '11px' }}
                      title="Test valid authorized credential accepted"
                    >
                      ✓ Valid (4821)
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinSubmit(door.id, '9999')}
                      className="pill-btn-ghost"
                      style={{ padding: '3px 10px', fontSize: '11px' }}
                      title="Test invalid keypad credential rejected"
                    >
                      ✗ Invalid (9999)
                    </button>
                  </div>

                  {/* Dynamic Feedback Banner */}
                  {feedback && (
                    <div 
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-smallcards)',
                        backgroundColor: feedback.status === 'success' ? '#eaf8f0' : 'var(--color-blush-peach)',
                        color: feedback.status === 'success' ? '#14532d' : 'var(--color-sienna-brown)',
                        fontSize: '12px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {feedback.status === 'success' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>{feedback.message}</span>
                    </div>
                  )}
                </div>

                {/* Failed attempts alert box */}
                {door.failedAttempts > 0 && (
                  <div 
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-smallcards)',
                      backgroundColor: 'var(--color-blush-peach)',
                      color: 'var(--color-sienna-brown)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '13px',
                      fontWeight: 500,
                      marginBottom: '14px'
                    }}
                  >
                    <AlertTriangle size={16} color="var(--color-sienna-brown)" style={{ flexShrink: 0 }} />
                    <span>
                      Failed attempts: {door.failedAttempts} / 3 {door.failedAttempts >= 3 ? '(Security Lockout Active)' : ''}
                    </span>
                  </div>
                )}

                {/* Recent Access Event Details */}
                <div 
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-smallcards)',
                    backgroundColor: 'var(--color-paper-white)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-slate-gray)' }}>
                    <span>Last Access Event</span>
                    <span style={{ fontWeight: 500 }}>{door.lastEventTime}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 450, color: 'var(--color-ink-black)' }}>
                    {door.lastEventText}
                  </div>
                </div>
              </div>

              {/* Action Buttons with Steep Matched Pill Buttons */}
              <div 
                style={{
                  borderTop: 'var(--border-hairline)',
                  paddingTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                {isAlert ? (
                  <InteractiveHoverButton
                    onClick={() => {
                      const inc = incidents.find(i => 
                        i.location.includes(door.name) || 
                        i.location.includes('Door E-04') ||
                        i.id.includes(door.id)
                      );
                      if (inc) setSelectedIncident(inc);
                      setActiveTab('incidents');
                    }}
                    variant="sienna"
                    icon={<ShieldAlert size={14} />}
                    style={{ padding: '8px 18px', fontSize: '13px' }}
                  >
                    View Incident
                  </InteractiveHoverButton>
                ) : <div />}

                {isLocked ? (
                  <InteractiveHoverButton
                    onClick={() => requestUnlockDoor(door.id)}
                    disabled={!canManageDoors}
                    variant="ghost"
                    icon={<Unlock size={14} />}
                    style={{ padding: '8px 20px', fontSize: '14px' }}
                    title={canManageDoors ? "Remotely release door lock (requires confirmation)" : "Unauthorized role"}
                  >
                    Unlock Door
                  </InteractiveHoverButton>
                ) : (
                  <InteractiveHoverButton
                    onClick={() => lockDoor(door.id)}
                    disabled={!canManageDoors}
                    variant="filled"
                    icon={<Lock size={14} />}
                    style={{ padding: '8px 20px', fontSize: '14px' }}
                    title={canManageDoors ? "Engage magnetic lock" : "Unauthorized role"}
                  >
                    Lock Door
                  </InteractiveHoverButton>
                )}
              </div>
            </BentoCard>
          );
        })}
      </BentoGrid>
    </div>
  );
};

export default AccessControlView;
