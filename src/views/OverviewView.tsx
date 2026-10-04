import React from 'react';
import { useAppState } from '../services/stateContext';
import { OverviewHeader } from '../components/overview/OverviewHeader';
import { HeroOperationsBand } from '../components/overview/HeroOperationsBand';
import { LiveIncidentStrip } from '../components/overview/LiveIncidentStrip';
import { SurveillancePrimaryPanel } from '../components/overview/SurveillancePrimaryPanel';
import { AccessControlModule } from '../components/overview/AccessControlModule';
import { SensorNetworkModule } from '../components/overview/SensorNetworkModule';
import { CampusPulseGraph } from '../components/overview/CampusPulseGraph';
import { SecurityCoverageMatrix } from '../components/overview/SecurityCoverageMatrix';
import { FourSystemPillars } from '../components/overview/FourSystemPillars';
import { RecentActivityFeed } from '../components/overview/RecentActivityFeed';
import { QuickCommandBar } from '../components/overview/QuickCommandBar';

export const OverviewView: React.FC = () => {
  const {
    campusStatus,
    doors,
    devices,
    automations,
  } = useAppState();

  const isEmergency = campusStatus === 'EMERGENCY';

  // Live calculations for telemetry indicators
  const totalDoors = doors.length;
  const lockedDoors = doors.filter((d) => d.lockStatus === 'locked').length;
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === 'online').length;
  const submeterLoadKw = automations.reduce((sum, z) => sum + z.currentPowerKw, 0);
  const totalDemandKw = (35.0 + submeterLoadKw).toFixed(2);

  // System Health percentage: 98.7% nominal baseline, dropping during emergency
  const systemHealthPct = isEmergency ? 82.4 : 98.7;

  return (
    <div
      aria-label="Smart Campus Operations Command Center"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
      }}
    >
      {/* 01. HEADER: SMART CAMPUS Command Center, Operational Status, Date/Time, RBAC Role, Notifications */}
      <OverviewHeader />

      {/* 02. HERO OPERATIONS BAND: CAMPUS COMMAND CENTER + 98.7% SYSTEM HEALTH + 4 STATUS INDICATORS */}
      <HeroOperationsBand
        systemHealthPct={systemHealthPct}
        lockedDoorsCount={lockedDoors}
        totalDoorsCount={totalDoors}
        onlineDevicesCount={onlineDevices}
        totalDevicesCount={totalDevices}
        totalDemandKw={totalDemandKw}
        isEmergency={isEmergency}
      />

      {/* 03. LIVE INCIDENT STRIP: IMMEDIATELY BELOW HERO (CRITICAL / WARNING / RESOLVED) */}
      <LiveIncidentStrip />

      {/* 04. MAIN OPERATIONS AREA: ASYMMETRIC COMPOSITION (LEFT: CCTV VISUAL, RIGHT: ACCESS & SENSORS) */}
      <section
        aria-label="Primary Tactical Operations"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(360px, 1fr)',
          gap: '24px',
          alignItems: 'stretch',
        }}
      >
        {/* LEFT: Large Primary Surveillance Panel (Main Gate CAM-01) */}
        <div style={{ minHeight: '440px' }}>
          <SurveillancePrimaryPanel />
        </div>

        {/* RIGHT: Stacked Operational Modules (Access Control & Sensor Network) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            justifyContent: 'space-between',
          }}
        >
          {/* Module 1: Access Control (128 Authorized Today KPI + 8 attempts / 2 denied / 1 alert) */}
          <AccessControlModule />

          {/* Module 2: Sensor Network (PIR, MQ-2, Temperature, Energy clean visualization) */}
          <SensorNetworkModule />
        </div>
      </section>

      {/* 05. ENERGY / CAMPUS PULSE: WIDE 24-HOUR TELEMETRY CURVE (54.00 kW vs 54.85 kW) */}
      <CampusPulseGraph />

      {/* 06. SECURITY COVERAGE: 7 CAMPUS ZONES CONNECTED OPERATIONAL MATRIX */}
      <SecurityCoverageMatrix />

      {/* 07. FOUR SYSTEM PILLARS: PROTECT, DETECT, RESPOND, AUTOMATE WITH HOVER REVEAL */}
      <FourSystemPillars />

      {/* 08. LOWER OPERATIONS ROW: RECENT ACTIVITY FEED + QUICK ACTIONS COMMAND AREA */}
      <section
        aria-label="Operational Activity & Quick Command Area"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left: Operational Timeline Feed */}
        <RecentActivityFeed maxItems={5} />

        {/* Right: Minimal Command Dispatch Controls */}
        <QuickCommandBar />
      </section>
    </div>
  );
};
