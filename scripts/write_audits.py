import os

base_dir = 'references/mdx-analysis/final-difference-audit'

audits = {
    '01-hero': """# 01 - Hero Scene Difference Audit

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
""",

    '02-editorial-1': """# 02 - Editorial Scene 1 Difference Audit

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
""",

    '03-editorial-2': """# 03 - Editorial Scene 2 Difference Audit

## Visual State Landmarks
- **MDX Reference**: ~13.5s ("From Ideas to Impactful Experiences")
- **Current Implementation**: ~11.5s ("From Detection to Autonomous Action")
- **Artifact**: `references/mdx-analysis/final-difference-audit/03-editorial-2/side_by_side_comparison.png`

## Viewport Composition & Spatial Architecture
- **MDX Reference**:
  - Pure pinned editorial scene.
  - Giant headline: `From Ideas to Impactful` / `Experiences`.
  - Soft warm ambient dome rising from bottom-center.
  - Subtext: `Every project begins with your vision. We design, develop, and refine until every detail delivers.`.
  - Bottom ticks: `| | | |` (3rd tick highlighted).
  - Absolutely zero card intrusion or UI clutter.
- **Current Implementation**:
  - Major violation: A large gray dashboard card (`AUTONOMOUS CORRELATION ENGINE | Zone 02 • Motion Verified`) is actively sliding in and cutting across the bottom 45% of the editorial space!
  - Text is crammed into the top half to make room for the premature card.

## Key Visual Delta & Corrective Directives
1. **REMOVE Premature Card Entry**:
   - The operational card MUST NOT enter during Editorial 2.
   - Editorial 2 must remain a completely clean, calm, pinned editorial viewport.
2. **Headline Composition**:
   - Headline: `From Detection to` / `Autonomous Action.`
   - Subtext: `Every event begins with telemetry. We detect, analyze, and automate until every zone is safeguarded.`.
3. **Atmosphere**:
   - Soft sunrise/dome warm atmospheric glow centered behind the typography.
""",

    '04-cinematic': """# 04 - Cinematic Stage Difference Audit

## Visual State Landmarks
- **MDX Reference**: ~15.5s ("WATCH SHOWREEL" cinematic stage)
- **Current Implementation**: ~14.5s (Zone 02 / Zone 04 telemetry card)
- **Artifact**: `references/mdx-analysis/final-difference-audit/04-cinematic/side_by_side_comparison.png`

## Viewport Composition & Spatial Architecture
- **MDX Reference**:
  - Full-width rounded black cinematic stage (`border-radius: ~28px`, ~88vw width, ~68vh height).
  - Deep black surface (`#050505`).
  - Center of stage: Centered play trigger: `▷ | WATCH SHOWREEL` with subtle particle logo background.
  - Clean, minimal, zero dashboard noise.
  - Below stage: bottom stage ticks.
- **Current Implementation**:
  - Wrong component entirely: It is a SaaS telemetry dashboard card (`AUTONOMOUS CORRELATION ENGINE | Zone 04 • Safe Baseline (38 PPM)`).
  - Contains telemetry pills (`PIR`, `MQ-2`, `CCTV`, `ACCESS`, `ENERGY`, `IOT`), live latency values (`TLS 1.3 < 4ms LATENCY`), and system action text.
  - Crammed beneath is `Engineered with Intention. Built to Protect.`.

## Key Visual Delta & Corrective Directives
1. **COMPLETE REDESIGN to Cinematic Stage**:
   - Replace the telemetry card with a large rounded black cinematic screen.
   - Stage styling: `bg-[#080808] border border-white/10 rounded-[28px] shadow-2xl relative overflow-hidden`.
   - Center trigger: `▷ | WATCH DECISION ENGINE` (or `WATCH AUTONOMOUS REEL`).
   - Retain Smart Campus architecture pillars (`PIR`, `MQ-2`, `CCTV`, `ACCESS`, `ENERGY`, `IOT`) as quiet stage metadata or lower pill tags.
   - Editorial copy positioned cleanly below the stage.
""",

    '05-floating': """# 05 - Floating Experience Difference Audit

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
""",

    '06-dark-showcase': """# 06 - Dark Showcase Difference Audit

## Visual State Landmarks
- **MDX Reference**: ~21.5s ("Our Craft, Your Expression." visual showcase)
- **Current Implementation**: ~22.0s (Operational text cards Sector 03, 04, 05, 06)
- **Artifact**: `references/mdx-analysis/final-difference-audit/06-dark-showcase/side_by_side_comparison.png`

## Viewport Composition & Spatial Architecture
- **MDX Reference**:
  - Full black canvas (`#0b0b0b`).
  - Top header: `Our Craft, Your Expression.` with category filter pills (`ALL`, `UI/UX`, `DEVELOPMENT`, `BRANDING`, `3D ANIMATION`).
  - Active filter pill is solid orange (`#FF8200`).
  - 2-column visual showcase grid with LARGE MEDIA TILES (HorizonX, The Social Elite, etc.).
  - Each tile has:
    - Large media/image region (`aspect-ratio: 16/10` or `3/2`).
    - Subtle rounded corners (`rounded-2xl`).
    - Lower caption: Category (`UI/UX / DEVELOPMENT`), Title (`HorizonX ↗`).
    - Hover animation: subtle scale (`scale-102`) and smooth transition.
- **Current Implementation**:
  - CRITICAL ISSUE: The current section displays operational text cards: `SECTOR 03 GRID SYNCHRONIZED`, `SECTOR 04 INTERLOCK SEALED`, `SECTOR 05 ATMOSPHERE MONITORED`, `SECTOR 06 OPTIMIZED LOAD` with telemetry metrics (48 Active Nodes, 92% Accurate, 100 Hz, 34 Portals, 54.85 kW).
  - No media/image showcase tiles exist.

## Key Visual Delta & Corrective Directives
1. **REMOVE Operational Telemetry Cards**:
   - Remove the telemetry dashboard cards completely from the landing page.
2. **Build Editorial Media Showcase**:
   - Filter pills: `ALL`, `SECURITY`, `SURVEILLANCE`, `SENSORS`, `ACCESS`, `EMERGENCY`, `ENERGY`, `IOT`.
   - Render 4-6 large visual media showcase tiles using the custom 3D particle assets (`lock.png`, `globe.png`, `fire.png`, `eletrcity.png`).
   - Tile structure:
     - Media area: 3D particle artwork with dark/studio framing.
     - Meta row: Category (e.g. `SECURITY / ACCESS`), Title (e.g. `Autonomous Perimeter Defense ↗`).
     - Hover physics: smooth elevation and arrow angle shift.
""",

    '07-contact': """# 07 - Contact Scene Difference Audit

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
""",

    '08-dark-prefooter': """# 08 - Dark Pre-Footer Scene Difference Audit

## Visual State Landmarks
- **MDX Reference**: ~24.5s ("Is there a fascinating project brewing in your mind?")
- **Current Implementation**: ~26.8s (COMPLETELY MISSING)
- **Artifact**: `references/mdx-analysis/final-difference-audit/08-dark-prefooter/side_by_side_comparison.png`

## Viewport Composition & Spatial Architecture
- **MDX Reference**:
  - Dedicated black editorial CTA scene immediately preceding the footer.
  - Left column: Giant headline: `Is there a fascinating` / `project brewing in your` / `mind?`, direct email `hello@mdx.so`.
  - Right column: Sub-heading `Award-winning studio`, subtext `Recognized by the world's leading design communities`, prestige award badges (`AWWWARDS.`, `THE WEBBY AWARDS`, `CSSDesignAwards`).
- **Current Implementation**:
  - COMPLETELY MISSING. The page jumps straight from the contact card into the footer navigation.

## Key Visual Delta & Corrective Directives
1. **CREATE the Missing Dark Pre-Footer Scene**:
   - Section background: Pitch black (`#070707`).
   - Left column:
     - Giant typography: `FROM SIGNAL` / `TO RESPONSE.`
     - Supporting copy: `A connected campus should turn every signal into action. Zero latency from detection to physical containment.`.
     - Direct CTA button: `OPEN COMMAND CENTER →` (`/app`).
   - Right column:
     - Headline: `ENTERPRISE CERTIFIED ARCHITECTURE`.
     - Subtext: `Validated across high-density facilities, autonomous perimeters, and critical infrastructure.`.
     - Operational badge certifications: `ISO 27001`, `SOC 2 TYPE II`, `UL 2900-2`, `NIST SP 800-53`.
""",

    '09-footer': """# 09 - Footer Difference Audit

## Visual State Landmarks
- **MDX Reference**: ~28.0s (Massive MDX wordmark and footer columns)
- **Current Implementation**: ~29.5s (Footer with SMART CAMPUS)
- **Artifact**: `references/mdx-analysis/final-difference-audit/09-footer/side_by_side_comparison.png`

## Viewport Composition & Spatial Architecture
- **MDX Reference**:
  - Deep black surface (`#050505`).
  - Top navigation: 4 thin columns (`ABOUT US`, `SERVICES`, `OTHER SERVICES`, `SOCIAL MEDIA`) with generous tracking and vertical line-height.
  - Divider: Thin horizontal hair-line (`rgba(255,255,255,0.08)`).
  - Main wordmark: Colossal `M D X` letters filling the entire horizontal width of the screen.
  - Bottom row: Social icons on left, copyright (`© 2026 MDX. All rights reserved`) and legal links (`Privacy Policy`, `Terms & Conditions`) center, `SCROLL TOP ⌃` on right.
- **Current Implementation**:
  - Footer exists, but typography and spacing need refinement:
    - Column fonts are too dense.
    - Wordmark `SMART CAMPUS` is large, but letter spacing and vertical proportions need calibration against the MDX reference.
    - Bottom bar requires clean separators and responsive alignment.

## Key Visual Delta & Corrective Directives
1. **Typography & Proportions**:
   - Set column titles to `text-xs uppercase tracking-[0.2em] text-white/40`.
   - Set link items to `text-sm font-light text-white/70 hover:text-white transition-colors py-1`.
   - Ensure massive wordmark `SMART CAMPUS` has tracking `-0.04em` and perfect optical centering.
   - Refine bottom bar with `PROTECT. DETECT. RESPOND. AUTOMATE.` and interactive `SCROLL TOP ↑`.
"""
}

for folder, content in audits.items():
    p = os.path.join(base_dir, folder, 'audit.md')
    with open(p, 'w') as f:
        f.write(content)
    print(f'Wrote {p}')

# Master README
master_readme = """# Master Pin-to-Pin Difference Audit: MDX Reference vs Current Smart Campus

## Executive Summary
This difference audit provides a landmark-by-landmark visual analysis comparing:
1. **MDX Reference Recording** (`mdx.so.mov`, 31.25s)
2. **Current Implementation Recording** (`Screen Recording 2026-09-27 at 10.24.11 AM.mov`, 34.62s)

The comparison is conducted strictly by **visual landmark and state**, not by arbitrary timestamp stretching.

## Scene Matrix & Audit Directory

| Scene Index | Scene Name | Reference Landmark | Current Landmark | Status & Primary Findings |
|---|---|---|---|---|
| `01-hero` | Hero Stage | ~02.0s | ~02.0s | Too orange & UI-dense. Needs pale studio floor, soft particle appearance, diffuse ground shadow, refined typography. |
| `02-editorial-1` | Editorial 1 | ~10.5s | ~09.0s | Too information-heavy. Needs pure giant typography, soft circular atmosphere, and generous whitespace. |
| `03-editorial-2` | Editorial 2 | ~13.5s | ~11.5s | Premature card intrusion. Zone 02 card must be removed; keep clean pinned editorial state. |
| `04-cinematic` | Cinematic Stage | ~15.5s | ~14.5s | Wrong component type. Convert telemetry dashboard card into a large rounded black cinematic stage with center play trigger. |
| `05-floating` | Floating Experience | ~18.0s | ~19.0s | Central object too orange. Pills too heavy. Transform to soft cream/gray particle cloud with slender capsule controls. |
| `06-dark-showcase` | Dark Showcase | ~21.5s | ~22.0s | Critical misalignment. Replace operational telemetry text cards with editorial visual showcase tiles using custom 3D particle assets (`lock.png`, `globe.png`, `fire.png`, `eletrcity.png`). |
| `07-contact` | Contact Entry | ~23.2s | ~25.5s | Dismantle floating card container. Implement full-bleed editorial contact layout with underlined fields, pills, and black capsule CTA. |
| `08-dark-prefooter` | Dark Pre-Footer | ~24.5s | ~26.8s | Completely missing. Build dedicated black editorial CTA scene (\"FROM SIGNAL TO RESPONSE\") with certifications and CTA before footer. |
| `09-footer` | Massive Footer | ~28.0s | ~29.5s | Refine column typography, letter-spacing, and proportions of colossal wordmark and bottom bar. |

## Audit Artifacts
All high-resolution side-by-side comparisons are saved in:
- `01-hero/side_by_side_comparison.png`
- `02-editorial-1/side_by_side_comparison.png`
- `03-editorial-2/side_by_side_comparison.png`
- `04-cinematic/side_by_side_comparison.png`
- `05-floating/side_by_side_comparison.png`
- `06-dark-showcase/side_by_side_comparison.png`
- `07-contact/side_by_side_comparison.png`
- `08-dark-prefooter/side_by_side_comparison.png`
- `09-footer/side_by_side_comparison.png`
"""

with open(os.path.join(base_dir, 'README.md'), 'w') as f:
    f.write(master_readme)
print('Master README written!')
