#!/usr/bin/env python3
"""Final replacement — properly handle large arrays."""

MAIN_FILE = '/home/z/my-project/src/lib/gameQuestions.ts'
QUESTIONS_DIR = '/home/z/my-project/download/questions'

REPLACEMENTS = {
    'Q_bh_js_e': 'Q_bh_js_e.txt',
    'Q_bh_js_m': 'Q_bh_js_m.txt',
    'Q_bh_js_h': 'Q_bh_js_h.txt',
}

with open(MAIN_FILE, 'r') as f:
    lines = f.readlines()

for array_name, filename in REPLACEMENTS.items():
    with open(f'{QUESTIONS_DIR}/{filename}', 'r') as f:
        new_content = f.read().strip()

    # Find start of this sub-array
    start_line = None
    for i, line in enumerate(lines):
        if f'const {array_name}: GameQuestion[] = [' in line:
            start_line = i
            break

    if start_line is None:
        print(f'WARNING: Could not find {array_name}')
        continue

    # Find the NEXT sub-array declaration after this one
    next_array_line = None
    for i in range(start_line + 1, len(lines)):
        if 'const Q_' in lines[i] and 'GameQuestion[]' in lines[i]:
            next_array_line = i
            break

    if next_array_line is None:
        print(f'WARNING: Could not find next array after {array_name}')
        continue

    # The actual end of our array is just before the next const Q_
    # But there might be blank lines between ]; and const Q_
    # Work backwards from next_array_line to find the ];
    end_line = next_array_line - 1
    while end_line > start_line and lines[end_line].strip() == '':
        end_line -= 1

    # end_line should now be at ];
    old_count = sum(1 for l in lines[start_line:end_line+1] if '{ id:' in l)
    new_count = new_content.count('{ id:')

    # Build the replacement
    new_lines = [f'const {array_name}: GameQuestion[] = [\n', new_content + '\n', '];\n', '\n']

    # Replace from start_line to next_array_line (exclusive)
    lines[start_line:next_array_line] = new_lines

    print(f'Replaced {array_name}: {old_count} old -> {new_count} new')

with open(MAIN_FILE, 'w') as f:
    f.writelines(lines)

# Verify
with open(MAIN_FILE, 'r') as f:
    final = f.read()

print(f'\nTotal questions: {final.count("{ id:")}')
print(f'Remaining "Add !important": {final.count("Add !important")}')
print(f'Remaining "Change selector": {final.count("Change selector")}')
print(f'Remaining "Remove the line": {final.count("Remove the line")}')
