# 02 - Editorial Scene 1 Difference Audit

## Visual State Landmarks
- **MDX Reference**: ~10.5s ("Every Experience Begins With a Feeling")
- **Current Implementation**: ~09.0s ("One Campus. One Connected Response.")
- **Artifact**: `references/mdx-analysis/final-difference-audit/02-editorial-1/side_by_side_comparison.png`

## Viewport Composition & Spatial Architecture
- **MDX Reference**:
  - Giant centered display typography (2 lines): `Every Experience Begins` / `With a Feeling`.
  - Circular atmospheric backdrop: huge warm orange/amber glow contained within a soft optical circle (`ideas-blur-2.avif`).
  - Supporting narrative: 2 lines of quiet, centered text (`We blend creativity, emotion...`).
  - Pill CTA: centered black capsule `ABOUT US ↗`.
  - Bottom-center ticks: `| | | |` indicating stage 2.
  - Pure whitespace: over 65% of viewport is empty breathing space.
- **Current Implementation**:
  - Typography: `One Campus.` / `One Connected Response.`
  - Font weight is too heavy, line-height too compressed.
  - Button `ENTER COMMAND CENTER ↗` has a dark, heavy drop shadow.
  - Background radial gradient is slightly too small and sharp.

## Key Visual Delta & Corrective Directives
1. **Typography & Layout**:
   - Match MDX editorial scale: giant font-size (`clamp(2.75rem, 5.5vw, 5.5rem)`), font-weight 400/450, tracking `-0.025em`.
   - Balanced 2-line structure with generous line-height (`1.08`).
   - Clean subtext: 2 lines max, tracking wide.
2. **Atmospheric Glow**:
   - Use the circular optical atmosphere element (`ideas-blur-2.avif` or calibrated circular mask).
3. **Pacing & Cleanliness**:
   - Ensure complete stillness and pinned serenity; no elements from subsequent scenes may appear.
