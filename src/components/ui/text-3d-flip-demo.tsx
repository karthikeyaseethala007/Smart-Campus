import { Text3DFlip } from './text-3d-flip';

export function Text3DFlipDemo() {
  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Text3DFlip
        rotateDirection="top"
        staggerDuration={0.03}
        staggerFrom="first"
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 160,
        }}
        style={{
          fontFamily: 'var(--font-signifier)',
          fontSize: '36px',
          color: 'var(--color-ink-black)',
        }}
      >
        Stay hungry, stay foolish
      </Text3DFlip>
    </div>
  );
}

export default Text3DFlipDemo;
