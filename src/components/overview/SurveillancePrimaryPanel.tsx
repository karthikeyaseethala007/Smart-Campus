import React, { useState } from 'react';
import {
  Video,
  Maximize2,
  Camera,
  ChevronRight,
  AlertTriangle,
  Compass,
  X,
  Flag,
} from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import type { CameraFeed, CampusIncident } from '../../types';
import { CameraStreamSurface } from './CameraStreamSurface';

export const SurveillancePrimaryPanel: React.FC = () => {
  const {
    cameras,
    selectedCameraId,
    setSelectedCameraId,
    setSelectedZone,
    captureCameraSnapshot,
    ptzCameraAction,
    incidents,
    setIncidents,
    setCameraStatus,
    addToast,
    userRole,
  } = useAppState();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPTZ, setShowPTZ] = useState(false);

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
    setTimeout(() => {
      const cam = cameras.find((c) => c.id === camId) || activeCamera;
      const targetStatus = cam.streamUrl?.startsWith('rtsp') ? 'live' : 'simulation';
      setCameraStatus(camId, targetStatus);
      addToast('Camera Telemetry Restored', `Heartbeat re-synchronized for ${cam.name} (${targetStatus.toUpperCase()}).`, 'success');
    }, 1200);
  };

  const handleMarkIncident = (camId: string) => {
    if (userRole === 'student') {
      addToast('Clearance Denied', 'Student role is not authorized to create security incident markers.', 'error');
      return;
    }
    const cam = cameras.find(c => c.id === camId) || activeCamera;
    const incId = `INC-SURV-${Date.now().toString().slice(-4)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newInc: CampusIncident = {
      id: incId,
      event: `Tactical Visual Anomaly — ${cam.name}`,
      location: cam.location,
      zone: cam.zone,
      severity: 'warning',
      status: 'investigating',
      timestamp: timeStr,
      description: `Operator marked security incident on optical channel ${cam.id} (${cam.name}).`,
      source: 'live',
      auditTimeline: [
        {
          time: timeStr,
          action: 'CAMERA_INCIDENT_MARKED',
          actor: userRole.toUpperCase(),
          notes: `Incident flagged on camera ${cam.name} by ${userRole.toUpperCase()}`,
        }
      ]
    };
    setIncidents((prev: CampusIncident[]) => [newInc, ...prev]);
    addToast('Incident Marker Logged', `Security anomaly flagged on ${cam.name} (${cam.zone}). Incident ${incId} created.`, 'warning');
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
                  backgroundColor:
                    activeCamera.status === 'live'
                      ? 'rgba(34, 197, 94, 0.16)'
                      : activeCamera.status === 'simulation'
                      ? 'rgba(255, 130, 0, 0.16)'
                      : activeCamera.status === 'no_signal'
                      ? 'rgba(234, 179, 8, 0.16)'
                      : 'rgba(239, 68, 68, 0.16)',
                  border:
                    activeCamera.status === 'live'
                      ? '1px solid rgba(34, 197, 94, 0.3)'
                      : activeCamera.status === 'simulation'
                      ? '1px solid rgba(255, 130, 0, 0.3)'
                      : activeCamera.status === 'no_signal'
                      ? '1px solid rgba(234, 179, 8, 0.3)'
                      : '1px solid rgba(239, 68, 68, 0.3)',
                  color:
                    activeCamera.status === 'live'
                      ? '#22c55e'
                      : activeCamera.status === 'simulation'
                      ? '#FF8200'
                      : activeCamera.status === 'no_signal'
                      ? '#eab308'
                      : '#ef4444',
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
                    backgroundColor:
                      activeCamera.status === 'live'
                        ? '#22c55e'
                        : activeCamera.status === 'simulation'
                        ? '#FF8200'
                        : activeCamera.status === 'no_signal'
                        ? '#eab308'
                        : '#ef4444',
                    boxShadow:
                      activeCamera.status === 'live'
                        ? '0 0 6px #22c55e'
                        : activeCamera.status === 'simulation'
                        ? '0 0 6px rgba(255, 130, 0, 0.4)'
                        : 'none',
                  }}
                />
                <span>
                  {activeCamera.status === 'live'
                    ? 'LIVE FEED'
                    : activeCamera.status === 'simulation'
                    ? 'SIMULATED FEED'
                    : activeCamera.status === 'no_signal'
                    ? 'NO SIGNAL'
                    : 'OFFLINE'}
                </span>
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

                <button
                  onClick={() => handleMarkIncident(activeCamera.id)}
                  title="Flag tactical security incident on active camera"
                  style={{
                    background: 'rgba(255, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 0, 0, 0.3)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#FF6B6B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.688rem',
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 600,
                  }}
                >
                  <Flag size={12} />
                  <span>INCIDENT</span>
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
              flexDirection: 'column',
            }}
          >
            <CameraStreamSurface
              camera={activeCamera}
              minHeight="380px"
              onSnapshot={(id) => captureCameraSnapshot(id)}
              onMarkIncident={(id) => handleMarkIncident(id)}
              onToggleFullscreen={() => setIsFullscreen(true)}
              onRetryConnection={(id) => handleRetryStream(id)}
            />

            {/* Active Incident Warning Overlay if present */}
            {zoneIncident && (
              <div
                style={{
                  position: 'absolute',
                  top: '52px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(255, 0, 0, 0.88)',
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
                  zIndex: 20,
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
                          backgroundColor: cam.status === 'live' ? (hasIncident ? '#FF0000' : '#22c55e') : (cam.status === 'simulation' ? '#FF8200' : cam.status === 'no_signal' ? '#eab308' : '#ef4444'),
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.563rem',
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          backgroundColor: cam.status === 'live' ? 'rgba(34, 197, 94, 0.16)' : cam.status === 'simulation' ? 'rgba(255, 130, 0, 0.16)' : cam.status === 'no_signal' ? 'rgba(234, 179, 8, 0.16)' : 'rgba(239, 68, 68, 0.16)',
                          color: cam.status === 'live' ? '#22c55e' : cam.status === 'simulation' ? '#FF8200' : cam.status === 'no_signal' ? '#eab308' : '#ef4444',
                        }}
                      >
                        {cam.status === 'live' ? 'LIVE' : cam.status === 'simulation' ? 'SIM' : cam.status === 'no_signal' ? 'NO SIG' : 'OFFLINE'}
                      </span>

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
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <CameraStreamSurface
              camera={activeCamera}
              minHeight="100%"
              onSnapshot={(id) => captureCameraSnapshot(id)}
              onMarkIncident={(id) => handleMarkIncident(id)}
              onToggleFullscreen={() => setIsFullscreen(false)}
              onRetryConnection={(id) => handleRetryStream(id)}
            />
          </div>
        </div>
      )}
    </>
  );
};
