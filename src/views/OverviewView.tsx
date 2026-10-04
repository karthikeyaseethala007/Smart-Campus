import React from 'react';
import { useAppState } from '../services/stateContext';
import { OverviewHeader } from '../components/overview/OverviewHeader';
import { HeroOperationsBand } from '../components/overview/HeroOperationsBand';
import { LiveOperationalStrip } from '../components/overview/LiveOperationalStrip';
import { SurveillancePrimaryPanel } from '../components/overview/SurveillancePrimaryPanel';
import { LiveIncidentStrip } from '../components/overview/LiveIncidentStrip';
import { CampusPulseGraph } from '../components/overview/CampusPulseGraph';
import { SensorNetworkModule } from '../components/overview/SensorNetworkModule';
import { AccessControlModule } from '../components/overview/AccessControlModule';
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
      {/* 01. GLOBAL COMMAND HEADER */}
      <OverviewHeader />

      {/* 02. COMMAND CENTER INTRO + SYSTEM STATUS */}
      <HeroOperationsBand
        systemHealthPct={systemHealthPct}
        lockedDoorsCount={lockedDoors}
        totalDoorsCount={totalDoors}
        onlineDevicesCount={onlineDevices}
        totalDevicesCount={totalDevices}
        totalDemandKw={totalDemandKw}
        isEmergency={isEmergency}
      />

      {/* 03. LIVE OPERATIONAL STRIP (6 Signals: CCTV, Access, PIR, MQ-2, Energy, IoT) */}
      <LiveOperationalStrip />

      {/* 04. PRIMARY SURVEILLANCE STAGE */}
      <SurveillancePrimaryPanel />

      {/* 05. LIVE INCIDENTS & CAMPUS PULSE */}
      <LiveIncidentStrip />

      <CampusPulseGraph />

      {/* 06. SENSOR INTELLIGENCE & ACCESS CONTROL (Stacked Asymmetric Tactical Grid) */}
      <section
        aria-label="Sensor Intelligence and Access Control Workspace"
        className="tactical-duo-grid"
      >
        <SensorNetworkModule />
        <AccessControlModule />
      </section>

      {/* 07. CAMPUS ZONES (7 Operational Spatial Nodes Synced with Surveillance) */}
      <SecurityCoverageMatrix />

      {/* 08. FOUR OPERATIONAL PILLARS (Protect, Detect, Respond, Automate) */}
      <FourSystemPillars />

      {/* 09. RECENT ACTIVITY STREAM & QUICK ACTIONS COMMAND BAR */}
      <section
        aria-label="Activity Feed, Audit Trail, and Quick Command Dispatch"
        className="overview-bottom-grid"
      >
        <RecentActivityFeed maxItems={6} />
        <QuickCommandBar />
      </section>
    </div>
  );
};
