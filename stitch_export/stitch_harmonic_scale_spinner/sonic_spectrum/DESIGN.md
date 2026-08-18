---
name: Sonic Spectrum
colors:
  surface: '#101418'
  surface-dim: '#101418'
  surface-bright: '#36393f'
  surface-container-lowest: '#0b0e13'
  surface-container-low: '#191c21'
  surface-container: '#1d2025'
  surface-container-high: '#272a2f'
  surface-container-highest: '#32353a'
  on-surface: '#e1e2e9'
  on-surface-variant: '#c1c7d3'
  inverse-surface: '#e1e2e9'
  inverse-on-surface: '#2e3036'
  outline: '#8b919d'
  outline-variant: '#414751'
  surface-tint: '#a4c9ff'
  primary: '#a4c9ff'
  on-primary: '#00315d'
  primary-container: '#4d93e5'
  on-primary-container: '#002a51'
  inverse-primary: '#0060ac'
  secondary: '#ffb1c4'
  on-secondary: '#65002e'
  secondary-container: '#b20055'
  on-secondary-container: '#ffc0cf'
  tertiary: '#ffb953'
  on-tertiary: '#452b00'
  tertiary-container: '#c58305'
  on-tertiary-container: '#3c2500'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a4c9ff'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#004883'
  secondary-fixed: '#ffd9e0'
  secondary-fixed-dim: '#ffb1c4'
  on-secondary-fixed: '#3f001a'
  on-secondary-fixed-variant: '#8f0043'
  tertiary-fixed: '#ffddb4'
  tertiary-fixed-dim: '#ffb953'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#101418'
  on-background: '#e1e2e9'
  surface-variant: '#32353a'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style

The design system is centered on the intersection of professional audio precision and high-energy playfulness. It targets a diverse audience from casual music enthusiasts to creative producers who value a "flow state" experience. The UI is designed to evoke a sense of infinite creative possibility through high-contrast, vibrant visuals set against a cinematic dark backdrop.

The design style is **Modern Playful**. It leverages the clean, structural integrity of modern SaaS interfaces but injects it with rhythmic energy through radiant glows, organic movement, and a "living" color palette. The interface should feel like a premium physical instrument that has been digitized—tactile, responsive, and visually resonant.

## Colors

The palette is built on a "Dark Room" philosophy, where the interface recedes to let the musical data shine. The primary **Musical Blue (#4A90E2)** serves as the anchor for active states and primary interactions. 

To differentiate notes within an octave, the design system utilizes a 7-step **Chromatic Spectrum**. These colors are highly saturated to ensure they "pop" against the deep navy and charcoal surfaces. Use the neutral palette for structural elements (borders, inactive states, and backgrounds) to maintain visual hierarchy and prevent the interface from becoming overwhelming.

## Typography

Typography in this design system balances geometric character with functional clarity. **Montserrat** is used for high-level branding and headings to provide a bold, confident voice. **Inter** handles the majority of the UI for its exceptional readability at smaller sizes. 

For technical readouts like BPM, frequency, or MIDI data, **JetBrains Mono** is introduced to provide a precise, instrument-like aesthetic. All text should maintain a high contrast ratio against the dark background, utilizing off-whites and light greys rather than pure white to reduce eye strain during long creative sessions.

## Layout & Spacing

This design system employs a **Fluid Grid** model with a 4px base unit. The layout is optimized for "reachability," particularly on mobile devices where musical performance often occurs. 

- **Desktop:** A 12-column grid with generous 24px gutters to allow the colorful scale elements breathing room.
- **Mobile:** A 4-column grid with 16px margins. Primary instrument controls (like the note wheel) should center themselves to maximize the ergonomic arc of the user's thumb.
- **Rhythm:** Use spacing increments of 8px (2 units) for most component grouping, and 16px (4 units) for sectional separation.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Luminescent Glows**. 
- **Level 0 (Base):** Deep Navy (#0A0E14).
- **Level 1 (Card/Container):** Charcoal (#161B22) with a 1px subtle border (#252A31).
- **Level 2 (Active/Interactable):** Elements use a subtle inner-glow rather than traditional drop shadows. When a note is triggered, it should emit an outer "bloom" effect using its assigned scale color, creating the illusion of light passing through glass.
- **Glassmorphism:** Use backdrop blurs (20px) on floating panels and overlays to maintain context of the underlying instrument state.

## Shapes

The shape language is consistently **Rounded (Level 2)**. This approach softens the technical nature of a music interface and makes it feel more approachable and "toy-like" in the best sense. 

- **Standard Buttons/Inputs:** 0.5rem (8px) corner radius.
- **Instrument Segments:** Use arc-based geometry with rounded end-caps.
- **Knobs & Dials:** Strictly circular.
- **Selection States:** Use "pill" shapes for toggles and chips to reinforce the playful, interactive vibe.

## Components

### Buttons & Interaction
Primary buttons use the Musical Blue with a slight gradient. When pressed, the button should shrink slightly (scale: 0.96) and increase its inner-glow intensity.

### The Note Wheel
The core component. Segments are separated by 2px gaps. When active, a segment fills with its scale color and triggers a subtle vertical "bounce" animation.

### Sliders & Knobs
Sliders feature a thick track with a high-contrast "active" fill. Knobs use a "ring-fill" indicator. Both should support haptic feedback on mobile devices.

### Cards
Cards are used for synth presets and effects modules. They use a Charcoal surface with a subtle 1px border. On hover, the border color should shift to the Musical Blue.

### Chips (Octave/Scale Selectors)
Small, pill-shaped indicators. The active chip takes the Primary Blue color, while inactive chips remain as outlined "ghost" buttons to minimize visual noise.

### Performance Visualizers
Include a "Waveform" component that uses the active note's color to draw the frequency line, reinforcing the link between sight and sound.