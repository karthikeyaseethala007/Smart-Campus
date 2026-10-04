import { BentoCard, BentoGrid } from '../../registry/magicui/bento-grid';
import { Shield, KeyRound, Lock, Bell } from 'lucide-react';

export function BentoGridDemo() {
  const items = [
    {
      name: 'Main Gate Access',
      description: 'Perimeter turnstiles and vehicle barriers.',
      href: '#',
      cta: 'View Portal',
      Icon: Shield,
      className: 'bento-col-3',
    },
    {
      name: 'Engineering E-04',
      description: 'Robotics lab magnetic lock interlock.',
      href: '#',
      cta: 'View Portal',
      Icon: KeyRound,
      className: 'bento-col-3',
    },
    {
      name: 'Science Block 204',
      description: 'Chemical containment entrance door.',
      href: '#',
      cta: 'View Portal',
      Icon: Lock,
      className: 'bento-col-3',
    },
    {
      name: 'Central Library',
      description: 'Archival atrium dual-badge portal.',
      href: '#',
      cta: 'View Portal',
      Icon: Bell,
      className: 'bento-col-2',
    },
    {
      name: 'Server Vault 101',
      description: 'Restricted infrastructure perimeter.',
      href: '#',
      cta: 'View Portal',
      Icon: Shield,
      className: 'bento-col-2',
    },
  ];

  return (
    <BentoGrid>
      {items.map((item, idx) => (
        <BentoCard key={idx} {...item} />
      ))}
    </BentoGrid>
  );
}

export default BentoGridDemo;
