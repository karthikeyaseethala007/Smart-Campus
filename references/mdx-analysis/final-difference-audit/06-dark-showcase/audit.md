# 06 - Dark Showcase Difference Audit

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
