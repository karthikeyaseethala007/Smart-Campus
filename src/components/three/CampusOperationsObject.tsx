import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';

export interface CampusOperationsObjectProps {
  className?: string;
  style?: React.CSSProperties;
}

export const CampusOperationsObject: React.FC<CampusOperationsObjectProps> = ({
  className = '',
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Dimensions
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera - Isometric-style Perspective
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(24, 20, 24);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting: Subtle dark-blue ambient + crisp directional + warm accent rim
    const ambientLight = new THREE.AmbientLight(0xd1dbe6, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(30, 40, 20);
    scene.add(dirLight1);

    const warmRim = new THREE.DirectionalLight(0xffa13d, 0.65);
    warmRim.position.set(-25, -10, -20);
    scene.add(warmRim);

    const blueFill = new THREE.DirectionalLight(0x5580aa, 0.5);
    blueFill.position.set(0, -30, 20);
    scene.add(blueFill);

    // Campus Root Group
    const campusGroup = new THREE.Group();
    scene.add(campusGroup);

    // Base Grid Plane (Architectural Blueprint Plate)
    const baseGeo = new THREE.BoxGeometry(26, 0.4, 26);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x101820,
      roughness: 0.6,
      metalness: 0.2,
    });
    const basePlate = new THREE.Mesh(baseGeo, baseMat);
    basePlate.position.y = -0.2;
    campusGroup.add(basePlate);

    // Grid lines
    const gridHelper = new THREE.GridHelper(26, 26, 0x3a5774, 0x253341);
    gridHelper.position.y = 0.01;
    campusGroup.add(gridHelper);

    // Buildings Data: Architectural volumetric masses
    const buildings = [
      { name: 'Science Complex', x: -5, z: -5, w: 6, h: 5.5, d: 5, color: 0x2c4258, edgeColor: 0x7c9ec0 },
      { name: 'Engineering Hall', x: 5, z: -4, w: 5, h: 7.2, d: 6, color: 0x253341, edgeColor: 0x5580aa },
      { name: 'Library South', x: -4, z: 6, w: 7, h: 3.8, d: 5, color: 0x3a5774, edgeColor: 0xadc2d6 },
      { name: 'Admin Quad', x: 6, z: 5, w: 5, h: 4.6, d: 5, color: 0x2c4258, edgeColor: 0x7c9ec0 },
      { name: 'Server Vault', x: 0, z: 0, w: 3.5, h: 2.8, d: 3.5, color: 0x101820, edgeColor: 0xffa13d },
    ];

    const buildingMeshes: THREE.Mesh[] = [];

    buildings.forEach((b) => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshStandardMaterial({
        color: b.color,
        roughness: 0.4,
        metalness: 0.1,
        transparent: true,
        opacity: 0.94,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.h / 2, b.z);
      campusGroup.add(mesh);
      buildingMeshes.push(mesh);

      // Building Edges for clean architectural outline
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: b.edgeColor, transparent: true, opacity: 0.7 })
      );
      line.position.copy(mesh.position);
      campusGroup.add(line);
    });

    // Floating IoT Sensor Nodes
    interface SensorNode {
      mesh: THREE.Mesh;
      ring: THREE.Mesh;
      x: number;
      z: number;
      y: number;
      pulseSpeed: number;
      type: string;
      zone: string;
      telemetry: string;
    }

    const sensorNodes: SensorNode[] = [];
    const nodeDefs = [
      { x: -5, y: 6.2, z: -5, type: 'smoke', zone: 'Science Lab 204', telemetry: 'Smoke: 412 ppm · Nominal', color: 0x22c55e },
      { x: 5, y: 7.9, z: -4, type: 'motion', zone: 'Engineering E-04', telemetry: 'PIR Occupancy Active', color: 0xffa13d },
      { x: -4, y: 4.4, z: 6, type: 'access', zone: 'Library South Portal', telemetry: 'Turnstile Door Lock · Engaged', color: 0x7c9ec0 },
      { x: 6, y: 5.2, z: 5, type: 'camera', zone: 'Admin Quad Perimeter', telemetry: 'Optical Dome · 30 FPS Stream', color: 0x5580aa },
      { x: 0, y: 3.4, z: 0, type: 'energy', zone: 'Server Vault Feeder', telemetry: 'Power Bus: 286 kWh Total', color: 0xff8200 },
      { x: 9, y: 1.0, z: -9, type: 'gate', zone: 'Main Perimeter Gate', telemetry: 'Barrier Relay Nominal', color: 0x22c55e },
    ];

    nodeDefs.forEach((nd) => {
      const sGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const sMat = new THREE.MeshStandardMaterial({
        color: nd.color,
        emissive: nd.color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(nd.x, nd.y, nd.z);
      campusGroup.add(sMesh);

      // Outer Pulsing Ring
      const rGeo = new THREE.RingGeometry(0.45, 0.6, 24);
      const rMat = new THREE.MeshBasicMaterial({
        color: nd.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.rotation.x = Math.PI / 2;
      rMesh.position.set(nd.x, nd.y - 0.2, nd.z);
      campusGroup.add(rMesh);

      sensorNodes.push({
        mesh: sMesh,
        ring: rMesh,
        x: nd.x,
        y: nd.y,
        z: nd.z,
        pulseSpeed: 1.5 + Math.random() * 1.5,
        type: nd.type,
        zone: nd.zone,
        telemetry: nd.telemetry,
      });
    });

    // Data Flow Packets traveling along bus lines
    const packetGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xffa13d });
    const packets: { mesh: THREE.Mesh; start: THREE.Vector3; end: THREE.Vector3; t: number; speed: number }[] = [];

    const centerPoint = new THREE.Vector3(0, 1.4, 0);
    sensorNodes.forEach((node) => {
      const start = new THREE.Vector3(node.x, node.y, node.z);
      const packet = new THREE.Mesh(packetGeo, packetMat);
      campusGroup.add(packet);
      packets.push({
        mesh: packet,
        start,
        end: centerPoint,
        t: Math.random(),
        speed: 0.006 + Math.random() * 0.005,
      });

      // Drawn Bus Line connecting node to center
      const lineCurve = new THREE.LineCurve3(start, centerPoint);
      const tubeGeo = new THREE.TubeGeometry(lineCurve, 20, 0.04, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x3a5774,
        transparent: true,
        opacity: 0.35,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      campusGroup.add(tube);
    });

    // Mouse Parallax Interaction
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.25;
      targetRotX = y * 0.15;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Render loop
    let animId: number;
    let clock = new THREE.Clock();
    let isVisible = true;

    // IntersectionObserver to pause rendering when offscreen
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsedTime = clock.getElapsedTime();

      if (!shouldReduceMotion) {
        // Idle gentle rotation + mouse parallax damping
        currentRotY += (targetRotY - currentRotY) * 0.05;
        currentRotX += (targetRotX - currentRotX) * 0.05;

        campusGroup.rotation.y = currentRotY + Math.sin(elapsedTime * 0.3) * 0.08;
        campusGroup.rotation.x = currentRotX + Math.cos(elapsedTime * 0.2) * 0.03;

        // Sensor Node Pulses
        sensorNodes.forEach((sn) => {
          const s = 1 + Math.sin(elapsedTime * sn.pulseSpeed) * 0.2;
          sn.mesh.scale.set(s, s, s);
          const rs = 1 + Math.sin(elapsedTime * sn.pulseSpeed) * 0.4;
          sn.ring.scale.set(rs, rs, rs);
          (sn.ring.material as THREE.MeshBasicMaterial).opacity = 0.6 - (rs - 1) * 0.5;
        });

        // Packets motion
        packets.forEach((p) => {
          p.t += p.speed;
          if (p.t > 1) p.t = 0;
          p.mesh.position.lerpVectors(p.start, p.end, p.t);
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      renderer.dispose();
    };
  }, [shouldReduceMotion]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        height: '560px',
        maxWidth: '1100px',
        margin: '0 auto',
        borderRadius: '1.3135rem',
        backgroundColor: 'var(--color-primary-950, #101820)',
        boxShadow: '0 24px 60px -12px rgba(16, 24, 32, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          outline: 'none',
        }}
      />

      {/* Floating HUD Telemetry Badges (Editorial Layering) */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: 'rgba(16, 24, 32, 0.75)',
            backdropFilter: 'blur(12px)',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f5f7fa',
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '9999px',
              backgroundColor: '#22c55e',
              boxShadow: '0 0 8px #22c55e',
            }}
          />
          <span>Campus Object · 3D Operations Abstract</span>
        </div>

        <div
          style={{
            fontSize: '0.813rem',
            color: '#adc2d6',
            letterSpacing: '0.02em',
            paddingLeft: '4px',
          }}
        >
          5 Buildings · 127 Nodes · Autonomous Telemetry Bus
        </div>
      </div>

      {/* Interactive Bottom Control / Status Strip */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '28px',
          right: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Access', 'Safety', 'Optical', 'Energy'].map((type, i) => (
            <span
              key={type}
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: i === 1 ? '#ffa13d' : '#adc2d6',
              }}
            >
              {type}
            </span>
          ))}
        </div>

        <span
          style={{
            fontSize: '0.7rem',
            color: '#7c9ec0',
            letterSpacing: '0.05em',
            fontFamily: 'monospace',
          }}
        >
          [ Interactive 3D · Orbit / Parallax ]
        </span>
      </div>
    </div>
  );
};
