import { AnimatedList } from './animated-list';
import { NotificationItem } from '../notifications/NotificationItem';
import type { CampusEvent } from '@/types';

const DEMO_CAMPUS_EVENTS: CampusEvent[] = [
  {
    id: 'DEMO-EVT-01',
    time: '08:42:15',
    eventType: 'Motion detected',
    location: 'Science Block · Lab 204',
    resultingAction: 'Occupancy confirmed → Lights active',
    severity: 'info',
    source: 'live',
  },
  {
    id: 'DEMO-EVT-02',
    time: '08:43:02',
    eventType: 'Access denied',
    location: 'Engineering Block · Door E-04',
    resultingAction: 'Keypad authentication rejected',
    severity: 'warning',
    source: 'live',
  },
  {
    id: 'DEMO-EVT-03',
    time: '08:44:19',
    eventType: 'Smoke detected [SIMULATION]',
    location: 'Science Block · Lab 204',
    resultingAction: 'HVAC damper closed · Alert logged',
    severity: 'critical',
    source: 'simulation',
  },
  {
    id: 'DEMO-EVT-04',
    time: '08:45:00',
    eventType: 'Lights turned ON',
    location: 'Library · Reading Room B',
    resultingAction: 'Automated relay activated (2.4 kW)',
    severity: 'info',
    source: 'live',
  },
];

export function AnimatedListDemo() {
  return (
    <div className="relative flex max-h-[400px] min-h-[300px] w-full max-w-[420px] flex-col overflow-hidden p-2">
      <AnimatedList delay={1500}>
        {DEMO_CAMPUS_EVENTS.map((event) => (
          <NotificationItem key={event.id} event={event} />
        ))}
      </AnimatedList>
    </div>
  );
}

export default AnimatedListDemo;
