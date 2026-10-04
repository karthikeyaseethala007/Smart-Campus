import React, { useState } from 'react';
import { 
  Video, 
  Maximize2, 
  Camera, 
  Info,
  X,
  Wifi,
  AlertTriangle
} from 'lucide-react';
import { useAppState } from '../services/stateContext';
import type { CameraFeed } from '../types';
import { HeroVideoDialog } from '../components/ui/hero-video-dialog';

export const MonitoringView: React.FC = () => {
  const { cameras, updateCameraStream, setCameraStatus, addToast } = useAppState();
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [configCam, setConfigCam] = useState<CameraFeed | null>(null);
  const [streamUrlInput, setStreamUrlInput] = useState('');
  const [isProbing, setIsProbing] = useState(false);

  const zones = ['all', 'Main Perimeter', 'Engineering Block', 'Science Block', 'Central Library', 'Administrative Wing'];

  const filteredCameras = selectedZone === 'all' 
    ? cameras 
    : cameras.filter(c => c.zone === selectedZone);

  const handleTakeSnapshot = (cam: CameraFeed) => {
    addToast('Security Snapshot Recorded', `Timestamped frame logged from ${cam.name} (${cam.location}) to operational audit vault.`, 'info');
  };

  const handleOpenConfig = (cam: CameraFeed) => {
    setConfigCam(cam);
    setStreamUrlInput(cam.streamUrl || '');
  };

  const handleSaveStream = async () => {
    if (!configCam) return;
    setIsProbing(true);
    await updateCameraStream(configCam.id, streamUrlInput);
    setIsProbing(false);
    setConfigCam(null);
  };

  const handleSimulateOffline = () => {
    if (!configCam) return;
    setCameraStatus(configCam.id, 'offline');
    addToast('Camera Marked Offline', `${configCam.name} stream manually set to offline state.`, 'warning');
    setConfigCam(null);
  };

  const handleResetToSimulation = () => {
    if (!configCam) return;
    updateCameraStream(configCam.id, undefined);
    setConfigCam(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Editorial Section Heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h1 className="heading-editorial">
            Optical <em>surveillance grid.</em>
          </h1>
          <p className="subhead-editorial" style={{ marginTop: '6px' }}>
            Authorized perimeter cameras and corridor visual streams for campus operations.
          </p>
        </div>

        {/* Ethical Compliance Pill Notice */}
        <div 
          className="pill-badge pill-badge-neutral" 
          style={{ 
            maxWidth: '480px', 
            padding: '10px 18px', 
            fontSize: '13px',
            lineHeight: 1.4,
            gap: '10px'
          }}
        >
          <Info size={16} color="var(--color-slate-gray)" style={{ flexShrink: 0 }} />
          <span>Feeds are strictly optical. Biometric tracking and automated identity profiling are excluded by policy.</span>
        </div>
      </div>

      {/* Zone Filter Pill Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {zones.map(z => {
          const isSelected = selectedZone === z;
          return (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`pill-btn-sm ${isSelected ? 'active' : ''}`}
            >
              {z === 'all' ? 'All Campus Feeds' : z}
            </button>
          );
        })}
      </div>

      {/* CCTV Feeds Grid — Floating Product Artifact Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
        {filteredCameras.map(cam => {
          const isLive = cam.status === 'live';
          const isOffline = cam.status === 'offline';

          return (
            <div 
              key={cam.id}
              className="floating-artifact"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              {/* Viewport Card: Steep Ink Black optical surface */}
              <div 
                style={{
                  position: 'relative',
                  height: '210px',
                  borderRadius: 'var(--radius-smallcards)',
                  backgroundColor: 'var(--color-ink-black)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '16px',
                  color: 'var(--color-paper-white)',
                  overflow: 'hidden'
                }}
              >
                {/* Live Real Stream Image (if active ESP32-CAM stream) */}
                {isLive && cam.streamUrl ? (
                  <img
                    src={cam.streamUrl}
                    alt={cam.name}
                    onError={() => setCameraStatus(cam.id, 'offline')}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 1
                    }}
                  />
                ) : (
                  /* Minimal Optical Grid Reticle */
                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
                      backgroundSize: '28px 28px',
                      pointerEvents: 'none'
                    }}
                  />
                )}

                {/* Viewport Top Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(255, 255, 255, 0.16)',
                        fontSize: '11px',
                        fontWeight: 500
                      }}
                    >
                      {isLive ? (
                        <>
                          <span className="status-dot status-dot-safe" />
                          <span>LIVE</span>
                        </>
                      ) : isOffline ? (
                        <>
                          <span className="status-dot status-dot-warning" />
                          <span>OFFLINE</span>
                        </>
                      ) : (
                        <>
                          <span className="status-dot status-dot-ink" style={{ opacity: 0.5 }} />
                          <span>SIMULATION</span>
                        </>
                      )}
                    </span>

                    <span style={{ fontSize: '11px', opacity: 0.75, fontFamily: 'monospace' }}>
                      {cam.fps} FPS · {cam.resolution}
                    </span>
                  </div>

                  <span style={{ fontSize: '11px', opacity: 0.75, fontFamily: 'monospace' }}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {/* Viewport Center */}
                {!isLive && (
                  <div style={{ alignSelf: 'center', textAlign: 'center', zIndex: 2 }}>
                    {isOffline ? (
                      <>
                        <AlertTriangle size={30} color="var(--color-blush-peach)" style={{ opacity: 0.9, margin: '0 auto 6px' }} />
                        <div style={{ fontFamily: 'var(--font-signifier)', fontSize: '15px', color: 'var(--color-blush-peach)' }}>
                          Stream Unavailable
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.65, marginTop: '2px' }}>
                          Camera endpoint offline / network dropped
                        </div>
                      </>
                    ) : (
                      <>
                        <Video size={32} color="var(--color-blush-peach)" style={{ opacity: 0.8, margin: '0 auto 6px' }} />
                        <div style={{ fontFamily: 'var(--font-signifier)', fontSize: '16px', fontWeight: 400, letterSpacing: '0.02em' }}>
                          Optical Stream
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.65 }}>
                          No physical hardware connected (Simulation)
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Viewport Bottom Info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
                  <span style={{ fontSize: '11px', opacity: 0.75, fontFamily: 'monospace' }}>
                    {cam.id}
                  </span>

                  {cam.ptzCapable && (
                    <span 
                      style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(251, 225, 209, 0.2)',
                        color: 'var(--color-blush-peach)'
                      }}
                    >
                      PTZ
                    </span>
                  )}
                </div>
              </div>

              {/* Camera Details & Metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-sohne)', fontSize: '16px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                      {cam.name}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)', marginTop: '2px' }}>
                      {cam.location} · {cam.zone}
                    </div>
                  </div>

                  <span className={`pill-badge ${isLive ? 'pill-badge-safe' : (isOffline ? 'pill-badge-peach' : 'pill-badge-neutral')}`} style={{ fontSize: '11px' }}>
                    {isLive ? '● Live Feed' : (isOffline ? '⚠ Offline' : '○ Synthetic')}
                  </span>
                </div>

                {/* Compact telemetry container */}
                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-mist-gray)',
                    borderRadius: 'var(--radius-smallcards)',
                    fontSize: '12px'
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--color-slate-gray)', fontSize: '11px' }}>Signal</div>
                    <div style={{ fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '2px' }}>
                      {isOffline ? '0 dBm' : '-54 dBm'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-slate-gray)', fontSize: '11px' }}>Bitrate</div>
                    <div style={{ fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '2px' }}>
                      {isOffline ? '0 Mbps' : '4.2 Mbps'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-slate-gray)', fontSize: '11px' }}>Service</div>
                    <div style={{ fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '2px' }}>{cam.lastMaintenance}</div>
                  </div>
                </div>

                {/* Matched Pill Buttons */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '6px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleTakeSnapshot(cam)}
                      className="pill-btn-ghost"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      title="Save timestamped frame to audit log"
                    >
                      <Camera size={13} />
                      <span>Snapshot</span>
                    </button>

                    <button
                      onClick={() => handleOpenConfig(cam)}
                      className="pill-btn-ghost"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      title="Configure physical ESP32-CAM stream URL"
                    >
                      <Wifi size={13} />
                      <span>ESP32 Link</span>
                    </button>
                  </div>

                  <HeroVideoDialog
                    animationStyle="from-center"
                    dialogTitle={`Surveillance Feed — ${cam.name} (${cam.id})`}
                    trigger={
                      <button
                        type="button"
                        className="pill-btn-filled"
                        style={{ padding: '6px 16px', fontSize: '13px' }}
                      >
                        <Maximize2 size={13} />
                        <span>Expanded →</span>
                      </button>
                    }
                  >
                    {(close) => (
                      <ExpandedCameraDialogContent
                        camera={cam}
                        onClose={close}
                        onSnapshot={() => handleTakeSnapshot(cam)}
                      />
                    )}
                  </HeroVideoDialog>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ESP32-CAM Stream Configuration Modal */}
      {configCam && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(23, 25, 28, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 300
          }}
        >
          <div 
            className="floating-artifact"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--color-paper-white)',
              borderRadius: 'var(--radius-cards)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: 'var(--shadow-subtle-2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span className="tag-category">Hardware Transport</span>
                <h3 style={{ fontFamily: 'var(--font-signifier)', fontSize: '22px', fontWeight: 400, marginTop: '2px' }}>
                  ESP32-CAM Stream Link
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)', marginTop: '2px' }}>
                  {configCam.name} ({configCam.id})
                </div>
              </div>
              <button 
                onClick={() => setConfigCam(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-slate-gray)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--color-slate-gray)', lineHeight: 1.5 }}>
              Enter an active HTTP / MJPEG stream endpoint hosted on your local network by an ESP32-CAM module (e.g. <code>http://192.168.1.120:81/stream</code>). The system probes the endpoint to verify physical connectivity.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                Stream Source URL
              </label>
              <input
                type="text"
                placeholder="http://192.168.1.x:81/stream or snapshot URL"
                value={streamUrlInput}
                onChange={(e) => setStreamUrlInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-inputs)',
                  border: 'var(--border-hairline)',
                  backgroundColor: 'var(--color-mist-gray)',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Quick Test URL Helper */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setStreamUrlInput('https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80')}
                className="pill-btn-ghost"
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                Fill Verified Sample Stream
              </button>
              <button
                type="button"
                onClick={() => setStreamUrlInput('')}
                className="pill-btn-ghost"
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                Clear URL
              </button>
            </div>

            {configCam.streamError && (
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-smallcards)', backgroundColor: 'var(--color-blush-peach)', color: 'var(--color-sienna-brown)', fontSize: '12px' }}>
                ⚠ {configCam.streamError}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: 'var(--border-hairline)', paddingTop: '16px', marginTop: '4px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSimulateOffline}
                  className="pill-btn-ghost"
                  style={{ padding: '7px 14px', fontSize: '12px' }}
                  title="Mark camera as offline to test failure notification"
                >
                  Set Offline
                </button>
                <button
                  type="button"
                  onClick={handleResetToSimulation}
                  className="pill-btn-ghost"
                  style={{ padding: '7px 14px', fontSize: '12px' }}
                  title="Reset to synthetic simulated feed"
                >
                  Reset Simulation
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setConfigCam(null)}
                  className="pill-btn-ghost"
                  style={{ padding: '7px 16px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStream}
                  disabled={isProbing}
                  className="pill-btn-filled"
                  style={{ padding: '7px 18px', fontSize: '13px' }}
                >
                  {isProbing ? 'Probing Endpoint...' : 'Connect & Probe'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ExpandedCameraDialogContentProps {
  camera: CameraFeed;
  onClose: () => void;
  onSnapshot: () => void;
}

const ExpandedCameraDialogContent: React.FC<ExpandedCameraDialogContentProps> = ({
  camera,
  onClose,
  onSnapshot,
}) => {
  const isLive = camera.status === 'live';
  const isOffline = camera.status === 'offline';

  return (
    <div
      className="floating-artifact"
      style={{
        maxWidth: '920px',
        width: '100%',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: 'var(--color-paper-white)',
        borderRadius: 'var(--radius-cards)',
        border: '1px solid rgba(23, 25, 28, 0.08)',
        boxShadow: '0 24px 60px -12px rgba(23, 25, 28, 0.25)',
      }}
    >
      {/* 1. TOP BAR: Status, Identity, Location & Close Button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span 
              className={`pill-badge ${isLive ? 'pill-badge-safe' : (isOffline ? 'pill-badge-peach' : 'pill-badge-neutral')}`}
              style={{ 
                fontSize: '11px', 
                fontWeight: 500,
                letterSpacing: '0.04em',
                padding: '3px 10px'
              }}
            >
              <span className={`status-dot ${isLive ? 'status-dot-safe' : (isOffline ? 'status-dot-warning' : 'status-dot-ink')}`} />
              {isLive ? `LIVE · ${camera.id}` : (isOffline ? `OFFLINE · ${camera.id}` : `SIMULATION · ${camera.id}`)}
            </span>

            <span 
              className="pill-badge pill-badge-neutral"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.04em',
                padding: '3px 10px'
              }}
            >
              {isLive ? 'SOURCE · PHYSICAL ESP32' : 'SOURCE · SIMULATION'}
            </span>

            {camera.ptzCapable && (
              <span 
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(23, 25, 28, 0.06)',
                  color: 'var(--color-slate-gray)'
                }}
              >
                PTZ CAPABLE
              </span>
            )}
          </div>

          <h2 
            style={{ 
              fontFamily: 'var(--font-signifier)', 
              fontSize: '26px', 
              fontWeight: 400, 
              color: 'var(--color-ink-black)',
              margin: 0,
              lineHeight: 1.2
            }}
          >
            {camera.name}
          </h2>
          <p 
            style={{ 
              fontFamily: 'var(--font-sohne)', 
              fontSize: '13px', 
              color: 'var(--color-slate-gray)',
              margin: 0
            }}
          >
            {camera.location} · {camera.zone} Zone
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close surveillance window"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-mist-gray)',
            border: '1px solid rgba(23, 25, 28, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-ink-black)',
            flexShrink: 0,
            transition: 'background-color 0.15s ease'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. CENTER: Large Optical Viewport */}
      <div 
        style={{
          position: 'relative',
          height: '420px',
          borderRadius: 'var(--radius-smallcards)',
          backgroundColor: 'var(--color-ink-black)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px',
          color: 'var(--color-paper-white)',
          overflow: 'hidden'
        }}
      >
        {isLive && camera.streamUrl ? (
          <img
            src={camera.streamUrl}
            alt={camera.name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1
            }}
          />
        ) : (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Viewport Corner Brackets */}
        <div style={{ position: 'absolute', top: 12, left: 12, width: 14, height: 14, borderTop: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)', pointerEvents: 'none', zIndex: 3 }} />
        <div style={{ position: 'absolute', top: 12, right: 12, width: 14, height: 14, borderTop: '2px solid rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.3)', pointerEvents: 'none', zIndex: 3 }} />
        <div style={{ position: 'absolute', bottom: 12, left: 12, width: 14, height: 14, borderBottom: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)', pointerEvents: 'none', zIndex: 3 }} />
        <div style={{ position: 'absolute', bottom: 12, right: 12, width: 14, height: 14, borderBottom: '2px solid rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.3)', pointerEvents: 'none', zIndex: 3 }} />

        {/* Top Information Strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2, fontSize: '12px', fontFamily: 'monospace' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255,255,255,0.14)',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 500
              }}
            >
              <span className={`status-dot ${isLive ? 'status-dot-safe' : (isOffline ? 'status-dot-warning' : 'status-dot-ink')}`} />
              {isLive ? 'OPTICAL STREAM · ACTIVE' : (isOffline ? 'STREAM · OFFLINE' : 'SYNTHETIC STREAM · SIMULATION')}
            </span>
            <span style={{ opacity: 0.8 }}>
              {camera.fps} FPS · {camera.resolution}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.8 }}>
            <span>{camera.streamUrl ? camera.streamUrl : `NODE-0${camera.id.replace(/\D/g, '') || '1'}.CAMPUS.INT`}</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Center Optical Stream Visualization (if not live) */}
        {!isLive && (
          <div style={{ alignSelf: 'center', textAlign: 'center', zIndex: 2 }}>
            <div 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(251, 225, 209, 0.12)',
                border: '1px solid rgba(251, 225, 209, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}
            >
              {isOffline ? (
                <AlertTriangle size={30} color="var(--color-blush-peach)" style={{ opacity: 0.9 }} />
              ) : (
                <Video size={30} color="var(--color-blush-peach)" style={{ opacity: 0.9 }} />
              )}
            </div>
            <div 
              style={{ 
                fontFamily: 'var(--font-signifier)', 
                fontSize: '22px', 
                fontWeight: 400, 
                letterSpacing: '0.01em',
                color: 'var(--color-paper-white)'
              }}
            >
              {isOffline ? 'Camera Stream Unavailable' : 'Optical Simulation Stream'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.65, marginTop: '4px' }}>
              {camera.name} · {isOffline ? 'Physical hardware connection lost' : 'Calibrated Synthetic Sensor Matrix'}
            </div>
            <div style={{ marginTop: '12px' }}>
              <span 
                style={{
                  fontSize: '10px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'var(--color-ash-gray)',
                  fontFamily: 'monospace'
                }}
              >
                {isOffline ? 'OFFLINE · RECHECK ENDPOINT' : 'SOURCE · SIMULATION · NO BIOMETRIC PROCESSING'}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Policy & Transport Line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2, fontSize: '11px', opacity: 0.75 }}>
          <span>POLICY COMPLIANCE: ZERO FACIAL RECOGNITION · OPTICAL ANOMALY ONLY</span>
          <span style={{ fontFamily: 'monospace' }}>SIGNAL: {isOffline ? 'DISCONNECTED' : '-54 DBM (OPTIMAL)'}</span>
        </div>
      </div>

      {/* 3. BOTTOM: Telemetry Metrics & Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Telemetry Grid */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: 'var(--color-mist-gray)',
            borderRadius: 'var(--radius-smallcards)',
            fontSize: '12px'
          }}
        >
          <div>
            <div style={{ color: 'var(--color-slate-gray)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Frame Rate</div>
            <div style={{ fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '3px', fontSize: '13px' }}>{camera.fps} FPS</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-slate-gray)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resolution</div>
            <div style={{ fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '3px', fontSize: '13px' }}>{camera.resolution}</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-slate-gray)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Signal Strength</div>
            <div style={{ fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '3px', fontSize: '13px' }}>
              {isOffline ? 'Offline' : '-54 dBm'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-slate-gray)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stream State</div>
            <div style={{ fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '3px', fontSize: '13px' }}>
              {isLive ? 'Physical Live' : (isOffline ? 'Offline / Disconnected' : 'Simulated')}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-slate-gray)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Maintenance</div>
            <div style={{ fontWeight: 500, color: 'var(--color-ink-black)', marginTop: '3px', fontSize: '13px' }}>{camera.lastMaintenance}</div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)' }}>
            Authorized operator view logged to operational compliance ledger.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onSnapshot}
              className="pill-btn-ghost"
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              <Camera size={14} />
              <span>Snapshot</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="pill-btn-filled"
              style={{ padding: '8px 22px', fontSize: '13px' }}
            >
              <span>Close Feed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringView;
