# Hero Motion Map — MDX Reference Frame-by-Frame Motion Analysis

## 1. Executive Summary & Methodology
This motion map documents the exact measured kinematic and morphological behavior of the central particle system in `references/mdx-reference.mov` (1536 frames, 49.15 fps).
The pinned hero sequence spans frames **0 to 383** (duration 7.792s), during which the persistent 3,200-particle object undergoes three distinct morphological transitions while remaining mounted as a single physical entity.

---

## 2. Master Morphing Timeline & Measured Values Table

All progress values below are normalized to the Hero Sequence ($p \in [0.000, 1.000]$):

| Transition | Start progress | Morph start | Peak deformation | Resolve | Settle | Notes |
|---|---:|---:|---:|---:|---:|---|
| **State 01 (Globe) → State 02 (Electricity)** | **0.000** | **0.287** | **0.345** | **0.402** | **0.431** | Extended initial spherical hold with constant $\omega_z$ rotation. At $p=0.287$ spherical surface constraint relaxes; particles expand horizontally along wave harmonics (+4.2% radial swell). Resolves into electric ripples at $p=0.402$. |
| **State 02 (Electricity) → State 03 (Fire)** | **0.402** | **0.449** | **0.486** | **0.517** | **0.546** | Brief electric hold. At $p=0.449$ equatorial rings decouple and accelerate upward into energetic vertical streamers. Peak turbulent energy at $p=0.486$ with +45% orange core bloom. Flame silhouette resolves at $p=0.517$. |
| **State 03 (Fire) → State 04 (Lock)** | **0.517** | **0.564** | **0.601** | **0.632** | **0.674** | Flame tip particles curl inwards into arch shackle while base particles compress into tumbler cylinder. Resolves to mechanical lock at $p=0.632$, settling into solid physical equilibrium at $p=0.674$. |
| **State 04 (Lock) → Editorial 01 Handoff** | **0.674** | **0.809** | **0.901** | **1.000** | **1.000+** | Lock holds and rotates steadily until $p=0.809$. Optical reduction to scale 0.88, ground shadow diffuses, orange ambient spreads wide. Editorial 01 headline enters smoothly before hero unpins. |

---

## 3. Detailed Phase Breakdown per Transition

### A. State 01: Globe → State 02: Electricity
1. **HOLD START ($p = 0.000$, $t = 0.00s$, Frame 0):** Stable spherical shell, radius $R = 2.0$, rotating at continuous angular velocity $\omega_z \approx 1.5^\circ/\text{frame}$. Constant scale $1.00$.
2. **DEFORMATION START ($p = 0.287$, $t = 2.24s$, Frame 110):** Spherical constraint relaxes. Local particle groups begin stretching along horizontal equatorial planes.
3. **MAIN MORPH ($p = 0.313 - 0.370$, $t = 2.45 - 2.90s$, Frames 120–142):** Nonlinear acceleration. Spherical shell dissolves into concentric horizontal wave crests.
4. **INTERMEDIATE SILHOUETTE / PEAK DEFORMATION ($p = 0.345$, $t = 2.70s$, Frame 132):** Cloud reaches maximum asymmetric dispersion. Bounding box expands by +5.4% horizontally, center-of-mass remains spatially locked.
5. **RESOLUTION ($p = 0.402$, $t = 3.13s$, Frame 154):** Particles align into clean electrical field/wave contours.
6. **SETTLE ($p = 0.431$, $t = 3.36s$, Frame 165):** Subtle damped spring oscillation stabilizes wave tips; scale relaxes back to $1.00$.
7. **NEXT HOLD & ROTATION ($p = 0.431 - 0.449$):** Electricity wave structure rotates steadily around vertical axis.

### B. State 02: Electricity → State 03: Fire
1. **HOLD START ($p = 0.402 - 0.449$, $t = 3.13 - 3.46s$, Frames 154–172):** High-frequency electric ripples holding coherent shape while revolving.
2. **DEFORMATION START ($p = 0.449$, $t = 3.50s$, Frame 172):** Lateral wave rings break apart; kinetic vectors reorient from horizontal to vertical.
3. **MAIN MORPH ($p = 0.467 - 0.505$, $t = 3.65 - 3.95s$, Frames 179–194):** Particles stream vertically upward in organic laminar channels. Internal orange core light intensifies.
4. **INTERMEDIATE SILHOUETTE / PEAK DEFORMATION ($p = 0.486$, $t = 3.78s$, Frame 186):** Organic teardrop / turbulent plume intermediate shape. Core luminescence peaks at 145% of baseline.
5. **RESOLUTION ($p = 0.517$, $t = 4.03s$, Frame 198):** Flame silhouette resolves with dynamic flickering crests and stable base.
6. **SETTLE ($p = 0.546$, $t = 4.25s$, Frame 209):** Vertical velocity tails off; slight contraction in upper flame tip.
7. **NEXT HOLD & ROTATION ($p = 0.546 - 0.564$):** Coherent flame system revolves as an anchored column.

### C. State 03: Fire → State 04: Lock
1. **HOLD START ($p = 0.517 - 0.564$, $t = 4.03 - 4.35s$, Frames 198–216):** Vertical flame rotating in place.
2. **DEFORMATION START ($p = 0.564$, $t = 4.40s$, Frame 216):** Upper flame tips curl inwards towards the apex to begin shackle loop formation; lower particles consolidate into a dense cylindrical core.
3. **MAIN MORPH ($p = 0.585 - 0.620$, $t = 4.55 - 4.85s$, Frames 224–238):** Fast conversion from organic fluid motion to rigid geometric symmetry.
4. **INTERMEDIATE SILHOUETTE / PEAK DEFORMATION ($p = 0.601$, $t = 4.68s$, Frame 230):** Arch shackle connected to an elongated cylindrical core; hybrid energy-mechanical structure.
5. **RESOLUTION ($p = 0.632$, $t = 4.92s$, Frame 242):** Shackle loop closes cleanly; lower tumbler cylinder solidifies with clear edges.
6. **SETTLE ($p = 0.674$, $t = 5.25s$, Frame 258):** Micro-spring settle of mechanical shackle. Ground shadow deepens beneath the dense base.
7. **NEXT HOLD & ROTATION ($p = 0.674 - 0.809$, $t = 5.25 - 6.30s$, Frames 258–310):** Lock rotates steadily through $90^\circ$ of rotation before scene transition begins.

---

## 4. The Seven Decoupled Motion Curves

To prevent mechanical synchronization, the browser implementation maps `scrollProgress` through separate, specialized easing curves:

1. **`shapeMorphCurve(p)`**: Piecewise cubic Hermite interpolation between key shape points (`0.287 -> 0.402`, `0.449 -> 0.517`, `0.564 -> 0.632`). Holds between morph windows.
2. **`rotationCurve(p)`**: Continuous, monotonic angular progression $\theta(p) = \theta_0 + k \cdot p$. Does NOT pause or jump during shape morphs.
3. **`scaleCurve(p)`**: Subtle breathing response:
   - Base: $1.00$
   - Morph 1 Peak ($p=0.345$): $+4\%$ expansion ($1.04$)
   - Settle 1 ($p=0.431$): Relax to $1.00$
   - Morph 2 Peak ($p=0.486$): Vertical stretch $+5\%$, horizontal compression $-2\%$
   - Settle 2 ($p=0.546$): Relax to $1.00$
   - Morph 3 Peak ($p=0.601$): Compression $-3\%$ ($0.97$), then settle to $1.00$
   - Scene Exit ($p=0.809 - 1.000$): Smooth reduction to $0.88$.
4. **`verticalPositionCurve(p)`**: Anchored center ($Y = 46\% \pm 0.8\%$). Micro-bob of $\pm 8\text{px}$ during flame morph, zero erratic jumping.
5. **`opacityCurve(p)`**: $1.00$ throughout hero ($p \in [0.00, 0.85]$), gradual optical handoff to $0.00$ at $p = 1.00$ as Editorial 01 headline achieves 100% opacity.
6. **`atmosphereCurve(p)`**:
   - Baseline: $0.34$ opacity, scale $1.00$
   - Peak Morph 1: $0.48$ opacity
   - Peak Morph 2 (Fire): $0.65$ opacity, scale $1.25$
   - Peak Morph 3 (Lock): $0.42$ opacity
   - Exit to Editorial 01: Spreads wide to scale $1.45$, opacity $0.55$, centering behind editorial typography.
7. **`shadowCurve(p)`**:
   - Follows particle density and height. Soft ellipse ($420\text{px} \times 42\text{px}$, opacity $0.42$, blur $7\text{px}$) beneath object.
   - Expands to $450\text{px}$ during Morph 1 swell.
   - Deepens to opacity $0.48$ under dense Lock base.
   - Softens and diffuses as object yields to Editorial 01.
