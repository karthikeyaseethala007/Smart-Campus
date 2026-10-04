import { ShimmerButton } from './shimmer-button';

export function ShimmerButtonDemo() {
  return (
    <div style={{ display: 'flex', minHeight: '16rem', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <ShimmerButton>
        <span style={{ textAlign: 'center', fontSize: '14px', lineHeight: 1, fontWeight: 500, letterSpacing: '-0.02em', whiteSpace: 'pre-wrap', color: '#ffffff' }}>
          Shimmer Button
        </span>
      </ShimmerButton>
    </div>
  );
}

export default ShimmerButtonDemo;
