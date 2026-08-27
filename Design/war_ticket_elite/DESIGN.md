---
name: War Ticket Elite
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d4c5ad'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#9c8f7a'
  outline-variant: '#504534'
  surface-tint: '#fabd32'
  primary: '#ffd481'
  on-primary: '#412d00'
  primary-container: '#f0b429'
  on-primary-container: '#644800'
  inverse-primary: '#7b5900'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#aee0ff'
  on-tertiary: '#003549'
  tertiary-container: '#5bc9ff'
  on-tertiary-container: '#005371'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea4'
  primary-fixed-dim: '#fabd32'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4200'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#c3e8ff'
  tertiary-fixed-dim: '#7ad0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  war-gold: '#F0B429'
  surface-grey: '#1A1A1A'
  status-green: '#10B981'
  urgent-red: '#EF4444'
  text-primary: '#FFFFFF'
  text-secondary: '#666666'
  brand-glow: rgba(240, 180, 41, 0.1)
typography:
  display-xl:
    fontFamily: Bebas Neue
    fontSize: 80px
    fontWeight: '700'
    lineHeight: 80px
    letterSpacing: 0.02em
  display-lg:
    fontFamily: Bebas Neue
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: 0.02em
  display-md:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg:
    fontFamily: Bebas Neue
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  display-xl-mobile:
    fontFamily: Bebas Neue
    fontSize: 36px
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
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is crafted for a premium, high-stakes ticketing environment. It evokes the adrenaline of a "ticket war" while maintaining the sophistication of an exclusive concierge service. The aesthetic is a fusion of **Glassmorphism** and **High-Contrast Bold**, utilizing deep blacks to provide a stage for vibrant, glowing gold accents.

The visual language emphasizes "live" energy through subtle neon pulses and dynamic transitions, signaling urgency and real-time activity. It targets a tech-savvy audience that values speed, reliability, and status. The overall mood is "Electric Underground Festival"—dark, sleek, and high-performance.

## Colors

The palette is anchored by **Deep Black (#090909)** to achieve true depth and premium contrast. **War Gold** serves as the primary action color, used for critical CTAs and active states, often accompanied by a subtle outer glow to simulate neon luminosity.

**Surface Grey** is used for secondary containers and glassmorphic backgrounds to create layered hierarchy without breaking the dark aesthetic. Functional colors (**Status Green** and **Urgent Red**) are saturated to ensure visibility against the dark backdrop, specifically for "Live" indicators and "Sold Out" warnings.

## Typography

Typography follows a strict hierarchy: **Bebas Neue** is reserved for high-energy display moments, headlines, and data points that require immediate impact. Its condensed nature allows for aggressive sizing without consuming excessive horizontal space.

**Plus Jakarta Sans** provides the functional balance, used for all UI text, labels, and body copy to ensure maximum readability during high-stress checkout flows. Tracking is slightly increased for labels to enhance clarity against dark backgrounds.

## Layout & Spacing

This design system utilizes a **12-column fluid grid** for desktop and a **single-column stack** for mobile. Spacing is generous to prevent the dark UI from feeling cramped, using an 8px base rhythm.

- **Desktop (1024px+):** 3-4 column event grids, 40px side margins.
- **Tablet (768px-1023px):** 2-column grids, condensed navigation.
- **Mobile (320px-767px):** 1-column layout, 16px side margins, sticky bottom CTAs for ergonomic "War" participation.

## Elevation & Depth

Hierarchy is established through **Glassmorphism** rather than traditional shadows. Surfaces are layered using varying levels of background blur (12px to 20px) and semi-transparent fills of `Surface Grey`.

- **Base Level:** Deep Black background.
- **Mid Level:** Glassmorphic cards with 1px border (`rgba(255,255,255,0.1)`).
- **High Level:** Modals and Floating Bars with a stronger background blur and a `War Gold` accent border (0.5px).
- **Interactions:** Hovering over elements triggers a scale increase (1.02x) and a `War Gold` glow effect (`box-shadow: 0 0 20px rgba(240, 184, 41, 0.3)`).

## Shapes

The shape language is **Rounded (Level 2)**. Standard UI components like input fields and buttons use a 0.5rem (8px) radius. Larger containers like event cards and checkout panels use **rounded-xl (24px)** to soften the high-contrast aesthetic and feel more modern and premium.

## Components

### Buttons
- **Primary:** Solid War Gold with black text. On hover, apply a magnetic pull effect and a subtle outer glow.
- **Secondary:** Transparent with a War Gold border.
- **Checkout CTA:** Massive, full-width gold button with a "live pulse" animation on the text during processing.

### Cards
Event cards feature a metallic texture overlay. The header image uses a vertical gradient fade into the card body. Include a top-right badge for status (e.g., "LIMITED" in Urgent Red).

### Interactive Live Queue
A central, large animated ring. The ring stroke should pulse in War Gold. Use Bebas Neue for the position number. Real-time tickers should slide in from the bottom of the component with a staggered entrance.

### Inputs
Dark backgrounds (`#090909`) with a 1px `Surface Grey` border. Focus state shifts the border to `War Gold` with a subtle interior glow.

### Status Indicators
Live indicators must feature a CSS-only infinite pulse animation (`scale` and `opacity`) to denote real-time connectivity.