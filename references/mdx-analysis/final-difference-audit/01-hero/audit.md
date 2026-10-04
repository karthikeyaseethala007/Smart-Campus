# 01 - Hero Scene Difference Audit

## Visual State Landmarks
- **MDX Reference**: ~02.0s (resting hero state)
- **Current Implementation**: ~02.0s (resting hero state)
- **Artifact**: `references/mdx-analysis/final-difference-audit/01-hero/side_by_side_comparison.png`

## Viewport Composition & Spatial Architecture
- **MDX Reference**:
  - Studio-style pale off-white floor (`#f4f4f2`).
  - Organic, tactile particle sphere centered (~45% from top), size ~42vh diameter.
  - Very subtle, diffuse internal amber/peach warmth.
  - Soft, wide ambient ground contact shadow (realistic occlusion).
  - Lower-left editorial lockup: large clean title (2 lines), muted subtext (2 lines), small black pill CTA (`LET'S TALK ↗`).
  - Lower-right supporting narrative lockup: 3-line paragraph, 4 subtle outline capsule tags (`UI/UX`, `3D VISUALIZATION`, `DEVELOPMENT`, `+`).
  - Bottom-center subtle 4-tick stage indicator (`| | | |`).
  - Massive whitespace around all perimeter edges (generous padding `64px+`).
- **Current Implementation**:
  - Aggressive neon-orange radial bloom halo surrounding the sphere (diameter >80vh).
  - Dense, heavy black shadow pill with sharp boundaries underneath the sphere.
  - Overly bold/rounded display font with excessive weight.
  - Too many tags in bottom-right (`CCTV`, `ACCESS CONTROL`, `PIR SENSORS`, `MQ-2 GAS`, `ENERGY`, `+`).
  - Hero feels like an illuminated UI component rather than an object existing in a physical studio space.

## Key Visual Delta & Corrective Directives
1. **Background & Atmosphere**:
   - Soften the atmospheric lighting: remove the harsh saturated orange radial gradient.
   - Use soft pale studio background (`#f6f6f4`) with subtle diffuse warm bloom (`hero-center-ell.avif`).
2. **Blender Particle Asset Compositing**:
   - Keep the particle video asset, but adjust CSS blend modes and opacity.
   - Ground shadow must be soft, diffuse Gaussian blur (`filter: blur(24px); opacity: 0.18`), not a hard black pill.
3. **Typography**:
   - Refine left headline: `Security that sees.` / `Safety that responds.` — lighter weight (400-500), optical tracking, smaller font-size.
   - CTA button: small black capsule (`h-9 px-5 text-xs`).
   - Right tags: reduce to 4 primary tags (`SURVEILLANCE`, `ACCESS`, `SENSORS`, `+`).
4. **Stage Indicators**:
   - Bottom stage indicator ticks must be subtle neutral lines animating with scroll progress.
