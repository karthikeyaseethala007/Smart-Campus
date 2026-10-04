# 07 - Contact Scene Difference Audit

## Visual State Landmarks
- **MDX Reference**: ~23.2s ("Let's build your next award winning project")
- **Current Implementation**: ~25.5s (Command Center card container)
- **Artifact**: `references/mdx-analysis/final-difference-audit/07-contact/side_by_side_comparison.png`

## Viewport Composition & Spatial Architecture
- **MDX Reference**:
  - Full-bleed pale off-white editorial page (`#f5f5f3`).
  - Left column:
    - Pill tag: `• Get Started`.
    - Giant headline: `Let's build your next` / `award winning project`.
    - Subtext: `Turn your vision into a digital experience that stands out.`.
    - Direct email: `hello@mdx.so`.
    - Circular social icons.
  - Right column:
    - Heading: `Let's talk`.
    - Underlined input fields (no box borders): `Full name`, `Company`, `Email`, `Phone`.
    - Interest selector pills: `UI/UX`, `Development`, `Branding`, `3D Animation`, `Business automation`.
    - Underlined multi-line field: `Tell us more about your project!`.
    - Full-width black capsule CTA button: `SEND →`.
- **Current Implementation**:
  - Contained inside a floating beige dashboard card container with rounded corners and drop shadows.
  - Labels: `DIRECT COMMS (EMAIL)`, `CLEARANCE KEY ID: KEY-ALPHA-09`, `Priority 1 Perimeter & Optical Dome Surveillance Verification`.
  - The dark footer is already encroaching at the bottom.

## Key Visual Delta & Corrective Directives
1. **REMOVE Card Container**:
   - Dismantle the floating card container; expand to a full-bleed 2-column editorial layout.
2. **Left Column**:
   - Badge: `• Operational Clearance`.
   - Headline: `ENTER THE` / `CAMPUS COMMAND CENTER`.
   - Subtext: `A connected campus begins with unified intelligence. Direct integration for physical security, energy, and emergency response.`.
   - Contact email: `ops@smartcampus.internal`.
3. **Right Column**:
   - Underlined inputs: `Name`, `Role`, `Email`, `Campus Area`.
   - Sector selector pills: `SECURITY`, `ACCESS`, `SURVEILLANCE`, `ENERGY`, `EMERGENCY`.
   - CTA button: Black capsule `OPEN COMMAND CENTER →` linking to `/app`.
