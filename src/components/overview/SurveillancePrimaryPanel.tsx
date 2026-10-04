import React, { useState } from 'react';
import {
  Video,
  Maximize2,
  Camera,
  ChevronRight,
  AlertTriangle,
  Compass,
  X,
  RefreshCw
} from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import type { CameraFeed } from '../../types';

export const SurveillancePrimaryPanel: React.FC = () => {
  const {
    cameras,
    selectedCameraId,
    setSelectedCameraId,
    setSelectedZone,
    captureCameraSnapshot,
    ptzCameraAction,
    incidents,
    setCameraStatus,
    addToast
  } = useAppState();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPTZ, setShowPTZ] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Active Camera
  const activeCamera = cameras.find((c) => c.id === selectedCameraId) || cameras[0];

  // Incidents in this camera's zone
  const zoneIncident = incidents.find(
    (i) => i.status !== 'resolved' && (i.location.toLowerCase().includes(activeCamera.zone.toLowerCase()) || i.zone.toLowerCase().includes(activeCamera.zone.toLowerCase()))
  );

  const handleSelectCamera = (cam: CameraFeed) => {
    setSelectedCameraId(cam.id);
    setSelectedZone(cam.zone);
  };

  const handleRetryStream = (camId: string) => {
    setIsRetrying(true);
    setTimeout(() => {
      setCameraStatus(camId, 'live');
      setIsRetrying(false);
      addToast('Camera Restored', `Heartbeat re-established for ${activeCamera.name}.`, 'success');
    }, 1200);
  };

  const handleSimulateOffline = () => {
    setCameraStatus(activeCamera.id, 'offline');
    addToast('Camera Disconnected', `${activeCamera.name} switched to simulated offline state.`, 'warning');
  };

  return (
    <>
      <section
        aria-label="Primary Surveillance Operations Stage"
        className="surveillance-stage-grid"
      >
        {/* =====================================================================
            LEFT: PRIMARY SURVEILLANCE STAGE (DOMINANT VIEWPORT)
            ===================================================================== */}
        <div
          role="region"
          aria-label={`Live Surveillance Feed — ${activeCamera.name}`}
          style={{
            backgroundColor: '#0a0f14',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '480px',
            position: 'relative',
          }}
        >
          {/* Top Stage Control HUD Bar */}
          <div
            style={{
              padding: '12px 18px',
              backgroundColor: '#101820',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: activeCamera.status === 'live' ? 'rgba(34, 197, 94, 0.16)' : 'rgba(255, 0, 0, 0.16)',
                  border: activeCamera.status === 'live' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 0, 0, 0.3)',
                  color: activeCamera.status === 'live' ? '#22c55e' : '#FF0000',
                  fontSize: '0.688rem',
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: activeCamera.status === 'live' ? '#22c55e' : '#FF0000',
                    boxShadow: activeCamera.status === 'live' ? '0 0 6px #22c55e' : '0 0 6px #FF0000',
                  }}
                />
                <span>{activeCamera.status === 'live' ? 'LIVE FEED' : 'OFFLINE'}</span>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                    letterSpacing: '-0.01em',
                  }}
                >
                  {activeCamera.name}
                </span>
                <span
                  style={{
                    fontSize: '0.688rem',
                    color: 'rgba(255, 255, 255, 0.45)',
                    fontFamily: "var(--font-mono, monospace)",
                    marginLeft: '8px',
                  }}
                >
                  [{activeCamera.id}] · {activeCamera.location}
                </span>
              </div>
            </div>

            {/* Tactical Stream Metadata */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.688rem',
                  fontFamily: "var(--font-mono, monospace)",
                  color: 'rgba(255, 255, 255, 0.55)',
                }}
              >
                <span>{activeCamera.resolution}</span>
                <span>·</span>
                <span>{activeCamera.fps} FPS</span>
                <span>·</span>
                <span style={{ color: '#22c55e' }}>18ms Latency</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => captureCameraSnapshot(activeCamera.id)}
                  title="Capture timestamped optical snapshot"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.688rem',
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  <Camera size={13} color="#FF8200" />
                  <span>SNAPSHOT</span>
                </button>

                {activeCamera.ptzCapable && (
                  <button
                    onClick={() => setShowPTZ(!showPTZ)}
                    title="Toggle optical PTZ servo controls"
                    style={{
                      background: showPTZ ? 'rgba(255, 130, 0, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      border: showPTZ ? '1px solid #FF8200' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.688rem',
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                  >
                    <Compass size={13} color="#FF8200" />
                    <span>PTZ</span>
                  </button>
                )}

                <button
                  onClick={() => setIsFullscreen(true)}
                  title="Fullscreen surveillance view"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* CCTV Feed Main Surface */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              width: '100%',
              minHeight: '380px',
              backgroundColor: '#05070a',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {activeCamera.status === 'offline' ? (
              // SECTION 20: CAMERA OFFLINE ERROR STATE
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px',
                  textAlign: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 0, 0, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FF0000',
                  }}
                >
                  <AlertTriangle size={24} />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display, sans-serif)",
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}
                >
                  CAMERA NODE OFFLINE
                </div>
                <p
                  style={{
                    fontSize: '0.813rem',
                    color: 'rgba(255, 255, 255, 0.55)',
                    maxWidth: '380px',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {activeCamera.name} is not responding to optical RTSP ping. Last seen at 09:42:10 UTC.
                </p>
                <button
                  onClick={() => handleRetryStream(activeCamera.id)}
                  disabled={isRetrying}
                  style={{
                    marginTop: '8px',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    backgroundColor: '#FF8200',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={13} className={isRetrying ? 'animate-spin' : ''} />
                  <span>{isRetrying ? 'PROBING STREAM...' : 'RETRY CONNECTION'}</span>
                </button>
              </div>
            ) : (
              <>
                {/* Visual Imagery Feed */}
                <img
                  src={activeCamera.streamUrl || '/assets/cctv_main_gate.jpg'}
                  alt={`Live Optical Feed — ${activeCamera.name}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    opacity: 0.92,
                    filter: 'contrast(1.06) brightness(0.95)',
                  }}
                />

                {/* Subtle Scanline Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'linear-gradient(rgba(10, 15, 20, 0) 50%, rgba(0, 0, 0, 0.22) 50%)',
                    backgroundSize: '100% 4px',
                    pointerEvents: 'none',
                    opacity: 0.5,
                  }}
                />

                {/* Tactical HUD Reticles (Corners) */}
                <div style={{ position: 'absolute', top: '16px', left: '16px', width: '24px', height: '24px', borderTop: '2px solid rgba(255, 255, 255, 0.6)', borderLeft: '2px solid rgba(255, 255, 255, 0.6)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px', borderTop: '2px solid rgba(255, 255, 255, 0.6)', borderRight: '2px solid rgba(255, 255, 255, 0.6)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '44px', left: '16px', width: '24px', height: '24px', borderBottom: '2px solid rgba(255, 255, 255, 0.6)', borderLeft: '2px solid rgba(255, 255, 255, 0.6)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '44px', right: '16px', width: '24px', height: '24px', borderBottom: '2px solid rgba(255, 255, 255, 0.6)', borderRight: '2px solid rgba(255, 255, 255, 0.6)', pointerEvents: 'none' }} />

                {/* Center Crosshair HUD */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '32px',
                    height: '32px',
                    pointerEvents: 'none',
                    opacity: 0.4,
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: '15px', width: '2px', height: '10px', backgroundColor: '#FFFFFF' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: '15px', width: '2px', height: '10px', backgroundColor: '#FFFFFF' }} />
                  <div style={{ position: 'absolute', top: '15px', left: 0, width: '10px', height: '2px', backgroundColor: '#FFFFFF' }} />
                  <div style={{ position: 'absolute', top: '15px', right: 0, width: '10px', height: '2px', backgroundColor: '#FFFFFF' }} />
                </div>

                {/* Active Incident Warning Overlay if present */}
                {zoneIncident && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(255, 0, 0, 0.85)',
                      color: '#FFFFFF',
                      padding: '4px 14px',
                      borderRadius: '9999px',
                      fontSize: '0.688rem',
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(255, 0, 0, 0.4)',
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>PRIORITY INCIDENT IN ZONE: {zoneIncident.event.toUpperCase()}</span>
                  </div>
                )}

                {/* On-screen PTZ Virtual Overlay Controls */}
                {showPTZ && activeCamera.ptzCapable && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '50px',
                      right: '20px',
                      backgroundColor: 'rgba(16, 24, 32, 0.88)',
                      backdropFilter: 'blur(6px)',
                      borderRadius: '10px',
                      padding: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      zIndex: 20,
                    }}
                  >
                    <div style={{ fontSize: '0.563rem', fontFamily: "var(--font-mono, monospace)", color: '#FF8200', fontWeight: 700, letterSpacing: '0.08em' }}>
                      SERVO PTZ MOUNT
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 26px)', gap: '4px' }}>
                      <div />
                      <button onClick={() => ptzCameraAction(activeCamera.id, 'TILT_UP')} style={{ width: '26px', height: '26px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: '#FFF', cursor: 'pointer', fontSize: '10px' }}>▲</button>
                      <div />
                      <button onClick={() => ptzCameraAction(activeCamera.id, 'PAN_LEFT')} style={{ width: '26px', height: '26px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: '#FFF', cursor: 'pointer', fontSize: '10px' }}>◀</button>
                      <button onClick={() => ptzCameraAction(activeCamera.id, 'ZOOM_IN')} style={{ width: '26px', height: '26px', background: 'rgba(255,130,0,0.2)', border: '1px solid #FF8200', borderRadius: '4px', color: '#FF8200', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}>+</button>
                      <button onClick={() => ptzCameraAction(activeCamera.id, 'PAN_RIGHT')} style={{ width: '26px', height: '26px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: '#FFF', cursor: 'pointer', fontSize: '10px' }}>▶</button>
                      <div />
                      <button onClick={() => ptzCameraAction(activeCamera.id, 'TILT_DOWN')} style={{ width: '26px', height: '26px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: '#FFF', cursor: 'pointer', fontSize: '10px' }}>▼</button>
                      <div />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Bottom Timestamp & Technical Strip */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '6px 16px',
                backgroundColor: 'rgba(10, 15, 20, 0.85)',
                backdropFilter: 'blur(4px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.625rem',
                fontFamily: "var(--font-mono, monospace)",
                color: 'rgba(255, 255, 255, 0.7)',
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#22c55e' }}>● RTSP://10.24.8.101/STREAM1</span>
                <span>ENC: H.264 / 4096 kbps</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={handleSimulateOffline}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    fontSize: '0.563rem',
                    textDecoration: 'underline',
                  }}
                >
                  Simulate Offline
                </button>
                <span>LAST MAINTENANCE: {activeCamera.lastMaintenance}</span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            RIGHT: CAMERA NETWORK SELECTOR (ALL 7 CHANNELS)
            ===================================================================== */}
        <div
          role="region"
          aria-label="Camera Network Selector"
          style={{
            backgroundColor: '#0a0f14',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={14} color="#FF8200" />
                <span
                  style={{
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.688rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.65)',
                  }}
                >
                  CAMERA NETWORK
                </span>
              </div>

              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: '0.688rem',
                  fontWeight: 600,
                  color: '#22c55e',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {cameras.filter((c) => c.status === 'live').length}/{cameras.length} ONLINE
              </span>
            </div>

            {/* List of 7 Cameras */}
            <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {cameras.map((cam) => {
                const isSelected = cam.id === activeCamera.id;
                const hasIncident = incidents.some(
                  (i) => i.status !== 'resolved' && (i.location.toLowerCase().includes(cam.zone.toLowerCase()) || i.zone.toLowerCase().includes(cam.zone.toLowerCase()))
                );

                return (
                  <div
                    key={cam.id}
                    onClick={() => handleSelectCamera(cam)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectCamera(cam)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '1px solid #FF8200'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      backgroundColor: isSelected
                        ? 'rgba(255, 130, 0, 0.12)'
                        : hasIncident
                        ? 'rgba(255, 0, 0, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = hasIncident ? 'rgba(255, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: cam.status === 'live' ? (hasIncident ? '#FF0000' : '#22c55e') : '#8C8C8C',
                          boxShadow: cam.status === 'live' ? (hasIncident ? '0 0 6px #FF0000' : '0 0 6px #22c55e') : 'none',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: '#FFFFFF',
                          }}
                        >
                          {cam.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.625rem',
                            fontFamily: "var(--font-mono, monospace)",
                            color: isSelected ? '#FF8200' : 'rgba(255, 255, 255, 0.45)',
                            marginTop: '1px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {cam.id} · {cam.zone}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {hasIncident && (
                        <span
                          style={{
                            fontSize: '0.563rem',
                            backgroundColor: '#FF0000',
                            color: '#FFFFFF',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 700,
                            fontFamily: "var(--font-mono, monospace)",
                          }}
                        >
                          ALERT
                        </span>
                      )}
                      <ChevronRight size={13} color={isSelected ? '#FF8200' : 'rgba(255, 255, 255, 0.35)'} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Snapshot / Record Metric */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.688rem',
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>SURVEILLANCE ARCHIVE</span>
            <span style={{ fontWeight: 600, color: '#FFFFFF' }}>90 DAYS ROLLING</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FULLSCREEN SURVEILLANCE STAGE MODAL
          ===================================================================== */}
      {isFullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fullscreen Surveillance Feed — ${activeCamera.name}`}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#05070a',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Fullscreen Header */}
          <div
            style={{
              padding: '16px 28px',
              backgroundColor: '#101820',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 8px #22c55e',
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-display, sans-serif)",
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                }}
              >
                {activeCamera.name} [{activeCamera.id}]
              </span>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', color: '#FF8200' }}>
                · {activeCamera.location}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => captureCameraSnapshot(activeCamera.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                CAPTURE EVIDENCE
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                aria-label="Exit fullscreen"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Fullscreen Video Body */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={activeCamera.streamUrl || '/assets/cctv_main_gate.jpg'}
              alt={activeCamera.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
