#!/usr/bin/env python3
"""
Supplement question bank to reach ~100 per category.
Uses template-based generation with many variations.
"""

import json, os, random, sys

# Read existing questions from the TS file by parsing the generated data
# We'll work directly with the question data from gen_questions.py

GAMES = ['bug-hunter', 'whats-output', 'code-completion']
LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'css', 'html']
DIFFICULTIES = ['easy', 'medium', 'hard']
TARGET = 100

counter = 10000  # Start high to avoid conflicts with existing IDs

def nid(prefix):
    global counter
    counter += 1
    return f"{prefix}{counter}"

def q(id, game, lang, diff, code, options, correct, explanation):
    return {
        "id": id, "game": game, "language": lang, "difficulty": diff,
        "code": code, "options": options, "correctIndex": correct, "explanation": explanation
    }

supplemental = []

# ═══════════════════════════════════════════════════════
# BUG HUNTER supplemental generators
# ═══════════════════════════════════════════════════════

def bh_python_easy(n):
    """Generate n bug-hunter python easy questions"""
    qs = []
    templates = [
        # Variable typo patterns
        ('{var1} = {val}\nprint({var2})', 
         lambda: (_v1 := random.choice(['count','total','result','name','value','data','items','num','score','level']),
                  _v2 := _v1[:-1] + random.choice(['x','z','q','s']) if random.random() > 0.3 else _v1 + random.choice(['e','s','']),
                  _val := random.choice(['42', '"hello"', '3.14', 'True', '[1,2,3]', '0']),
                  {'var1': _v1, 'var2': _v2, 'val': _val}),
         'Typo in variable name causes NameError. Check spelling carefully.',
         lambda ctx: f'print({ctx["var1"]})',
         0),
        # Missing colon
        ('{keyword} {condition}\n    {body}',
         lambda: (_kw := random.choice(['if','for','while','def']),
                  _cond := {'if': 'x > 5', 'for': 'i in range(5)', 'while': 'x < 10', 'def': 'hello()'}[_kw],
                  _body := random.choice(['print("yes")', 'x += 1', 'return True', 'pass']),
                  {'keyword': _kw, 'condition': _cond, 'body': _body}),
         'Python compound statements require a colon (:) after the condition.',
         lambda ctx: f'{ctx["keyword"]} {ctx["condition"]}:',
         0),
    ]
    
    # More varied direct questions
    direct = [
        ('x = 10\nif x > 5 and x < 20:\n    print("in range")\nelse if x >= 20:\n    print("too high")', ['Use elif instead of else if', 'Use elseif', 'The code is correct', 'Use else: if'], 0, 'Python uses "elif" keyword, not "else if".'),
        ('def square(x):\n    x * x', ['return x * x', 'print(x * x)', 'x * x is correct', 'yield x * x'], 0, 'Function computes but doesn\'t return the value. Add return.'),
        ('my_list = [1, 2, 3]\nprint(my_list[1.5])', ['Use integer index: my_list[1]', 'my_list[1.5] returns 2', 'Use my_list.get(1.5)', 'Use float index'], 0, 'List indices must be integers, not floats. Use my_list[1].'),
        ('x = "100"\ny = x + 50', ['y = int(x) + 50', 'y = x + "50"', 'y = float(x) + 50', 'Both A and C'], 3, 'Cannot add string and int. Convert x to int or float first.'),
        ('def greet(name="World", greeting):\n    return greeting + name', ['def greet(greeting, name="World"):', 'The code is correct', 'Remove default from name', 'Use *greeting'], 0, 'Non-default parameters cannot follow default parameters.'),
        ('print(len(3.14))', ['print(len(str(3.14)))', 'len(3.14) returns 4', 'print(3.14.__len__())', 'Error'], 0, 'len() does not work on floats. Convert to string first.'),
        ('my_list = [1, 2, 3]\nprint(my_list.length)', ['print(len(my_list))', 'my_list.length is correct', 'print(my_list.len())', 'print(my_list.size())'], 0, 'Python uses len() function, not .length attribute.'),
        ('if "hello" in "hello world":\n    print("found")', ['This code is correct', 'Use .contains()', 'Use .find()', 'Use == operator'], 0, '"in" operator correctly checks if substring exists in string.'),
        ('print(type([]))', ["<class 'list'>", "<class 'array'>", "<class 'empty'>", "Error"], 0, 'An empty list literal creates a list object.'),
        ('x = 5\nprint("x is " + x)', ['print("x is " + str(x))', 'print(f"x is {x}")', 'Both A and B', 'print("x is " + int(x))'], 2, 'Cannot concatenate string and int. Use str() or f-strings.'),
        ('import os\nprint(os.getcwd())', ['This code is correct — prints current working directory', 'os.getcwd() is wrong', 'Use os.cwd()', 'Use os.current_dir()'], 0, 'os.getcwd() correctly returns the current working directory.'),
        ('d = {"a": 1}\nprint(d.pop("b"))', ['Use d.pop("b", None) to avoid KeyError', 'd.pop("b") returns None', 'd.pop("b") is correct', 'Use d.remove("b")'], 0, 'pop() on a missing key raises KeyError. Provide a default value.'),
        ('x = [1, 2, 3]\nx.clear()\nprint(x)', ['[]', 'None', '[1, 2, 3]', 'Error'], 0, 'clear() removes all items from the list, leaving it empty.'),
        ('def foo():\n    x = 10\nfoo()\nprint(x)', ['NameError — x is local to foo()', '10', 'None', '0'], 0, 'x is a local variable inside foo(). Not accessible outside.'),
        ('s = "hello world"\nprint(s.startswith("Hello"))', ['False (case-sensitive)', 'True', 'Error', 'None'], 0, 'startswith() is case-sensitive. "hello" ≠ "Hello".'),
        ('numbers = range(5)\nprint(numbers[2])', ['2', '3', '0', 'Error'], 0, 'range(5) creates 0,1,2,3,4. Index 2 returns 2.'),
        ('x = {"a": 1, "b": 2}\nx.update({"c": 3})\nprint(len(x))', ['3', '2', '4', 'Error'], 0, 'update() adds new key-value pairs. Length becomes 3.'),
        ('print(sorted([3,1,2], reverse=False))', ['[1, 2, 3]', '[3, 2, 1]', '[3, 1, 2]', 'Error'], 0, 'reverse=False sorts in ascending order (default).'),
        ('my_list = [1, 2, 3, 2, 1]\nprint(my_list.count(2))', ['2', '1', '3', '5'], 0, 'count() returns number of occurrences. 2 appears twice.'),
        ('s = "hello"\nprint(s.find("l"))', ['2', '3', '1', '-1'], 0, 'find() returns the index of first occurrence. "l" is at index 2.'),
        ('x = True\nprint(int(x))', ['1', 'True', '0', 'Error'], 0, 'int(True) converts boolean True to integer 1.'),
        ('my_list = [3, 1, 4, 1, 5]\nmy_list.sort()\nprint(my_list)', ['[1, 1, 3, 4, 5]', '[3, 1, 4, 1, 5]', '[5, 4, 3, 1, 1]', 'Error'], 0, 'sort() modifies the list in place to ascending order.'),
        ('x = 5\nprint(f"Value: {x+1}")', ['Value: 6', 'Value: 5', 'Value: x+1', 'Error'], 0, 'f-strings evaluate expressions inside curly braces.'),
        ('my_set = {1, 2, 3}\nmy_set.add(2)\nprint(len(my_set))', ['3', '4', '2', 'Error'], 0, 'Adding an existing element to a set doesn\'t change it.'),
        ('print("hello".replace("l", "r"))', ['herro', 'herlo', 'hello', 'Error'], 0, 'replace() replaces all occurrences by default.'),
        ('def test(*args):\n    print(type(args))\ntest(1, 2, 3)', ["<class 'tuple'>", "<class 'list'>", "<class 'dict'>", "Error"], 0, '*args collects positional arguments into a tuple.'),
        ('def test(**kwargs):\n    print(type(kwargs))\ntest(a=1, b=2)', ["<class 'dict'>", "<class 'tuple'>", "<class 'list'>", "Error"], 0, '**kwargs collects keyword arguments into a dict.'),
        ('x = [1, 2, 3]\ny = x.copy()\ny.append(4)\nprint(len(x))', ['3', '4', '5', 'Error'], 0, '.copy() creates a shallow copy. Modifying y doesn\'t affect x.'),
        ('print("hello".isalpha())', ['True', 'False', 'Error', 'None'], 0, 'isalpha() returns True if all characters are letters.'),
        ('print("123".isdigit())', ['True', 'False', 'Error', 'None'], 0, 'isdigit() returns True if all characters are digits.'),
        ('x = "hello"\nprint(x * 2)', ['hellohello', 'hello 2', 'hello2', 'Error'], 0, 'String multiplication repeats the string.'),
        ('print(max(1, 2, 3))', ['3', '1', '[1,2,3]', 'Error'], 0, 'max() returns the largest value.'),
        ('print(min([5, 2, 8, 1]))', ['1', '2', '5', '8'], 0, 'min() returns the smallest value in the iterable.'),
        ('x = [1, 2, 3]\nprint(1 in x)', ['True', 'False', '1', 'Error'], 0, 'The "in" operator checks if value exists in list.'),
        ('print(isinstance(42, int))', ['True', 'False', 'Error', 'None'], 0, '42 is an instance of int.'),
        ('print(chr(65))', ['A', '65', 'Error', 'a'], 0, 'chr() converts an integer to its Unicode character. 65 = "A".'),
        ('print(ord("A"))', ['65', 'A', 'Error', '97'], 0, 'ord() returns the Unicode code point of a character.'),
        ('x = [1, 2, 3]\nprint(x.index(2))', ['1', '2', '0', '3'], 0, 'index() returns the position of the first occurrence.'),
        ('d = {"x": 1, "y": 2}\nprint(list(d.values()))', ['[1, 2]', '["x", "y"]', '[("x", 1), ("y", 2)]', 'Error'], 0, '.values() returns a view of the dictionary\'s values.'),
        ('print(abs(-5))', ['5', '-5', '0', 'Error'], 0, 'abs() returns the absolute value.'),
        ('print(pow(2, 3))', ['8', '6', '5', '9'], 0, 'pow(2, 3) = 2^3 = 8.'),
        ('print(divmod(17, 5))', ['(3, 2)', '(2, 3)', '(3, 5)', 'Error'], 0, 'divmod() returns (quotient, remainder): 17÷5 = 3 remainder 2.'),
        ('x = [1, 2, 3, 4, 5]\nprint(x[1:4:2])', ['[2, 4]', '[1, 3, 5]', '[2, 3, 4]', '[1, 2]'], 0, 'Slice [1:4:2] starts at 1, stops before 4, step 2: indices 1, 3.'),
        ('print(hex(255))', ['0xff', 'ff', '255', 'Error'], 0, 'hex() converts integer to hexadecimal string.'),
        ('print(bin(5))', ['0b101', '101', '5', '0b5'], 0, 'bin() converts integer to binary string.'),
        ('x = "hello"\nprint(x.center(11, "-"))', ['--hello----', '---hello---', '-hello-', 'hello------'], 0, 'center() pads the string to center it with the given character.'),
        ('print(all([True, True, False]))', ['False', 'True', 'Error', 'None'], 0, 'all() returns True only if all elements are truthy.'),
        ('print(any([False, False, True]))', ['True', 'False', 'Error', 'None'], 0, 'any() returns True if at least one element is truthy.'),
        ('print(sum([1, 2, 3], 10))', ['16', '6', '10', 'Error'], 0, 'sum() with start value: 10 + 1 + 2 + 3 = 16.'),
        ('x = "hello world"\nprint(x.title())', ['Hello World', 'Hello world', 'HELLO WORLD', 'hello world'], 0, 'title() capitalizes the first letter of each word.'),
        ('x = [1, 2, 3]\nprint(reversed(x) is list)', ['False — reversed() returns an iterator, not a list', 'True', 'Error', 'None'], 0, 'reversed() returns an iterator. Wrap with list() to get a list.'),
        ('print(format(3.14159, ".2f"))', ['3.14', '3.14159', '3.1', 'Error'], 0, 'format() with ".2f" rounds to 2 decimal places.'),
        ('x = {"a": 1, "b": 2}\nprint("a" in x.keys())', ['True', 'False', '1', 'Error'], 0, '"a" is a key in the dictionary.'),
        ('print(2 ** 10)', ['1024', '100', '512', '20'], 0, '2^10 = 1024.'),
        ('x = [1, 2, 3]\nprint(x.pop())', ['3', '1', '[1, 2]', 'Error'], 0, 'pop() removes and returns the last element.'),
        ('x = "hello"\nprint(x.rjust(10, "*"))', ['*****hello', 'hello*****', '**hello***', 'Error'], 0, 'rjust() right-justifies the string, padding with the given character.'),
        ('print(0b1010)', ['10', '1010', '0b1010', 'Error'], 0, '0b prefix denotes binary literal. 1010 in binary = 10.'),
        ('print(0xFF)', ['255', 'FF', '0xFF', 'Error'], 0, '0x prefix denotes hexadecimal. FF in hex = 255.'),
        ('x = [1, 2, 3]\nprint(x[-2])', ['2', '1', '3', 'Error'], 0, 'Negative index -2 means second from the end.'),
    ]
    
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-py-e'), 'bug-hunter', 'python', 'easy', code, opts, ci, expl))
    
    return qs

def bh_python_medium(n):
    qs = []
    direct = [
        ('def get_age(data):\n    return data["age"]\n\nprint(get_age({"name": "Alice"}))', ['Use data.get("age") with a default', 'The code is correct', 'Use data["age"] or default', 'Use data.find("age")'], 0, 'Missing key raises KeyError. Use .get() with a default value.'),
        ('class Team:\n    members = []\n    def add(self, name):\n        self.members.append(name)', ['members should be initialized in __init__', 'The code is correct', 'Use self.members = [] in add', 'Use Team.members'], 0, 'members is a class variable shared by all instances.'),
        ('def parse_config(filepath):\n    with open(filepath) as f:\n        return dict(line.strip().split("=") for line in f)', ['Lines without "=" cause ValueError in split()', 'The code is correct', 'Use json.load instead', 'Add try/except'], 0, 'If any line doesn\'t contain "=", split returns 1 item instead of 2.'),
        ('def cache_result(func):\n    cache = {}\n    def wrapper(*args):\n        if args in cache:\n            return cache[args]\n        result = func(*args)\n        cache[args] = result\n        return result\n    return wrapper', ['args is unhashable if it contains lists/dicts', 'The code is correct', 'Use functools.lru_cache', 'Both A and C'], 3, 'Lists/dicts as args cause TypeError. Use lru_cache or handle unhashable types.'),
        ('def process(data):\n    result = []\n    for item in data:\n        result.append(process_item(item))\n    return result', ['Use list comprehension: [process_item(i) for i in data]', 'The code is correct but verbose', 'Use map()', 'All of the above'], 3, 'List comprehension or map() is more Pythonic and often faster.'),
        ('def find_first(items, predicate):\n    for item in items:\n        if predicate(item):\n            return item', ['Return None explicitly or use next() with generator', 'The code is correct', 'Use filter()', 'Use list comprehension'], 0, 'Implicitly returns None, which works but explicit is better. Or use next(i for i in items if predicate(i)).'),
        ('class DB:\n    connection = None\n    def connect(self):\n        self.connection = create_connection()', ['connection is class-level — use instance variable in __init__', 'The code is correct', 'Use static method', 'Use @property'], 0, 'connection is shared across all DB instances. Initialize in __init__.'),
        ('def divide(a, b):\n    return a / b\n\nresult = divide(10, 0)', ['Add try/except ZeroDivisionError or validate b != 0', 'result is infinity', 'result is 0', 'Python handles it'], 0, 'Division by zero raises ZeroDivisionError. Always validate the divisor.'),
        ('def update_dict(d, key, value):\n    d[key] = value\n    return d\n\noriginal = {"a": 1}\nnew = update_dict(original, "b", 2)\nprint(original)', ['original is modified — return a copy: d.copy() then modify', 'original is unchanged', 'Error', 'original = {"a": 1}'], 0, 'Dicts are mutable. The function modifies the original dict.'),
        ('def retry(func, attempts=3):\n    for i in range(attempts):\n        try:\n            return func()\n        except Exception:\n            continue\n    return None', ['Should raise after all attempts fail, not return None', 'The code is correct', 'Add logging', 'Use recursion'], 0, 'Returning None on failure hides errors. Raise an exception instead.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-py-m'), 'bug-hunter', 'python', 'medium', code, opts, ci, expl))
    return qs

def bh_python_hard(n):
    qs = []
    direct = [
        ('import threading\n\nclass LazySingleton:\n    _instance = None\n    @classmethod\n    def get_instance(cls):\n        if cls._instance is None:\n            cls._instance = cls()\n        return cls._instance', ['Not thread-safe — add threading.Lock', 'The code is correct', 'Use module-level variable', 'Use __new__'], 0, 'Two threads could both see _instance as None and create two instances.'),
        ('def deep_merge(base, override):\n    result = base.copy()\n    for k, v in override.items():\n        if k in result and isinstance(result[k], dict) and isinstance(v, dict):\n            result[k] = deep_merge(result[k], v)\n        else:\n            result[k] = v\n    return result', ['The code is correct for deep merging dicts', 'Only handles shallow merge', 'Missing base case', 'Use dict.update()'], 0, 'This is a correct recursive deep merge implementation.'),
        ('class Observable:\n    def __init__(self):\n        self._observers = []\n    def subscribe(self, cb):\n        self._observers.append(cb)\n    def notify(self, *args):\n        for cb in self._observers:\n            cb(*args)', ['No unsubscribe method, no error handling, no weak refs', 'The code is correct', 'Use asyncio', 'Use signals'], 0, 'Memory leak without unsubscribe. One failing callback stops others.'),
        ('from functools import wraps\n\ndef rate_limit(calls_per_second):\n    min_interval = 1.0 / calls_per_second\n    def decorator(func):\n        last_called = [0.0]\n        @wraps(func)\n        def wrapper(*args, **kwargs):\n            elapsed = time.time() - last_called[0]\n            if elapsed < min_interval:\n                time.sleep(min_interval - elapsed)\n            last_called[0] = time.time()\n            return func(*args, **kwargs)\n        return wrapper\n    return decorator', ['Not thread-safe — last_called could be accessed concurrently', 'The code is correct', 'Use asyncio instead', 'Use token bucket'], 0, 'last_called is shared state without synchronization. Add a Lock.'),
        ('def curried_add(a):\n    def inner(b):\n        def innermost(c):\n            return a + b + c\n        return innermost\n    return inner\n\nadd_five = curried_add(2)(3)\nprint(add_five(4))', ['9 — this is correct currying', 'Error', '234', '2+3+4=9'], 0, 'Currying works: curried_add(2)(3)(4) = 2+3+4 = 9.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-py-h'), 'bug-hunter', 'python', 'hard', code, opts, ci, expl))
    return qs

# Bug Hunter JavaScript
def bh_js_easy(n):
    qs = []
    direct = [
        ('let x = "5";\nconsole.log(x + 3);', ['"53"', '8', 'Error', 'NaN'], 0, 'String + number concatenates, not adds.'),
        ('console.log(typeof []);', ['"object"', '"array"', '"list"', '"undefined"'], 0, 'Arrays are objects in JavaScript.'),
        ('let x;\nconsole.log(x);', ['undefined', 'null', '0', 'Error'], 0, 'Variables declared without assignment are undefined.'),
        ('console.log("5" - 3);', ['2', '"53"', 'NaN', 'Error'], 0, '- operator converts strings to numbers.'),
        ('console.log(true + 1);', ['2', '"true1"', 'true1', 'Error'], 0, 'true coerces to 1. 1+1=2.'),
        ('console.log(false == 0);', ['true', 'false', 'Error', 'undefined'], 0, 'false coerces to 0. 0 == 0 is true.'),
        ('console.log("" == false);', ['true', 'false', 'Error', 'undefined'], 0, 'Empty string coerces to 0. 0 == 0 is true.'),
        ('const obj = {};\nconsole.log(obj.foo);', ['undefined', 'null', 'Error', 'false'], 0, 'Accessing non-existent property returns undefined.'),
        ('console.log([1, 2, 3].length);', ['3', '2', '4', 'undefined'], 0, 'Arrays have a .length property.'),
        ('console.log("hello".length);', ['5', '6', 'undefined', 'Error'], 0, 'Strings have a .length property.'),
        ('let x = null;\nconsole.log(typeof x);', ['"object"', '"null"', '"undefined"', '"boolean"'], 0, 'typeof null is "object" — a known JS quirk.'),
        ('console.log(1 == "1");', ['true', 'false', 'Error', '"1"'], 0, 'Loose equality coerces types. 1 == "1" is true.'),
        ('console.log(1 === "1");', ['false', 'true', 'Error', '"1"'], 0, 'Strict equality checks type AND value.'),
        ('console.log(NaN == NaN);', ['false', 'true', 'NaN', 'Error'], 0, 'NaN is not equal to anything, including itself.'),
        ('console.log(isNaN("hello"));', ['true', 'false', 'Error', 'undefined'], 0, 'isNaN() coerces the argument. "hello" becomes NaN.'),
        ('console.log(Number.isNaN("hello"));', ['false', 'true', 'Error', 'undefined'], 0, 'Number.isNaN() does NOT coerce. "hello" is not NaN.'),
        ('console.log("hello"[1]);', ['"e"', '"h"', 'undefined', 'Error'], 0, 'Strings support bracket notation for character access.'),
        ('console.log(null == undefined);', ['true', 'false', 'Error', 'null'], 0, 'null and undefined are loosely equal.'),
        ('console.log(3 > 2);', ['true', 'false', 'Error', '1'], 0, '3 is greater than 2.'),
        ('let a = 1;\nlet b = a;\na = 2;\nconsole.log(b);', ['1', '2', 'undefined', 'Error'], 0, 'Primitives are copied by value. b stays 1.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-js-e'), 'bug-hunter', 'javascript', 'easy', code, opts, ci, expl))
    return qs

def bh_js_medium(n):
    qs = []
    direct = [
        ('const obj = {a: 1, b: 2};\nconst copy = Object.assign({}, obj);\ncopy.a = 99;\nconsole.log(obj.a);', ['1', '99', 'undefined', 'Error'], 0, 'Object.assign creates a shallow copy. obj.a unchanged.'),
        ('const arr = [1, 2, 3];\nconst [first, ...rest] = arr;\nconsole.log(rest);', ['[2, 3]', '[1, 2, 3]', '[1]', '3'], 0, 'Rest operator collects remaining elements.'),
        ('console.log([1, [2, 3]].flat());', ['[1, 2, 3]', '[1, [2, 3]]', 'Error', '[1, 2, 3, undefined]'], 0, 'flat() flattens one level of nesting.'),
        ('const obj = {a: 1, b: 2, c: 3};\nconst {a, ...others} = obj;\nconsole.log(others);', ['{b: 2, c: 3}', '{a: 1}', '{a: 1, b: 2, c: 3}', 'Error'], 0, 'Rest in destructuring collects remaining properties.'),
        ('const map = new Map();\nmap.set("key", "value");\nconsole.log(map.get("key"));', ['"value"', 'undefined', '"key"', 'Error'], 0, 'Map.get() retrieves the value for a key.'),
        ('const set = new Set([1, 2, 2, 3]);\nconsole.log(set.size);', ['3', '4', '2', 'Error'], 0, 'Set removes duplicates. Size is 3.'),
        ('console.log("hello".padStart(10, "x"));', ['xxxxxhello', 'helloxxxxx', 'xxhelloxxx', 'Error'], 0, 'padStart() pads the start to reach target length.'),
        ('console.log("hello world".includes("world"));', ['true', 'false', 'Error', '"world"'], 0, 'includes() checks if substring exists.'),
        ('console.log([1, 2, 3].find(x => x > 1));', ['2', '3', '[2, 3]', 'undefined'], 0, 'find() returns the first matching element.'),
        ('console.log([1, 2, 3].findIndex(x => x > 1));', ['1', '2', '0', '-1'], 0, 'findIndex() returns index of first match.'),
        ('const obj = {name: "Alice"};\nconsole.log(Object.keys(obj));', ['["name"]', '["Alice"]', '[0]', 'Error'], 0, 'Object.keys() returns an array of the object\'s keys.'),
        ('console.log([1, 2, 3].includes(2));', ['true', 'false', '2', '1'], 0, 'includes() checks if value exists in array.'),
        ('const obj = {x: 1};\nconsole.log(Object.entries(obj));', ['[["x", 1]]', '[["x", "1"]]', '["x", 1]', 'Error'], 0, 'Object.entries() returns array of [key, value] pairs.'),
        ('console.log("hello".repeat(3));', ['hellohellohello', 'hello3', 'Error', 'hello hello hello'], 0, 'repeat() repeats the string n times.'),
        ('console.log([1, 2, 3].every(x => x > 0));', ['true', 'false', 'Error', 'undefined'], 0, 'every() returns true if ALL elements pass the test.'),
        ('console.log([1, 2, 3].some(x => x > 2));', ['true', 'false', 'Error', 'undefined'], 0, 'some() returns true if ANY element passes the test.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-js-m'), 'bug-hunter', 'javascript', 'medium', code, opts, ci, expl))
    return qs

def bh_js_hard(n):
    qs = []
    direct = [
        ('const obj = new Proxy({}, {\n  set(target, prop, value) {\n    if (prop === "age" && (value < 0 || value > 150)) {\n      throw new Error("Invalid age");\n    }\n    target[prop] = value;\n    return true;\n  }\n});\nobj.age = -5;', ['Throws Error: "Invalid age"', 'Sets age to -5', 'Sets age to undefined', 'Silently fails'], 0, 'Proxy set trap validates the value before assignment.'),
        ('class MyPromise {\n  constructor(executor) {\n    this.callbacks = [];\n    const resolve = (value) => {\n      this.callbacks.forEach(cb => cb(value));\n    };\n    executor(resolve);\n  }\n  then(callback) {\n    this.callbacks.push(callback);\n    return this;\n  }\n}', ['then() returns this instead of new promise — cannot chain properly', 'The code is correct', 'Use async/await', 'Use generators'], 0, 'Proper Promise chaining requires returning a new Promise from then().'),
        ('function* fibonacci() {\n  let a = 0, b = 1;\n  while (true) {\n    yield a;\n    [a, b] = [b, a + b];\n  }\n}\nconst gen = fibonacci();\nconsole.log(gen.next().value, gen.next().value, gen.next().value);', ['0 1 1', '1 1 2', '0 1 2', 'Error'], 0, 'Generator yields: 0, 1, 1, 2, 3, 5, ...'),
        ('const weakMap = new WeakMap();\nlet obj = {a: 1};\nweakMap.set(obj, "value");\nobj = null;\n// What happens to the entry?', ['Entry is garbage collected (no references to key)', 'Entry persists', 'Error', 'Entry value becomes null'], 0, 'WeakMap entries are garbage collected when keys have no references.'),
        ('async function* asyncGen() {\n  yield await Promise.resolve(1);\n  yield await Promise.resolve(2);\n}\nconst gen = asyncGen();\ngen.next().then(r => console.log(r.value));', ['1', '2', '{value: 1, done: false}', 'Promise'], 0, 'Async generators yield promises. .next() returns a promise.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-js-h'), 'bug-hunter', 'javascript', 'hard', code, opts, ci, expl))
    return qs

# Bug Hunter Java
def bh_ja_easy(n):
    qs = []
    direct = [
        ('System.out.println("Hello" + 5 + 5);', ['"Hello55"', '"Hello10"', '"Hello5" + 5', 'Error'], 0, 'Left-to-right: "Hello"+5="Hello5", "Hello5"+5="Hello55".'),
        ('System.out.println(5 + 5 + "Hello");', ['"10Hello"', '"55Hello"', '"5+5Hello"', 'Error'], 0, 'Left-to-right: 5+5=10, 10+"Hello"="10Hello".'),
        ('int x = 5;\nSystem.out.println(x++);', ['5', '6', '4', 'Error'], 0, 'Post-increment: returns 5, then x becomes 6.'),
        ('int x = 5;\nSystem.out.println(++x);', ['6', '5', '7', 'Error'], 0, 'Pre-increment: increments first, then returns 6.'),
        ('System.out.println(10 % 3);', ['1', '3', '0', '3.33'], 0, '% is modulo: remainder of 10/3 = 1.'),
        ('boolean b = !true;\nSystem.out.println(b);', ['false', 'true', 'Error', 'null'], 0, '! negates boolean: !true = false.'),
        ('String s = "Java";\nSystem.out.println(s.length());', ['4', '5', '3', 'Error'], 0, '"Java" has 4 characters.'),
        ('int x = 10;\nint y = 3;\nSystem.out.println(x / y);', ['3', '3.33', '3.0', '4'], 0, 'Integer division truncates: 10/3 = 3.'),
        ('System.out.println("hello".equals("hello"));', ['true', 'false', 'Error', 'null'], 0, '.equals() compares string content.'),
        ('System.out.println("hello" == "hello");', ['true (string interning)', 'false', 'Error', 'null'], 0, 'Literals are interned, same reference. But .equals() is correct.'),
        ('int[] arr = {5, 3, 1};\nArrays.sort(arr);\nSystem.out.println(arr[0]);', ['1', '5', '3', 'Error'], 0, 'sort() arranges in ascending order. First element is 1.'),
        ('String s = "Hello World";\nSystem.out.println(s.substring(0, 5));', ['"Hello"', '"Hello "', '"World"', 'Error'], 0, 'substring(0, 5) returns chars from index 0 to 4.'),
        ('System.out.println(Math.max(10, 20));', ['20', '10', 'Error', '0'], 0, 'Math.max() returns the larger value.'),
        ('System.out.println(Math.min(10, 20));', ['10', '20', '0', 'Error'], 0, 'Math.min() returns the smaller value.'),
        ('System.out.println(String.valueOf(42));', ['"42"', '42', 'Error', 'null'], 0, 'String.valueOf() converts int to String.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-ja-e'), 'bug-hunter', 'java', 'easy', code, opts, ci, expl))
    return qs

def bh_ja_medium(n):
    qs = []
    direct = [
        ('List<Integer> nums = Arrays.asList(1, 2, 3, 4, 5);\nint sum = nums.stream().mapToInt(Integer::intValue).sum();\nSystem.out.println(sum);', ['15', '10', 'Error', '0'], 0, 'Stream API sums 1+2+3+4+5 = 15.'),
        ('Map<String, Integer> map = new HashMap<>();\nmap.put("a", 1);\nmap.put("b", 2);\nSystem.out.println(map.get("c"));', ['null', '0', 'Error', '-1'], 0, 'get() returns null for non-existent keys.'),
        ('Set<Integer> set = new HashSet<>();\nset.add(1);\nset.add(2);\nset.add(1);\nSystem.out.println(set.size());', ['2', '3', '1', 'Error'], 0, 'Set removes duplicates. Size is 2.'),
        ('String s = "  hello  ";\nSystem.out.println(s.trim());', ['"hello"', '"  hello  "', '" hello "', 'Error'], 0, 'trim() removes leading and trailing whitespace.'),
        ('System.out.println("hello".contains("ell"));', ['true', 'false', 'Error', 'null'], 0, 'contains() checks if substring exists.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-ja-m'), 'bug-hunter', 'java', 'medium', code, opts, ci, expl))
    return qs

def bh_ja_hard(n):
    qs = []
    direct = [
        ('class Parent {\n  static { System.out.print("1"); }\n  { System.out.print("2"); }\n  Parent() { System.out.print("3"); }\n}\nclass Child extends Parent {\n  static { System.out.print("4"); }\n  { System.out.print("5"); }\n  Child() { System.out.print("6"); }\n}\npublic static void main(String[] args) {\n  new Child();\n}', ['142356', '123456', '412356', '142365'], 0, 'Order: parent static, child static, parent instance init, parent constructor, child instance init, child constructor.'),
        ('AtomicInteger count = new AtomicInteger(0);\nExecutorService pool = Executors.newFixedThreadPool(10);\nfor (int i = 0; i < 1000; i++) {\n  pool.submit(() -> count.incrementAndGet());\n}\npool.shutdown();\npool.awaitTermination(1, TimeUnit.SECONDS);\nSystem.out.println(count.get());', ['1000', 'Less than 1000', 'Error', '0'], 0, 'AtomicInteger ensures thread-safe increment. Result is 1000.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-ja-h'), 'bug-hunter', 'java', 'hard', code, opts, ci, expl))
    return qs

# Bug Hunter C++
def bh_cp_easy(n):
    qs = []
    direct = [
        ('int x = 10 / 3;\ncout << x;', ['3', '3.33', '3.0', 'Error'], 0, 'Integer division truncates.'),
        ('int x = 5;\ncout << x++;', ['5', '6', '4', 'Error'], 0, 'Post-increment returns 5, then increments.'),
        ('cout << sizeof(char);', ['1', '2', '4', '8'], 0, 'sizeof(char) is always 1 byte.'),
        ('int arr[] = {1, 2, 3};\ncout << arr[1];', ['2', '1', '3', 'Error'], 0, 'Arrays are 0-indexed. arr[1] is the second element.'),
        ('string s = "hello";\ncout << s.size();', ['5', '6', '4', 'Error'], 0, 's.size() returns the number of characters.'),
        ('int x = 10;\nint &ref = x;\nref = 20;\ncout << x;', ['20', '10', 'Error', '0'], 0, 'Reference is an alias. Changing ref changes x.'),
        ('auto x = 42;\ncout << typeid(x).name();', ['int (typically "i")', 'auto', '42', 'Error'], 0, 'auto deduces int from 42.'),
        ('cout << 5 % 3;', ['2', '1', '0', '1.67'], 0, '% is modulo: 5 % 3 = 2.'),
        ('bool b = true;\ncout << b;', ['1', 'true', '0', 'Error'], 0, 'bool prints as 1 (true) or 0 (false) by default.'),
        ('vector<int> v = {1, 2, 3};\ncout << v.size();', ['3', '2', '1', 'Error'], 0, 'v.size() returns number of elements.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-cp-e'), 'bug-hunter', 'cpp', 'easy', code, opts, ci, expl))
    return qs

def bh_cp_medium(n):
    qs = []
    direct = [
        ('vector<int> v = {5, 3, 1, 4, 2};\nsort(v.begin(), v.end());\ncout << v[0];', ['1', '5', '2', 'Error'], 0, 'sort() arranges ascending. First element is 1.'),
        ('map<string, int> m;\nm["a"] = 1;\nm["b"] = 2;\ncout << m["c"];', ['0', 'Error', 'null', '-1'], 0, 'map[] creates entry with default value 0 if key missing.'),
        ('string s = "hello";\ncout << s.substr(1, 3);', ['"ell"', '"hel"', '"ello"', 'Error'], 0, 'substr(1, 3) starts at index 1, length 3.'),
        ('set<int> s = {3, 1, 2, 1, 3};\ncout << s.size();', ['3', '5', '2', 'Error'], 0, 'Set removes duplicates. Size is 3.'),
        ('auto lambda = [](int x) { return x * 2; };\ncout << lambda(5);', ['10', '5', 'Error', '25'], 0, 'Lambda function doubles the input. 5*2=10.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-cp-m'), 'bug-hunter', 'cpp', 'medium', code, opts, ci, expl))
    return qs

def bh_cp_hard(n):
    qs = []
    direct = [
        ('unique_ptr<int> p1 = make_unique<int>(42);\nunique_ptr<int> p2 = p1;', ['Cannot copy unique_ptr — use move: p2 = move(p1)', 'p2 points to 42', 'p1 becomes null', 'Error'], 0, 'unique_ptr is non-copyable. Transfer ownership with std::move().'),
        ('template<typename... Args>\nvoid print(Args... args) {\n    (cout << ... << args) << endl;\n}\nprint(1, "hello", 3.14);', ['1hello3.14', 'Error', '1 hello 3.14', 'Compile error'], 0, 'Fold expression expands parameter pack with << operator.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-cp-h'), 'bug-hunter', 'cpp', 'hard', code, opts, ci, expl))
    return qs

# Bug Hunter CSS
def bh_cs_easy(n):
    qs = []
    direct = [
        ('.box {\n  color: red;\n  color: blue;\n}', ['blue — last declaration wins', 'red', 'purple', 'Error'], 0, 'When specificity is equal, the last declaration wins.'),
        ('.box {\n  margin: 10px 20px 30px;\n}', ['top: 10px, right/left: 20px, bottom: 30px', 'All sides 10px', 'top/bottom: 10px, left/right: 20px', 'Error'], 0, '3-value shorthand: top, horizontal, bottom.'),
        ('.text {\n  font-weight: bold;\n}', ['This code is correct', 'Use font-style: bold', 'Use text-weight: bold', 'Use font: bold'], 0, 'font-weight: bold is correct CSS.'),
        ('.box {\n  background: #ff0000;\n}', ['This code is correct — red background', 'Use bg-color', 'Use background-color only', 'Error'], 0, '#ff0000 is valid hex color for red.'),
        ('a:hover {\n  color: green;\n}', ['This code is correct — styles links on hover', 'Use onHover', 'Use a.onhover', 'Use a.hover'], 0, ':hover is a valid pseudo-class for hover state.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-cs-e'), 'bug-hunter', 'css', 'easy', code, opts, ci, expl))
    return qs

def bh_cs_medium(n):
    qs = []
    direct = [
        ('.parent {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n}', ['This code is correct — 3 equal columns', 'Use flexbox instead', 'Use repeat(3, 1fr)', 'Both A and C are correct'], 3, 'Both 1fr 1fr 1fr and repeat(3, 1fr) create 3 equal columns.'),
        ('.box {\n  position: sticky;\n  top: 0;\n}', ['This code is correct — sticks to top on scroll', 'Use position: fixed', 'Use position: absolute', 'Error'], 0, 'position: sticky with top: 0 makes element stick on scroll.'),
        ('.box {\n  transition: transform 0.3s ease;\n}\n.box:hover {\n  transform: scale(1.1);\n}', ['This code is correct — smooth scale on hover', 'Use animation instead', 'Missing @keyframes', 'Error'], 0, 'transition with transform creates smooth hover effects.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-cs-m'), 'bug-hunter', 'css', 'medium', code, opts, ci, expl))
    return qs

def bh_cs_hard(n):
    qs = []
    direct = [
        (':root {\n  --primary: #3b82f6;\n}\n.button {\n  background: var(--primary);\n}\n.button:hover {\n  --primary: #2563eb;\n}', ['Hover changes --primary for .button context only — CSS custom properties cascade', 'Hover changes --primary globally', 'Hover has no effect', 'Error'], 0, 'Custom properties follow cascade rules. The hover scope only affects .button.'),
        ('@supports (display: grid) {\n  .layout {\n    display: grid;\n  }\n}\n@supports not (display: grid) {\n  .layout {\n    display: flex;\n  }\n}', ['This code is correct — progressive enhancement with @supports', 'Use @media instead', 'Only need first rule', 'Error'], 0, '@supports checks browser feature support for progressive enhancement.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-cs-h'), 'bug-hunter', 'css', 'hard', code, opts, ci, expl))
    return qs

# Bug Hunter HTML
def bh_ht_easy(n):
    qs = []
    direct = [
        ('<p>This is <strong>important</strong> text</p>', ['This code is correct — <strong> is semantic bold', 'Use <b> instead', 'Use <em> instead', 'Error'], 0, '<strong> is semantically correct for important text.'),
        ('<h1>Title</h1>\n<h2>Subtitle</h2>', ['This code is correct — proper heading hierarchy', 'Skip to h3', 'Use only h1', 'Error'], 0, 'Proper heading hierarchy: h1 > h2 > h3.'),
        ('<a href="#section1">Jump to Section 1</a>\n...\n<section id="section1">Section 1</section>', ['This code is correct — anchor link to section', 'Use <div> instead of <section>', 'Use name attribute', 'Error'], 0, 'Anchor links with id attributes work correctly.'),
        ('<ul>\n  <li>First</li>\n  <li>Second</li>\n</ul>', ['This code is correct — unordered list', 'Use <ol>', 'Use <li> without <ul>', 'Error'], 0, 'Proper unordered list with <ul> and <li> elements.'),
        ('<img src="photo.jpg" alt="A scenic photo">', ['This code is correct — image with alt text', 'Missing title', 'Use <image> instead', 'Error'], 0, 'Image with alt attribute is properly accessible.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-ht-e'), 'bug-hunter', 'html', 'easy', code, opts, ci, expl))
    return qs

def bh_ht_medium(n):
    qs = []
    direct = [
        ('<details>\n  <summary>Click to expand</summary>\n  <p>Hidden content here</p>\n</details>', ['This code is correct — native disclosure widget', 'Use JavaScript instead', 'Use <dialog>', 'Error'], 0, '<details>/<summary> creates a native collapsible section.'),
        ('<figure>\n  <img src="chart.png" alt="Sales chart">\n  <figcaption>Figure 1: Monthly sales</figcaption>\n</figure>', ['This code is correct — figure with caption', 'Use <div> instead', 'Use <caption>', 'Error'], 0, '<figure> with <figcaption> is semantically correct for images with captions.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-ht-m'), 'bug-hunter', 'html', 'medium', code, opts, ci, expl))
    return qs

def bh_ht_hard(n):
    qs = []
    direct = [
        ('<template id="card-template">\n  <div class="card">\n    <h2></h2>\n    <p></p>\n  </div>\n</template>', ['This code is correct — inert template not rendered until cloned', 'Template renders immediately', 'Use <slot> instead', 'Error'], 0, '<template> content is inert and not rendered until used with JS.'),
        ('<dialog id="modal">\n  <p>Are you sure?</p>\n  <button onclick="document.getElementById(\'modal\').close()">Close</button>\n</dialog>', ['This code is correct — native dialog element', 'Use div with CSS instead', 'Use <modal>', 'Error'], 0, '<dialog> is the native HTML element for modals with .showModal().'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('bh-ht-h'), 'bug-hunter', 'html', 'hard', code, opts, ci, expl))
    return qs

# ═══════════════════════════════════════════════════════
# WHAT'S OUTPUT supplemental generators
# ═══════════════════════════════════════════════════════

def wo_python_easy(n):
    qs = []
    direct = [
        ('print(2 + 3 * 4)', ['14', '20', '24', '9'], 0, 'Multiplication before addition: 3*4=12, 2+12=14.'),
        ('print(10 // 3)', ['3', '3.33', '4', '0'], 0, '// is floor division: 10//3 = 3.'),
        ('print(2 ** 0)', ['1', '0', '2', 'Error'], 0, 'Any number to the power of 0 is 1.'),
        ('print(len("hello"))', ['5', '6', '4', 'Error'], 0, '"hello" has 5 characters.'),
        ('print(list(range(3)))', ['[0, 1, 2]', '[1, 2, 3]', '[0, 1, 2, 3]', '[3]'], 0, 'range(3) generates 0, 1, 2.'),
        ('print(max(1, 2, 3))', ['3', '1', '[1,2,3]', 'Error'], 0, 'max() returns the largest value.'),
        ('print(min([5, 2, 8]))', ['2', '5', '8', 'Error'], 0, 'min() returns the smallest value.'),
        ('print(sorted([3, 1, 2]))', ['[1, 2, 3]', '[3, 1, 2]', '[3, 2, 1]', 'Error'], 0, 'sorted() returns a new sorted list.'),
        ('print("hello".replace("l", "r"))', ['herro', 'herlo', 'hello', 'Error'], 0, 'replace() replaces all occurrences by default.'),
        ('print([1, 2, 3].index(2))', ['1', '2', '0', '-1'], 0, 'index() returns the position. 2 is at index 1.'),
        ('print(True and False)', ['False', 'True', 'Error', 'None'], 0, 'and returns False if any operand is False.'),
        ('print(True or False)', ['True', 'False', 'Error', 'None'], 0, 'or returns True if any operand is True.'),
        ('print(not True)', ['False', 'True', 'Error', 'None'], 0, 'not negates: not True = False.'),
        ('print(3 in [1, 2, 3])', ['True', 'False', '3', 'Error'], 0, '3 exists in the list.'),
        ('print("abc" + "def")', ['abcdef', 'abc def', 'Error', 'abc+def'], 0, '+ concatenates strings.'),
        ('print(10 % 3)', ['1', '3', '0', '3.33'], 0, '% is modulo: 10/3 remainder is 1.'),
        ('print(abs(-7))', ['7', '-7', '0', 'Error'], 0, 'abs() returns absolute value.'),
        ('print(round(3.5))', ['4', '3', '3.5', 'Error'], 0, 'round(3.5) uses banker\'s rounding: rounds to even → 4.'),
        ('print(str(42))', ['"42"', '42', 'Error', 'int'], 0, 'str() converts to string.'),
        ('print(int("42") + 8)', ['50', '"428"', 'Error', '42'], 0, 'int("42")=42, then 42+8=50.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('wo-py-e'), 'whats-output', 'python', 'easy', code, opts, ci, expl))
    return qs

def wo_python_medium(n):
    qs = []
    direct = [
        ('x = [1, 2, 3]\ny = x[:]\ny[0] = 99\nprint(x[0], y[0])', ['1 99', '99 99', '1 1', '99 1'], 0, 'x[:] creates a copy. Modifying y doesn\'t affect x.'),
        ('d = {"a": 1, "b": 2}\nprint(d.get("c", 3))', ['3', 'None', '1', 'Error'], 0, 'get() returns default 3 when key is missing.'),
        ('print(list(map(str, [1, 2, 3])))', ["['1', '2', '3']", "['1', '2', '3']", '[1, 2, 3]', 'Error'], 0, 'map(str, ...) converts each element to string.'),
        ('print(any([False, False, False]))', ['False', 'True', 'Error', 'None'], 0, 'any() returns False when all elements are falsy.'),
        ('print(all([True, True, True]))', ['True', 'False', 'Error', 'None'], 0, 'all() returns True when all elements are truthy.'),
        ('x = [1, 2, 3, 4, 5]\nprint(x[1:4])', ['[2, 3, 4]', '[1, 2, 3]', '[2, 3, 4, 5]', '[1, 2, 3, 4]'], 0, 'Slice [1:4] gets indices 1, 2, 3.'),
        ('def foo(x, y=[]):\n    y.append(x)\n    return y\nprint(foo(1))\nprint(foo(2))', ['[1]\n[1, 2]', '[1]\n[2]', '[1, 2]\n[1, 2]', 'Error'], 0, 'Mutable default arg persists across calls.'),
        ('print(sorted({3: "c", 1: "a", 2: "b"}))', ['[1, 2, 3]', '["a", "b", "c"]', '[3, 1, 2]', 'Error'], 0, 'sorted() on dict sorts the keys.'),
        ('print("hello world".split("o"))', ["['hell', ' w', 'rld']", "['hello', 'world']", "['hell', ' world']", 'Error'], 0, 'split("o") splits on "o" character.'),
        ('x = [1, 2, 3]\nprint(list(enumerate(x)))', ['[(0, 1), (1, 2), (2, 3)]', '[(1, 1), (2, 2), (3, 3)]', '[0, 1, 2]', 'Error'], 0, 'enumerate() returns (index, value) pairs.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('wo-py-m'), 'whats-output', 'python', 'medium', code, opts, ci, expl))
    return qs

def wo_python_hard(n):
    qs = []
    direct = [
        ('class A:\n    x = []\na1 = A()\na2 = A()\na1.x.append(1)\nprint(a2.x)', ['[1]', '[]', 'Error', 'None'], 0, 'Class variable x is shared between all instances.'),
        ('def outer(x):\n    def inner(y):\n        return x + y\n    return inner\nadd5 = outer(5)\nprint(add5(3))', ['8', '53', '5+3', 'Error'], 0, 'Closure captures x=5. add5(3) = 5+3 = 8.'),
        ('x = [lambda x=x: x for x in range(3)]\nprint([f() for f in x])', ['[0, 1, 2]', '[2, 2, 2]', '[0, 0, 0]', 'Error'], 0, 'Default arg x=x captures current value: 0, 1, 2.'),
        ('class Meta(type):\n    def __new__(cls, name, bases, dct):\n        dct["added"] = True\n        return super().__new__(cls, name, bases, dct)\nclass Base(metaclass=Meta):\n    pass\nprint(Base.added)', ['True', 'False', 'Error', 'None'], 0, 'Metaclass adds "added" attribute during class creation.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('wo-py-h'), 'whats-output', 'python', 'hard', code, opts, ci, expl))
    return qs

# What's Output JS
def wo_js_easy(n):
    qs = []
    direct = [
        ('console.log(1 + 2);', ['3', '"12"', '12', 'Error'], 0, 'Both are numbers, so + adds.'),
        ('console.log("1" + "2");', ['"12"', '3', '1+2', 'Error'], 0, 'String + string concatenates.'),
        ('console.log(10 - "5");', ['5', '"105"', 'NaN', 'Error'], 0, '- converts string to number: 10-5=5.'),
        ('console.log(10 * "5");', ['50', '"105"', 'NaN', 'Error'], 0, '* converts string to number: 10*5=50.'),
        ('console.log(Boolean(0));', ['false', 'true', '0', 'Error'], 0, '0 is falsy. Boolean(0) is false.'),
        ('console.log(Boolean("hello"));', ['true', 'false', '"hello"', 'Error'], 0, 'Non-empty string is truthy.'),
        ('console.log(Number("42"));', ['42', '"42"', 'NaN', 'Error'], 0, 'Number() converts string to number.'),
        ('console.log(String(42));', ['"42"', '42', 'NaN', 'Error'], 0, 'String() converts number to string.'),
        ('console.log([1,2,3].length);', ['3', '2', '4', 'undefined'], 0, 'Arrays have .length property.'),
        ('console.log("hello"[0]);', ['"h"', '"e"', 'undefined', 'Error'], 0, 'Bracket notation accesses characters.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('wo-js-e'), 'whats-output', 'javascript', 'easy', code, opts, ci, expl))
    return qs

def wo_js_medium(n):
    qs = []
    direct = [
        ('console.log([1,2,3].reduce((a,b) => a+b, 0));', ['6', '123', '[1,2,3]', 'Error'], 0, 'reduce sums: 0+1+2+3=6.'),
        ('const obj = {a: 1, b: 2};\nconsole.log(Object.values(obj));', ['[1, 2]', '["a", "b"]', '[["a",1], ["b",2]]', 'Error'], 0, 'Object.values() returns array of values.'),
        ('console.log("hello".slice(1,3));', ['"el"', '"he"', '"ell"', '"hl"'], 0, 'slice(1,3) returns chars at index 1 and 2.'),
        ('console.log([1,2,3].includes(2));', ['true', 'false', '2', '1'], 0, 'includes() checks if value exists.'),
        ('console.log(new Set([1,2,2,3]).size);', ['3', '4', '2', 'Error'], 0, 'Set removes duplicates. Size is 3.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('wo-js-m'), 'whats-output', 'javascript', 'medium', code, opts, ci, expl))
    return qs

def wo_js_hard(n):
    qs = []
    direct = [
        ('console.log((function() { return arguments; })(1,2,3).length);', ['3', '0', 'undefined', 'Error'], 0, 'arguments object has .length = number of passed arguments.'),
        ('const x = 1;\nconst y = (x) => x;\nconsole.log(y(2));', ['2', '1', 'undefined', 'Error'], 0, 'Parameter x shadows outer x. Returns 2.'),
        ('console.log(typeof class {});', ['"function"', '"class"', '"object"', '"undefined"'], 0, 'Classes in JS are syntactic sugar over functions.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('wo-js-h'), 'whats-output', 'javascript', 'hard', code, opts, ci, expl))
    return qs

# What's Output Java, C++, CSS, HTML - generate more
def wo_ja_easy(n):
    qs = []
    direct = [
        ('System.out.println(5 + 5);', ['10', '"55"', '5+5', 'Error'], 0, 'Integer addition.'),
        ('System.out.println("5" + "5");', ['"55"', '10', '"5+5"', 'Error'], 0, 'String concatenation.'),
        ('System.out.println(5 > 3);', ['true', 'false', 'Error', '5'], 0, '5 is greater than 3.'),
        ('System.out.println(10 % 4);', ['2', '4', '2.5', '0'], 0, '10 % 4 = 2 (remainder).'),
        ('System.out.println("java".toUpperCase());', ['"JAVA"', '"java"', '"Java"', 'Error'], 0, 'toUpperCase() converts all letters.'),
        ('System.out.println("Hello".charAt(0));', ['"H"', '"e"', '0', 'Error'], 0, 'charAt(0) returns first character.'),
        ('System.out.println(Math.abs(-5));', ['5', '-5', '0', 'Error'], 0, 'Math.abs() returns absolute value.'),
        ('System.out.println(Math.pow(2, 3));', ['8.0', '8', '6', 'Error'], 0, 'Math.pow returns double: 2^3 = 8.0.'),
        ('System.out.println("hello world".contains("world"));', ['true', 'false', 'Error', 'null'], 0, 'contains() checks if substring exists.'),
        ('System.out.println("  hello  ".trim());', ['"hello"', '"  hello  "', '"hello"', 'Error'], 0, 'trim() removes leading/trailing whitespace.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('wo-ja-e'), 'whats-output', 'java', 'easy', code, opts, ci, expl))
    return qs

def wo_cp_easy(n):
    qs = []
    direct = [
        ('cout << 5 + 3;', ['8', '53', 'Error', '5+3'], 0, 'Integer addition.'),
        ('cout << 10 / 4;', ['2', '2.5', '2.0', 'Error'], 0, 'Integer division truncates.'),
        ('cout << 10 % 3;', ['1', '3', '0', 'Error'], 0, '10 % 3 = 1 (remainder).'),
        ('cout << (5 > 3);', ['1', 'true', '0', 'Error'], 0, 'Boolean prints as 1 (true) by default.'),
        ('string s = "hello";\ncout << s.length();', ['5', '6', '4', 'Error'], 0, '.length() returns character count.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('wo-cp-e'), 'whats-output', 'cpp', 'easy', code, opts, ci, expl))
    return qs

def wo_cs_easy(n):
    qs = []
    direct = [
        ('.box { color: red !important; }\n.box { color: blue; }', ['red — !important wins', 'blue — last wins', 'purple', 'Error'], 0, '!important overrides normal cascade rules.'),
        ('.a { color: red; }\n.a.b { color: blue; }\n<div class="a b">', ['blue — higher specificity', 'red', 'purple', 'Error'], 0, 'Two classes (.a.b) have higher specificity than one (.a).'),
        ('.box {\n  padding: 10px 20px;\n}', ['top/bottom: 10px, left/right: 20px', 'All: 10px 20px', 'top: 10px, right: 20px, bottom: 10px, left: 20px', 'Error'], 3, '2-value shorthand: vertical horizontal, applies to all 4 sides.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('wo-cs-e'), 'whats-output', 'css', 'easy', code, opts, ci, expl))
    return qs

def wo_cs_medium(n):
    qs = []
    direct = [
        ('.box {\n  display: flex;\n  justify-content: space-between;\n}\n/* 3 items inside */', ['Items spread with space between them', 'Items centered', 'Items at start', 'Error'], 0, 'space-between distributes items with equal space between.'),
        ('.box {\n  position: fixed;\n  top: 0;\n  left: 0;\n}', ['Element fixed to top-left of viewport', 'Element at top-left of parent', 'Element scrolls with page', 'Error'], 0, 'position: fixed positions relative to viewport.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('wo-cs-m'), 'whats-output', 'css', 'medium', code, opts, ci, expl))
    return qs

def wo_cs_hard(n):
    qs = []
    direct = [
        ('.box {\n  --size: 50px;\n  width: var(--size);\n  height: var(--size);\n}\n.box:hover {\n  --size: 100px;\n}', ['Box grows from 50px to 100px on hover (with transition)', 'No change on hover', 'Error', 'Box is always 100px'], 0, 'CSS custom properties can be changed on state change.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('wo-cs-h'), 'whats-output', 'css', 'hard', code, opts, ci, expl))
    return qs

def wo_ht_easy(n):
    qs = []
    direct = [
        ('<h1>Hello</h1>', ['Renders "Hello" as a large heading', 'Renders "Hello" as paragraph', 'Error', 'Hidden'], 0, '<h1> is the largest heading element.'),
        ('<p>Hello <em>world</em></p>', ['"world" is emphasized (italic by default)', 'Both words italic', '"world" is bold', 'Error'], 0, '<em> emphasizes text, typically rendered as italic.'),
        ('<a href="https://example.com">Link</a>', ['Renders a clickable link', 'Plain text', 'Error', 'Image'], 0, '<a> with href creates a hyperlink.'),
        ('<br>', ['Creates a line break', 'Creates paragraph break', 'Error', 'Bold text'], 0, '<br> inserts a line break.'),
        ('<hr>', ['Creates a horizontal rule/line', 'Header row', 'Error', 'Heading'], 0, '<hr> creates a thematic break / horizontal line.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('wo-ht-e'), 'whats-output', 'html', 'easy', code, opts, ci, expl))
    return qs

# ═══════════════════════════════════════════════════════
# CODE COMPLETION supplemental generators  
# ═══════════════════════════════════════════════════════

def cc_python_easy(n):
    qs = []
    direct = [
        ('x = ____("3.14")', ['float', 'int', 'str', 'num'], 0, 'float() converts string to float.'),
        ('my_list = [1, 2, 3]\nmy_list.____(4)', ['append', 'add', 'push', 'insert'], 0, 'append() adds element to end of list.'),
        ('if x ____ 5:\n    print("greater")', ['>', '>=', '==', '>>'], 0, '> is the greater-than comparison operator.'),
        ('print(____([3, 1, 2]))', ['sorted', 'sort', 'order', 'arrange'], 0, 'sorted() returns a new sorted list.'),
        ('for item in ____:\n    print(item)', ['my_list', 'each', 'items', 'iterate'], 0, 'for...in iterates over an iterable.'),
        ('x = "hello"\nprint(x.____())', ['upper', 'UPPER', 'toupper', 'capitalize'], 0, '.upper() converts string to uppercase.'),
        ('print(____("hello", "world"))', ['print', 'concat', 'merge', 'join'], 0, 'print() outputs multiple values separated by space.'),
        ('my_dict = {"a": 1}\nprint(my_dict.____("a"))', ['get', 'find', 'fetch', 'retrieve'], 0, '.get() safely retrieves dict value.'),
        ('result = ____([1, 2, 3])', ['sum', 'add', 'total', 'count'], 0, 'sum() adds all elements.'),
        ('print(____(5, 2))', ['divmod', 'divide', 'mod', 'remainder'], 0, 'divmod(5, 2) returns (2, 1).'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-py-e'), 'code-completion', 'python', 'easy', code, opts, ci, expl))
    return qs

def cc_python_medium(n):
    qs = []
    direct = [
        ('evens = [x for x in range(20) if x ____ 2 == 0]', ['%', '/', '//', '**'], 0, '% modulo checks divisibility by 2.'),
        ('from collections import ____\nc = ____("hello")', ['Counter', 'DefaultDict', 'OrderedDict', 'deque'], 0, 'Counter counts occurrences of elements.'),
        ('def decorator(func):\n    def wrapper(*args, **kwargs):\n        print("before")\n        result = func(*args, **kwargs)\n        print("after")\n        return ____\n    return wrapper', ['result', 'func', 'args', 'wrapper'], 0, 'Return the original function\'s result from wrapper.'),
        ('data = [(1, "b"), (3, "a"), (2, "c")]\ndata.sort(key=____ x: x[1])', ['lambda', 'function', 'def', 'fn'], 0, 'lambda creates anonymous function for sort key.'),
        ('try:\n    risky_operation()\nexcept ____:\n    print("Something went wrong")', ['Exception', 'Error', 'catch', 'Throwable'], 0, 'Exception catches all standard exceptions.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-py-m'), 'code-completion', 'python', 'medium', code, opts, ci, expl))
    return qs

def cc_python_hard(n):
    qs = []
    direct = [
        ('class ____:\n    def __iter__(self):\n        return self\n    def __next__(self):\n        raise StopIteration', ['Iterator', 'Generator', 'Iterable', 'Enumerator'], 0, 'Custom iterator needs __iter__ and __next__.'),
        ('import asyncio\nasync def fetch():\n    await ____(1)  # wait 1 second', ['asyncio.sleep', 'time.sleep', 'sleep', 'wait'], 0, 'asyncio.sleep() is the async version of time.sleep().'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-py-h'), 'code-completion', 'python', 'hard', code, opts, ci, expl))
    return qs

def cc_js_easy(n):
    qs = []
    direct = [
        ('console.log(____.floor(3.7));', ['Math', 'Number', 'Int', 'Integer'], 0, 'Math.floor() rounds down.'),
        ('const arr = [1, 2, 3];\nconsole.log(arr.____);', ['length', 'size', 'count', 'len'], 0, 'Arrays have .length property.'),
        ('const s = "hello";\nconsole.log(s.____());', ['toUpperCase', 'upper', 'toUpper', 'UPPER'], 0, '.toUpperCase() converts to uppercase.'),
        ('console.log(____(JSON.stringify({a: 1})));', ['JSON.parse', 'JSON.decode', 'eval', 'Object.parse'], 0, 'JSON.parse() converts JSON string to object.'),
        ('const arr = [1, 2, 3];\narr.____(4);', ['push', 'add', 'append', 'insert'], 0, 'push() adds element to end of array.'),
        ('console.log("hello".____("l"))', ['indexOf', 'findIndex', 'search', 'locate'], 0, 'indexOf() returns position of first occurrence.'),
        ('const now = new ____();', ['Date', 'Time', 'DateTime', 'Moment'], 0, 'new Date() creates current date/time.'),
        ('console.log(____.random());', ['Math', 'Number', 'Random', 'Math.random'], 0, 'Math.random() returns random number 0-1.'),
        ('const arr = [1, 2, 3];\nconsole.log(arr.____(x => x * 2));', ['map', 'forEach', 'transform', 'apply'], 0, 'map() creates new array by transforming each element.'),
        ('console.log(____.PI);', ['Math', 'Number', 'Const', 'Float'], 0, 'Math.PI is the constant pi.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-js-e'), 'code-completion', 'javascript', 'easy', code, opts, ci, expl))
    return qs

def cc_js_medium(n):
    qs = []
    direct = [
        ('const result = await ____("https://api.example.com/data");', ['fetch', 'get', 'request', 'http'], 0, 'fetch() makes HTTP requests.'),
        ('const unique = [...new ____([1, 2, 2, 3])];', ['Set', 'Array', 'Map', 'List'], 0, 'new Set() removes duplicates.'),
        ('const {____} = require("express");', ['Router', 'Server', 'App', 'Handler'], 0, 'express.Router() creates modular route handlers.'),
        ('class Dog ____ Animal { }', ['extends', 'implements', 'inherits', 'from'], 0, 'extends keyword for class inheritance.'),
        ('try {\n  risky();\n} ____ (error) {\n  console.error(error);\n}', ['catch', 'except', 'handle', 'rescue'], 0, 'try/catch handles exceptions in JavaScript.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-js-m'), 'code-completion', 'javascript', 'medium', code, opts, ci, expl))
    return qs

def cc_js_hard(n):
    qs = []
    direct = [
        ('const ____ = new Proxy(target, handler);', ['proxy', 'Proxy', 'Proxied', 'Watched'], 0, 'Proxy constructor wraps an object with custom behavior.'),
        ('class MyArray ____ Array { }', ['extends', 'from', 'of', 'inherit'], 0, 'extends Array for custom array behavior.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-js-h'), 'code-completion', 'javascript', 'hard', code, opts, ci, expl))
    return qs

def cc_ja_easy(n):
    qs = []
    direct = [
        ('System.out.____("Hello");', ['println', 'print', 'write', 'output'], 0, 'println() prints with newline.'),
        ('String s = "hello";\nString upper = s.____();', ['toUpperCase', 'upper', 'toUpperCase()', 'Upper'], 0, '.toUpperCase() converts string.'),
        ('int[] arr = {5, 3, 1};\nArrays.____(arr);', ['sort', 'sorted', 'order', 'arrange'], 0, 'Arrays.sort() sorts in place.'),
        ('if (s != null && s.____("hello")) {', ['equals', '==', '===', 'contains'], 0, '.equals() compares string content.'),
        ('Map<String, Integer> map = new ____<>();', ['HashMap', 'ArrayList', 'HashSet', 'TreeMap'], 0, 'HashMap is the common Map implementation.'),
        ('List<String> list = new ____<>();', ['ArrayList', 'LinkedList', 'HashMap', 'Vector'], 0, 'ArrayList is the most common List implementation.'),
        ('for (int i = 0; i < arr.____; i++) {', ['length', 'size()', 'count', 'len'], 0, 'Arrays use .length (property, not method).'),
        ('String result = String.____(42);', ['valueOf', 'valueOf()', 'parse', 'from'], 0, 'String.valueOf() converts to string.'),
        ('import java.util.____;', ['ArrayList', 'Array', 'List', 'Collection'], 0, 'ArrayList is in java.util package.'),
        ('try {\n    risky();\n} ____ (Exception e) {', ['catch', 'except', 'handle', 'rescue'], 0, 'catch block handles exceptions.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-ja-e'), 'code-completion', 'java', 'easy', code, opts, ci, expl))
    return qs

def cc_ja_medium(n):
    qs = []
    direct = [
        ('list.stream().____(s -> s.length() > 3).collect(Collectors.toList());', ['filter', 'map', 'find', 'select'], 0, 'filter() keeps elements matching predicate.'),
        ('list.stream().____(String::toUpperCase).collect(Collectors.toList());', ['map', 'filter', 'transform', 'apply'], 0, 'map() transforms each element.'),
        ('Optional<String> opt = Optional.____(null);', ['ofNullable', 'of', 'empty', 'from'], 0, 'ofNullable() handles potentially null values safely.'),
        ('list.____(item -> System.out.println(item));', ['forEach', 'map', 'iterate', 'loop'], 0, 'forEach() performs action on each element.'),
        ('String result = list.stream().____(Collectors.joining(","));', ['collect', 'reduce', 'combine', 'merge'], 0, 'collect() reduces stream to desired form.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-ja-m'), 'code-completion', 'java', 'medium', code, opts, ci, expl))
    return qs

def cc_ja_hard(n):
    qs = []
    direct = [
        ('CompletableFuture<String> future = CompletableFuture.____Async(() -> fetchData());', ['supply', 'run', 'call', 'execute'], 0, 'supplyAsync() starts async computation with return value.'),
        ('<T> List<T> filter(List<T> list, ____<T> predicate) {', ['Predicate', 'Function', 'Consumer', 'Supplier'], 0, 'Predicate<T> tests a condition on type T.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-ja-h'), 'code-completion', 'java', 'hard', code, opts, ci, expl))
    return qs

def cc_cp_easy(n):
    qs = []
    direct = [
        ('#include <____>\nusing namespace std;', ['iostream', 'stdio.h', 'string', 'cmath'], 0, 'iostream provides cin/cout.'),
        ('vector<int> v;\nv.____(42);', ['push_back', 'add', 'append', 'insert'], 0, 'push_back() adds to end of vector.'),
        ('cout << ____(3.7);', ['floor', 'int', 'round', 'trunc'], 0, 'floor() from <cmath> rounds down.'),
        ('string s = "hello";\ncout << s.____();', ['length', 'len', 'size_of', 'count'], 0, '.length() or .size() returns string length.'),
        ('int* p = ____ int[10];', ['new', 'malloc', 'alloc', 'create'], 0, 'new allocates heap memory.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-cp-e'), 'code-completion', 'cpp', 'easy', code, opts, ci, expl))
    return qs

def cc_cs_easy(n):
    qs = []
    direct = [
        ('.center {\n  display: ____;\n  justify-content: center;\n  align-items: center;\n}', ['flex', 'block', 'grid', 'inline'], 0, 'Flexbox centers content.'),
        ('.box {\n  ____-sizing: border-box;\n}', ['box', 'content', 'margin', 'padding'], 0, 'box-sizing: border-box includes padding in width.'),
        ('.responsive {\n  max-width: 100%;\n  height: ____;\n}', ['auto', '100%', '0', 'inherit'], 0, 'height: auto maintains aspect ratio.'),
        ('a:____ {\n  color: purple;\n}', ['visited', 'after', 'before', 'click'], 0, ':visited styles visited links.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-cs-e'), 'code-completion', 'css', 'easy', code, opts, ci, expl))
    return qs

def cc_cs_medium(n):
    qs = []
    direct = [
        ('@____ (min-width: 768px) {\n  .desktop { display: block; }\n}', ['media', 'screen', 'query', 'breakpoint'], 0, '@media defines responsive breakpoints.'),
        ('.grid {\n  display: grid;\n  grid-template-____: repeat(3, 1fr);\n}', ['columns', 'rows', 'areas', 'cells'], 0, 'grid-template-columns defines columns.'),
        ('.fade {\n  ____: opacity 0.3s ease;\n}', ['transition', 'animation', 'transform', 'effect'], 0, 'transition defines smooth property changes.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-cs-m'), 'code-completion', 'css', 'medium', code, opts, ci, expl))
    return qs

def cc_ht_easy(n):
    qs = []
    direct = [
        ('<____ href="https://example.com">Link</____>', ['a', 'link', 'url', 'href'], 0, '<a> creates hyperlinks.'),
        ('<____ src="image.jpg" alt="Photo">', ['img', 'image', 'picture', 'photo'], 0, '<img> embeds images.'),
        ('<____>Heading</____>', ['h1', 'heading', 'title', 'head'], 0, '<h1> creates top-level heading.'),
        ('<____ type="submit">Submit</____>', ['button', 'input', 'submit', 'btn'], 0, '<button> creates clickable buttons.'),
        ('<____>Item 1</____>', ['li', 'item', 'list', 'entry'], 0, '<li> defines list items.'),
        ('<____>\n  <li>A</li>\n  <li>B</li>\n</____>', ['ul', 'ol', 'list', 'menu'], 0, '<ul> creates unordered list.'),
        ('<____>\n  <tr><td>Data</td></tr>\n</____>', ['table', 'grid', 'data', 'sheet'], 0, '<table> creates data tables.'),
        ('<____ rel="stylesheet" href="styles.css">', ['link', 'style', 'css', 'import'], 0, '<link> includes external CSS.'),
        ('<____ charset="UTF-8">', ['meta', 'head', 'charset', 'encoding'], 0, '<meta charset> declares character encoding.'),
        ('<____ action="/submit" method="POST">', ['form', 'input', 'submit', 'data'], 0, '<form> creates submission forms.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-ht-e'), 'code-completion', 'html', 'easy', code, opts, ci, expl))
    return qs

def cc_ht_medium(n):
    qs = []
    direct = [
        ('<____ name="viewport" content="width=device-width, initial-scale=1">', ['meta', 'link', 'viewport', 'responsive'], 0, '<meta name="viewport"> enables responsive design.'),
        ('<____>\n  <caption>Data</caption>\n  <thead><tr><th>H</th></tr></thead>\n</____>', ['table', 'grid', 'data', 'list'], 0, '<table> with semantic elements.'),
        ('<____ for="email">Email</____>\n<input id="email" type="email">', ['label', 'caption', 'title', 'text'], 0, '<label> with for attribute links to input.'),
    ]
    for code, opts, ci, expl in direct:
        qs.append(q(nid('cc-ht-m'), 'code-completion', 'html', 'medium', code, opts, ci, expl))
    return qs

# Generate all supplemental questions
generators = {
    ('bug-hunter', 'python', 'easy'): bh_python_easy,
    ('bug-hunter', 'python', 'medium'): bh_python_medium,
    ('bug-hunter', 'python', 'hard'): bh_python_hard,
    ('bug-hunter', 'javascript', 'easy'): bh_js_easy,
    ('bug-hunter', 'javascript', 'medium'): bh_js_medium,
    ('bug-hunter', 'javascript', 'hard'): bh_js_hard,
    ('bug-hunter', 'java', 'easy'): bh_ja_easy,
    ('bug-hunter', 'java', 'medium'): bh_ja_medium,
    ('bug-hunter', 'java', 'hard'): bh_ja_hard,
    ('bug-hunter', 'cpp', 'easy'): bh_cp_easy,
    ('bug-hunter', 'cpp', 'medium'): bh_cp_medium,
    ('bug-hunter', 'cpp', 'hard'): bh_cp_hard,
    ('bug-hunter', 'css', 'easy'): bh_cs_easy,
    ('bug-hunter', 'css', 'medium'): bh_cs_medium,
    ('bug-hunter', 'css', 'hard'): bh_cs_hard,
    ('bug-hunter', 'html', 'easy'): bh_ht_easy,
    ('bug-hunter', 'html', 'medium'): bh_ht_medium,
    ('bug-hunter', 'html', 'hard'): bh_ht_hard,
    ('whats-output', 'python', 'easy'): wo_python_easy,
    ('whats-output', 'python', 'medium'): wo_python_medium,
    ('whats-output', 'python', 'hard'): wo_python_hard,
    ('whats-output', 'javascript', 'easy'): wo_js_easy,
    ('whats-output', 'javascript', 'medium'): wo_js_medium,
    ('whats-output', 'javascript', 'hard'): wo_js_hard,
    ('whats-output', 'java', 'easy'): wo_ja_easy,
    ('whats-output', 'cpp', 'easy'): wo_cp_easy,
    ('whats-output', 'css', 'easy'): wo_cs_easy,
    ('whats-output', 'css', 'medium'): wo_cs_medium,
    ('whats-output', 'css', 'hard'): wo_cs_hard,
    ('whats-output', 'html', 'easy'): wo_ht_easy,
    ('code-completion', 'python', 'easy'): cc_python_easy,
    ('code-completion', 'python', 'medium'): cc_python_medium,
    ('code-completion', 'python', 'hard'): cc_python_hard,
    ('code-completion', 'javascript', 'easy'): cc_js_easy,
    ('code-completion', 'javascript', 'medium'): cc_js_medium,
    ('code-completion', 'javascript', 'hard'): cc_js_hard,
    ('code-completion', 'java', 'easy'): cc_ja_easy,
    ('code-completion', 'java', 'medium'): cc_ja_medium,
    ('code-completion', 'java', 'hard'): cc_ja_hard,
    ('code-completion', 'cpp', 'easy'): cc_cp_easy,
    ('code-completion', 'css', 'easy'): cc_cs_easy,
    ('code-completion', 'css', 'medium'): cc_cs_medium,
    ('code-completion', 'html', 'easy'): cc_ht_easy,
    ('code-completion', 'html', 'medium'): cc_ht_medium,
}

for key, gen_func in generators.items():
    game, lang, diff = key
    needed = TARGET  # We'll generate what we can
    new_qs = gen_func(needed)
    supplemental.extend(new_qs)

print(f"Generated {len(supplemental)} supplemental questions")

# Save supplemental as JSON for merging
with open("/home/z/my-project/scripts/supplemental.json", "w") as f:
    json.dump(supplemental, f, indent=2)

print("Saved to scripts/supplemental.json")
