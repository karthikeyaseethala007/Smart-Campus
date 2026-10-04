import React, {
  type ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  const shouldReduceMotion = useReducedMotion();

  const animations = {
    initial: shouldReduceMotion ? false : { scale: 0.96, opacity: 0, y: -10 },
    animate: { scale: 1, opacity: 1, y: 0, originY: 0 },
    exit: shouldReduceMotion ? undefined : { scale: 0.96, opacity: 0 },
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 30,
      mass: 0.8,
    },
  };

  return (
    <motion.div
      {...animations}
      layout={!shouldReduceMotion}
      className={cn('w-full', className)}
    >
      {children}
    </motion.div>
  );
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedList = React.memo(
  ({ children, className, delay = 0, ...props }: AnimatedListProps) => {
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children],
    );

    const [index, setIndex] = useState(() => (delay > 0 ? 0 : childrenArray.length - 1));

    useEffect(() => {
      if (delay > 0 && index < childrenArray.length - 1) {
        const timer = setTimeout(() => {
          setIndex((prevIndex) => prevIndex + 1);
        }, delay);

        return () => clearTimeout(timer);
      }
    }, [index, delay, childrenArray.length]);

    const itemsToShow = useMemo(() => {
      if (delay > 0) {
        return childrenArray.slice(0, index + 1).reverse();
      }
      return childrenArray;
    }, [index, delay, childrenArray]);

    return (
      <div
        className={cn('flex flex-col gap-2.5', className)}
        {...props}
      >
        <AnimatePresence initial={false}>
          {itemsToShow.map((item) => {
            const element = item as React.ReactElement;
            return (
              <AnimatedListItem key={element.key ?? undefined}>
                {element}
              </AnimatedListItem>
            );
          })}
        </AnimatePresence>
      </div>
    );
  },
);

AnimatedList.displayName = 'AnimatedList';

export default AnimatedList;
