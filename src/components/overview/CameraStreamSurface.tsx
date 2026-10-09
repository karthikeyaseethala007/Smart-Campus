import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Camera,
  Maximize2,
  Flag,
  WifiOff,
} from 'lucide-react';
import type { CameraFeed } from '../../types';

interface CameraStreamSurfaceProps {
  camera: CameraFeed;
  mode?: 'simulated' | 'live' | 'hybrid';
  onSnapshot?: (cameraId: string) => void;
  onMarkIncident?: (cameraId: string) => void;
  onToggleFullscreen?: () => void;
  onRetryConnection?: (cameraId: string) => void;
  showControls?: boolean;
  aspectRatio?: string;
  minHeight?: string;
}

const DEFAULT_IMAGE_MAP: Record<string, string> = {
  'CAM-01': '/assets/cctv_main_gate.jpg',
  'CAM-02': '/assets/trail/campus-architecture.jpg',
  'CAM-03': '/assets/trail/optical-surveillance.jpg',
  'CAM-04': '/assets/trail/safety-sensor.jpg',
  'CAM-05': '/assets/trail/campus-entrance.jpg',
  'CAM-06': '/assets/trail/keypad-control.jpg',
  'CAM-07': '/assets/trail/energy-automation.jpg',
};

export const CameraStreamSurface: React.FC<CameraStreamSurfaceProps> = ({
  camera,
  mode = 'simulated',
  onSnapshot,
  onMarkIncident,
  onToggleFullscreen,
  onRetryConnection,
  showControls = true,
  aspectRatio,
  minHeight = '240px',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fallbackAsset = DEFAULT_IMAGE_MAP[camera.id] || '/assets/cctv_main_gate.jpg';
  const resolvedStreamUrl = camera.streamUrl || fallbackAsset;

  // Reset image error state when camera changes
  useEffect(() => {
    setImageError(false);
  }, [camera.id, camera.streamUrl]);

  // Procedural Canvas telemetry animation when offline/no_signal or if image fails
  useEffect(() => {
    if (!imageError && camera.status !== 'no_signal' && camera.status !== 'offline') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const { width, height } = canvas;
      ctx.fillStyle = '#060a0f';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const step = 24;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Scanline sweep
      const sweepY = (frame * 1.5) % height;
      ctx.fillStyle = 'rgba(255, 130, 0, 0.08)';
      ctx.fillRect(0, sweepY, width, 4);

      // Noise grain if offline or no signal
      if (camera.status === 'no_signal' || camera.status === 'offline') {
        const idata = ctx.getImageData(0, 0, width, height);
        const data = idata.data;
        for (let i = 0; i < data.length; i += 16) {
          const noise = (Math.random() - 0.5) * 20;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        ctx.putImageData(idata, 0, 0);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [imageError, camera.status]);

  const handleRetry = () => {
    setIsRetrying(true);
    if (onRetryConnection) {
      onRetryConnection(camera.id);
    }
    setTimeout(() => {
      setImageError(false);
      setIsRetrying(false);
    }, 1000);
  };

  const statusBadge = () => {
    switch (camera.status) {
      case 'live':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(34, 197, 94, 0.16)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#22c55e',
              fontSize: '0.688rem',
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 700,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span>LIVE FEED</span>
          </span>
        );
      case 'simulation':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 130, 0, 0.14)',
              border: '1px solid rgba(255, 130, 0, 0.3)',
              color: '#FF8200',
              fontSize: '0.688rem',
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 700,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF8200' }} />
            <span>SIMULATED</span>
          </span>
        );
      case 'connecting':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(59, 130, 246, 0.16)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              fontSize: '0.688rem',
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 700,
            }}
          >
            <RefreshCw size={10} className="animate-spin" />
            <span>CONNECTING</span>
          </span>
        );
      case 'no_signal':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(234, 179, 8, 0.16)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              color: '#eab308',
              fontSize: '0.688rem',
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 700,
            }}
          >
            <WifiOff size={10} />
            <span>NO SIGNAL</span>
          </span>
        );
      case 'offline':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(239, 68, 68, 0.16)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.688rem',
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 700,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span>OFFLINE</span>
          </span>
        );
    }
  };

  const isOffline = camera.status === 'offline';
  const isNoSignal = camera.status === 'no_signal';
  const hasVisualFeed = !isOffline && !isNoSignal && !imageError;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight,
        aspectRatio,
        backgroundColor: '#05070a',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Background Visual Layer */}
      {hasVisualFeed ? (
        <img
          src={resolvedStreamUrl}
          alt={`Camera stream for ${camera.name}`}
          onError={() => setImageError(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: camera.status === 'simulation' ? 0.92 : 0.98,
            filter: camera.status === 'simulation' ? 'contrast(1.08) brightness(0.96)' : 'none',
          }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          width={480}
          height={320}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* Optical Scanline Texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(10, 15, 20, 0) 50%, rgba(0, 0, 0, 0.35) 50%)',
          backgroundSize: '100% 4px',
          pointerEvents: 'none',
          opacity: 0.45,
          zIndex: 2,
        }}
      />

      {/* Tactical Corner Brackets */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', width: '16px', height: '16px', borderTop: '2px solid rgba(255, 255, 255, 0.5)', borderLeft: '2px solid rgba(255, 255, 255, 0.5)', pointerEvents: 'none', zIndex: 3 }} />
      <div style={{ position: 'absolute', top: '10px', right: '10px', width: '16px', height: '16px', borderTop: '2px solid rgba(255, 255, 255, 0.5)', borderRight: '2px solid rgba(255, 255, 255, 0.5)', pointerEvents: 'none', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '16px', height: '16px', borderBottom: '2px solid rgba(255, 255, 255, 0.5)', borderLeft: '2px solid rgba(255, 255, 255, 0.5)', pointerEvents: 'none', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '16px', height: '16px', borderBottom: '2px solid rgba(255, 255, 255, 0.5)', borderRight: '2px solid rgba(255, 255, 255, 0.5)', pointerEvents: 'none', zIndex: 3 }} />

      {/* Center Failure / Offline Overlay */}
      {(!hasVisualFeed || isOffline || isNoSignal) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(5, 7, 10, 0.75)',
            zIndex: 4,
            padding: '16px',
            textAlign: 'center',
            gap: '8px',
          }}
        >
          {isNoSignal ? (
            <>
              <WifiOff size={28} color="#eab308" />
              <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-mono, monospace)' }}>
                NO SIGNAL DETECTED
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.688rem', maxWidth: '280px' }}>
                RTSP carrier signal missing for {camera.name}.
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={28} color="#ef4444" />
              <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-mono, monospace)' }}>
                CAMERA ENDPOINT OFFLINE
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.688rem', maxWidth: '280px' }}>
                {camera.name} ({camera.id}) ping timeout.
              </div>
            </>
          )}

          <button
            onClick={handleRetry}
            disabled={isRetrying}
            style={{
              marginTop: '4px',
              padding: '5px 12px',
              borderRadius: '4px',
              backgroundColor: '#FF8200',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.688rem',
              fontWeight: 600,
              fontFamily: 'var(--font-mono, monospace)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={11} className={isRetrying ? 'animate-spin' : ''} />
            <span>{isRetrying ? 'PROBING...' : 'RECONNECT STREAM'}</span>
          </button>
        </div>
      )}

      {/* Top Telemetry Overlay */}
      <div
        style={{
          position: 'relative',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 5,
          background: 'linear-gradient(180deg, rgba(5, 7, 10, 0.8) 0%, rgba(5, 7, 10, 0) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {statusBadge()}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#FFFFFF',
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
            }}
          >
            {camera.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.688rem', fontFamily: 'var(--font-mono, monospace)', color: 'rgba(255, 255, 255, 0.7)' }}>
          <span>{camera.resolution}</span>
          <span>·</span>
          <span>{isOffline ? 0 : camera.fps} FPS</span>
        </div>
      </div>

      {/* Bottom Controls & Metadata Bar */}
      <div
        style={{
          position: 'relative',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 5,
          background: 'linear-gradient(0deg, rgba(5, 7, 10, 0.85) 0%, rgba(5, 7, 10, 0) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.688rem', fontFamily: 'var(--font-mono, monospace)', color: 'rgba(255, 255, 255, 0.65)' }}>
          <span style={{ color: '#FF8200' }}>[{camera.id}]</span>
          <span>{camera.zone}</span>
          <span>·</span>
          <span>{mode.toUpperCase()}</span>
        </div>

        {showControls && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onSnapshot && (
              <button
                onClick={() => onSnapshot(camera.id)}
                title="Capture timestamped frame"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                <Camera size={11} color="#FF8200" />
                <span>SNAP</span>
              </button>
            )}

            {onMarkIncident && (
              <button
                onClick={() => onMarkIncident(camera.id)}
                title="Flag security incident on camera location"
                style={{
                  background: 'rgba(255, 0, 0, 0.15)',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  color: '#FF6B6B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 600,
                }}
              >
                <Flag size={11} />
                <span>MARK INCIDENT</span>
              </button>
            )}

            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                title="Fullscreen view"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  padding: '4px 6px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Maximize2 size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
