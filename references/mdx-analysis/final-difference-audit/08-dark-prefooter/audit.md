# 08 - Dark Pre-Footer Scene Difference Audit

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
