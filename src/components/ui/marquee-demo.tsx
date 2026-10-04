import { Marquee } from './marquee';

const sampleItems = [
  'Campus Safety & Fire Readiness',
  'Confirmed Access Control',
  'Deterministic Room Automation',
  'Sub-Metered Energy Awareness',
  'Continuous Device Fleet Health',
  'Incident Accountability Ledger',
];

export function MarqueeDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
      <Marquee pauseOnHover className="[--duration:25s]">
        {sampleItems.slice(0, 3).map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '16px 24px',
              backgroundColor: '#f2f2f3',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {item}
          </div>
        ))}
      </Marquee>

      <Marquee reverse pauseOnHover className="[--duration:25s]">
        {sampleItems.slice(3, 6).map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '16px 24px',
              backgroundColor: '#f2f2f3',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {item}
          </div>
        ))}
      </Marquee>
    </div>
  );
}

export default MarqueeDemo;
