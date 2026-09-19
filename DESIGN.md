# DESIGN.md — Adaptive Media Engine

> **Design System Specification**: Synthesized via `awesome-design` & `impeccable` design principles.
> **Aesthetic Archetype**: Scholarly Literary Minimalism + Tactile Skeuomorphism + Precision Dark Obsidian.

---

## 1. Product Context & Identity

- **Product Name**: Adaptive Media Engine (AME)
- **Nature**: Cross-media recommendation system (Cinema, Series, Literature, Audiobooks) prioritizing depth, cognitive nourishment, and genuine taste over addictive infinite scrolling.
- **Tone**: Restrained, academic, curated, tactile, calm, authoritative.
- **Anti-Patterns**: Strictly no neon purple AI gradients, no generic bento boxes, no artificial urgency, no dark-mesh background fluff.

---

## 2. Color System & Semantic Tokens

### Canvas & Surfaces (Dual Theme)

#### Light Mode (Warm Parchment / Library Archive)
- `canvas-background`: `#FDF9F0` (Warm library parchment)
- `surface-container`: `#F2EDE5` (Tactile card face)
- `surface-container-high`: `#ECE8DF` (Elevated modals / popovers)
- `surface-border`: `#CEC5BD` (Subtle boundary)
- `text-primary`: `#1C1C17` (Deep sumi ink)
- `text-muted`: `#4B4640` (Parchment charcoal)

#### Dark Mode (Deep Obsidian / Study at Night - Primary Default)
- `canvas-background`: `#0E0E0E` (Deep matte black)
- `surface-container`: `#181716` (Obsidian card surface)
- `surface-container-high`: `#22201E` (Active floating panels)
- `surface-border`: `#2E2A26` (Warm bronze hairline border)
- `text-primary`: `#FAF8F5` (Soft linen white)
- `text-muted`: `#878380` (Muted bone grey)

#### Accent Accents (Used Sparingly)
- `gilded-amber`: `#C4975A` (Curator star, completion depth, active status)
- `amber-glow`: `rgba(196, 151, 90, 0.15)` (Subtle tactile focus glow)
- `crimson-accent`: `#BA1A1A` (Destructive actions only)

---

## 3. Typography Scale

- **Display & Titles**: Editorial Serif (`Playfair Display`, `Newsreader`, or `Cinzel`)
  - Weight: 600 / 700
  - Tracking: `-0.02em`
- **Body & Reasoning**: Clean Neogrotesque (`Inter`, `Plus Jakarta Sans`, or `Geist`)
  - Weight: 400 / 500
  - Line height: 1.6
- **Metadata, Telemetry & Stats**: Monospace (`DM Mono`, `JetBrains Mono`)
  - Weight: 500
  - Tracking: `+0.05em`
  - Uppercase for tags and metrics (e.g. `98% AFFINITY`, `124 MIN`, `VOL. IV`)

---

## 4. Tactile 3D Shelf & Physical Case Spec

- **Perspective**: `perspective: 1200px` on shelf containers.
- **Spine & Depth**: Media items render with genuine physical thickness (3D book spine or jewel case edge).
- **Interactive State**:
  - `hover`: `-translate-y-2 rotate-y-[-12deg] shadow-2xl`
  - Subtle realistic light sheen along the spine highlight.
  - Inspection mode: Fullscreen 3D rotation inspects front, spine, and back-blurb reasoning.

---

## 5. Interaction & Motion Rules

- **Spring Dynamics**: `cubic-bezier(0.16, 1, 0.3, 1)` (snappy, physical deceleration).
- **Duration**: 240ms for micro-transitions, 380ms for modals and drawer expansions.
- **No Infinite Loops**: Avoid distracting pulsing glowing badges. Movement only in response to direct user interaction.
