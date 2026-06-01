#!/usr/bin/env python3
"""
Clean up gameQuestions.ts by removing low-quality template questions.
Identifies and removes:
1. Lazy arithmetic templates (x=N, y=M, print(x OP y) patterns)
2. Questions with CSS filler options ("Add !important", "Remove the line", "Change selector")
3. Questions with scraped HTML artifacts in explanations
4. Highly repetitive "Replace X with Y" patterns

Strategy: Remove bad questions, keep good ones. Arrays will be smaller but higher quality.
"""

import re
import sys

FILE_PATH = '/home/z/my-project/src/lib/gameQuestions.ts'

# Patterns that indicate lazy arithmetic templates
LAZY_ARITH_PATTERNS = [
    r'let x = \d+;\s*let y = \d+;',
    r'int x = \d+;\s*int y = \d+;',
    r'x = \d+\s*\n\s*y = \d+',
    r'console\.log\(\d+\s*[+\-*/%]\s*\d+\)',
    r'System\.out\.println\(\d+\s*[+\-*/%]\s*\d+\)',
    r'cout\s*<<\s*\d+\s*[+\-*/%]\s*\d+',
    r'print\(\d+\s*[+\-*/%]\s*\d+\)',
    r'console\.log\(x\s*[+\-*/%]\s*y\)',
    r'System\.out\.println\(x\s*[+\-*/%]\s*y\)',
    r'cout\s*<<\s*x\s*[+\-*/%]\s*y',
    r'print\(x\s*[+\-*/%]\s*y\)',
    # Pattern for questions with IDs in the 90xxx range (bulk generated)
]

# Options that indicate CSS filler (non-sensical for non-CSS questions)
FILLER_OPTIONS = [
    "Add !important",
    "Remove the line",
    "Change selector",
    "Change the selector",
    "Remove the property",
    "Add a semicolon",
    "Add a closing tag",
]

# Explanation patterns that indicate scraped content
SCRAPE_PATTERNS = [
    r'<div align=',
    r'back to top',
    r'Back to Top',
    r'```javascript',
    r'```java',
    r'```python',
    r'```css',
    r'```html',
]

def is_lazy_arithmetic(code, options):
    """Check if a question is a lazy arithmetic template."""
    # Check for simple x=N, y=M patterns
    for pattern in LAZY_ARITH_PATTERNS:
        if re.search(pattern, code):
            # Also check if options are just numbers (another sign of lazy templates)
            all_numeric = all(re.match(r'^-?\d+(\.\d+)?$', opt.strip()) or opt.strip() == 'Error' or opt.strip() == 'NaN' for opt in options)
            if all_numeric:
                return True
    return False

def has_filler_options(options):
    """Check if options contain CSS filler that doesn't belong."""
    for opt in options:
        for filler in FILLER_OPTIONS:
            if filler.lower() in opt.lower():
                return True
    return False

def has_scraped_content(explanation):
    """Check if explanation contains scraped HTML artifacts."""
    for pattern in SCRAPE_PATTERNS:
        if re.search(pattern, explanation, re.IGNORECASE):
            return True
    return False

def is_repetitive_replace(options, correct_index):
    """Check if the correct option is a repetitive 'Replace X with Y' pattern."""
    if correct_index < len(options):
        correct = options[correct_index]
        if correct.startswith('Replace '):
            # Common repetitive patterns
            repetitive = [
                'Replace var with const',
                'Replace var with let',
                'Replace func with function',
                'Replace func with def',
                'Replace Private with public',
                'Replace Static with static',
                'Replace Void with void',
                'Replace require with import',
                'Replace let with const',
            ]
            for rep in repetitive:
                if rep in correct:
                    return True
    return False

def process_file():
    """Read, analyze, and clean the gameQuestions.ts file."""
    with open(FILE_PATH, 'r') as f:
        content = f.read()
    
    lines = content.split('\n')
    total_lines = len(lines)
    
    # Track statistics
    stats = {
        'total_questions': 0,
        'lazy_arith_removed': 0,
        'filler_options_removed': 0,
        'scraped_content_removed': 0,
        'repetitive_removed': 0,
        'kept': 0,
        'removed': 0,
        'by_array': {},
    }
    
    # Parse the file - find array boundaries and question objects
    # We need to identify each question object and its parent array
    
    current_array = None
    array_start_line = None
    in_question = False
    question_start = None
    question_data = {}
    brace_depth = 0
    
    questions_to_remove = set()  # (start_line, end_line) tuples
    
    i = 0
    while i < total_lines:
        line = lines[i]
        stripped = line.strip()
        
        # Detect array declaration
        array_match = re.match(r'^const\s+(Q_\w+)\s*:\s*GameQuestion\[\]\s*=\s*\[', stripped)
        if array_match:
            current_array = array_match.group(1)
            array_start_line = i
            stats['by_array'][current_array] = {'total': 0, 'removed': 0, 'kept': 0}
            i += 1
            continue
        
        # Detect array end
        if stripped == '];' and current_array:
            current_array = None
            i += 1
            continue
        
        # Detect start of a question object
        if current_array and stripped.startswith('{ id:'):
            question_start = i
            question_data = {'lines': [], 'code': '', 'options': '', 'explanation': '', 'correctIndex': -1}
            brace_depth = 0
            in_question = True
        
        if in_question:
            question_data['lines'].append(i)
            brace_depth += stripped.count('{') - stripped.count('}')
            
            # Extract fields
            code_match = re.match(r"\s*code:\s*['\"](.+?)['\"],?\s*$", stripped)
            if code_match:
                question_data['code'] = code_match.group(1)
            
            options_match = re.match(r"\s*options:\s*\[(.+?)\],?\s*$", stripped)
            if options_match:
                question_data['options'] = options_match.group(1)
            
            correct_match = re.match(r"\s*correctIndex:\s*(\d+)", stripped)
            if correct_match:
                question_data['correctIndex'] = int(correct_match.group(1))
            
            explanation_match = re.match(r"\s*explanation:\s*['\"](.+?)['\"]\s*}", stripped)
            if explanation_match:
                question_data['explanation'] = explanation_match.group(1)
            
            # End of question object
            if brace_depth <= 0:
                in_question = False
                stats['total_questions'] += 1
                if current_array:
                    stats['by_array'][current_array]['total'] += 1
                
                # Now evaluate this question
                should_remove = False
                reason = ''
                
                code = question_data.get('code', '')
                options_str = question_data.get('options', '')
                explanation = question_data.get('explanation', '')
                correct_index = question_data.get('correctIndex', 0)
                
                # Parse options
                try:
                    options = re.findall(r"['\"](.+?)['\"]", options_str)
                except:
                    options = []
                
                # Check for lazy arithmetic
                if is_lazy_arithmetic(code, options):
                    should_remove = True
                    reason = 'lazy_arith'
                    stats['lazy_arith_removed'] += 1
                
                # Check for filler options
                elif has_filler_options(options):
                    should_remove = True
                    reason = 'filler_options'
                    stats['filler_options_removed'] += 1
                
                # Check for scraped content
                elif has_scraped_content(explanation):
                    should_remove = True
                    reason = 'scraped_content'
                    stats['scraped_content_removed'] += 1
                
                # Check for repetitive replace patterns
                elif is_repetitive_replace(options, correct_index):
                    should_remove = True
                    reason = 'repetitive'
                    stats['repetitive_removed'] += 1
                
                if should_remove:
                    # Mark lines for removal (including the comma/whitespace before/after)
                    for line_num in question_data['lines']:
                        questions_to_remove.add(line_num)
                    stats['removed'] += 1
                    if current_array:
                        stats['by_array'][current_array]['removed'] += 1
                else:
                    stats['kept'] += 1
                    if current_array:
                        stats['by_array'][current_array]['kept'] += 1
        
        i += 1
    
    # Print stats
    print("=" * 60)
    print("GAME QUESTIONS CLEANUP REPORT")
    print("=" * 60)
    print(f"\nTotal questions analyzed: {stats['total_questions']}")
    print(f"Questions to keep: {stats['kept']}")
    print(f"Questions to remove: {stats['removed']}")
    print(f"\nRemoval reasons:")
    print(f"  Lazy arithmetic templates: {stats['lazy_arith_removed']}")
    print(f"  CSS filler options: {stats['filler_options_removed']}")
    print(f"  Scraped content: {stats['scraped_content_removed']}")
    print(f"  Repetitive patterns: {stats['repetitive_removed']}")
    
    print(f"\n{'Array':<20} {'Total':>6} {'Removed':>8} {'Kept':>6} {'% Bad':>7}")
    print("-" * 50)
    for array_name, data in sorted(stats['by_array'].items()):
        pct = (data['removed'] / data['total'] * 100) if data['total'] > 0 else 0
        print(f"{array_name:<20} {data['total']:>6} {data['removed']:>8} {data['kept']:>6} {pct:>6.1f}%")
    
    return stats, questions_to_remove

if __name__ == '__main__':
    stats, to_remove = process_file()
    print(f"\n{len(to_remove)} lines would be removed")
    print("Run with --apply to actually modify the file")
