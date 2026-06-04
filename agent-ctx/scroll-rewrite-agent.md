# Task: Complete Scroll System Rewrite

## Summary
Completed a full scroll system rewrite for the XFoundry/Vaulta website to achieve section-by-section scrolling feel (like sectionscrolltransition.webflow.io).

## Changes Made

### 1. Removed SectionPinner Component (`src/app/page.tsx`)
- Removed `SectionPinner` from import statement
- Removed `<SectionPinner sectionIds={[...]} />` usage entirely
- This eliminates the conflicting opacity:0 state that was set on the same elements as SectionReveal

### 2. Updated globals.css — CSS Scroll Snap Mandatory
- Changed `scroll-snap-type: y proximity` → `scroll-snap-type: y mandatory` + `scroll-behavior: smooth`
- Added `scroll-snap-stop: always` to `.v-section, .v-hero, .v-showcase-section`
- Added `scroll-snap-align: none` for non-snap elements (`.v-marquee-band, .v-stats-row, .v-brand-strip, .v-section-sep, .reveal-line`)
- Updated all `.v-section`, `.v-hero`, `.v-showcase-section` from `overflow: hidden` → `overflow-y: auto; overflow-x: hidden`
- Added mobile breakpoint at `max-width: 900px` to disable scroll-snap (set `scroll-snap-align: none` and `height: auto; min-height: 100vh`)

### 3. Integrated In-Between Elements Into Sections (`src/app/page.tsx`)
- **Marquee band**: Moved INTO the hero section as absolute-positioned element at bottom
- **Stats row**: Moved INTO the services section with proper spacing
- **Brand strip**: Moved INTO the services section with proper spacing
- Removed ALL `<div className="v-section-sep" />` elements (6 total) between sections
- Removed standalone `<RevealLine />` between hero and services
- All counter animation content preserved in the services section
- All brand strip content preserved in the services section

### 4. Converted SectionReveal to Scrub Mode (`src/components/ScrollAnimations.tsx`)
- Replaced `toggleActions: 'play none none reverse'` with `scrub: 0.5`
- Changed scrollTrigger range to `start: 'top 90%'` → `end: 'top 40%'`
- Changed `ease: 'power3.out'` → `ease: 'none'` (scrub-based needs linear)
- Removed `duration` and `delay` from the tween (scrub controls timing)
- Updated safety timeout from 500ms → 800ms

### 5. Converted StaggerReveal to Scrub Mode (`src/components/ScrollAnimations.tsx`)
- Same changes as SectionReveal: scrub mode, linear ease, updated trigger range
- Stagger still works with scrub (creates sequential offset in the scroll range)

### 6. Updated SmoothScrollProvider.tsx for Snap Compatibility
- Reduced `duration` from 1.4 → 1.2
- Added `smoothWheel: true` for better snap integration
- Kept Lenis + GSAP ScrollTrigger sync
- Kept `lenisScrollTo` utility function

## Commit
- `feat: rewrite scroll system - CSS snap mandatory + scrub animations + integrated sections`
- Pushed to `https://github.com/for-tristan/xfnl.git main`

## Verification
- Lint passes (only pre-existing warnings, no new errors)
- Dev server compiles and serves with 200 status
- 4 files changed, 116 insertions, 133 deletions
