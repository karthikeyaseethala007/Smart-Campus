import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';
import { Shield, Zap, Lock, Flame, Radio } from 'lucide-react';

export interface CampusBuildingData {
  id: string;
  name: string;
  category: string;
  devices: number;
  portals: string;
  sensors: string;
  energyKW: number;
  safetyStatus: string;
  coords: { x: number; z: number; w: number; h: number; d: number };
  color: number;
}

export const CAMPUS_BUILDINGS: CampusBuildingData[] = [
  {
    id: 'science',
    name: 'Science Complex',
    category: 'Research & Chemical Facilities',
    devices: 34,
    portals: 'Science Lab 204 (Restricted Dual-PIN)',
    sensors: '18 Smoke / Thermal Heads · 420 ppm Nominal',
    energyKW: 68.4,
    safetyStatus: 'Suppression Armed · Clean',
    coords: { x: -6, z: -6, w: 7, h: 6.5, d: 6 },
    color: 0x2c4258,
  },
  {
    id: 'engineering',
    name: 'Engineering Hall',
    category: 'Labs & Computing Infrastructure',
    devices: 42,
    portals: 'Engineering E-04 (Keypad & RFID Active)',
    sensors: '24 Optical & PIR Occupancy Nodes',
    energyKW: 92.1,
    safetyStatus: 'Nominal Operations',
    coords: { x: 6, z: -5, w: 6, h: 8.2, d: 7 },
    color: 0x253341,
  },
  {
    id: 'library',
    name: 'Library South',
    category: 'High-Throughput Study Pavilions',
    devices: 21,
    portals: 'Library South Entrance (Optical Turnstiles)',
    sensors: '12 Occupancy Infrared · 6 Ambient Lux',
    energyKW: 38.6,
    safetyStatus: 'Nominal Operations',
    coords: { x: -5, z: 6, w: 8, h: 4.2, d: 6 },
    color: 0x3a5774,
  },
  {
    id: 'administration',
    name: 'Administration Quad',
    category: 'Governance & Operational Command',
    devices: 18,
    portals: 'Quad Central Portal (Biometric Override Locked)',
    sensors: '9 Security Contacts · 4 Environmental',
    energyKW: 44.2,
    safetyStatus: 'Nominal Operations',
    coords: { x: 7, z: 6, w: 6, h: 5.4, d: 5 },
    color: 0x2c4258,
  },
  {
    id: 'perimeter',
    name: 'Perimeter Sector',
    category: 'Access Gates & Boundary Telemetry',
    devices: 12,
    portals: 'Main Gate Barrier (Vehicle & Pedestrian Interlock)',
    sensors: '6 Microwave Radar · 4 Optical Domes',
    energyKW: 14.8,
    safetyStatus: 'Perimeter Secured',
    coords: { x: 0, z: 0, w: 4, h: 2.8, d: 4 },
    color: 0x101820,
  },
];

export const CampusNetwork3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('science');
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);

  // Active building for display
  const activeBuilding =
    CAMPUS_BUILDINGS.find((b) => b.id === (hoveredBuildingId || selectedBuildingId)) ||
    CAMPUS_BUILDINGS[0];

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(28, 22, 28);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xd1dbe6, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.3);
    sunLight.position.set(30, 45, 25);
    scene.add(sunLight);

    const warmAccentLight = new THREE.PointLight(0xffa13d, 1.2, 40);
    warmAccentLight.position.set(0, 8, 0);
    scene.add(warmAccentLight);

    const group = new THREE.Group();
    scene.add(group);

    // Grid Floor
    const grid = new THREE.GridHelper(32, 32, 0x476b8f, 0x101820);
    grid.position.y = 0;
    group.add(grid);

    // Buildings & Mesh mapping for Raycasting
    const meshMap = new Map<THREE.Mesh, CampusBuildingData>();
    const meshes: THREE.Mesh[] = [];

    CAMPUS_BUILDINGS.forEach((b) => {
      const geo = new THREE.BoxGeometry(b.coords.w, b.coords.h, b.coords.d);
      const mat = new THREE.MeshStandardMaterial({
        color: b.color,
        roughness: 0.35,
        metalness: 0.15,
        transparent: true,
        opacity: 0.92,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.coords.x, b.coords.h / 2, b.coords.z);
      mesh.userData = { id: b.id };
      group.add(mesh);
      meshes.push(mesh);
      meshMap.set(mesh, b);

      // Edge outline
      const edges = new THREE.EdgesGeometry(geo);
      const edgeLine = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: 0x7c9ec0,
          transparent: true,
          opacity: 0.6,
        })
      );
      edgeLine.position.copy(mesh.position);
      group.add(edgeLine);

      // Roof Antenna Node
      const nodeGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: 0xffa13d,
        emissive: 0xffa13d,
        emissiveIntensity: 0.7,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(b.coords.x, b.coords.h + 0.5, b.coords.z);
      group.add(nodeMesh);

      // Bus line to central perimeter
      if (b.id !== 'perimeter') {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(b.coords.x, 0.1, b.coords.z),
          new THREE.Vector3(0, 0.1, 0),
        ]);
        const line = new THREE.Line(
          lineGeo,
          new THREE.LineBasicMaterial({
            color: 0x5580aa,
            transparent: true,
            opacity: 0.4,
          })
        );
        group.add(line);
      }
    });

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    container.addEventListener('mousemove', onPointerMove);

    // Render loop
    let animId: number;
    let clock = new THREE.Clock();
    let isVisible = true;

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

      const elapsed = clock.getElapsedTime();

      if (!shouldReduceMotion) {
        group.rotation.y = Math.sin(elapsed * 0.15) * 0.06;
      }

      // Raycast for hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const b = meshMap.get(hit);
        if (b) {
          setHoveredBuildingId(b.id);
        }
      } else {
        setHoveredBuildingId(null);
      }

      // Update highlight colors
      meshes.forEach((m) => {
        const id = m.userData.id;
        const isHovered = id === hoveredBuildingId;
        const isSelected = id === selectedBuildingId;
        const mat = m.material as THREE.MeshStandardMaterial;

        if (isHovered || isSelected) {
          mat.emissive.setHex(0xffa13d);
          mat.emissiveIntensity = isHovered ? 0.45 : 0.25;
          mat.color.setHex(0x3a5774);
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
          mat.color.setHex(0x253341);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      renderer.dispose();
    };
  }, [shouldReduceMotion, hoveredBuildingId, selectedBuildingId]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: '24px',
        alignItems: 'stretch',
      }}
      className="campus-network-grid"
    >
      {/* Left 3D Canvas Box */}
      <div
        ref={containerRef}
        style={{
          height: '520px',
          borderRadius: '1.3135rem',
          backgroundColor: 'var(--color-primary-950, #101820)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-subtle-2)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', outline: 'none' }}
        />

        {/* Hover hint */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '6px 14px',
            backgroundColor: 'rgba(16, 24, 32, 0.8)',
            backdropFilter: 'blur(8px)',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.75rem',
            color: '#adc2d6',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          Hover Building · Live Architectural Telemetry
        </div>

        {/* Selector pills on bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {CAMPUS_BUILDINGS.map((b) => {
            const isCurrent = b.id === (hoveredBuildingId || selectedBuildingId);
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBuildingId(b.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  backgroundColor: isCurrent ? '#ffa13d' : 'rgba(255, 255, 255, 0.08)',
                  color: isCurrent ? '#101820' : '#f5f7fa',
                  fontWeight: isCurrent ? 600 : 400,
                  border: isCurrent ? '1px solid #ffa13d' : '1px solid rgba(255, 255, 255, 0.12)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Telemetry Metadata Card (Elevated Editorial Surface) */}
      <div
        style={{
          backgroundColor: 'var(--color-paper-white, #ffffff)',
          borderRadius: '1.3135rem',
          border: 'var(--border-hairline)',
          boxShadow: 'var(--shadow-subtle-2)',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-sienna-brown, #ffa13d)',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            <Radio size={12} />
            <span>Zone Telemetry</span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-display, sans-serif)',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--color-ink-black)',
              marginBottom: '4px',
            }}
          >
            {activeBuilding.name}
          </h3>
          <p style={{ fontSize: '0.813rem', color: 'var(--color-slate-gray)', marginBottom: '24px' }}>
            {activeBuilding.category}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Devices Metric */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                backgroundColor: 'var(--color-fog-white, #f5f7fa)',
                borderRadius: '0.6567rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={16} color="var(--color-slate-gray)" />
                <span style={{ fontSize: '0.813rem', color: 'var(--color-slate-gray)' }}>
                  Active Hardware
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.938rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-black)',
                }}
              >
                {activeBuilding.devices} Nodes
              </span>
            </div>

            {/* Portals Metric */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '12px 14px',
                backgroundColor: 'var(--color-fog-white, #f5f7fa)',
                borderRadius: '0.6567rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={16} color="var(--color-slate-gray)" />
                <span style={{ fontSize: '0.813rem', color: 'var(--color-slate-gray)' }}>
                  Primary Portal
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--color-ink-black)',
                  maxWidth: '140px',
                  textAlign: 'right',
                }}
              >
                {activeBuilding.portals}
              </span>
            </div>

            {/* Energy Load */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                backgroundColor: 'var(--color-fog-white, #f5f7fa)',
                borderRadius: '0.6567rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={16} color="var(--color-sienna-brown, #ffa13d)" />
                <span style={{ fontSize: '0.813rem', color: 'var(--color-slate-gray)' }}>
                  Load Demand
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.938rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-black)',
                }}
              >
                {activeBuilding.energyKW} kW
              </span>
            </div>

            {/* Safety status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                backgroundColor: 'var(--color-fog-white, #f5f7fa)',
                borderRadius: '0.6567rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Flame size={16} color="#22c55e" />
                <span style={{ fontSize: '0.813rem', color: 'var(--color-slate-gray)' }}>
                  Safety Readiness
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#22c55e',
                }}
              >
                {activeBuilding.safetyStatus}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: 'var(--border-hairline)',
            paddingTop: '16px',
            marginTop: '20px',
            fontSize: '0.75rem',
            color: 'var(--color-slate-gray)',
            lineHeight: 1.4,
          }}
        >
          Sensors: {activeBuilding.sensors}
        </div>
      </div>
    </div>
  );
};
