import React from 'react';

interface PortalBentoBackgroundProps {
  doorId: string;
  isAlert?: boolean;
  isLocked?: boolean;
}

export const PortalBentoBackground: React.FC<PortalBentoBackgroundProps> = ({
  doorId,
  isAlert,
  isLocked = true,
}) => {
  const strokeColor = isAlert 
    ? 'rgba(93, 42, 26, 0.12)' 
    : (!isLocked ? 'rgba(20, 83, 45, 0.08)' : 'rgba(23, 25, 28, 0.05)');
  
  const textColor = isAlert 
    ? 'rgba(93, 42, 26, 0.22)' 
    : 'rgba(119, 123, 134, 0.2)';

  switch (doorId) {
    case 'DOOR-GATE-MAIN':
      return (
        <div className="bento-card-bg" aria-hidden="true">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 380 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', right: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            {/* Coordinate Grid & Radar Arcs */}
            <circle cx="340" cy="40" r="140" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="340" cy="40" r="90" stroke={strokeColor} strokeWidth="1" />
            <circle cx="340" cy="40" r="40" stroke={strokeColor} strokeWidth="1" />
            <line x1="200" y1="40" x2="380" y2="40" stroke={strokeColor} strokeWidth="1" />
            <line x1="340" y1="0" x2="340" y2="180" stroke={strokeColor} strokeWidth="1" />
            
            {/* Barrier Gate Topology */}
            <path d="M 230 110 L 260 110 L 280 140 L 320 140" stroke={strokeColor} strokeWidth="1.5" />
            <rect x="256" y="106" width="8" height="8" stroke={strokeColor} strokeWidth="1" fill="none" />
            <rect x="316" y="136" width="8" height="8" stroke={strokeColor} strokeWidth="1" fill="none" />
            
            {/* Architectural Callout Watermark */}
            <text x="360" y="240" textAnchor="end" fill={textColor} fontFamily="monospace" fontSize="9" letterSpacing="0.1em">
              PERIMETER // GATE_INTERLOCK_01
            </text>
          </svg>
        </div>
      );

    case 'DOOR-ENG-E04':
      return (
        <div className="bento-card-bg" aria-hidden="true">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 380 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', right: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            {/* Circuit Traces & Bus Architecture */}
            <path d="M 210 20 L 260 20 L 290 50 L 370 50" stroke={strokeColor} strokeWidth="1.2" />
            <path d="M 230 40 L 270 40 L 300 70 L 360 70" stroke={strokeColor} strokeWidth="1.2" />
            <path d="M 250 80 L 280 80 L 310 110 L 380 110" stroke={strokeColor} strokeWidth="1.2" />
            
            {/* Terminal Nodes */}
            <circle cx="210" cy="20" r="3" stroke={strokeColor} strokeWidth="1" />
            <circle cx="370" cy="50" r="3" stroke={strokeColor} strokeWidth="1" />
            <circle cx="230" cy="40" r="3" stroke={strokeColor} strokeWidth="1" />
            <circle cx="360" cy="70" r="3" stroke={strokeColor} strokeWidth="1" />
            <circle cx="310" cy="110" r="3" stroke={strokeColor} strokeWidth="1" />

            <text x="360" y="240" textAnchor="end" fill={textColor} fontFamily="monospace" fontSize="9" letterSpacing="0.1em">
              ZONE-ENG // ROBOTICS_LAB_E04
            </text>
          </svg>
        </div>
      );

    case 'DOOR-SCI-204':
      return (
        <div className="bento-card-bg" aria-hidden="true">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 380 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', right: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            {/* Hexagonal Containment Lattice */}
            <polygon points="320,30 350,45 350,75 320,90 290,75 290,45" stroke={strokeColor} strokeWidth="1" fill="none" />
            <polygon points="350,75 380,90 380,120 350,135 320,120 320,90" stroke={strokeColor} strokeWidth="1" fill="none" />
            <polygon points="290,75 320,90 320,120 290,135 260,120 260,90" stroke={strokeColor} strokeWidth="1" fill="none" />
            <circle cx="320" cy="60" r="2" fill={strokeColor} />
            <circle cx="350" cy="105" r="2" fill={strokeColor} />
            <circle cx="290" cy="105" r="2" fill={strokeColor} />

            <text x="360" y="240" textAnchor="end" fill={textColor} fontFamily="monospace" fontSize="9" letterSpacing="0.1em">
              ZONE-SCI // CONTAINMENT_LAB_204
            </text>
          </svg>
        </div>
      );

    case 'DOOR-LIB-SOUTH':
      return (
        <div className="bento-card-bg" aria-hidden="true">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 440 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', right: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            {/* Concentric Architectural Gallery Rotunda */}
            <path d="M 280 220 A 180 180 0 0 1 440 60" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 4" />
            <path d="M 320 220 A 130 130 0 0 1 440 100" stroke={strokeColor} strokeWidth="1" />
            <path d="M 360 220 A 80 80 0 0 1 440 140" stroke={strokeColor} strokeWidth="1" />
            
            {/* Atrium Column Points */}
            <rect x="330" y="160" width="6" height="6" stroke={strokeColor} strokeWidth="1" fill="none" />
            <rect x="370" y="130" width="6" height="6" stroke={strokeColor} strokeWidth="1" fill="none" />
            <rect x="410" y="90" width="6" height="6" stroke={strokeColor} strokeWidth="1" fill="none" />

            <text x="420" y="240" textAnchor="end" fill={textColor} fontFamily="monospace" fontSize="9" letterSpacing="0.1em">
              ATRIUM // LIB_SOUTH_PORTAL
            </text>
          </svg>
        </div>
      );

    case 'DOOR-SRV-101':
    default:
      return (
        <div className="bento-card-bg" aria-hidden="true">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 440 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', right: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            {/* Server Rack Track & Vault Perimeter */}
            <line x1="260" y1="20" x2="430" y2="20" stroke={strokeColor} strokeWidth="1" />
            <line x1="260" y1="35" x2="430" y2="35" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 4" />
            <line x1="260" y1="50" x2="430" y2="50" stroke={strokeColor} strokeWidth="1" />
            <line x1="260" y1="65" x2="430" y2="65" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 4" />
            <line x1="260" y1="80" x2="430" y2="80" stroke={strokeColor} strokeWidth="1" />

            {/* Cryptographic Shield Glyph Outline */}
            <path d="M 370 120 L 400 135 L 400 165 C 400 185 370 200 370 200 C 370 200 340 185 340 165 L 340 135 Z" stroke={strokeColor} strokeWidth="1.2" fill="none" />
            <circle cx="370" cy="155" r="5" stroke={strokeColor} strokeWidth="1" />
            <line x1="370" y1="160" x2="370" y2="175" stroke={strokeColor} strokeWidth="1.5" />

            <text x="420" y="240" textAnchor="end" fill={textColor} fontFamily="monospace" fontSize="9" letterSpacing="0.1em">
              HIGH_SECURITY // SERVER_VAULT_101
            </text>
          </svg>
        </div>
      );
  }
};

export default PortalBentoBackground;
