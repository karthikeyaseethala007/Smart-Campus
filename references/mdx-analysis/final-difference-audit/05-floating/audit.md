# 05 - Floating Experience Difference Audit

## Visual State Landmarks
- **MDX Reference**: ~18.0s ("Made with Intention. Meant to Be Felt.")
- **Current Implementation**: ~19.0s (Pills PROTECT, DETECT, RESPOND, AUTOMATE)
- **Artifact**: `references/mdx-analysis/final-difference-audit/05-floating/side_by_side_comparison.png`

## Viewport Composition & Spatial Architecture
- **MDX Reference**:
  - Pale studio canvas with subtle warm lighting.
  - Center: Soft organic cream/gray particle cloud (tactile, fuzzy, desaturated, gentle movement).
  - 4 floating capsule controls: `UI/UX`, `Development`, `Branding`, `3D Animation`.
  - Pills are delicate, thin, translucent, spatially separated, and react to pointer movement.
  - Top-left: `Made with Intention.` / `Meant to Be Felt.`.
  - Top-right: `From the way words breathe to how animations flow, every part is made to resonate.`.
- **Current Implementation**:
  - Center object is STILL the intense orange particle sphere with the bright orange halo.
  - Pills (`PROTECT`, `DETECT`, `RESPOND`, `AUTOMATE`) are heavy white rectangular cards with thick borders and dark drop shadows.
  - Dark section is already encroaching at the bottom.

## Key Visual Delta & Corrective Directives
1. **Particle Cloud Visual Treatment**:
   - Differentiate from Hero: tone down the orange saturation, transform into a soft cream/gray tactile particle cloud.
2. **Pill Controls Refinement**:
   - Pills must be smaller, thinner, more rounded (capsule), quiet semi-translucent background (`bg-white/80 backdrop-blur-md border border-black/10`).
   - Spatially separated around the perimeter of the cloud.
   - Orange accent only on active / hover state.
   - Smooth floating drift physics.
3. **Pacing**:
   - Prevent the dark showcase from cutting into this scene before it finishes.
