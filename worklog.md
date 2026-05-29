---
Task ID: 1
Agent: Main
Task: Fix light mode dropdown menus, cursor on courses/services pages, and replace hardcoded colors with CSS variables

Work Log:
- Analyzed uploaded screenshot showing grid-bg pattern bleeding through dropdown menus in light mode
- Identified root cause: `--input-bg: rgba(0,0,0,0.04)` in light mode is nearly transparent, letting grid pattern show through all select elements
- Identified root cause of cursor not showing: `useCustomCursor` hook captured `dotRef.current`/`ringRef.current` at effect start time. When component transitions from loading skeleton to main content, old DOM elements are unmounted and new ones mounted, but the hook's animation loop still references the old (unmounted) elements
- Fixed `useCustomCursor` hook to read from refs dynamically in animation loop and event handlers instead of capturing DOM elements at effect start
- Fixed light mode select/option elements: added `[data-theme="light"] select` with `background-color: #ffffff` (broad rule covering all selects including admin)
- Fixed search modal: replaced `--bg-secondary` (undefined!) with `--card-bg`, added CSS class names (`search-modal-overlay`, `search-modal-panel`, `search-result-item`) for targeted overrides
- Fixed notification panel: replaced `--dark-gray` with `--card-bg`, added CSS class names (`notif-panel`, `notif-item`, `notif-unread`)
- Fixed AuthGate overlay: replaced `--text-primary, #fff` fallbacks with `--text-light`, replaced `#ff3b30` with `--primary-red`
- Replaced all hardcoded `rgba(255,255,255,...)` border colors with `var(--border-color)` throughout PageModals
- Replaced all `#ff3b30` hardcoded reds with `var(--primary-red)`
- Added light mode cursor visibility CSS overrides
- Committed and pushed to GitHub

Stage Summary:
- useCustomCursor hook now survives DOM remounts (fixes courses + services cursor)
- All dropdown menus now have solid white background in light mode
- Search modal, notification panel, and AuthGate fully theme-aware
- All hardcoded inline colors replaced with CSS variables
