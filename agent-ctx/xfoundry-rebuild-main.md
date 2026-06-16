# Task: Complete Rebuild of XFoundry Landing Page (Synapser Studio Style)

## Summary
Successfully rebuilt all 14 files for the XFoundry landing page with a Synapser Studio-inspired design system. The page now features:

### Files Written
1. **globals.css** — Complete rewrite with warm cream/beige palette (#dcd8c0 bg, #1a1a18 text), custom cursor styles, marquee animations, noise overlay, form inputs
2. **layout.tsx** — Minimal layout with Google Fonts imports (IBM Plex Mono + Newsreader)
3. **LenisProvider.tsx** — Proper Lenis + GSAP ScrollTrigger integration using gsap.ticker
4. **CustomCursor.tsx** — Ring + Dot cursor with lerp-based following (dot: 0.2, ring: 0.1), click particles
5. **Preloader.tsx** — Animated counter (0-100) with progress bar and slide-up exit
6. **NoiseOverlay.tsx** — Canvas-based film grain noise at very subtle opacity (0.035)
7. **Navigation.tsx** — Fixed nav with blur backdrop on scroll, mobile hamburger menu, smooth scroll to sections
8. **Hero.tsx** — Full hero with background marquee text (3 rows desktop, 5 rows mobile), 8 hero words with GSAP stagger animation, parallax on scroll, scroll indicator
9. **Manifesto.tsx** — Word-by-word scroll reveal (opacity 0.1 → 1), updated to new color system
10. **ProjectsSlider.tsx** — GSAP Draggable horizontal project cards, 5 projects with images, tags, counter
11. **Services.tsx** — Expanding accordion cards (hover/click to expand), 4 service categories with sub-services
12. **Collaborate.tsx** — Contact section with form (name, email, service, message), location info, social links
13. **Footer.tsx** — Simple footer with copyright and links
14. **page.tsx** — Main page orchestrating all components with preloader state

### Key Technical Decisions
- All components use `'use client'` directive and named exports
- GSAP ScrollTrigger properly registered in each file that uses it
- Lenis integration via gsap.ticker.add() with proper cleanup
- All colors use CSS variables (var(--text-primary), var(--bg-primary), etc.)
- All fonts use CSS variables (var(--font-heading), var(--font-body))
- No Tailwind color classes — all styling via inline styles with CSS variables
- Parallax: Hero words at yPercent: -30, subtitle at yPercent: -60, marquee at yPercent: -15
- Custom cursor with both dot and ring, proper mobile detection to hide on touch devices

### Verification
- Lint passes (pre-existing errors in other files, none in synapser components)
- Dev server compiles successfully
- Screenshots taken at multiple scroll positions confirming all sections render correctly:
  - Hero with animated words and marquee background
  - Manifesto with word-by-word reveal
  - Projects slider with draggable cards
  - Services accordion
  - Collaborate form section
  - Footer
