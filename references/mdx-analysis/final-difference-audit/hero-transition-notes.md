# Hero Transition & Choreography Notes — MDX Precision Pass

## 1. Ground Truth Architecture
The landing page animation represents a continuous, physically grounded world. It operates on a single persistent particle sculpture (3,200 vertices) undergoing deterministic shape-key morphing and rotation, scrubbed bi-directionally by the user's scroll.

### Critical Anti-Patterns Strictly Eliminated:
- ❌ **No discrete state swaps:** The component is never unmounted, hidden with `display: none`, or crossfaded between separate image assets.
- ❌ **No linear 25% quadrant division:** The hero does not artificially divide progress into four equal 25% blocks. It follows the measured reference timing where Globe holds for ~29% of the scene, morphs take 11–14%, and Lock holds and rotates before the scene handoff.
- ❌ **No coupled single easing curve:** Shape morphing, spatial rotation, breathing scale, internal orange luminescence, and contact floor shadows are driven by distinct, decoupled curves.
- ❌ **No visible video/canvas rectangle:** The WebGL hardware-accelerated dual-alpha shader samples RGB from the top frame half and native alpha from the bottom half, compositing directly onto the DOM with 100% true physical transparency.

---

## 2. Scroll Scrubbing Remapping Engine

The browser timeline does NOT directly execute `currentTime = scrollProgress * duration`. Instead, `useLandingMasterTimeline` computes:

$$\text{scrollProgress} \xrightarrow{\text{spring damping}} \text{smoothProgress} \xrightarrow{\text{remapping function}} \text{blenderFrameProgress} \xrightarrow{} \text{video.currentTime}$$

### Piecewise Remapping Table:
```ts
function remapScrollToHeroFrame(p: number): number {
  // p is normalized hero progress [0.00, 1.00]
  if (p <= 0.287) {
    // Globe Hold & Pure Rotation: Frame 1 to 55 (Blender)
    return 1 + (p / 0.287) * 54;
  } else if (p <= 0.402) {
    // Globe -> Electricity Morph: Frame 55 to 80 (Peak at F67 / p=0.345)
    const t = (p - 0.287) / (0.402 - 0.287);
    const eased = cubicHermite(t);
    return 55 + eased * 25;
  } else if (p <= 0.449) {
    // Electricity Settle & Hold: Frame 80 to 104
    const t = (p - 0.402) / (0.449 - 0.402);
    return 80 + t * 24;
  } else if (p <= 0.517) {
    // Electricity -> Fire Morph: Frame 104 to 131 (Peak at F117 / p=0.486)
    const t = (p - 0.449) / (0.517 - 0.449);
    const eased = cubicHermite(t);
    return 104 + eased * 27;
  } else if (p <= 0.564) {
    // Fire Settle & Hold: Frame 131 to 160
    const t = (p - 0.517) / (0.564 - 0.517);
    return 131 + t * 29;
  } else if (p <= 0.632) {
    // Fire -> Lock Morph: Frame 160 to 187 (Peak at F173 / p=0.601)
    const t = (p - 0.564) / (0.632 - 0.564);
    const eased = cubicHermite(t);
    return 160 + eased * 27;
  } else if (p <= 0.809) {
    // Lock Settle, Pure Rotation & Hold: Frame 187 to 215
    const t = (p - 0.632) / (0.809 - 0.632);
    return 187 + t * 28;
  } else {
    // Lock Continues Rotating during Editorial Transition: Frame 215 to 240
    const t = (p - 0.809) / (1.000 - 0.809);
    return 215 + t * 25;
  }
}
```

---

## 3. Physical Particle Behavior & Energy Layers

### Continuous Rotation
The particle object rotates smoothly around its central Z-axis throughout all morphs. The angular speed $\omega$ undergoes subtle dynamic deceleration during peak deformation ($0.85\times$ speed at $p=0.345, 0.486, 0.601$) to emphasize structural transformation, returning smoothly to $1.0\times$ baseline velocity as shapes resolve.

### Scale Breathing Response
- **Resting Scale:** `1.000`
- **Globe → Electricity ($p=0.345$):** Expands to `1.042` as particles push outward against the spherical shell.
- **Electricity Resolve & Settle ($p=0.431$):** Snaps gently to `0.995` before returning to `1.000`.
- **Electricity → Fire ($p=0.486$):** Stretches vertically (+5%) while waist compresses (-2%).
- **Fire → Lock ($p=0.601$):** Mechanical compression down to `0.970` as particles condense into dense solid geometry, settling to `1.000`.

### Ground Contact Shadow
- Located at optical floor plane `top: 74%`, `left: 50%`.
- Driven by real-time reactive CSS variables:
  - Width: `clamp(380px, 32vw, 440px)` during holds; expands to `460px` at peak morph.
  - Opacity: scales from `0.38` (diffuse electricity) to `0.48` (solid lock).
  - Blur radius: expands during volumetric dispersion, tightens during lock settlement.

### Internal Orange Luminescence
- An internal atmospheric layer sits directly behind the particle mesh.
- Intensity peaks during peak deformation states:
  - State 01 Hold: 34% opacity
  - Morph 1 (Globe → Elec): 48% opacity
  - Morph 2 (Elec → Fire): 65% opacity (highest thermal energy)
  - Morph 3 (Fire → Lock): 42% opacity
  - Scene Exit: Expands into ambient studio back-bounce behind Editorial 01 typography.

---

## 4. Deterministic Reverse Scrubbing Verification
When the user reverses scroll direction midway through any transition (e.g. from $p=0.35$ backwards to $p=0.25$):
1. `currentNorm` smoothly interpolates backwards under spring mass damping (`mass: 0.18`, `damping: 32`).
2. WebGL canvas draws the exact deterministic reverse frames.
3. Particles smoothly contract back from the horizontal waves of Electricity into the pristine sphere of Globe.
4. Scale breathing, floor shadow, and orange glow follow the exact reverse trajectory without jumps or glitches.
