---
name: Sonic Spectrum Terminal
colors:
  surface: '#111319'
  surface-dim: '#111319'
  surface-bright: '#36393f'
  surface-container-lowest: '#0b0e13'
  surface-container-low: '#191c21'
  surface-container: '#1d2025'
  surface-container-high: '#272a30'
  surface-container-highest: '#32353b'
  on-surface: '#e1e2ea'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e1e2ea'
  inverse-on-surface: '#2e3036'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#d1bcff'
  on-secondary: '#3c0090'
  secondary-container: '#7000ff'
  on-secondary-container: '#ddcdff'
  tertiary: '#fff5de'
  on-tertiary: '#3b2f00'
  tertiary-container: '#fed639'
  on-tertiary-container: '#715d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d1bcff'
  on-secondary-fixed: '#23005b'
  on-secondary-fixed-variant: '#5700c9'
  tertiary-fixed: '#ffe179'
  tertiary-fixed-dim: '#eac324'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#554500'
  background: '#111319'
  on-background: '#e1e2ea'
  surface-variant: '#32353b'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 1.5rem
  module-gap: 0.75rem
  data-row-height: 2rem
  input-height: 2.5rem
---

## Brand & Style
The design system embodies a high-fidelity "Command Center" aesthetic, optimized for professional trading and deep data analysis. It draws from **Cyber-Minimalism** and **Glassmorphism**, prioritizing extreme legibility, rapid information processing, and a sense of technical authority.

The interface should feel like a high-performance instrument—cold, precise, and responsive. It utilizes a layered dark-mode architecture to reduce eye strain during long sessions while using vibrant, high-contrast status accents to signal market movements and system alerts.

- **Primary Motif:** Semi-transparent modules over a deep, void-like background.
- **Visual Weight:** Light-weight borders and high-density information arrays.
- **Tone:** Technical, institutional, and futuristic.

## Colors
The palette is rooted in a deep "Command Center" black (#0b0e13) to provide maximum contrast for data visualization. 

- **Core Palette:** The primary "Sonic" cyan acts as the focus color for active states and primary actions. Secondary violet is reserved for subtle branding or secondary data streams.
- **Status Colors:** These are non-negotiable and must maintain high saturation to ensure instant recognition of market trends (Success Green for "Long/Up", Error Red for "Short/Down").
- **Surface Strategy:** Backgrounds utilize tiered levels of the neutral dark, with "glass" overlays (low-opacity white) used to define modular containers.

## Typography
This design system employs a dual-font strategy to balance aesthetic modernism with functional precision.

1.  **Hanken Grotesk (Brand & UI):** Used for all structural UI elements, headers, and standard body text. It provides a sharp, contemporary feel that remains legible at small sizes.
2.  **JetBrains Mono (Data & Metrics):** Essential for all numerical values, price feeds, tickers, and code-based inputs. The monospaced nature ensures that fluctuating numbers do not cause horizontal layout shifts (layout thrashing).

**Hierarchical Rules:**
- Use `label-caps` for table headers and metadata descriptors.
- `data-lg` should be used for primary balance or price displays.
- All letter-spacing on headlines should be slightly tightened for a "technical" look.

## Layout & Spacing
The layout follows a **Fixed Modular Grid** approach, optimized for multi-monitor setups and dense dashboards.

- **The 4px Rule:** All spacing and sizing must be increments of 4px to maintain mathematical precision.
- **Density:** High-density is the default. Information should be packed tightly but separated by clear, thin borders rather than large whitespace gaps.
- **Breakpoints:**
  - **Desktop (1440px+):** 12-column grid, modular "widgets" can be resized or rearranged.
  - **Tablet (768px - 1439px):** Columns collapse to 6; sidebar navigation moves to a collapsed icon-only state.
  - **Mobile:** Single column stack. Complex charts should prompt a landscape-mode recommendation.

## Elevation & Depth
Depth is achieved through **Backdrop Blurs** and **Luminance** rather than traditional drop shadows.

- **Base Layer:** The deepest neutral (#0b0e13).
- **Surface Layer:** Background-blur (20px to 40px) with a subtle `border_low_contrast` (1px).
- **Active Layer:** Elements that are "raised" (like hover states or active modals) receive a subtle inner glow or a primary color rim-light effect.
- **Shadows:** If used for popovers, use a "Hard" shadow—0px blur, 4px offset—in a darker-than-background black to mimic a technical cutout.

## Shapes
The shape language is "Technical-Soft." It avoids both the aggression of sharp corners and the playfulness of large radii.

- **Components:** Standard buttons and inputs use a `0.25rem` (4px) radius.
- **Containers:** Large dashboard modules use `rounded-lg` (8px).
- **Status Indicators:** Small pips and "Live" indicators are circular (pill-shaped).
- **Borders:** Always 1px solid. Never use 2px borders unless indicating a focus state.

## Components

### Buttons
- **Primary:** Solid Cyan background with black text. No gradient.
- **Ghost:** 1px Cyan border, transparent background, Cyan text.
- **Actionable Icons:** Minimalist 20px icons inside a 32px square container with a subtle hover fill.

### Data Tables
- **Header:** `label-caps` typography, 20% opacity white background.
- **Rows:** Alternating subtle zebra striping (optional) or 1px bottom border.
- **Cell Alignment:** Numbers are always right-aligned (using JetBrains Mono) to allow for vertical decimal comparison.

### Input Fields & Controls
- **Form Fields:** Dark background, 1px `border_low_contrast`. Label is positioned above in `data-sm`.
- **Segmented Control:** A "tabbed" toggle within a single module to switch between "Buy" and "Sell" or timeframes (1H, 4H, 1D).
- **Steppers:** Precision +/- buttons for adjusting price/amount in small increments.

### Cards & Modules
- Each module must have a "Header" section containing the title and utility actions (e.g., expand, settings, close).
- Content within cards should use the `module-gap` (12px) for internal padding.

### Status Chips
- Small, high-contrast badges for "Open," "Closed," "Pending." Use status colors with 10% opacity backgrounds and 100% opacity text for maximum readability without visual noise.