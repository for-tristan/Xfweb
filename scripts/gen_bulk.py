#!/usr/bin/env python3
"""
Bulk generate questions to fill all categories to ~100 each.
Uses template-based generation with many variations.
"""
import json, random
from collections import Counter

TARGET = 100
counter = 50000

def nid(prefix):
    global counter
    counter += 1
    return f"{prefix}{counter}"

def q(id, game, lang, diff, code, options, correct, explanation):
    return {"id": id, "game": game, "language": lang, "difficulty": diff,
            "code": code, "options": options, "correctIndex": correct, "explanation": explanation}

# Read current counts from the TS file
import re
with open("/home/z/my-project/src/lib/gameQuestions.ts", "r") as f:
    content = f.read()

cat_counts = Counter()
for match in re.finditer(r"game: '([^']+)', language: '([^']+)', difficulty: '([^']+)'", content):
    cat_counts[(match.group(1), match.group(2), match.group(3))] += 1

existing_ids = set()
for match in re.finditer(r"id: '([^']+)'", content):
    existing_ids.add(match.group(1))

GAMES = ['bug-hunter', 'whats-output', 'code-completion']
LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'css', 'html']
DIFFICULTIES = ['easy', 'medium', 'hard']

bulk = []

# ═══════════════════════════════════════════════
# PYTHON BUG HUNTER — fill with varied bug patterns
# ═══════════════════════════════════════════════

def fill_category(game, lang, diff, needed, questions_list):
    """Fill a category with generated questions"""
    prefix_map = {'bug-hunter': 'bh', 'whats-output': 'wo', 'code-completion': 'cc'}
    lang_map = {'python': 'py', 'javascript': 'js', 'java': 'ja', 'cpp': 'cp', 'css': 'cs', 'html': 'ht'}
    prefix = f"{prefix_map[game]}-{lang_map[lang]}-{diff[0]}"
    
    # Use language-specific templates
    if game == 'bug-hunter':
        fill_bh(lang, diff, needed, prefix, questions_list)
    elif game == 'whats-output':
        fill_wo(lang, diff, needed, prefix, questions_list)
    elif game == 'code-completion':
        fill_cc(lang, diff, needed, prefix, questions_list)

def fill_bh(lang, diff, needed, prefix, ql):
    """Fill bug-hunter questions"""
    if lang == 'python':
        fill_bh_python(diff, needed, prefix, ql)
    elif lang == 'javascript':
        fill_bh_js(diff, needed, prefix, ql)
    elif lang == 'java':
        fill_bh_java(diff, needed, prefix, ql)
    elif lang == 'cpp':
        fill_bh_cpp(diff, needed, prefix, ql)
    elif lang == 'css':
        fill_bh_css(diff, needed, prefix, ql)
    elif lang == 'html':
        fill_bh_html(diff, needed, prefix, ql)

def fill_bh_python(diff, needed, prefix, ql):
    # Generate varied bug patterns
    if diff == 'easy':
        # Variable name typos
        vars_list = ['count','total','result','name','value','data','items','num','score','level',
                     'index','temp','base','start','end','size','age','price','rate','count',
                     'user','text','word','key','item','flag','mode','step','sign','type',
                     'input','output','offset','width','height','depth','range','limit','threshold','peak']
        for i in range(min(needed, len(vars_list))):
            v = vars_list[i]
            typo = v[:-1] + random.choice('xsqz') if len(v) > 2 else v + random.choice('es')
            ql.append(q(nid(prefix), 'bug-hunter', 'python', 'easy',
                f'{v} = {random.choice(["42", '"hello"', "3.14", "True", "[1,2]", "0"])}\nprint({typo})',
                [f'print({v})', f'Fix the typo in the variable name', f'Declare {typo} first', f'Use globals()'],
                0, f'Variable is "{v}" but the code uses "{typo}" — a typo causing NameError.'))
        
        # Missing colons on various statements
        stmts = [
            ('if x > 0', 'if x > 0:'),
            ('for i in range(10)', 'for i in range(10):'),
            ('while True', 'while True:'),
            ('def hello()', 'def hello():'),
            ('class Dog', 'class Dog:'),
            ('if name == "Alice"', 'if name == "Alice":'),
            ('for char in text', 'for char in text:'),
            ('while count < 10', 'while count < 10:'),
            ('def add(a, b)', 'def add(a, b):'),
            ('if not found', 'if not found:'),
            ('for item in data', 'for item in data:'),
            ('while running', 'while running:'),
            ('def process(input)', 'def process(input):'),
            ('if x != 0', 'if x != 0:'),
            ('class Config', 'class Config:'),
        ]
        for i in range(min(needed - len(ql), len(stmts))):
            wrong, right = stmts[i]
            ql.append(q(nid(prefix), 'bug-hunter', 'python', 'easy',
                f'{wrong}\n    print("body")',
                [f'{right}', f'Add semicolon', f'Add bracket', f'Use curly braces'],
                0, f'Python compound statements require a colon. Change to: {right}'))
    
    elif diff == 'medium':
        patterns = [
            ('def get_value(d, key):\n    return d[key]\n\nresult = get_value({"a": 1}, "b")', 
             ['Use d.get(key) or check key existence', 'The code is correct', 'Use d.find(key)', 'Use d.pop(key)'],
             0, 'Accessing missing key raises KeyError. Use .get() or check with "in".'),
            ('class Config:\n    settings = {}\n    def set(self, key, value):\n        self.settings[key] = value',
             ['settings should be initialized in __init__', 'The code is correct', 'Use class method', 'Use @staticmethod'],
             0, 'settings is a class variable shared by all instances.'),
            ('def process(items):\n    for item in items:\n        if item is not None:\n            result = item.upper()\n    return result',
             ['result undefined if all items are None — initialize result before loop', 'The code is correct', 'Use else clause', 'Add try/except'],
             0, 'If all items are None, result is never assigned. Initialize it before the loop.'),
            ('def add_to_list(item, lst=[]):\n    lst.append(item)\n    return lst',
             ['Use lst=None and initialize inside: if lst is None: lst = []', 'The code is correct', 'Use tuple instead', 'Use lst = list()'],
             0, 'Mutable default argument is shared across calls. Use None as default.'),
            ('def read_data(path):\n    f = open(path)\n    data = f.read()\n    return data',
             ['Use with open(path) as f: to ensure file is closed', 'The code is correct', 'Add f.close() before return', 'Both A and C'],
             3, 'File may not be closed if error occurs. Use with statement or f.close().'),
            ('class User:\n    def __init__(self, name):\n        name = name\n    def greet(self):\n        return f"Hello {self.name}"',
             ['Use self.name = name in __init__', 'The code is correct', 'Use class variable', 'Use @property'],
             0, 'name = name assigns parameter to itself (shadowing). Use self.name = name.'),
            ('def split_and_sum(s):\n    parts = s.split(",")\n    return sum(parts)',
             ['Convert to int: sum(int(p) for p in parts)', 'The code is correct', 'Use sum(parts, 0)', 'Use map(sum, parts)'],
             0, 'split() returns strings. sum() fails on strings. Convert each to int first.'),
            ('data = [1, None, 3, None, 5]\ncleaned = [x for x in data if x]',
             ['This removes both None and 0 — use "if x is not None"', 'The code is correct', 'Use filter(None, data)', 'Use data.remove(None)'],
             0, 'if x filters out falsy values (0, False, ""). Use "if x is not None" for None only.'),
            ('def safe_div(a, b):\n    try:\n        return a / b\n    except:\n        return 0',
             ['Catch specific: except ZeroDivisionError:', 'The code is correct', 'Add finally clause', 'Use if b == 0 instead'],
             0, 'Bare except catches everything including KeyboardInterrupt. Be specific.'),
            ('class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, item):\n        self.items.append(item)\n    def pop(self):\n        return self.items.pop()',
             ['Add check: if not self.items: raise IndexError("empty stack")', 'The code is correct', 'Use deque instead', 'Add peek method'],
             0, 'pop() on empty list raises IndexError with unclear message. Add bounds check.'),
        ]
        for i in range(min(needed, len(patterns))):
            code, opts, ci, expl = patterns[i]
            ql.append(q(nid(prefix), 'bug-hunter', 'python', 'medium', code, opts, ci, expl))
        
        # Generate more medium patterns with variations
        funcs = ['calculate', 'process', 'transform', 'validate', 'handle', 'compute', 'analyze', 'format', 'convert', 'extract']
        for i in range(needed - len(ql)):
            fn = funcs[i % len(funcs)]
            bug_type = i % 5
            if bug_type == 0:  # mutable default
                ql.append(q(nid(prefix), 'bug-hunter', 'python', 'medium',
                    f'def {fn}(data, result=[]):\n    result.append(data)\n    return result',
                    [f'Use result=None, then if result is None: result = []', 'The code is correct', 'Use tuple for result', 'Use copy()'],
                    0, 'Mutable default argument persists between calls. Use None and initialize inside.'))
            elif bug_type == 1:  # reference vs copy
                ql.append(q(nid(prefix), 'bug-hunter', 'python', 'medium',
                    f'def {fn}(items):\n    output = items\n    output.append("processed")\n    return output',
                    [f'output = items.copy() or output = list(items)', 'The code is correct', f'Use output = items[:]', 'Both A and C'],
                    3, 'output = items creates a reference. Modifying it modifies the original.'))
            elif bug_type == 2:  # missing return
                ql.append(q(nid(prefix), 'bug-hunter', 'python', 'medium',
                    f'def {fn}(value):\n    if value > 0:\n        return True\n    if value < 0:\n        return False',
                    [f'Add: return None at the end for value == 0', 'The code is correct', f'Use else clause', 'Add default return 0'],
                    0, 'No return for value == 0. Function returns None implicitly.'))
            elif bug_type == 3:  # class var shared
                ql.append(q(nid(prefix), 'bug-hunter', 'python', 'medium',
                    f'class {fn.capitalize()}r:\n    cache = {{}}\n    def store(self, key, val):\n        self.cache[key] = val',
                    [f'Initialize cache in __init__ as instance variable', 'The code is correct', f'Use @classmethod', 'Use global cache'],
                    0, 'cache is a class variable shared by all instances. Initialize in __init__.'))
            else:  # bare except
                ql.append(q(nid(prefix), 'bug-hunter', 'python', 'medium',
                    f'def {fn}(data):\n    try:\n        return int(data)\n    except:\n        return 0',
                    [f'except ValueError:', 'The code is correct', f'Add except TypeError too', 'Use isdigit() check'],
                    0, 'Bare except catches all exceptions. Use except ValueError: for int() conversion.'))

    elif diff == 'hard':
        hard_patterns = [
            ('class Singleton:\n    _instance = None\n    def __new__(cls):\n        if not cls._instance:\n            cls._instance = super().__new__(cls)\n        return cls._instance',
             ['Not thread-safe — add threading.Lock in __new__', 'The code is correct', 'Use module-level instance', 'Use @classmethod'],
             0, 'Two threads could both check _instance simultaneously. Add a Lock.'),
            ('import threading\n\nclass SharedResource:\n    def __init__(self):\n        self.value = 0\n        self.lock = threading.Lock()\n    \n    def increment(self):\n        self.value += 1',
             ['Use self.lock: with self.lock: self.value += 1', 'The code is correct', 'Use multiprocessing.Value', 'Use asyncio.Lock'],
             0, 'increment is not atomic despite having a lock. Must use with self.lock:.'),
            ('def deep_copy(obj):\n    if isinstance(obj, dict):\n        return {k: deep_copy(v) for k, v in obj.items()}\n    elif isinstance(obj, list):\n        return [deep_copy(i) for i in obj]\n    return obj',
             ['Missing handling for set, tuple, and custom objects — use copy.deepcopy()', 'The code is correct', 'Add set and tuple handling', 'Use json serialization'],
             0, 'Only handles dict/list. Sets become dicts, tuples become lists. Use copy.deepcopy().'),
            ('class Observable:\n    _observers = []\n    def subscribe(self, callback):\n        self._observers.append(callback)\n    def notify(self, event):\n        for cb in self._observers:\n            cb(event)',
             ['_observers is class-level — make instance-level, add unsubscribe, use weak refs', 'The code is correct', 'Use asyncio', 'Use signals'],
             0, 'Class-level observers shared across instances. Also no unsubscribe or error isolation.'),
            ('from functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)',
             ['lru_cache with maxsize=None can cause memory leak for large n', 'The code is correct', 'Use iterative approach', 'Set maxsize=128'],
             0, 'Unbounded cache grows forever. Set maxsize or use iterative approach for large inputs.'),
        ]
        for i in range(min(needed, len(hard_patterns))):
            code, opts, ci, expl = hard_patterns[i]
            ql.append(q(nid(prefix), 'bug-hunter', 'python', 'hard', code, opts, ci, expl))
        
        # Generate more hard patterns
        for i in range(needed - len(ql)):
            bug_type = i % 4
            if bug_type == 0:
                ql.append(q(nid(prefix), 'bug-hunter', 'python', 'hard',
                    'import threading\n\nclass AsyncSafe:\n    def __init__(self):\n        self.data = {}\n    def update(self, key, value):\n        self.data[key] = value',
                    ['Add threading.Lock and use with lock: for all data access', 'The code is correct', 'Use multiprocessing.Manager', 'Use asyncio'],
                    0, 'Dict access is not thread-safe. Multiple threads updating can corrupt data.'))
            elif bug_type == 1:
                ql.append(q(nid(prefix), 'bug-hunter', 'python', 'hard',
                    'def curry(fn):\n    def curried(*args):\n        if len(args) >= fn.__code__.co_argcount:\n            return fn(*args)\n        return lambda *more: curried(*(args + more))\n    return curried',
                    ['Works for simple cases but fails with *args/**kwargs in fn signature', 'The code is correct', 'Use functools.partial', 'Use inspect.signature'],
                    0, "co_argcount doesn't account for *args/**kwargs. Use inspect.signature() for robustness."))
            elif bug_type == 2:
                ql.append(q(nid(prefix), 'bug-hunter', 'python', 'hard',
                    'class Descriptor:\n    def __set_name__(self, owner, name):\n        self.name = name\n    def __get__(self, obj, objtype=None):\n        return getattr(obj, f"_{self.name}", None)\n    def __set__(self, obj, value):\n        setattr(obj, f"_{self.name}", value)',
                    ['Works but uses name mangling risk — getattr can conflict with existing attrs', 'The code is correct', 'Use __dict__ directly', 'Use property instead'],
                    0, 'The _name pattern can conflict. Consider using a separate storage dict on the owner class.')
            else:
                ql.append(q(nid(prefix), 'bug-hunter', 'python', 'hard',
                    'def retry(func, max_retries=3, delay=1):\n    for attempt in range(max_retries):\n        try:\n            return func()\n        except Exception as e:\n            if attempt == max_retries - 1:\n                raise e\n            time.sleep(delay)',
                    ['Add exponential backoff: time.sleep(delay * (2 ** attempt))', 'The code is correct', 'Use recursive retry', 'Use ten library'],
                    0, 'Fixed delay retry hammers failing service. Add exponential backoff.'))

def fill_bh_js(diff, needed, prefix, ql):
    if diff == 'easy':
        patterns = [
            ('console.log(typeof [])', ['"object"', '"array"', '"list"', '"undefined"'], 0, 'Arrays are objects in JS.'),
            ('console.log(typeof NaN)', ['"number"', '"NaN"', '"undefined"', '"object"'], 0, 'NaN is technically a number type.'),
            ('console.log(null == undefined)', ['true', 'false', 'Error', 'null'], 0, 'null and undefined are loosely equal.'),
            ('console.log(null === undefined)', ['false', 'true', 'Error', 'null'], 0, 'Strict equality checks type. Different types.'),
            ('console.log("" == false)', ['true', 'false', 'Error', 'undefined'], 0, 'Empty string coerces to 0. 0 == 0 is true.'),
            ('console.log(0 == false)', ['true', 'false', 'Error', 'undefined'], 0, '0 and false both coerce to 0.'),
            ('console.log("1" == 1)', ['true', 'false', 'Error', '"1"'], 0, 'Loose equality coerces types.'),
            ('console.log("1" === 1)', ['false', 'true', 'Error', '"1"'], 0, 'Strict equality checks type AND value.'),
            ('console.log(typeof function(){})', ['"function"', '"object"', '"undefined"', '"class"'], 0, 'Functions are typeof "function".'),
            ('console.log(typeof class {})', ['"function"', '"class"', '"object"', '"undefined"'], 0, 'Classes are syntactic sugar over functions.'),
            ('console.log([] == ![])', ['true', 'false', 'Error', 'undefined'], 0, 'Both sides coerce to 0. 0 == 0.'),
            ('console.log(+true)', ['1', 'true', 'NaN', 'Error'], 0, 'Unary plus converts true to 1.'),
            ('console.log(+false)', ['0', 'false', 'NaN', 'Error'], 0, 'Unary plus converts false to 0.'),
            ('console.log(+""+ 0)', ['0', '""', 'NaN', 'Error'], 0, 'Unary plus on empty string is 0.'),
            ('console.log("b"+"a"+ +"a"+"a")', ['"baNaNa"', '"baaa"', '"ba0a"', 'Error'], 0, '+\"a\" is NaN. \"ba\"+NaN+\"a\" = \"baNaNa\".'),
        ]
        for i in range(min(needed, len(patterns))):
            code, opts, ci, expl = patterns[i]
            ql.append(q(nid(prefix), 'bug-hunter', 'javascript', 'easy', code, opts, ci, expl))
        # Generate more
        for i in range(needed - len(ql)):
            x = random.randint(1, 20)
            y = random.randint(1, 20)
            op = random.choice(['+', '-', '*', '%'])
            expected = eval(f"{x}{op}{y}")
            ql.append(q(nid(prefix), 'bug-hunter', 'javascript', 'easy',
                f'console.log({x} {op} {y});',
                [str(expected), str(expected + 1), str(expected - 1), 'NaN'],
                0, f'{x} {op} {y} = {expected}.'))

def fill_bh_java(diff, needed, prefix, ql):
    if diff == 'easy':
        ops = [
            ('System.out.println(5 + 5);', ['10', '"55"', '55', 'Error'], 0, 'Integer addition.'),
            ('System.out.println("5" + 5);', ['"55"', '10', '"5+5"', 'Error'], 0, 'String + int concatenates.'),
            ('System.out.println(5 > 3);', ['true', 'false', '1', 'Error'], 0, '5 is greater than 3.'),
            ('System.out.println(5 == 5);', ['true', 'false', '1', 'Error'], 0, '5 equals 5.'),
            ('System.out.println(!true);', ['false', 'true', 'Error', 'null'], 0, '! negates: !true = false.'),
            ('System.out.println(10 > 5 && 3 > 1);', ['true', 'false', 'Error', 'null'], 0, 'Both conditions true, && returns true.'),
            ('System.out.println(10 > 5 || 3 < 1);', ['true', 'false', 'Error', 'null'], 0, 'First condition true, || returns true.'),
            ('System.out.println("hello".length());', ['5', '6', '4', 'Error'], 0, '"hello" has 5 characters.'),
            ('System.out.println("hello".charAt(1));', ['"e"', '"h"', '"l"', 'Error'], 0, 'charAt(1) returns second character.'),
            ('System.out.println("hello".substring(1,3));', ['"el"', '"he"', '"ell"', '"l"'], 0, 'substring(1,3) returns chars at index 1-2.'),
            ('System.out.println("hello".toUpperCase());', ['"HELLO"', '"hello"', '"Hello"', 'Error'], 0, 'toUpperCase() converts all letters.'),
            ('System.out.println("  hello  ".trim());', ['"hello"', '"  hello  "', '" hello "', 'Error'], 0, 'trim() removes whitespace.'),
            ('System.out.println("hello".contains("ell"));', ['true', 'false', 'Error', 'null'], 0, 'contains() checks substring.'),
            ('System.out.println("hello".indexOf("l"));', ['2', '3', '1', '-1'], 0, 'indexOf() returns first position.'),
            ('System.out.println("hello".replace("l", "r"));', ['"herro"', '"herlo"', '"hello"', 'Error'], 0, 'replace() replaces all occurrences.'),
        ]
        for i in range(min(needed, len(ops))):
            code, opts, ci, expl = ops[i]
            ql.append(q(nid(prefix), 'bug-hunter', 'java', 'easy', code, opts, ci, expl))
        for i in range(needed - len(ql)):
            x = random.randint(2, 20)
            y = random.randint(2, 20)
            expected = x + y
            ql.append(q(nid(prefix), 'bug-hunter', 'java', 'easy',
                f'System.out.println({x} + {y});',
                [str(expected), str(expected - 1), str(expected + 1), 'Error'],
                0, f'{x} + {y} = {expected}.'))

def fill_bh_cpp(diff, needed, prefix, ql):
    if diff == 'easy':
        ops = [
            ('cout << 5 + 3;', ['8', '53', 'Error', '5+3'], 0, 'Integer addition.'),
            ('cout << 10 / 3;', ['3', '3.33', '4', 'Error'], 0, 'Integer division truncates.'),
            ('cout << 10 % 3;', ['1', '3', '0', 'Error'], 0, '10 % 3 = 1 (remainder).'),
            ('cout << (5 > 3);', ['1', 'true', '0', 'Error'], 0, 'Boolean prints as 1 by default.'),
            ('cout << !true;', ['0', '1', 'false', 'Error'], 0, '!true = false, prints as 0.'),
            ('cout << (3 != 5);', ['1', '0', 'true', 'Error'], 0, '3 != 5 is true, prints as 1.'),
            ('cout << (3 == 3);', ['1', '0', 'true', 'Error'], 0, '3 == 3 is true, prints as 1.'),
            ('cout << sizeof(int);', ['4', '2', '8', '1'], 0, 'sizeof(int) is typically 4 bytes.'),
            ('cout << sizeof(double);', ['8', '4', '16', '2'], 0, 'sizeof(double) is typically 8 bytes.'),
            ('cout << sizeof(char);', ['1', '2', '4', '8'], 0, 'sizeof(char) is always 1.'),
        ]
        for i in range(min(needed, len(ops))):
            code, opts, ci, expl = ops[i]
            ql.append(q(nid(prefix), 'bug-hunter', 'cpp', 'easy', code, opts, ci, expl))
        for i in range(needed - len(ql)):
            x = random.randint(2, 20)
            y = random.randint(2, 10)
            expected = x * y
            ql.append(q(nid(prefix), 'bug-hunter', 'cpp', 'easy',
                f'cout << {x} * {y};',
                [str(expected), str(expected + 1), str(expected - 1), 'Error'],
                0, f'{x} * {y} = {expected}.'))

def fill_bh_css(diff, needed, prefix, ql):
    if diff == 'easy':
        props = [
            ('.box {\n  display: ____;\n}', ['block', 'none', 'auto', 'normal'], 0, 'display: block makes element a block-level box.'),
            ('.text {\n  color: ____;\n}', ['red', '0', 'none', 'auto'], 0, 'color property accepts named colors.'),
            ('.box {\n  margin: 10px;\n}', ['This code is correct', 'Missing unit', 'Use padding instead', 'Error'], 0, 'margin with px unit is valid CSS.'),
            ('.box {\n  font-size: ____px;\n}', ['16', '16.0', '16rem', 'auto'], 0, 'font-size accepts pixel values.'),
            ('.hidden {\n  display: ____;\n}', ['none', 'hidden', 'invisible', 'off'], 0, 'display: none hides the element.'),
            ('.bold {\n  font-weight: ____;\n}', ['bold', 'bolder', 'strong', 'heavy'], 0, 'font-weight: bold makes text bold.'),
            ('.center {\n  text-align: ____;\n}', ['center', 'middle', 'justify', 'auto'], 0, 'text-align: center centers inline content.'),
            ('.link {\n  text-decoration: ____;\n}', ['none', 'invisible', 'hide', 'off'], 0, 'text-decoration: none removes underline.'),
            ('.box {\n  border: 1px ____ black;\n}', ['solid', 'line', 'normal', 'straight'], 0, 'border-style values include solid, dashed, dotted.'),
            ('.bg {\n  background-color: ____;\n}', ['#ffffff', 'white', 'rgb(255,255,255)', 'All of the above'], 3, 'CSS accepts multiple color formats.'),
        ]
        for i in range(min(needed, len(props))):
            code, opts, ci, expl = props[i]
            ql.append(q(nid(prefix), 'bug-hunter', 'css', 'easy', code, opts, ci, expl))

def fill_bh_html(diff, needed, prefix, ql):
    if diff == 'easy':
        tags = [
            ('<____>Title</____>', ['h1', 'title', 'heading', 'header'], 0, '<h1> is the top-level heading element.'),
            ('<____>Paragraph text</____>', ['p', 'text', 'para', 'div'], 0, '<p> defines a paragraph.'),
            ('<____ href="url">Link</____>', ['a', 'link', 'url', 'href'], 0, '<a> creates hyperlinks.'),
            ('<____ src="img.jpg" alt="photo">', ['img', 'image', 'picture', 'photo'], 0, '<img> embeds images.'),
            ('<____>Item</____>', ['li', 'item', 'list', 'entry'], 0, '<li> defines list items.'),
            ('<____>Click me</____>', ['button', 'btn', 'click', 'input'], 0, '<button> creates buttons.'),
            ('<____ type="text" name="field">', ['input', 'field', 'text', 'form'], 0, '<input> creates form inputs.'),
            ('<____>Text area content</____>', ['textarea', 'text', 'area', 'input'], 0, '<textarea> creates multi-line text input.'),
            ('<____ action="/submit">', ['form', 'submit', 'data', 'input'], 0, '<form> creates submission forms.'),
            ('<____>Navigation</____>', ['nav', 'navigation', 'menu', 'links'], 0, '<nav> defines navigation sections.'),
        ]
        for i in range(min(needed, len(tags))):
            code, opts, ci, expl = tags[i]
            ql.append(q(nid(prefix), 'bug-hunter', 'html', 'easy', code, opts, ci, expl))

def fill_wo(lang, diff, needed, prefix, ql):
    """Fill whats-output questions"""
    if lang == 'python':
        fill_wo_python(diff, needed, prefix, ql)
    elif lang == 'javascript':
        fill_wo_js(diff, needed, prefix, ql)
    elif lang == 'java':
        fill_wo_java(diff, needed, prefix, ql)
    elif lang == 'cpp':
        fill_wo_cpp(diff, needed, prefix, ql)
    elif lang == 'css':
        fill_wo_css(diff, needed, prefix, ql)
    elif lang == 'html':
        fill_wo_html(diff, needed, prefix, ql)

def fill_wo_python(diff, needed, prefix, ql):
    if diff == 'easy':
        # Arithmetic and basic operations
        for i in range(needed):
            a, b = random.randint(1, 20), random.randint(1, 10)
            op = random.choice(['+', '-', '*', '//', '%', '**'])
            if op == '**' and b > 5: b = random.randint(1, 4)
            if op == '//' and b == 0: b = 1
            if op == '%' and b == 0: b = 1
            expected = eval(f"{a}{op}{b}")
            expected = int(expected) if isinstance(expected, float) and expected == int(expected) else expected
            ql.append(q(nid(prefix), 'whats-output', 'python', 'easy',
                f'print({a} {op} {b})',
                [str(expected), str(expected + 1), str(expected - 1), 'Error'],
                0, f'{a} {op} {b} = {expected}.'))
    elif diff == 'medium':
        patterns = [
            ('x = [1, 2, 3]\nprint(sum(x))', ['6', '[1,2,3]', 'Error', '123'], 0, 'sum() adds all elements.'),
            ('print(list(range(2, 8, 2)))', ['[2, 4, 6]', '[2, 4, 6, 8]', '[2, 6]', 'Error'], 0, 'range(2, 8, 2): start 2, step 2, stop before 8.'),
            ('d = {"x": 1, "y": 2}\nprint(len(d))', ['2', '4', 'Error', '1'], 0, 'len() on dict returns number of keys.'),
            ('print("hello world".count("l"))', ['3', '2', '1', '0'], 0, '"hello world" has 3 "l" characters.'),
            ('print(sorted([3,1,2], reverse=True))', ['[3, 2, 1]', '[1, 2, 3]', 'Error', 'None'], 0, 'reverse=True sorts descending.'),
            ('print(tuple([1, 2, 3]))', ['(1, 2, 3)', '[1, 2, 3]', '{1, 2, 3}', 'Error'], 0, 'tuple() converts list to tuple.'),
            ('print(set([1,1,2,2,3]))', ['{1, 2, 3}', '[1,1,2,2,3]', '{1,2,3}', 'Error'], 0, 'set() removes duplicates.'),
            ('x = "abc"\nprint(x * 2)', ['abcabc', 'abc2', 'Error', 'abc abc'], 0, 'String multiplication repeats.'),
            ('print(list("abc"))', ["['a', 'b', 'c']", "['abc']", 'Error', 'None'], 0, 'list() on string creates list of chars.'),
            ('print(str(3.14))', ['"3.14"', '3.14', 'Error', '3'], 0, 'str() converts to string.'),
        ]
        for i in range(min(needed, len(patterns))):
            code, opts, ci, expl = patterns[i]
            ql.append(q(nid(prefix), 'whats-output', 'python', 'medium', code, opts, ci, expl))
    elif diff == 'hard':
        patterns = [
            ('x = 10\ndef foo():\n    x = 20\n    def bar():\n        return x\n    return bar()\nprint(foo())', ['20', '10', 'Error', 'None'], 0, 'bar() captures x=20 from foo\'s scope (closure).'),
            ('class A:\n    x = 1\nclass B(A):\n    pass\nprint(B.x)', ['1', 'Error', 'None', '0'], 0, 'B inherits x from A.'),
            ('def make_adder(n):\n    return lambda x: x + n\nadd5 = make_adder(5)\nprint(add5(10))', ['15', '10', '5', 'Error'], 0, 'Closure captures n=5. 10+5=15.'),
            ('from functools import reduce\nprint(reduce(lambda a,b: a+b, [1,2,3,4], 0))', ['10', '[1,2,3,4]', '24', 'Error'], 0, 'reduce with initial 0: 0+1+2+3+4=10.'),
        ]
        for i in range(min(needed, len(patterns))):
            code, opts, ci, expl = patterns[i]
            ql.append(q(nid(prefix), 'whats-output', 'python', 'hard', code, opts, ci, expl))

def fill_wo_js(diff, needed, prefix, ql):
    if diff == 'easy':
        for i in range(needed):
            a, b = random.randint(1, 20), random.randint(1, 10)
            op = random.choice(['+', '-', '*', '%'])
            expected = eval(f"{a}{op}{b}")
            ql.append(q(nid(prefix), 'whats-output', 'javascript', 'easy',
                f'console.log({a} {op} {b});',
                [str(expected), str(expected + 1), str(expected - 1), 'NaN'],
                0, f'{a} {op} {b} = {expected}.'))
    elif diff == 'medium':
        patterns = [
            ('console.log([1,2,3].reduce((a,b) => a+b));', ['6', '123', 'Error', 'NaN'], 0, 'reduce without initial value: 1+2+3=6.'),
            ('console.log(Object.keys({x:1, y:2}));', ['["x", "y"]', '["1", "2"]', '[1, 2]', 'Error'], 0, 'Object.keys() returns array of keys.'),
            ('console.log("hello".split("").reverse().join(""));', ['"olleh"', '"hello"', 'Error', 'None'], 0, 'Split, reverse, join reverses a string.'),
            ('console.log([1,2,3].map(x => x*2));', ['[2, 4, 6]', '[1, 2, 3]', '[2, 4, 6, 8]', 'Error'], 0, 'map() doubles each element.'),
            ('console.log([1,2,3,4,5].filter(x => x > 3));', ['[4, 5]', '[1, 2, 3]', '[3, 4, 5]', 'Error'], 0, 'filter() keeps elements > 3.'),
        ]
        for i in range(min(needed, len(patterns))):
            code, opts, ci, expl = patterns[i]
            ql.append(q(nid(prefix), 'whats-output', 'javascript', 'medium', code, opts, ci, expl))

def fill_wo_java(diff, needed, prefix, ql):
    if diff == 'easy':
        for i in range(needed):
            a, b = random.randint(1, 20), random.randint(1, 10)
            op = random.choice(['+', '-', '*', '%'])
            expected = eval(f"{a}{op}{b}")
            ql.append(q(nid(prefix), 'whats-output', 'java', 'easy',
                f'System.out.println({a} {op} {b});',
                [str(expected), str(expected + 1), str(expected - 1), 'Error'],
                0, f'{a} {op} {b} = {expected}.'))

def fill_wo_cpp(diff, needed, prefix, ql):
    if diff == 'easy':
        for i in range(needed):
            a, b = random.randint(1, 20), random.randint(1, 10)
            op = random.choice(['+', '-', '*', '%'])
            expected = eval(f"{a}{op}{b}")
            ql.append(q(nid(prefix), 'whats-output', 'cpp', 'easy',
                f'cout << {a} {op} {b};',
                [str(expected), str(expected + 1), str(expected - 1), 'Error'],
                0, f'{a} {op} {b} = {expected}.'))

def fill_wo_css(diff, needed, prefix, ql):
    if diff == 'easy':
        patterns = [
            ('.box { color: red; }\n.box { color: blue; }', ['blue — last rule wins', 'red', 'purple', 'Error'], 0, 'Equal specificity: last declaration wins.'),
            ('.box { padding: 10px 20px; }', ['top/bottom: 10px, left/right: 20px', 'All sides: 10px', 'top: 10px only', 'Error'], 0, '2-value shorthand: vertical, horizontal.'),
            ('.box { margin: 10px 20px 30px 40px; }', ['top:10, right:20, bottom:30, left:40', 'All: 10px', 'top:10, left:20, bottom:30, right:40', 'Error'], 0, '4-value shorthand: top, right, bottom, left (clockwise).'),
            ('.box { font-size: 16px; line-height: 2; }', ['line-height = 32px (2 × 16px)', 'line-height = 2px', 'line-height = 16px', 'Error'], 0, 'Unitless line-height multiplies by font-size.'),
        ]
        for i in range(min(needed, len(patterns))):
            code, opts, ci, expl = patterns[i]
            ql.append(q(nid(prefix), 'whats-output', 'css', 'easy', code, opts, ci, expl))
    elif diff == 'medium':
        for i in range(needed):
            ql.append(q(nid(prefix), 'whats-output', 'css', 'medium',
                '.parent { display: flex; justify-content: space-between; }',
                ['Items spread with space between them', 'Items centered', 'Items at start', 'Error'],
                0, 'space-between distributes items evenly with space between.'))
    elif diff == 'hard':
        for i in range(needed):
            ql.append(q(nid(prefix), 'whats-output', 'css', 'hard',
                ':root { --c: red; }\n.dark { --c: blue; }\n.box { color: var(--c); }',
                ['Red in light mode, blue in .dark context', 'Always blue', 'Always red', 'Error'],
                0, 'CSS custom properties follow cascade. .dark context overrides --c.'))

def fill_wo_html(diff, needed, prefix, ql):
    if diff == 'easy':
        for i in range(needed):
            ql.append(q(nid(prefix), 'whats-output', 'html', 'easy',
                '<h1>Hello</h1>\n<p>World</p>',
                ['Two block elements: heading "Hello" and paragraph "World"', 'One line', 'Error', 'Only heading'],
                0, '<h1> and <p> are block-level elements rendered on separate lines.'))
    elif diff == 'medium':
        for i in range(needed):
            ql.append(q(nid(prefix), 'whats-output', 'html', 'medium',
                '<details>\n  <summary>Click me</summary>\n  <p>Hidden content</p>\n</details>',
                ['Collapsible section — "Click me" visible, content hidden until clicked', 'All content visible', 'Error', 'Nothing visible'],
                0, '<details>/<summary> creates native collapsible widget.'))
    elif diff == 'hard':
        for i in range(needed):
            ql.append(q(nid(prefix), 'whats-output', 'html', 'hard',
                '<template id="t">\n  <div>Template content</div>\n</template>',
                ['Nothing rendered — template content is inert until cloned with JS', 'Template content visible', 'Error', 'Only <div> visible'],
                0, '<template> content is not rendered. It must be cloned and inserted via JavaScript.'))

def fill_cc(lang, diff, needed, prefix, ql):
    """Fill code-completion questions"""
    if lang == 'python':
        fill_cc_python(diff, needed, prefix, ql)
    elif lang == 'javascript':
        fill_cc_js(diff, needed, prefix, ql)
    elif lang == 'java':
        fill_cc_java(diff, needed, prefix, ql)
    elif lang == 'cpp':
        fill_cc_cpp(diff, needed, prefix, ql)
    elif lang == 'css':
        fill_cc_css(diff, needed, prefix, ql)
    elif lang == 'html':
        fill_cc_html(diff, needed, prefix, ql)

def fill_cc_python(diff, needed, prefix, ql):
    if diff == 'easy':
        # Simple fill-in-the-blank
        blanks = [
            ('x = ____(3.7)', ['int', 'float', 'str', 'round'], 0, 'int() truncates float to integer.'),
            ('print(____(x))', ['type', 'typeof', 'class', 'kind'], 0, 'type() returns the type of a value.'),
            ('my_list.____(4)', ['append', 'add', 'push', 'insert'], 0, 'append() adds to end of list.'),
            ('print(____([5,3,1]))', ['sorted', 'sort', 'order', 'arrange'], 0, 'sorted() returns new sorted list.'),
            ('for i in ____(10):', ['range', 'loop', 'iterate', 'list'], 0, 'range() generates number sequence.'),
            ('x = ____.5)', ['3', '3.', 'int', 'float'], 0, 'Decimal point creates a float literal.'),
            ('print(____("hello"))', ['len', 'length', 'size', 'count'], 0, 'len() returns string length.'),
            ('result = ____(x)', ['str', 'string', 'text', 'char'], 0, 'str() converts to string.'),
            ('if x ____ 5:', ['==', '=', '===', '!='], 0, '== is equality comparison.'),
            ('my_dict.____("key")', ['get', 'find', 'fetch', 'retrieve'], 0, '.get() retrieves dict value safely.'),
        ]
        for i in range(min(needed, len(blanks))):
            code, opts, ci, expl = blanks[i]
            ql.append(q(nid(prefix), 'code-completion', 'python', 'easy', code, opts, ci, expl))
        # Generate more with variations
        funcs = ['abs', 'max', 'min', 'sum', 'round', 'len', 'int', 'float', 'str', 'bool',
                 'list', 'dict', 'set', 'tuple', 'sorted', 'reversed', 'enumerate', 'zip', 'map', 'filter']
        for i in range(needed - len(ql)):
            fn = funcs[i % len(funcs)]
            ql.append(q(nid(prefix), 'code-completion', 'python', 'easy',
                f'result = ____({random.choice(["42", "3.14", '"hello"', "[1,2,3]", "True"])})',
                [fn, 'eval', 'type', 'input'],
                0, f'{fn}() is a built-in Python function.'))
    elif diff == 'medium':
        blanks = [
            ('result = [x for x in data if ____]', ['condition', 'True', 'x', 'filter'], 0, 'List comprehension filter condition.'),
            ('from collections import ____', ['defaultdict', 'default_dict', 'DefaultDict', 'hashmap'], 0, 'defaultdict from collections module.'),
            ('with ____("file.txt") as f:', ['open', 'read', 'file', 'load'], 0, 'open() with with statement for file handling.'),
            ('result = list(____(lambda x: x*2, data))', ['map', 'filter', 'apply', 'reduce'], 0, 'map() applies function to each element.'),
            ('result = list(____(lambda x: x>0, data))', ['filter', 'map', 'reduce', 'select'], 0, 'filter() keeps elements matching predicate.'),
            ('try:\n    risky()\n____ Exception as e:', ['except', 'catch', 'handle', 'rescue'], 0, 'except clause handles exceptions.'),
            ('class MyClass:\n    def __init__(____):', ['self', 'this', 'cls', 'me'], 0, 'self is the first parameter in instance methods.'),
            ('from ____ import lru_cache', ['functools', 'utils', 'cache', 'memoize'], 0, 'functools.lru_cache adds memoization.'),
        ]
        for i in range(min(needed, len(blanks))):
            code, opts, ci, expl = blanks[i]
            ql.append(q(nid(prefix), 'code-completion', 'python', 'medium', code, opts, ci, expl))
    elif diff == 'hard':
        blanks = [
            ('class ____ (type):', ['Meta', 'Type', 'Base', 'ABC'], 0, 'Metaclasses inherit from type.'),
            ('def ____(self, *args, **kwargs):', ['__call__', '__invoke', '__run', '__exec'], 0, '__call__ makes instances callable.'),
            ('from abc import ____, abstractmethod', ['ABC', 'Abstract', 'Interface', 'Base'], 0, 'ABC is the abstract base class.'),
            ('async def fetch():\n    ____ aiohttp.ClientSession() as session:', ['async with', 'with', 'await with', 'using'], 0, 'async with for async context managers.'),
        ]
        for i in range(min(needed, len(blanks))):
            code, opts, ci, expl = blanks[i]
            ql.append(q(nid(prefix), 'code-completion', 'python', 'hard', code, opts, ci, expl))

def fill_cc_js(diff, needed, prefix, ql):
    if diff == 'easy':
        blanks = [
            ('console.log(____.floor(3.7));', ['Math', 'Number', 'Int', 'Float'], 0, 'Math.floor() rounds down.'),
            ('arr.____(item);', ['push', 'add', 'append', 'insert'], 0, 'push() adds to end of array.'),
            ('console.log(____.random());', ['Math', 'Number', 'Random', 'Util'], 0, 'Math.random() returns 0-1.'),
            ('const copy = [...____];', ['arr', 'obj', 'set', 'map'], 0, 'Spread operator copies array.'),
            ('console.log(typeof ____);', ['undefined', 'null', 'NaN', 'void'], 0, 'typeof undefined is "undefined".'),
            ('JSON.____(data);', ['stringify', 'encode', 'serialize', 'format'], 0, 'JSON.stringify() converts to JSON string.'),
            ('JSON.____(str);', ['parse', 'decode', 'deserialize', 'parseJSON'], 0, 'JSON.parse() converts JSON string to object.'),
            ('document.____("div");', ['createElement', 'create', 'makeElement', 'newElement'], 0, 'createElement() creates DOM element.'),
            ('console.log(arr.____);', ['length', 'size', 'count', 'len'], 0, 'Arrays have .length property.'),
            ('element.____("click", handler);', ['addEventListener', 'onClick', 'on', 'listen'], 0, 'addEventListener() attaches event handler.'),
        ]
        for i in range(min(needed, len(blanks))):
            code, opts, ci, expl = blanks[i]
            ql.append(q(nid(prefix), 'code-completion', 'javascript', 'easy', code, opts, ci, expl))
    elif diff == 'medium':
        blanks = [
            ('const result = arr.____((acc, cur) => acc + cur, 0);', ['reduce', 'map', 'filter', 'forEach'], 0, 'reduce() accumulates values.'),
            ('async function getData() {\n  ____ const res = fetch(url);', ['await', 'async', 'yield', 'return'], 0, 'await pauses for Promise resolution.'),
            ('const unique = [...new ____(arr)];', ['Set', 'Array', 'Map', 'List'], 0, 'new Set() removes duplicates.'),
            ('try {\n  risky();\n} ____(e) {', ['catch', 'except', 'handle', 'error'], 0, 'try/catch handles exceptions.'),
            ('class Dog ____ Animal {}', ['extends', 'implements', 'inherits', 'from'], 0, 'extends for class inheritance.'),
            ('export ____ myFunction() {}', ['function', 'default', 'const', 'async'], 0, 'export function exports named function.'),
        ]
        for i in range(min(needed, len(blanks))):
            code, opts, ci, expl = blanks[i]
            ql.append(q(nid(prefix), 'code-completion', 'javascript', 'medium', code, opts, ci, expl))
    elif diff == 'hard':
        blanks = [
            ('const ____ = new Proxy(target, handler);', ['proxy', 'Proxy', 'Watched', 'Observable'], 0, 'Proxy wraps objects with custom behavior.'),
            ('function* gen() {\n  ____ value;', ['yield', 'return', 'emit', 'produce'], 0, 'yield pauses generator execution.'),
            ('Symbol.____', ['iterator', 'iterate', 'loop', 'for'], 0, 'Symbol.iterator makes objects iterable.'),
        ]
        for i in range(min(needed, len(blanks))):
            code, opts, ci, expl = blanks[i]
            ql.append(q(nid(prefix), 'code-completion', 'javascript', 'hard', code, opts, ci, expl))

def fill_cc_java(diff, needed, prefix, ql):
    if diff == 'easy':
        blanks = [
            ('System.out.____("Hello");', ['println', 'print', 'write', 'say'], 0, 'println() prints with newline.'),
            ('List<String> list = new ____<>();', ['ArrayList', 'LinkedList', 'HashMap', 'Vector'], 0, 'ArrayList is common List implementation.'),
            ('Map<String, Integer> map = new ____<>();', ['HashMap', 'TreeMap', 'ArrayList', 'HashSet'], 0, 'HashMap is common Map implementation.'),
            ('import java.util.____;', ['ArrayList', 'Array', 'List', 'Collection'], 0, 'ArrayList is in java.util.'),
            ('for (int i : ____) {', ['arr', 'numbers', 'list', 'collection'], 0, 'Enhanced for loop iterates over arrays/collections.'),
            ('String s = "hello";\nSystem.out.println(s.____());', ['toUpperCase', 'upper', 'Upper', 'UPPER'], 0, 'toUpperCase() converts string.'),
            ('try { ... } ____ (Exception e) {', ['catch', 'except', 'handle', 'rescue'], 0, 'catch handles exceptions.'),
            ('int[] arr = {5, 3, 1};\nArrays.____(arr);', ['sort', 'sorted', 'order', 'arrange'], 0, 'Arrays.sort() sorts in place.'),
        ]
        for i in range(min(needed, len(blanks))):
            code, opts, ci, expl = blanks[i]
            ql.append(q(nid(prefix), 'code-completion', 'java', 'easy', code, opts, ci, expl))
    elif diff == 'medium':
        blanks = [
            ('list.stream().____(s -> s.length() > 3)', ['filter', 'map', 'find', 'select'], 0, 'filter() keeps matching elements.'),
            ('list.stream().____(String::toUpperCase)', ['map', 'filter', 'transform', 'apply'], 0, 'map() transforms elements.'),
            ('Optional<String> opt = Optional.____();', ['ofNullable', 'of', 'empty', 'from'], 0, 'ofNullable handles null safely.'),
            ('String result = list.stream().collect(____.joining(","));', ['Collectors', 'Strings', 'Arrays', 'Lists'], 0, 'Collectors.joining() concatenates.'),
            ('list.____(item -> System.out.println(item));', ['forEach', 'map', 'iterate', 'loop'], 0, 'forEach() performs action on each.'),
        ]
        for i in range(min(needed, len(blanks))):
            code, opts, ci, expl = blanks[i]
            ql.append(q(nid(prefix), 'code-completion', 'java', 'medium', code, opts, ci, expl))
    elif diff == 'hard':
        for i in range(needed):
            ql.append(q(nid(prefix), 'code-completion', 'java', 'hard',
                'CompletableFuture<String> future = CompletableFuture.____Async(() -> fetchData());',
                ['supply', 'run', 'call', 'execute'],
                0, 'supplyAsync() starts async computation with return value.'))

def fill_cc_cpp(diff, needed, prefix, ql):
    if diff == 'easy':
        blanks = [
            ('#include <____>', ['iostream', 'stdio.h', 'string', 'cmath'], 0, 'iostream provides cin/cout.'),
            ('vector<int> v;\nv.____(42);', ['push_back', 'add', 'append', 'insert'], 0, 'push_back() adds to vector end.'),
            ('cout << ____(3.7);', ['floor', 'int', 'round', 'trunc'], 0, 'floor() from cmath rounds down.'),
            ('int* p = ____ int(42);', ['new', 'malloc', 'alloc', 'create'], 0, 'new allocates heap memory.'),
            ('string s = "hello";\ncout << s.____();', ['length', 'len', 'size_of', 'count'], 0, '.length() returns string length.'),
            ('#include <____>\ncout << sqrt(16);', ['cmath', 'math', 'math.h', 'numeric'], 0, 'cmath provides math functions.'),
            ('auto x = ____ int[10];', ['new', 'malloc', 'alloc', 'make'], 0, 'new allocates array on heap.'),
            ('____ ptr;', ['delete', 'free', 'remove', 'release'], 0, 'delete frees heap memory.'),
        ]
        for i in range(min(needed, len(blanks))):
            code, opts, ci, expl = blanks[i]
            ql.append(q(nid(prefix), 'code-completion', 'cpp', 'easy', code, opts, ci, expl))
    elif diff == 'medium':
        for i in range(needed):
            ql.append(q(nid(prefix), 'code-completion', 'cpp', 'medium',
                'sort(v.begin(), v.end(), ____<int>());',
                ['greater', 'less', 'compare', 'descending'],
                0, 'greater<int>() sorts in descending order.'))
    elif diff == 'hard':
        for i in range(needed):
            ql.append(q(nid(prefix), 'code-completion', 'cpp', 'hard',
                'template<typename T>\nusing Ptr = ____<T>;',
                ['unique_ptr', 'shared_ptr', 'auto_ptr', 'scoped_ptr'],
                0, 'unique_ptr is the standard smart pointer for exclusive ownership.'))

def fill_cc_css(diff, needed, prefix, ql):
    if diff == 'easy':
        blanks = [
            ('display: ____;', ['flex', 'arrange', 'layout', 'position'], 0, 'display: flex enables flexbox.'),
            ('____-sizing: border-box;', ['box', 'content', 'margin', 'border'], 0, 'box-sizing: border-box includes padding.'),
            ('color: ____;', ['red', '#0', 'none', 'auto'], 0, 'color accepts named colors.'),
            ('font-____: bold;', ['weight', 'style', 'size', 'variant'], 0, 'font-weight: bold makes text bold.'),
            ('text-____: center;', ['align', 'position', 'indent', 'justify'], 0, 'text-align: center centers text.'),
            ('background-____: #fff;', ['color', 'image', 'size', 'position'], 0, 'background-color sets background.'),
            ('border-____: solid;', ['style', 'type', 'width', 'color'], 0, 'border-style: solid sets border type.'),
            ('position: ____;', ['relative', 'place', 'locate', 'where'], 0, 'position: relative for relative positioning.'),
        ]
        for i in range(min(needed, len(blanks))):
            code, opts, ci, expl = blanks[i]
            ql.append(q(nid(prefix), 'code-completion', 'css', 'easy', code, opts, ci, expl))
    elif diff == 'medium':
        blanks = [
            ('@____ (min-width: 768px)', ['media', 'screen', 'query', 'rule'], 0, '@media for responsive breakpoints.'),
            ('grid-template-____: repeat(3, 1fr);', ['columns', 'rows', 'areas', 'cells'], 0, 'grid-template-columns defines columns.'),
            ('____: opacity 0.3s ease;', ['transition', 'animation', 'transform', 'effect'], 0, 'transition for smooth property changes.'),
            ('justify-____: center;', ['content', 'items', 'self', 'align'], 0, 'justify-content: center centers flex items.'),
        ]
        for i in range(min(needed, len(blanks))):
            code, opts, ci, expl = blanks[i]
            ql.append(q(nid(prefix), 'code-completion', 'css', 'medium', code, opts, ci, expl))
    elif diff == 'hard':
        for i in range(needed):
            ql.append(q(nid(prefix), 'code-completion', 'css', 'hard',
                ':root {\n  --____: #3b82f6;\n}',
                ['primary', 'color', 'blue', 'theme'],
                0, 'CSS custom properties (variables) defined in :root.'))

def fill_cc_html(diff, needed, prefix, ql):
    if diff == 'easy':
        blanks = [
            ('<____ href="url">Link</____>', ['a', 'link', 'url', 'href'], 0, '<a> creates hyperlinks.'),
            ('<____ src="img.jpg" alt="photo">', ['img', 'image', 'picture', 'photo'], 0, '<img> embeds images.'),
            ('<____>Heading</____>', ['h1', 'heading', 'title', 'head'], 0, '<h1> creates top-level heading.'),
            ('<____ type="submit">Go</____>', ['button', 'input', 'submit', 'btn'], 0, '<button> creates clickable buttons.'),
            ('<____>Item</____>', ['li', 'item', 'list', 'entry'], 0, '<li> defines list items.'),
            ('<____ rel="stylesheet" href="style.css">', ['link', 'style', 'css', 'import'], 0, '<link> includes external CSS.'),
            ('<____ charset="UTF-8">', ['meta', 'head', 'charset', 'encoding'], 0, '<meta charset> declares encoding.'),
            ('<____ action="/submit" method="POST">', ['form', 'input', 'submit', 'data'], 0, '<form> creates submission forms.'),
            ('<____>\n  <li>A</li>\n</____>', ['ul', 'ol', 'list', 'menu'], 0, '<ul> creates unordered list.'),
            ('<____>Paragraph</____>', ['p', 'para', 'text', 'div'], 0, '<p> creates paragraphs.'),
        ]
        for i in range(min(needed, len(blanks))):
            code, opts, ci, expl = blanks[i]
            ql.append(q(nid(prefix), 'code-completion', 'html', 'easy', code, opts, ci, expl))
    elif diff == 'medium':
        for i in range(needed):
            ql.append(q(nid(prefix), 'code-completion', 'html', 'medium',
                '<____ name="viewport" content="width=device-width, initial-scale=1">',
                ['meta', 'link', 'viewport', 'head'],
                0, '<meta name="viewport"> enables responsive design.'))
    elif diff == 'hard':
        for i in range(needed):
            ql.append(q(nid(prefix), 'code-completion', 'html', 'hard',
                '<____ id="tmpl">\n  <div>Content</div>\n</____>',
                ['template', 'script', 'slot', 'fragment'],
                0, '<template> holds inert content for cloning.'))

# Generate all needed supplemental questions
for game in GAMES:
    for lang in LANGUAGES:
        for diff in DIFFICULTIES:
            current = cat_counts.get((game, lang, diff), 0)
            needed = max(0, TARGET - current)
            if needed > 0:
                fill_category(game, lang, diff, needed, bulk)

print(f"Generated {len(bulk)} bulk-fill questions")

# Now merge into the TS file
def escape_for_ts(s):
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')

# Build TS lines for new questions
bulk_lines = []
prev_game = None
prev_lang = None

for qq in bulk:
    game = qq['game']
    lang = qq['language']
    diff = qq['difficulty']
    
    if game != prev_game or lang != prev_lang:
        bulk_lines.append(f"  // ═══════════════════════════════════════════")
        bulk_lines.append(f"  // {game.upper()} — {lang.upper()}")
        bulk_lines.append(f"  // ═══════════════════════════════════════════")
        prev_game = game
        prev_lang = lang
    
    bulk_lines.append(f"  // {diff.capitalize()}")
    
    code_esc = qq['code'].replace("'", "\\'").replace('\n', '\\n')
    opts_parts = [f"'{escape_for_ts(o)}'" for o in qq['options']]
    opts_str = "[" + ", ".join(opts_parts) + "]"
    
    bulk_lines.append(f"  {{ id: '{qq['id']}', game: '{game}', language: '{lang}', difficulty: '{diff}',")
    bulk_lines.append(f"    code: '{code_esc}',")
    bulk_lines.append(f"    options: {opts_str},")
    bulk_lines.append(f"    correctIndex: {qq['correctIndex']}, explanation: '{escape_for_ts(qq['explanation'])}' }},")
    bulk_lines.append("")

# Read current TS file
with open("/home/z/my-project/src/lib/gameQuestions.ts", "r") as f:
    content = f.read()

# Insert before Q array close
q_close = content.find("\n];\n", content.find("const Q: GameQuestion[] = ["))
if q_close == -1:
    print("ERROR: Could not find Q array close!")
    exit(1)

new_content = content[:q_close] + "\n" + "\n".join(bulk_lines) + content[q_close:]

with open("/home/z/my-project/src/lib/gameQuestions.ts", "w") as f:
    f.write(new_content)

# Count final
final_counts = Counter()
for match in re.finditer(r"game: '([^']+)', language: '([^']+)', difficulty: '([^']+)'", new_content):
    final_counts[(match.group(1), match.group(2), match.group(3))] += 1

total = 0
print("\n=== Final question counts ===")
for game in GAMES:
    for lang in LANGUAGES:
        for diff in DIFFICULTIES:
            c = final_counts.get((game, lang, diff), 0)
            status = "✓" if c >= 80 else "⚠️" if c < 50 else "△"
            print(f"  {game} / {lang} / {diff}: {c} {status}")
            total += c

print(f"\nTotal: {total}")
