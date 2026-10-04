import React from 'react';
import { Check, X, Shield } from 'lucide-react';

export const UsersView: React.FC = () => {
  const permissions = [
    { feature: 'View Campus Overview & Metrics', admin: true, security_officer: true, faculty: true, student: true },
    { feature: 'Optical CCTV Monitoring Feeds', admin: true, security_officer: true, faculty: true, student: false },
    { feature: 'Remote Door Lock & Release', admin: true, security_officer: true, faculty: false, student: false },
    { feature: 'Incident Acknowledge & Resolution', admin: true, security_officer: true, faculty: false, student: false },
    { feature: 'Emergency Evacuation Broadcast', admin: true, security_officer: true, faculty: false, student: false },
    { feature: 'IoT Hardware Node Diagnostics', admin: true, security_officer: false, faculty: false, student: false },
    { feature: 'Simulate Fire & Breach Scenarios', admin: true, security_officer: true, faculty: false, student: false },
    { feature: 'Manage System Users & RBAC Rules', admin: true, security_officer: false, faculty: false, student: false }
  ];

  const staffMembers = [
    { name: 'Dr. Sarah Jenkins', role: 'Administrator', dept: 'Campus Operations & Security IT', clearance: 'Level 5 (Full Direct Admin)' },
    { name: 'Capt. Marcus Vance', role: 'Security Officer', dept: 'Campus Guard & Incident Dispatch', clearance: 'Level 4 (Operational Responder)' },
    { name: 'Prof. Alan Turing', role: 'Faculty Member', dept: 'School of Computer Science', clearance: 'Level 2 (Academic Access)' },
    { name: 'Elena Rostova', role: 'Student', dept: 'Undergraduate Engineering', clearance: 'Level 1 (Public Services Only)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Editorial Section Heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h1 className="heading-editorial">
            Identity & <em>clearance matrix.</em>
          </h1>
          <p className="subhead-editorial" style={{ marginTop: '6px' }}>
            Enforcing least-privilege security boundaries across students, academic staff, and operational officers.
          </p>
        </div>

        <div className="pill-badge pill-badge-neutral">
          <Shield size={14} color="var(--color-slate-gray)" />
          <span>4 Active Clearance Levels</span>
        </div>
      </div>

      {/* Permission Matrix wrapped in Floating Product Artifact */}
      <div className="floating-artifact" style={{ padding: 0, overflowX: 'auto' }}>
        <div style={{ padding: '24px 32px', borderBottom: 'var(--border-hairline)' }}>
          <h3 style={{ fontFamily: 'var(--font-signifier)', fontSize: '22px', fontWeight: 400, color: 'var(--color-ink-black)' }}>
            Functional Security Privilege Matrix
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--color-slate-gray)', marginTop: '4px', display: 'block' }}>
            Capability assignments enforced across navigation routes, remote actions, and telemetry APIs.
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-mist-gray)', borderBottom: 'var(--border-hairline)' }}>
              <th style={{ padding: '16px 32px', fontWeight: 500, color: 'var(--color-ink-black)' }}>Capability</th>
              <th style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-ink-black)', textAlign: 'center' }}>Admin</th>
              <th style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-ink-black)', textAlign: 'center' }}>Security Officer</th>
              <th style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-ink-black)', textAlign: 'center' }}>Faculty</th>
              <th style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-ink-black)', textAlign: 'center' }}>Student</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((p, idx) => (
              <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                <td style={{ padding: '16px 32px', color: 'var(--color-ink-black)' }}>
                  {p.feature}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  {p.admin ? <Check size={17} color="var(--color-ink-black)" style={{ margin: '0 auto' }} /> : <X size={17} color="var(--color-smoke-gray)" style={{ margin: '0 auto' }} />}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  {p.security_officer ? <Check size={17} color="var(--color-ink-black)" style={{ margin: '0 auto' }} /> : <X size={17} color="var(--color-smoke-gray)" style={{ margin: '0 auto' }} />}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  {p.faculty ? <Check size={17} color="var(--color-ink-black)" style={{ margin: '0 auto' }} /> : <X size={17} color="var(--color-smoke-gray)" style={{ margin: '0 auto' }} />}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  {p.student ? <Check size={17} color="var(--color-ink-black)" style={{ margin: '0 auto' }} /> : <X size={17} color="var(--color-smoke-gray)" style={{ margin: '0 auto' }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Authorized Personnel Directory */}
      <div className="section-editorial">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <h2 className="heading-editorial">
              Personnel <em>roster.</em>
            </h2>
            <p className="subhead-editorial" style={{ marginTop: '4px' }}>
              Active staff members, assigned operational roles, and credential levels.
            </p>
          </div>
          <span className="tag-category">4 Registered Staff</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {staffMembers.map((member, idx) => (
            <div 
              key={idx}
              className="neutral-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-signifier)', fontSize: '18px', color: 'var(--color-ink-black)' }}>
                  {member.name}
                </span>
                <span className="pill-badge pill-badge-neutral" style={{ backgroundColor: '#ffffff', fontSize: '12px' }}>
                  {member.role}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)' }}>
                {member.dept}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-sienna-brown)', marginTop: '4px' }}>
                {member.clearance}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
