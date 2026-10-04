import React, { useEffect, useRef, useState } from 'react';

export interface TrailItemAsset {
  src: string;
  alt: string;
  tag: string;
  caption: string;
  width: number;
  height: number;
}

export interface ImageCursorTrailProps {
  containerRef: React.RefObject<HTMLElement | null>;
  images?: TrailItemAsset[];
  className?: string;
  style?: React.CSSProperties;
  maxActiveImages?: number;
  distanceThreshold?: number;
}

export const OPERATIONAL_CONTEXT_TRAIL_ASSETS: TrailItemAsset[] = [
  {
    src: '/assets/trail/campus-entrance.jpg',
    alt: 'Perimeter Access Portal',
    tag: 'ACCESS · 01',
    caption: 'Secured Quad Pavilion',
    width: 172,
    height: 128,
  },
  {
    src: '/assets/trail/keypad-control.jpg',
    alt: 'Keypad Telemetry Node',
    tag: 'PIN · NOMINAL',
    caption: 'Smart Reader Station',
    width: 156,
    height: 122,
  },
  {
    src: '/assets/trail/optical-surveillance.jpg',
    alt: 'Optical Surveillance Node',
    tag: 'OPTIC · 04',
    caption: 'Library Corridor Dome',
    width: 180,
    height: 134,
  },
  {
    src: '/assets/trail/safety-sensor.jpg',
    alt: 'Smoke & Thermal Sensor',
    tag: 'SMOKE · 420PPM',
    caption: 'Science Lab Acoustic Array',
    width: 162,
    height: 120,
  },
  {
    src: '/assets/trail/energy-automation.jpg',
    alt: 'Building Relay Automation',
    tag: 'RELAY · R-12',
    caption: 'Distribution Feeder A',
    width: 176,
    height: 130,
  },
  {
    src: '/assets/trail/campus-architecture.jpg',
    alt: 'Campus Research Complex',
    tag: 'ZONE · SCIENCE',
    caption: 'Brutalist Research Wing',
    width: 168,
    height: 126,
  },
];

interface SlotState {
  x: number;
  y: number;
  targetOffsetX: number;
  targetOffsetY: number;
  rotation: number;
  scale: number;
  opacity: number;
  active: boolean;
  birthTime: number;
  assetIndex: number;
}

// Cascading lag factors: Trail 01 (youngest) follows closest; older artifacts trail with greater lag
const CASCADING_FOLLOW_FACTORS = [0.13, 0.09, 0.065, 0.045, 0.03, 0.02];

export const ImageCursorTrail: React.FC<ImageCursorTrailProps> = ({
  containerRef,
  images = OPERATIONAL_CONTEXT_TRAIL_ASSETS,
  className = '',
  style = {},
  maxActiveImages = 5,
  distanceThreshold = 48,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const slotsRef = useRef<SlotState[]>([]);
  const cardElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const imageElementsRef = useRef<(HTMLImageElement | null)[]>([]);
  const tagElementsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const captionElementsRef = useRef<(HTMLSpanElement | null)[]>([]);

  // Pointer position & timing refs
  const mousePosRef = useRef({ x: -999, y: -999 });
  const lastSpawnPosRef = useRef({ x: -999, y: -999 });
  const isInsideRef = useRef(false);
  const lastMoveTimeRef = useRef(0);
  const currentSlotIndexRef = useRef(0);
  const assetSequenceIndexRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef(performance.now());

  // Hardware capabilities: fine pointer and reduced-motion test
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const finePointerQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluateSupport = () => {
      const isFinePointer = finePointerQuery.matches;
      const isReducedMotion = reducedMotionQuery.matches;
      setIsEnabled(isFinePointer && !isReducedMotion);
    };

    evaluateSupport();

    finePointerQuery.addEventListener('change', evaluateSupport);
    reducedMotionQuery.addEventListener('change', evaluateSupport);

    return () => {
      finePointerQuery.removeEventListener('change', evaluateSupport);
      reducedMotionQuery.removeEventListener('change', evaluateSupport);
    };
  }, []);

  // Initialize pool of reusable slots with subtle positional offsets
  useEffect(() => {
    slotsRef.current = Array.from({ length: maxActiveImages }, (_, idx) => ({
      x: -999,
      y: -999,
      targetOffsetX: ((idx % 3) - 1) * 12 + Math.sin(idx * 1.5) * 8,
      targetOffsetY: (((idx + 1) % 3) - 1) * 10 + Math.cos(idx * 1.5) * 8,
      rotation: (idx % 2 === 0 ? 1 : -1) * (2.0 + Math.sin(idx) * 1.8),
      scale: 0.88,
      opacity: 0,
      active: false,
      birthTime: 0,
      assetIndex: 0,
    }));
  }, [maxActiveImages]);

  // Preload trail imagery
  useEffect(() => {
    images.forEach((asset) => {
      const img = new Image();
      img.src = asset.src;
    });
  }, [images]);

  // Interaction tracking & animation loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isEnabled) return;

    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      isInsideRef.current = true;
      mousePosRef.current = { x, y };
      lastSpawnPosRef.current = { x, y };
      lastMoveTimeRef.current = performance.now();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Ensure pointer is within interaction zone boundary
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        isInsideRef.current = false;
        return;
      }

      isInsideRef.current = true;
      mousePosRef.current = { x, y };
      const now = performance.now();
      lastMoveTimeRef.current = now;

      // Distance threshold check
      const dist = Math.hypot(
        x - lastSpawnPosRef.current.x,
        y - lastSpawnPosRef.current.y
      );

      if (dist >= distanceThreshold) {
        // Recycle next slot in circular buffer
        const slotIdx = currentSlotIndexRef.current;
        currentSlotIndexRef.current = (slotIdx + 1) % maxActiveImages;

        const assetIdx = assetSequenceIndexRef.current % images.length;
        assetSequenceIndexRef.current += 1;

        const slot = slotsRef.current[slotIdx];
        if (slot) {
          slot.active = true;
          slot.birthTime = now;
          // Spawn near pointer with slight initial physical offset
          slot.x = x + slot.targetOffsetX;
          slot.y = y + slot.targetOffsetY;
          slot.opacity = 0.94;
          slot.scale = 0.88;
          // Controlled subtle rotation (approx ±3-5 deg)
          slot.rotation = (slotIdx % 2 === 0 ? 1 : -1) * (2.2 + (Math.sin(now * 0.005) * 2.0));
          slot.assetIndex = assetIdx;

          // Directly update DOM element contents for active slot
          const imgEl = imageElementsRef.current[slotIdx];
          const tagEl = tagElementsRef.current[slotIdx];
          const capEl = captionElementsRef.current[slotIdx];
          const cardEl = cardElementsRef.current[slotIdx];
          const asset = images[assetIdx];

          if (imgEl && asset) {
            imgEl.src = asset.src;
            imgEl.alt = asset.alt;
          }
          if (tagEl && asset) {
            tagEl.textContent = asset.tag;
          }
          if (capEl && asset) {
            capEl.textContent = asset.caption;
          }
          if (cardEl && asset) {
            cardEl.style.width = `${asset.width}px`;
          }
        }

        lastSpawnPosRef.current = { x, y };
      }
    };

    const onPointerLeave = () => {
      isInsideRef.current = false;
      mousePosRef.current = { x: -999, y: -999 };
    };

    container.addEventListener('pointerenter', onPointerEnter);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);

    // High-performance requestAnimationFrame loop with cascading magnetic following
    const animate = (currentTime: number) => {
      const delta = Math.min(currentTime - lastTickTimeRef.current, 50);
      lastTickTimeRef.current = currentTime;

      const idleTime = currentTime - lastMoveTimeRef.current;
      const isIdle = idleTime > 340;
      const isExited = !isInsideRef.current;

      const mouseX = mousePosRef.current.x;
      const mouseY = mousePosRef.current.y;
      const currentSpawnIdx = currentSlotIndexRef.current;

      slotsRef.current.forEach((slot, idx) => {
        const el = cardElementsRef.current[idx];
        if (!el) return;

        if (!slot.active) {
          if (el.style.display !== 'none') {
            el.style.display = 'none';
          }
          return;
        }

        const age = currentTime - slot.birthTime;

        // Rank determination for cascading magnetic lag:
        // Rank 0 is the most recently spawned artifact; higher ranks are progressively older.
        const rank = ( (currentSpawnIdx - 1 - idx) % maxActiveImages + maxActiveImages ) % maxActiveImages;
        const followFactor = CASCADING_FOLLOW_FACTORS[Math.min(rank, CASCADING_FOLLOW_FACTORS.length - 1)];

        // Natural stacking: Newer artifacts sit on top
        el.style.zIndex = (15 + (maxActiveImages - rank)).toString();

        // Magnetic follow: cascading interpolation toward cursor with positional offset
        if (!isExited && mouseX > -500 && mouseY > -500) {
          const targetX = mouseX + slot.targetOffsetX;
          const targetY = mouseY + slot.targetOffsetY;
          slot.x += (targetX - slot.x) * followFactor;
          slot.y += (targetY - slot.y) * followFactor;
        }

        // Scale spring: smooth pop-in toward 1.0
        slot.scale += (1.0 - slot.scale) * 0.12;

        // Lifetime & decay management
        if (isExited) {
          // Rapid smooth fade when pointer leaves target zone
          slot.opacity -= delta * 0.006;
        } else if (isIdle) {
          // Gentle settle and fade away when pointer stops
          slot.opacity -= delta * 0.0032;
        } else if (age > 600) {
          // Standard lifetime decay
          slot.opacity -= delta * 0.0022;
        }

        // Termination and recycling
        if (slot.opacity <= 0.01) {
          slot.active = false;
          slot.opacity = 0;
          el.style.display = 'none';
          return;
        }

        // Hardware accelerated transforms
        el.style.display = 'block';
        el.style.transform = `translate3d(${slot.x}px, ${slot.y}px, 0) translate(-50%, -50%) rotate(${slot.rotation}deg) scale(${slot.scale})`;
        el.style.opacity = slot.opacity.toFixed(3);
      });

      rafIdRef.current = requestAnimationFrame(animate);
    };

    lastTickTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener('pointerenter', onPointerEnter);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [containerRef, isEnabled, images, maxActiveImages, distanceThreshold]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`image-cursor-trail-layer ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 10,
        userSelect: 'none',
        ...style,
      }}
    >
      {Array.from({ length: maxActiveImages }).map((_, idx) => (
        <div
          key={idx}
          ref={(el) => {
            cardElementsRef.current[idx] = el;
          }}
          className="cursor-trail-card"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            display: 'none',
            willChange: 'transform, opacity',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(23, 25, 28, 0.08)',
            boxShadow:
              '0 12px 30px -4px rgba(23, 25, 28, 0.12), 0 3px 8px rgba(23, 25, 28, 0.05)',
            padding: '7px 7px 8px 7px',
            pointerEvents: 'none',
          }}
        >
          {/* Editorial Image Artifact */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '105px',
              borderRadius: '11px',
              overflow: 'hidden',
              backgroundColor: 'var(--color-mist-gray, #f2f2f3)',
            }}
          >
            <img
              ref={(el) => {
                imageElementsRef.current[idx] = el;
              }}
              src={images[idx % images.length].src}
              alt={images[idx % images.length].alt}
              loading="eager"
              decoding="async"
              onError={(e) => {
                // Graceful fallback: hide broken image element without layout shift
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                filter: 'contrast(1.03) brightness(0.99)',
              }}
            />
          </div>

          {/* Editorial Micro Metadata Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              paddingTop: '6px',
              paddingLeft: '3px',
              paddingRight: '3px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-ink-black, #17191c)',
                  display: 'inline-block',
                }}
              />
              <span
                ref={(el) => {
                  tagElementsRef.current[idx] = el;
                }}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '9.5px',
                  fontWeight: 600,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: 'var(--color-slate-gray, #777b86)',
                }}
              >
                {images[idx % images.length].tag}
              </span>
            </div>

            <span
              ref={(el) => {
                captionElementsRef.current[idx] = el;
              }}
              style={{
                fontFamily: 'var(--font-sohne, sans-serif)',
                fontSize: '10.5px',
                color: 'var(--color-ink-black, #17191c)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '105px',
              }}
            >
              {images[idx % images.length].caption}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageCursorTrail;
