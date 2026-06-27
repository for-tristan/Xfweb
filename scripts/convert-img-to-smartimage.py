#!/usr/bin/env python3
"""
Convert <img> tags to <SmartImage> across the codebase.

Replaces patterns like:
  <img src={X} alt="..." style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />

With:
  <SmartImage src={X} alt="..." width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />

Also adds the SmartImage import if not present.
"""

import re
import os
from pathlib import Path

# Files to process (excluding gameQuestions.ts which has <img> in code strings)
FILES = [
    "src/app/admin/page.tsx",
    "src/app/instructor/page.tsx",
    "src/app/games/page.tsx",
    "src/app/study/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/lib/PageModals.tsx",
]

BASE = "/home/z/my-project/Xfweb"

def convert_img_to_smartimage(content: str) -> str:
    """Convert all <img> tags to <SmartImage> tags."""

    # Pattern 1: <img src={X} alt={Y} style={{Z}} />
    # Use non-greedy matching with [\s\S] to handle nested braces in style
    pattern1 = r'<img\s+src=\{([^}]+)\}\s+alt=\{([^}]+)\}\s+style=(\{\{[^}]*\}[^}]*\})\s*/>'
    def replace1(match):
        src, alt, style = match.group(1), match.group(2), match.group(3)
        return f'<SmartImage src={{{src}}} alt={{{alt}}} width={{48}} height={{48}} style={style} />'
    content = re.sub(pattern1, replace1, content)

    # Pattern 2: <img src={X} alt="Y" style={{Z}} />
    pattern2 = r'<img\s+src=\{([^}]+)\}\s+alt="([^"]*)"\s+style=(\{\{[^}]*\}[^}]*\})\s*/>'
    def replace2(match):
        src, alt, style = match.group(1), match.group(2), match.group(3)
        return f'<SmartImage src={{{src}}} alt="{alt}" width={{48}} height={{48}} style={style} />'
    content = re.sub(pattern2, replace2, content)

    return content


def ensure_smartimage_import(content: str, filepath: str) -> str:
    """Add SmartImage import if not present."""
    if 'SmartImage' in content and "from '@/components/SmartImage'" not in content:
        # Find the last import line and add after it
        lines = content.split('\n')
        last_import = -1
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import = i
        if last_import >= 0:
            lines.insert(last_import + 1, "import { SmartImage } from '@/components/SmartImage';")
            content = '\n'.join(lines)
    return content


def main():
    for rel_path in FILES:
        filepath = os.path.join(BASE, rel_path)
        if not os.path.exists(filepath):
            print(f"  SKIP (not found): {rel_path}")
            continue

        with open(filepath, 'r') as f:
            original = f.read()

        # Count <img> tags before
        img_count_before = len(re.findall(r'<img\s', original))

        if img_count_before == 0:
            print(f"  SKIP (no <img> tags): {rel_path}")
            continue

        # Convert
        content = convert_img_to_smartimage(original)
        content = ensure_smartimage_import(content, filepath)

        # Count remaining <img> tags
        img_count_after = len(re.findall(r'<img\s', content))

        if content != original:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"  DONE: {rel_path} — {img_count_before} <img> → {img_count_after} <img> remaining")
        else:
            print(f"  NO CHANGE: {rel_path}")


if __name__ == '__main__':
    main()
