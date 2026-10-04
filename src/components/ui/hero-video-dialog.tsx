import { useState, useEffect, type FC, type ReactNode } from 'react';
import { Play, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export type AnimationStyle =
  | 'from-bottom'
  | 'from-center'
  | 'from-top'
  | 'from-left'
  | 'from-right'
  | 'fade'
  | 'top-in-bottom-out'
  | 'left-in-right-out';

const animationVariants = {
  'from-center': {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },
  'from-bottom': {
    initial: { y: '40%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '40%', opacity: 0 },
  },
  'from-top': {
    initial: { y: '-40%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-40%', opacity: 0 },
  },
  'from-left': {
    initial: { x: '-40%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-40%', opacity: 0 },
  },
  'from-right': {
    initial: { x: '40%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '40%', opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  'top-in-bottom-out': {
    initial: { y: '-40%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '40%', opacity: 0 },
  },
  'left-in-right-out': {
    initial: { x: '-40%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '40%', opacity: 0 },
  },
};

export interface HeroVideoDialogProps {
  animationStyle?: AnimationStyle;
  videoSrc?: string;
  thumbnailSrc?: string;
  thumbnailAlt?: string;
  className?: string;
  trigger?: ReactNode;
  children?: ReactNode | ((close: () => void) => ReactNode);
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dialogTitle?: string;
}

export const HeroVideoDialog: FC<HeroVideoDialogProps> = ({
  animationStyle = 'from-center',
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = 'Video thumbnail',
  className,
  trigger,
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  dialogTitle = 'Media Player',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isDialogOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setOpen = (open: boolean) => {

    if (!isControlled) {
      setInternalIsOpen(open);
    }
    onOpenChange?.(open);
  };

  const closeDialog = () => setOpen(false);

  // Close on Escape key & manage body scroll
  useEffect(() => {
    if (!isDialogOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDialog();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDialogOpen]);

  const selectedAnimation = animationVariants[animationStyle] || animationVariants['from-center'];

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Trigger Rendering */}
      {trigger ? (
        <div
          onClick={() => setOpen(true)}
          style={{ display: 'inline-flex' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          {trigger}
        </div>
      ) : thumbnailSrc ? (
        <button
          type="button"
          aria-label="Play media"
          className="group relative cursor-pointer border-0 bg-transparent p-0"
          onClick={() => setOpen(true)}
        >
          <img
            src={thumbnailSrc}
            alt={thumbnailAlt}
            width={1920}
            height={1080}
            className="w-full rounded-md border shadow-lg transition-all duration-200 ease-out group-hover:brightness-[0.8]"
          />
          <div className="absolute inset-0 flex scale-[0.9] items-center justify-center rounded-2xl transition-all duration-200 ease-out group-hover:scale-100">
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(23, 25, 28, 0.75)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              <Play size={28} color="#ffffff" fill="#ffffff" style={{ marginLeft: '4px' }} />
            </div>
          </div>
        </button>
      ) : null}

      {/* Animated Dialog Modal */}
      <AnimatePresence>
        {isDialogOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDialog}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(23, 25, 28, 0.65)',
                backdropFilter: 'blur(8px)',
              }}
            />

            {/* Modal Dialog Content */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={dialogTitle}
              {...selectedAnimation}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              style={{
                position: 'relative',
                zIndex: 1,
                maxWidth: '920px',
                width: '100%',
                maxHeight: 'calc(100vh - 40px)',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {children ? (
                typeof children === 'function' ? children(closeDialog) : children
              ) : videoSrc ? (
                <div
                  style={{
                    backgroundColor: 'var(--color-paper-white)',
                    borderRadius: '24px',
                    padding: '24px',
                    boxShadow: '0 24px 60px -12px rgba(23, 25, 28, 0.3)',
                    border: '1px solid rgba(23, 25, 28, 0.08)',
                    position: 'relative',
                  }}
                >
                  <button
                    onClick={closeDialog}
                    aria-label="Close dialog"
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--color-mist-gray)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--color-ink-black)',
                    }}
                  >
                    <X size={18} />
                  </button>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/9',
                      overflow: 'hidden',
                      borderRadius: '16px',
                      backgroundColor: 'var(--color-ink-black)',
                    }}
                  >
                    <iframe
                      src={videoSrc}
                      title={dialogTitle}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroVideoDialog;
