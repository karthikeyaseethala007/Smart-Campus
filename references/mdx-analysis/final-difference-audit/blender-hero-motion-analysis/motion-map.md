# Blender Hero Motion Analysis — Ground Truth & Kinetic Correction Plan

## 1. Frame-by-Frame Comparative Audit

Detailed frame-by-frame analysis of the current implementation (`Screen Recording 2026-09-28 at 9.28.37 PM.mov`) against the motion ground truth (`references/mdx-reference.mov`):

| Time Window | MDX Reference Ground Truth | Current Implementation Defect | Kinetic Root Cause in Blender |
|---|---|---|---|
| **0.0s – 2.24s**<br>(f0 – f110) | **Stable Spherical Globe**: Continuous $\omega_z$ rotation ($46^\circ/\text{sec}$), stable spatial anchor ($X \approx 61.8\%, Y \approx 44.4\%$), warm internal core illumination, soft elliptical floor shadow. | **Static / Slow Rotation**: Particles rotate, but feel stiff; background compositing exhibits multiply contrast box edges. | Shape key values at 0. Rotation speed in web scrub was decoupled or stepped; material needs true RGBA transparent render. |
| **2.24s – 3.13s**<br>(f110 – f154) | **Phase B: Deformation (Globe $\to$ Electricity)**: Spherical constraint relaxes. Particles physically stream along horizontal field harmonics. Peak dispersion at $t=2.69\text{s}$ with $+4.2\%$ radial swell and $+25\%$ orange core pulse. | **Premature compression**: Mesh collapses inwards instead of dynamic outward dispersion. | F-curve interpolation was linear without Hermite weight; intermediate wave geometry lacked 3D radial depth. |
| **3.13s – 3.50s**<br>(f154 – f172) | **Phase C: Settle & Hold (Electricity)**: Subtle damped spring relaxation into stable electric field contours. Continuous rotation persists with zero deceleration at boundaries. | **Abrupt boundary stop**: Object stops rotating or stutters at morph completion. | F-curve tangent flatlines at keyframe boundary instead of preserving continuous angular momentum. |
| **3.50s – 4.03s**<br>(f172 – f198) | **Phase B: Deformation (Electricity $\to$ Fire)**: Equatorial rings break apart; kinetic vectors reorient from horizontal to vertical. Teardrop flame plume with $+45\%$ internal core light peak at $t=3.78\text{s}$. | **2D Flattening**: Object collapses into a razor-thin vertical sliver as it rotates. | **CRITICAL DEFECT**: Shape key `State_Fire` has $Y \in [-0.35, 0.35]$ (flattened 2D sheet). At $90^\circ/270^\circ$ rotation, the flat plane faces camera edge-on, destroying the 3D volume! |
| **4.03s – 4.39s**<br>(f198 – f216) | **Phase C: Settle & Hold (Fire)**: Laminar flame tips gently settle (-2% scale), rotating as an anchored column. | **Sliver continues rotating**: Thin needle continues rotating without depth. | Low $Y$-axis vertex variance ($Y/X$ ratio only $0.26$). |
| **4.39s – 4.92s**<br>(f216 – f242) | **Phase B: Deformation (Fire $\to$ Lock)**: Inward curl of flame tips forming arch shackle; bottom particles consolidate into tumbler cylinder. Solid physical equilibrium. | **Extreme Narrow Sliver Collapse**: Width collapses below 50px on screen. | `State_Lock` has $Y \in [-0.35, 0.35]$ ($Y/X$ ratio $0.24$). When rotating through $270^\circ$, it becomes a razor sliver. |
| **4.92s – 6.31s**<br>(f242 – f310) | **Lock Hold & Continuous Rotation**: Solid volumetric padlock rotating smoothly. Ground contact shadow deepens beneath dense base. | **Particle disappears / jumps**: Lock flickers or disappears prematurely. | Premature opacity fade in web layer before editorial transition window. |
| **6.31s – 7.79s**<br>(f310 – f383) | **Cinematic Hero $\to$ Editorial 01 Handoff**: Lock recedes gently (scale 0.88), orange energy expands wide to 145%, Editorial 01 headline enters smoothly while hero object coexists. | **Abrupt hard cut**: Hero disappears, screen goes blank, then editorial text suddenly pops in. | Non-overlapping progress ranges in scroll controller; hero opacity drops to 0 at $p=1.00$ of hero instead of blending across $p \in [0.82, 1.00]$. |

---

## 2. Quantitative Geometric Analysis of the 3,200 Persistent Particles

### Existing Blender Source Coordinates vs Corrected 3D Volumetric Targets

| State | Existing $X$ Span | Existing $Y$ Span | Existing $Y/X$ Ratio | Defect | Target $X$ Span | Target $Y$ Span | Target $Z$ Span | Target $Y/X$ Ratio | Target Topology |
|---|---:|---:|---:|---|---:|---:|---:|---:|---|
| **State_Globe** | 3.998 | 4.000 | **1.000** | Good 3D Sphere | 4.000 | 4.000 | 4.000 | **1.000** | Full 3D spherical shell ($R=2.0$) |
| **State_Electricity** | 1.686 | 0.638 | **0.378** | Compressed in $Y$ | 3.200 | 3.200 | 3.600 | **1.000** | Concentric 3D wave rings & field coils ($R_{xy} \in [0.8, 1.6]$) |
| **State_Fire** | 2.703 | 0.712 | **0.263** | **CRITICAL: 2D Flat Sheet** | 2.800 | 2.800 | 3.700 | **1.000** | Organic 3D swirling plume ($R(z) = 1.3 \cdot (1 - z/2.2)$) |
| **State_Lock** | 2.813 | 0.700 | **0.249** | **CRITICAL: 2D Flat Sheet** | 2.800 | 2.400 | 3.700 | **0.857** | Volumetric 3D cylinder tumbler base + 3D tubular arch shackle |

---

## 3. Kinetic Correction Requirements for Blender Master (`hero_particle_animation.blend`)

1. **Persistent 3,200 Vertex Topology**:
   - Every single vertex $i \in [0, 3199]$ in `Hero_Particle_Mesh` maintains a 1-to-1 continuous trajectory across all four states.
   - Zero vertex deletion, zero instancing swaps, zero mesh cross-fading.
2. **True 3D Volumetric Coordinate Restoration**:
   - Replace the flattened $Y$-axis coordinates in `State_Electricity`, `State_Fire`, and `State_Lock` with full radial $X, Y$ symmetry so the object maintains a full, solid silhouette across all $360^\circ$ of rotation.
3. **Decoupled Kinetic Curves**:
   - **Continuous Monotonic Rotation**: $\text{rot\_z} = 0 \to 2\pi$ across frames 1–240 without pausing or hesitating at morph boundaries.
   - **3-Phase Morph Pacing**:
     - *Hold*: Frame 1–55 (Globe), Frame 80–104 (Electricity), Frame 131–160 (Fire), Frame 187–240 (Lock).
     - *Deformation*: Nonlinear Hermite acceleration with radial breathing ($+4.2\%$ swell during Morph 1, $+5\%$ vertical surge during Morph 2).
     - *Settle*: Damped overshoot relaxation (tiny physical relaxation, not spring bounce).
4. **Internal Core Energy & Atmosphere**:
   - Animate `Core_Light` energy and `Globe_Inner_Aura` emission strength:
     - Baseline: 65W
     - Morph 1 peak (Frame 68): 82W (+26%)
     - Morph 2 peak (Frame 118): 110W (+69%)
     - Morph 3 peak (Frame 174): 85W (+30%)
     - Settle: Returns to 65W baseline.
5. **Physical Ground Contact Shadow**:
   - Animate `Floating_Ground_Shadow` scale and opacity in sync with object deformation:
     - Follows object mass and elevation.
     - Never disappears or jumps.
6. **Transparent Compositing**:
   - Re-render all 240 frames at 1920x1080 with `scene.render.film_transparent = True`, Cycles GPU denoising, and export dual-alpha master video + transparent poster.
