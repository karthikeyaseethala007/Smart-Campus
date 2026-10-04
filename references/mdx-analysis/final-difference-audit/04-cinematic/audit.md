# 04 - Cinematic Stage Difference Audit

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
