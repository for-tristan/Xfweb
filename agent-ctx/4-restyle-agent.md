# Task 4 - Games Page Vaulta Restyle

## Summary
Restyled the Games page (`/src/app/games/page.tsx`) to match the Vaulta aesthetic that was already applied to the main page.

## Changes Made
- All 15 Vaulta aesthetic rules applied to every inline style in the file
- No functionality changes, only styling

## Key Changes
1. **Fonts**: Orbitron → var(--font-heading), Space Grotesk → var(--font-body) (27 total replacements)
2. **Font weights**: 900→700, 800→600
3. **Border radius**: 4→12 (cards), 3→12 (rows), 2→999 (pills), 2→8 (progress bars)
4. **Colors**: All rgba(220,20,60,...) → color-mix equivalents, var(--primary-red) → var(--accent)
5. **Glass cards**: var(--card-bg) → glass effect on leaderboard containers
6. **Glass inputs**: var(--input-bg) → glass on pills, badges, avatar circles
7. **Code display**: #0d0d0d → glass with backdrop blur
8. **Letter spacing**: 2→0.5, 1→0.02
9. **Text transform**: Removed from non-tiny labels, kept on 9px labels
10. **Linear gradients**: Updated to use var(--accent)
11. **Leaderboard selects**: Removed inline styles (rule 14)
12. **Hover effects**: Updated to use color-mix accent borders

## Lint
- No new errors introduced
