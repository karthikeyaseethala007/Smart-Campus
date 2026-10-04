import React from 'react';
import type { CampusEvent } from '@/types';
import { AnimatedList } from '@/components/ui/animated-list';
import { NotificationItem } from './NotificationItem';
import { cn } from '@/lib/utils';

export interface AnimatedNotificationListProps {
  events: CampusEvent[];
  className?: string;
  style?: React.CSSProperties;
  maxItems?: number;
  emptyMessage?: string;
  onItemClick?: (event: CampusEvent) => void;
}

export const AnimatedNotificationList: React.FC<AnimatedNotificationListProps> = ({
  events,
  className,
  style,
  maxItems = 10,
  emptyMessage = 'No operational events recorded.',
  onItemClick,
}) => {
  const displayedEvents = maxItems ? events.slice(0, maxItems) : events;

  if (displayedEvents.length === 0) {
    return (
      <div
        style={{
          padding: '24px 16px',
          textAlign: 'center',
          color: 'var(--color-slate-gray)',
          fontSize: '13.5px',
          backgroundColor: 'var(--color-mist-gray)',
          borderRadius: '16px',
          border: 'var(--border-hairline)',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={cn('smart-campus-animated-feed-container', className)}
      style={{
        width: '100%',
        minWidth: 0,
        ...style,
      }}
    >
      <AnimatedList delay={0} className="gap-2.5">
        {displayedEvents.map((evt) => (
          <NotificationItem
            key={evt.id}
            event={evt}
            onClick={onItemClick ? () => onItemClick(evt) : undefined}
          />
        ))}
      </AnimatedList>
    </div>
  );
};

export default AnimatedNotificationList;
