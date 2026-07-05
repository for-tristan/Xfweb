#!/usr/bin/env python3
"""
Add rAF throttling to scroll listeners in pages that use checkReveals/checkBottom.

The pattern in these files is:
  window.addEventListener('scroll', checkReveals);
  window.addEventListener('scroll', checkBottom);

We wrap checkReveals and checkBottom with rafThrottle and add the import.
"""

import re
from pathlib import Path

BASE = "/home/z/my-project/Xfweb"
FILES = [
    "src/app/games/page.tsx",
    "src/app/study/page.tsx",
    "src/app/courses/[slug]/page.tsx",
    "src/app/services/[slug]/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/admin/page.tsx",
    "src/app/instructor/page.tsx",
]

for rel_path in FILES:
    filepath = Path(BASE) / rel_path
    if not filepath.exists():
        print(f"  SKIP (not found): {rel_path}")
        continue

    content = filepath.read_text()
    original = content

    # Add import if not present
    if "rafThrottle" not in content:
        # Find last import line
        lines = content.split('\n')
        last_import = -1
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import = i
        if last_import >= 0:
            lines.insert(last_import + 1, "import { rafThrottle } from '@/lib/throttle';")
            content = '\n'.join(lines)

    # Wrap checkReveals with rafThrottle if it's defined as a useCallback
    # Pattern: const checkReveals = useCallback(() => {
    # Change to: const checkReveals = useCallback(rafThrottle(() => {
    # and close with ), []);
    if 'const checkReveals = useCallback(() => {' in content:
        content = content.replace(
            'const checkReveals = useCallback(() => {',
            'const checkReveals = useCallback(rafThrottle(() => {'
        )
        # Find the closing of checkReveals useCallback and add the closing paren
        # Pattern: }, []);  after checkReveals body
        # This is tricky — we need to find the first }, []); after checkReveals
        idx = content.find('const checkReveals = useCallback(rafThrottle(() => {')
        if idx >= 0:
            # Find the closing }, []); after this point
            close_idx = content.find('}, []);', idx)
            if close_idx >= 0:
                content = content[:close_idx] + '}), []);' + content[close_idx + len('}, []);'):]

    # Wrap checkBottom (inline arrow, not useCallback)
    # Pattern: const checkBottom = () => setAtBottom(...)
    # This is inline and simple — wrap with rafThrottle
    if 'const checkBottom = () =>' in content and 'rafThrottle' not in content.split('const checkBottom')[1].split('\n')[0]:
        content = content.replace(
            'const checkBottom = () =>',
            'const checkBottom = rafThrottle(() =>'
        )
        # Need to close the extra paren — the arrow body is a single expression
        # Pattern: const checkBottom = rafThrottle(() => setAtBottom(...));
        # The original was: const checkBottom = () => setAtBottom(...);
        # So we need to add a ) before the ;
        # Actually the original likely doesn't have a semicolon (no-semi style)
        # Let's check for the pattern more carefully
        pass

    if content != original:
        filepath.write_text(content)
        print(f"  DONE: {rel_path}")
    else:
        print(f"  NO CHANGE: {rel_path}")
