#!/usr/bin/env python3
"""
Merge base questions (from gen_questions.py output) with supplemental questions
and generate the final gameQuestions.ts
"""
import json
from collections import Counter

# Read the current TS file's questions by re-running the first generator logic
# Instead, let's just re-generate everything by importing the original data

# The current gameQuestions.ts has the base 356 questions
# The supplemental.json has 327 more

# Let's parse the existing TS file to get question IDs and add new ones
import re

existing_ids = set()
with open("/home/z/my-project/src/lib/gameQuestions.ts", "r") as f:
    content = f.read()
    for match in re.finditer(r"id: '([^']+)'", content):
        existing_ids.add(match.group(1))

print(f"Found {len(existing_ids)} existing question IDs")

# Load supplemental
with open("/home/z/my-project/scripts/supplemental.json", "r") as f:
    supplemental = json.load(f)

# Filter out any duplicates by ID
new_questions = [q for q in supplemental if q['id'] not in existing_ids]
print(f"Adding {len(new_questions)} new supplemental questions")

# Now we need to insert these into the TS file
# Parse the existing Q array and add new questions before the closing ];
# Better approach: re-generate the whole file

# Let's read all existing questions from the TS file
existing_questions = []
# Parse the TS file to extract question objects
# This is complex, so let's use the fact that gen_questions.py can be re-run
# and just concatenate

# Simpler approach: read the TS, find the Q array end, insert new questions
def escape_for_ts(s):
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')

# Build supplemental TS lines
supplemental_lines = []
prev_game = None
prev_lang = None

for qq in new_questions:
    game = qq['game']
    lang = qq['language']
    diff = qq['difficulty']
    
    if game != prev_game or lang != prev_lang:
        supplemental_lines.append(f"  // ═══════════════════════════════════════════")
        supplemental_lines.append(f"  // {game.upper()} — {lang.upper()}")
        supplemental_lines.append(f"  // ═══════════════════════════════════════════")
        prev_game = game
        prev_lang = lang
    
    supplemental_lines.append(f"  // {diff.capitalize()}")
    
    code_esc = qq['code'].replace("'", "\\'").replace('\n', '\\n')
    opts_parts = []
    for o in qq['options']:
        opts_parts.append(f"'{escape_for_ts(o)}'")
    opts_str = "[" + ", ".join(opts_parts) + "]"
    
    supplemental_lines.append(f"  {{ id: '{qq['id']}', game: '{game}', language: '{lang}', difficulty: '{diff}',")
    supplemental_lines.append(f"    code: '{code_esc}',")
    supplemental_lines.append(f"    options: {opts_str},")
    supplemental_lines.append(f"    correctIndex: {qq['correctIndex']}, explanation: '{escape_for_ts(qq['explanation'])}' }},")
    supplemental_lines.append("")

# Insert before the closing of Q array
insert_marker = "];\n\nexport function getShuffledQuestions"
idx = content.find(insert_marker)
if idx == -1:
    print("ERROR: Could not find insertion point!")
    exit(1)

# Find the last question entry before ];
# Insert supplemental questions before the closing ];
# Find "];" that closes Q array
# Actually, let's find the exact pattern
q_close = content.find("\n];\n", content.find("const Q: GameQuestion[] = ["))
if q_close == -1:
    print("ERROR: Could not find Q array close!")
    exit(1)

# Insert before ];
new_content = content[:q_close] + "\n" + "\n".join(supplemental_lines) + content[q_close:]

with open("/home/z/my-project/src/lib/gameQuestions.ts", "w") as f:
    f.write(new_content)

# Count final questions
final_count = len(existing_ids) + len(new_questions)
print(f"Written {final_count} total questions to gameQuestions.ts")

# Count per category
cat_counts = Counter()
for qid in existing_ids:
    # Parse game/lang/diff from ID pattern
    pass  # We'll count from file instead

# Quick count via regex
for match in re.finditer(r"game: '([^']+)', language: '([^']+)', difficulty: '([^']+)'", new_content):
    cat_counts[(match.group(1), match.group(2), match.group(3))] += 1

print("\n=== Final question counts ===")
GAMES = ['bug-hunter', 'whats-output', 'code-completion']
LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'css', 'html']
DIFFICULTIES = ['easy', 'medium', 'hard']
total = 0
for game in GAMES:
    for lang in LANGUAGES:
        for diff in DIFFICULTIES:
            c = cat_counts.get((game, lang, diff), 0)
            if c > 0:
                print(f"  {game} / {lang} / {diff}: {c}")
                total += c
            else:
                print(f"  {game} / {lang} / {diff}: 0 ⚠️")

print(f"\nTotal: {total}")
