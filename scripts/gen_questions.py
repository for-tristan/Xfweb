#!/usr/bin/env python3
"""
Generate ~100 questions per difficulty per language per game for the X.Foundry game bank.
Output: src/lib/gameQuestions.ts
Total: 3 games × 6 languages × 3 difficulties × ~100 = ~5,400 questions
"""

import json, os, random

GAMES = ['bug-hunter', 'whats-output', 'code-completion']
LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'css', 'html']
DIFFICULTIES = ['easy', 'medium', 'hard']

counter = 0

def nid(prefix):
    global counter
    counter += 1
    return f"{prefix}{counter}"

def q(id, game, lang, diff, code, options, correct, explanation):
    return {
        "id": id, "game": game, "language": lang, "difficulty": diff,
        "code": code, "options": options, "correctIndex": correct, "explanation": explanation
    }

questions = []

# ═══════════════════════════════════════════════════════
# BUG HUNTER — PYTHON
# ═══════════════════════════════════════════════════════

# --- Easy ---
bh_py_easy = [
    ('def add(a, b):\n    return a - b\n\nprint(add(3, 5))', ['return a + b', 'return a * b', 'return a / b', 'return a // b'], 0, 'The function is named "add" but uses subtraction instead of addition.'),
    ('name = "Alice"\nprint("Hello " + nam)', ['print("Hello " + name)', 'print("Hello " + namE)', 'print("Hello" + name)', 'print(Hello + name)'], 0, 'Variable is "name" but the print uses "nam" — a typo causing a NameError.'),
    ('for i in range(5)\n    print(i)', ['for i in range(5):', 'for i in range(5);', 'for (i in range(5)):', 'for i in range(5) {'], 0, 'Python for loops require a colon (:) at the end of the line.'),
    ('if x = 5:\n    print("x is five")', ['if x == 5:', 'if x === 5:', 'if x := 5:', 'if x equals 5:'], 0, 'Single = is assignment. For comparison, use double ==.'),
    ('my_list = [1, 2, 3]\nprint(my_list[3])', ['print(my_list[2])', 'print(my_list[-1])', 'Both A and B', 'print(my_list[3]) is correct'], 2, 'Index 3 is out of range for a 3-element list. Use index 2 or -1.'),
    ('def greet(name)\n    return "Hello " + name', ['def greet(name):', 'def greet(name);', 'def greet(name) ->', 'def greet[name]:'], 0, 'Python function definitions require a colon after the parameter list.'),
    ('x = 10\nif x > 5\n    print("big")', ['if x > 5:', 'if x > 5;', 'if (x > 5):', 'if x > 5 then:'], 0, 'Python if statements require a colon at the end of the condition.'),
    ('while True\n    print("loop")', ['while True:', 'while True;', 'while (True):', 'while True do:'], 0, 'Python while loops require a colon after the condition.'),
    ('def square(n)\nreturn n * n', ['return n * n  (needs indentation)', 'return n * n;', 'return n**2', 'Both A and C'], 0, 'The return statement must be indented inside the function body.'),
    ('print("Hello World")\nprint("Goodbye")\n    print("Oops")', ['Remove the indentation from the third print', 'Indent all lines', 'Add a colon after print', 'Use print() instead'], 0, 'Unexpected indentation — Python uses indentation to define blocks.'),
    ('my_dict = {"a": 1, "b": 2}\nprint(my_dict["c"])', ['Use my_dict.get("c", default)', 'Use my_dict["c"] is correct', 'Use my_dict.c', 'Use my_dict.get["c"]'], 0, 'Accessing a key that does not exist raises KeyError. Use .get() with a default.'),
    ('list1 = [1, 2, 3]\nlist2 = list1\nlist2.append(4)\nprint(list1)', ['list2 = list1.copy()', 'list2 = list1[:]', 'Both A and B', 'list2 = list1 is correct'], 2, 'list2 = list1 creates a reference. Use .copy() or slicing to create a new list.'),
    ('def double(x):\n    return x * 2\n\nprint(double)', ['print(double(5))', 'double.call(5)', 'double[5]', 'double->5'], 0, 'double without parentheses is the function object, not the result. Call it with double(5).'),
    ('age = "25"\nresult = age + 5', ['result = int(age) + 5', 'result = age + "5"', 'result = age + str(5)', 'result = float(age) + 5'], 0, 'Cannot concatenate str and int. Convert age to int first with int(age).'),
    ('if len(my_list) > 0:\n    print("not empty")\nelse:\n    print("empty")\n    print("always?")', ['The last print should not be indented under else', 'The code is correct', 'Use elif instead', 'Remove the else block'], 0, 'The last print is indented under else, so it only runs when the list is empty.'),
    ('for i in range(10):\n    if i == 5\n        break', ['if i == 5:', 'if i = 5:', 'if i === 5:', 'if i is 5:'], 0, 'Python if statements require a colon. Also use == for comparison.'),
    ('def multiply(a, b)\n    return a * b', ['def multiply(a, b):', 'def multiply(a, b);', 'function multiply(a, b):', 'def multiply[a, b]:'], 0, 'Python function definitions require a colon after the parameter list.'),
    ('my_string = "Hello"\nmy_string[0] = "h"', ['Strings are immutable — use my_string = "h" + my_string[1:]', 'my_string[0] = "h" is correct', 'Use my_string.replace(0, "h")', 'Use my_string.set(0, "h")'], 0, 'Python strings are immutable. You cannot assign to individual characters.'),
    ('try:\n    x = 1 / 0\nexcept:\n    pass\nfinally\n    print("done")', ['finally:', 'finally;', 'finally {', 'end try:'], 0, 'The finally clause requires a colon, just like try and except.'),
    ('class Dog:\n    def __init__(self, name)\n        self.name = name', ['def __init__(self, name):', 'def __init__(self, name);', 'def __init__[self, name]:', 'def init(self, name):'], 0, 'The __init__ method needs a colon after the parameter list.'),
    ('numbers = [1, 2, 3, 4, 5]\nprint(numbers[-6])', ['Use a valid index like numbers[0] or numbers[-5]', 'numbers[-6] returns 1', 'numbers[-6] returns 5', 'Use numbers[6]'], 0, 'Index -6 is out of range for a 5-element list. Valid negative indices are -1 to -5.'),
    ('x = 5\nif x = 10:\n    print("ten")', ['if x == 10:', 'if x = 10 is correct', 'if x equals 10:', 'if x := 10:'], 0, 'Single = is assignment in Python, not comparison. Use == for equality check.'),
    ('def greet():\n    return "Hello"\n\ngreet = greet()', ['Rename the variable to avoid shadowing the function', 'The code is correct', 'Use greet.call()', 'Use greet() = result'], 0, 'greet = greet() overwrites the function with its return value. Use a different variable name.'),
    ('my_tuple = (1, 2, 3)\nmy_tuple[1] = 99', ['Tuples are immutable — use a list instead', 'my_tuple[1] = 99 is correct', 'Use my_tuple.set(1, 99)', 'Use my_tuple.replace(1, 99)'], 0, 'Tuples cannot be modified after creation. Use a list if you need mutability.'),
    ('print(len(42))', ['print(len(str(42)))', 'print(42.__len__())', 'len(42) returns 2', 'len(42) returns 1'], 0, 'len() does not work on integers. Convert to string first or use a different approach.'),
    ('result = 10 / 0\nprint(result)', ['Add: try/except ZeroDivisionError', 'result = 10 // 0', 'result = 10 % 0', 'Use math.inf'], 0, 'Division by zero raises ZeroDivisionError. Handle it with try/except.'),
    ('def add(a, b)\n    sum = a + b\n    return sum', ['def add(a, b):', 'def add(a, b);', 'def add[a, b]:', 'function add(a, b):'], 0, 'Function definition is missing a colon after the parameter list.'),
    ('numbers = [1, 2, 3]\nprint(numbers.length)', ['print(len(numbers))', 'print(numbers.len())', 'print(numbers.size)', 'print(count(numbers))'], 0, 'Python lists use len() not .length. Use len(numbers).'),
    ('import maths\nprint(maths.sqrt(16))', ['import math', 'import Maths', 'import mathematics', 'from math import sqrt only'], 0, 'The module is called "math" not "maths". Python uses the American spelling.'),
    ('for i in range(5):\nprint(i)', ['print(i) needs indentation', 'for i in range(5): is wrong', 'Use print(i) inside parentheses', 'Add semicolons'], 0, 'The print statement must be indented inside the for loop body.'),
    ('if x > 5 and x < 10:\n    print("between")\nelif x > 10 or x < 5\n    print("outside")', ['elif x > 10 or x < 5:', 'elif x > 10 or x < 5;', 'else if x > 10 or x < 5:', 'elif (x > 10 or x < 5):'], 0, 'elif statements also require a colon at the end, just like if.'),
    ('my_list = [1, 2, 3]\nmy_list.append(4, 5)', ['my_list.append(4) then my_list.append(5)', 'my_list.append(4, 5) is correct', 'Use my_list.extend([4, 5])', 'Both A and C'], 3, 'append() takes exactly one argument. Use extend() for multiple items or append one at a time.'),
    ('def is_even(n):\n    if n % 2 == 0:\n        return True\n    return False', ['The code works but could be: return n % 2 == 0', 'return False should be return True', 'if n % 2 == 0 should be if n / 2 == 0', 'The function has a bug'], 0, 'While the code works, it is unnecessarily verbose. Simply: return n % 2 == 0'),
    ('print(type(10 / 2))', ['<class \'float\'>', '<class \'int\'>', '<class \'double\'>', 'Error'], 0, 'In Python 3, the / operator always returns a float, even for integer division.'),
    ('name = input("Enter name: ")\nage = input("Enter age: ")\nprint(name + " is " + age + " years old")\nresult = age + 5', ['result = int(age) + 5', 'result = age + 5 is correct', 'result = str(age) + 5', 'result = float(age + 5)'], 0, 'input() returns a string. To do arithmetic, convert to int: int(age) + 5.'),
    ('def outer():\n    x = 10\n    def inner():\n        x = x + 1\n        return x\n    return inner()', ['Use nonlocal x in inner()', 'Use global x in inner()', 'x = x + 1 is correct', 'Use self.x'], 0, 'inner() tries to modify x from outer() without declaring nonlocal. Add: nonlocal x.'),
    ('try:\n    file = open("data.txt")\n    content = file.read()\nfinally:\n    file.close()', ['Use with open("data.txt") as file:', 'The code is correct', 'Move close() inside try', 'Use file.close before finally'], 0, 'While this works, using "with" is the Pythonic way to handle files (auto-closes).'),
    ('nums = [1, 2, 3, 4, 5]\nfor i in range(len(nums)):\n    print(nums[i+1])', ['Use range(len(nums)-1) or range(len(nums)) with nums[i]', 'The code is correct', 'Use range(1, len(nums)+1)', 'Use for n in nums:'], 0, 'i+1 will go out of bounds on the last iteration. Use nums[i] or range(len(nums)-1).'),
    ('x = [1, 2, 3]\ny = x\ny[0] = 99\nprint(x)', ['x will be [99, 2, 3] — y = x creates a reference', 'x will be [1, 2, 3]', 'y will be [1, 2, 3]', 'Error'], 0, 'Lists are mutable and assigned by reference. Modifying y also modifies x.'),
    ('def func(a=1, b):\n    return a + b', ['Non-default argument b cannot follow default argument a', 'The code is correct', 'Swap: def func(b, a=1)', 'Both A and C'], 3, 'In Python, parameters with defaults must come after parameters without defaults.'),
    ('my_set = {1, 2, 3}\nmy_set[0]', ['Sets are unordered — convert to list first: list(my_set)[0]', 'my_set[0] returns 1', 'Use my_set.get(0)', 'Use my_set.first()'], 0, 'Sets are unordered and do not support indexing. Convert to a list first.'),
    ('for item in my_list:\n    my_list.remove(item)', ['Create a copy: for item in my_list[:]:', 'The code is correct', 'Use my_list.delete(item)', 'Use my_list.pop()'], 0, 'Modifying a list while iterating over it causes issues. Iterate over a copy instead.'),
    ('def greet(name="World"):\n    print("Hello " + name)\n\ngreet(name="Alice", "Extra")', ['greet("Alice") or greet(name="Alice")', 'The code is correct', 'Use greet(*"Alice", "Extra")', 'Swap arguments'], 0, 'Cannot use positional arguments after keyword arguments. Pass greet("Alice") simply.'),
    ('x = "5"\ny = 3\nprint(x + y)', ['print(int(x) + y)', 'print(x + str(y))', 'Both A and B work differently', 'print(x + y) is correct'], 2, 'Cannot add str and int. Either convert both to int for math or both to str for concat.'),
    ('def count():\n    total = 0\n    for i in range(10):\n        total =+ 1\n    return total', ['total += 1 (not =+)', 'total =+ 1 is correct', 'total = total + 1 is wrong', 'Use total++'], 0, '=+ assigns positive 1 each time (total always = 1). Use += to increment.'),
    ('class Person:\n    def __init__(self):\n        name = "Alice"', ['self.name = "Alice"', 'name = "Alice" is correct', 'Use Person.name = "Alice"', 'Use __name = "Alice"'], 0, 'name = "Alice" creates a local variable, not an instance attribute. Use self.name.'),
    ('import os\nprint(os.path.joins("folder", "file.txt"))', ['os.path.join("folder", "file.txt")', 'os.path.joins is correct', 'os.join("folder", "file.txt")', 'os.path.combine("folder", "file.txt")'], 0, 'The method is os.path.join() not os.path.joins().'),
    ('my_list = []\nif my_list:\n    print("not empty")\nelse if not my_list:\n    print("empty")', ['Use elif instead of else if', 'else if is correct in Python', 'Use elseif', 'Use else: if not my_list:'], 0, 'Python uses "elif" not "else if" as a single keyword for chained conditions.'),
    ('print(math.pi)', ['import math first', 'math.pi is built-in', 'Use Math.PI', 'Use PI'], 0, 'math module must be imported before using math.pi.'),
    ('result = "hello".replace("l", "r", 1)\nprint(result)', ['This is correct — outputs "herlo"', 'replace() takes 2 args only', 'Outputs "herro"', 'Error'], 0, 'Actually this code is correct! replace(old, new, count) limits replacements. This is a trick question.'),
    ('def greet(name, greeting="Hello"):\n    return greeting + " " + name\n\nprint(greet(greeting="Hi"))', ['Missing required argument: greet("Alice", greeting="Hi")', 'The code is correct', 'Use greet(greeting="Hi", name)', 'Use greet(None, "Hi")'], 0, 'name is a required parameter. Must provide it: greet("Alice", greeting="Hi").'),
    ('def add(a, b): return a + b\n\ndef add(a, b, c): return a + b + c\n\nprint(add(1, 2))', ['Python does not support method overloading — second definition overrides first', 'Outputs 3', 'Outputs error about missing c', 'Both definitions coexist'], 0, 'Python does not support function overloading. The second add() replaces the first.'),
    ('with open("file.txt", "w") as f:\n    f.writeline("Hello")', ['f.write("Hello")', 'f.writeline is correct', 'f.print("Hello")', 'f.writeln("Hello")'], 0, 'The method is f.write() not f.writeline(). For lines with newlines: f.write("Hello\\n").'),
    ('numbers = [1, 2, 3, 4, 5]\neven = filter(lambda x: x % 2 == 0, numbers)\nprint(even[0])', ['Convert to list first: list(filter(...))[0]', 'even[0] returns 2', 'Use filter[0]', 'Use next(even)'], 0, 'filter() returns an iterator, not a list. Use list() or next() to access elements.'),
    ('x = 5\nif x > 3:\n    pass\nelif x > 4:\n    print("greater than 4")', ['elif should be if (since x > 4 is also true but elif won\'t check it)', 'The code outputs "greater than 4"', 'pass should be continue', 'elif is correct'], 0, 'Since x > 3 is true, the elif is never checked. This is a logic bug, not syntax.'),
    ('my_dict = {"name": "Alice"}\nprint(my_dict.name)', ['Use my_dict["name"] or my_dict.get("name")', 'my_dict.name is correct', 'Use my_dict->name', 'Use my_dict{name}'], 0, 'Dictionary values are accessed with brackets, not dot notation.'),
    ('x = "hello world"\nprint(x.capitalize())', ['Outputs "Hello world" — this is correct', 'Outputs "Hello World"', 'Error', 'Outputs "HELLO WORLD"'], 0, 'capitalize() only capitalizes the first character. Use title() for each word.'),
    ('def func(*args, **kwargs):\n    print(args[1])\n\nfunc(a=1, b=2)', ['No positional args passed — args is empty, args[1] raises IndexError', 'Outputs 2', 'Outputs 1', 'Outputs b'], 0, 'Keyword arguments go to kwargs, not args. args would be empty, causing IndexError.'),
    ('print(3 ** 2 ** 0)', ['3', '9', '1', '0'], 0, '** is right-associative: 2**0=1, then 3**1=3.'),
    ('x = 5\ny = x + 2\nx = 10\nprint(y)', ['7', '12', '5', 'Error'], 0, 'y was assigned when x was 5, so y=7. Changing x later does not affect y.'),
    ('def outer():\n    x = 1\n    def inner():\n        x = 2\n    inner()\n    print(x)\n\nouter()', ['1', '2', 'Error', 'None'], 0, 'inner() creates its own local x=2, not modifying outer\'s x. Use nonlocal to modify.'),
    ('my_list = [1, [2, 3], 4]\nmy_list[1] = [5, 6]\nprint(my_list)', ['[1, [5, 6], 4]', '[1, 5, 6, 4]', '[1, [2, 3], 4]', 'Error'], 0, 'Assigning to my_list[1] replaces the nested list. The outer list is modified.'),
    ('a = {1, 2, 3}\nb = {3, 4, 5}\nprint(a & b)', ['{3}', '{1, 2, 4, 5}', '{1, 2, 3, 4, 5}', 'Error'], 0, '& operator on sets returns the intersection: elements common to both.'),
    ('x = "123"\nprint(x.isnumeric())', ['True', 'False', 'Error', 'None'], 0, 'isnumeric() returns True if all characters in the string are numeric.'),
    ('print("Hello".find("x"))', ['-1', '0', 'Error', 'None'], 0, 'find() returns -1 when the substring is not found, not an error.'),
    ('try:\n    x = int("abc")\nexcept ValueError:\n    print("invalid")\nexcept:\n    print("error")', ['Outputs "invalid"', 'Outputs "error"', 'Both catch blocks run', 'Error'], 0, 'int("abc") raises ValueError, caught by the first specific except block.'),
    ('def add(a, b=2, c=3):\n    return a + b + c\n\nprint(add(1))', ['6', '3', 'Error', '1'], 0, 'add(1) uses defaults: a=1, b=2, c=3 → 1+2+3=6.'),
    ('x = [1, 2, 3]\ny = x[:]\ny[0] = 99\nprint(x[0])', ['1', '99', 'Error', 'None'], 0, 'x[:] creates a shallow copy, so modifying y does not affect x.'),
    ('print(bool(0))', ['False', 'True', '0', 'Error'], 0, '0 is falsy in Python. bool(0) returns False.'),
    ('print("hello".count("l"))', ['2', '1', '3', '0'], 0, 'count() returns the number of occurrences. "hello" has 2 "l" characters.'),
    ('print(sorted([3, 1, 2], reverse=True))', ['[3, 2, 1]', '[1, 2, 3]', 'Error', 'None'], 0, 'sorted() with reverse=True sorts in descending order.'),
    ('x = {"a": 1}\ny = x.copy()\ny["a"] = 2\nprint(x["a"])', ['1', '2', 'Error', 'None'], 0, '.copy() creates a shallow copy, so modifying y does not affect x.'),
    ('print("hello world".split())', ["['hello', 'world']", "['hello world']", "('hello', 'world')", 'Error'], 0, 'split() with no argument splits on whitespace.'),
    ('x = 5\nprint(f"x is {x}")', ['x is 5', 'x is {x}', 'Error', 'x is x'], 0, 'f-strings evaluate expressions inside curly braces.'),
    ('print(list(range(2, 10, 3)))', ['[2, 5, 8]', '[2, 5, 8, 11]', '[3, 6, 9]', '[2, 5]'], 0, 'range(2, 10, 3) starts at 2, step 3: 2, 5, 8 (stops before 10).'),
    ('a = [1, 2, 3]\nb = [4, 5, 6]\nprint(a + b)', ['[1, 2, 3, 4, 5, 6]', '[5, 7, 9]', 'Error', '[[1,2,3],[4,5,6]]'], 0, 'The + operator concatenates lists.'),
    ('print("abcde"[1:4])', ['bcd', 'abc', 'abcd', 'bc'], 0, 'Slicing [1:4] gets indices 1, 2, 3 (exclusive end).'),
    ('x = 10\nprint(type(x))', ["<class 'int'>", "<class 'float'>", "<class 'number'>", "10"], 0, '10 is an integer literal in Python.'),
    ('def test():\n    global x\n    x = 10\n\ntest()\nprint(x)', ['10', 'NameError', 'None', '0'], 0, 'global x makes the function modify the global variable x.'),
    ('print("Hello\\nWorld")', ['Hello\\nWorld on two lines', 'Hello World', 'HelloWorld', 'Error'], 0, '\\n is a newline character, so the output spans two lines.'),
    ('my_list = [1, 2, 3, 4, 5]\nprint(my_list[::2])', ['[1, 3, 5]', '[2, 4]', '[1, 2, 3]', '[5, 3, 1]'], 0, '[::2] takes every second element starting from index 0.'),
    ('print(max([1, 5, 3, 9, 2]))', ['9', '5', '1', 'Error'], 0, 'max() returns the largest element in the iterable.'),
    ('x = [1, 2, 3]\nprint(sum(x))', ['6', '123', 'Error', '[1,2,3]'], 0, 'sum() adds all elements in the iterable.'),
    ('print("hello".upper())', ['HELLO', 'hello', 'Hello', 'Error'], 0, '.upper() converts all characters to uppercase.'),
    ('x = {"a": 1, "b": 2}\nprint("a" in x)', ['True', 'False', '1', 'Error'], 0, 'The "in" operator checks keys in a dictionary.'),
    ('print(round(3.7))', ['4', '3', '3.7', 'Error'], 0, 'round() rounds to the nearest integer. 3.7 rounds to 4.'),
    ('def greet(name="World"):\n    print(f"Hello, {name}!")\n\ngreet()', ['Hello, World!', 'Hello, !', 'Error', 'Hello, name!'], 0, 'When no argument is passed, the default value "World" is used.'),
    ('print(len({"a": 1, "b": 2}))', ['2', '4', 'Error', '1'], 0, 'len() on a dict returns the number of key-value pairs.'),
    ('x = "hello"\nprint(x[::-1])', ['olleh', 'hello', 'h', 'Error'], 0, '[::-1] reverses a string (or any sequence).'),
    ('a = {1, 2, 3}\nb = {2, 3, 4}\nprint(a | b)', ['{1, 2, 3, 4}', '{1}', '{2, 3}', 'Error'], 0, '| operator on sets returns the union of both sets.'),
    ('x = 5\nprint(isinstance(x, str))', ['False', 'True', 'Error', 'None'], 0, '5 is an int, not a str. isinstance() returns False.'),
    ('print("hello world".title())', ['Hello World', 'Hello world', 'HELLO WORLD', 'hello world'], 0, 'title() capitalizes the first letter of each word.'),
]

for code, opts, ci, expl in bh_py_easy:
    questions.append(q(nid('bh-py-e'), 'bug-hunter', 'python', 'easy', code, opts, ci, expl))

# --- Medium ---
bh_py_medium = [
    ('def count_items(lst):\n    count = 0\n    for item in lst:\n        count =+ 1\n    return count', ['count += 1', 'count = count + 1', 'Both A and B', 'count ++'], 2, '"=+" assigns +1, not incrementing. Both "count += 1" and "count = count + 1" fix it.'),
    ('def merge_dicts(a, b):\n    result = a\n    result.update(b)\n    return result\n\noriginal = {"x": 1}\nprint(merge_dicts(original, {"y": 2}))\nprint(original)', ['result = a.copy()', 'result = dict(a)', 'Both A and B', 'result = {**a}'], 2, 'result = a creates a reference, mutating the original. .copy() or dict(a) creates a new dict.'),
    ('def flatten(nested):\n    result = []\n    for sublist in nested:\n        for item in sublist:\n            result.append(sublist)\n    return result', ['result.append(item)', 'result.extend(sublist)', 'result += sublist', 'Both B and C'], 0, 'The inner loop appends "sublist" instead of "item".'),
    ('def remove_duplicates(lst):\n    return list(set(lst))\n\ndata = [3, 1, 4, 1, 5, 9, 2, 6, 5]\nresult = remove_duplicates(data)\nprint(result[0])  # Expected: 3', ['Use dict.fromkeys(lst) to preserve order', 'Use sorted(set(lst))', 'The code is correct', 'Use set then sort'], 0, 'set() doesn\'t preserve insertion order. dict.fromkeys() preserves order.'),
    ('class Counter:\n    count = 0\n    def increment(self):\n        self.count += 1\n        return self.count\n\na = Counter()\nb = Counter()\na.increment()\nprint(b.count)', ['count should be initialized in __init__', 'Use Counter.__count', 'self.count is wrong', 'b.count returns 1 is correct'], 0, 'count is a class variable shared by all instances.'),
    ('def fibonacci(n):\n    cache = {0: 0, 1: 1}\n    def fib(n):\n        if n not in cache:\n            cache[n] = fib(n-1) + fib(n-2)\n        return cache[n]\n    return fib(n)\n\nprint(fibonacci(-1))', ['Add: if n < 0: raise ValueError', 'Change base case', 'Use iterative approach', 'Add memoization'], 0, 'No guard for negative n causes infinite recursion.'),
    ('def throttle(max_calls, period):\n    calls = []\n    def decorator(func):\n        def wrapper(*args, **kwargs):\n            now = time.time()\n            calls[:] = [c for c in calls if now - c < period]\n            if len(calls) >= max_calls:\n                raise Exception("Rate limited")\n            calls.append(now)\n            return func(*args, **kwargs)\n        return wrapper\n    return decorator', ['calls is shared across all decorated functions', 'Use a dict instead of list', 'The code is correct', 'Use nonlocal calls'], 0, 'The calls list is shared between ALL functions decorated with throttle.'),
    ('def safe_divide(a, b):\n    try:\n        return a / b\n    except:\n        return 0', ['Catch specific exception: except ZeroDivisionError:', 'The code is correct', 'Add finally clause', 'Use except Exception:'], 0, 'Bare except catches everything including KeyboardInterrupt. Be specific.'),
    ('def get_item(lst, index):\n    return lst[index]\n\nprint(get_item([1,2,3], 5))', ['Add bounds check: if 0 <= index < len(lst)', 'The code is correct', 'Use lst.get(index)', 'Use try/except'], 0, 'Index 5 is out of bounds. Add validation before accessing.'),
    ('class BankAccount:\n    def __init__(self, balance=0):\n        self._balance = balance\n    \n    def withdraw(self, amount):\n        self._balance -= amount\n        return self._balance', ['Add: if amount > self._balance: raise ValueError', 'The code is correct', 'Use self.balance instead', 'Add a fee calculation'], 0, 'No check for insufficient funds. Should prevent negative balance.'),
    ('def process_data(data):\n    result = []\n    for item in data:\n        if item is not None:\n            result.append(item.strip())\n    return result\n\nprint(process_data(["hello", None, "world"]))', ['Call .strip() only on strings: isinstance(item, str)', 'The code is correct', 'Use item.strip() is safe', 'Replace None with ""'], 0, 'is not None check passes for non-string objects that lack .strip(). Use isinstance().'),
    ('def calculate_average(numbers):\n    total = 0\n    for num in numbers:\n        total += num\n    return total / len(numbers)', ['Handle empty list: if not numbers: return 0', 'The code is correct', 'Use sum() instead', 'Add try/except'], 0, 'If numbers is empty, len() is 0, causing ZeroDivisionError.'),
    ('def read_config(filename):\n    f = open(filename)\n    data = f.read()\n    f.close()\n    return data', ['Use with open(filename) as f:', 'The code is correct', 'Add try/finally', 'Both A and C'], 3, 'If an error occurs before close(), the file stays open. Use with or try/finally.'),
    ('def merge_lists(list1, list2):\n    result = list1\n    result.extend(list2)\n    return result\n\na = [1, 2]\nprint(merge_lists(a, [3, 4]))\nprint(a)', ['result = list1.copy() or list(list1)', 'The code is correct', 'Use result = list1[:]', 'Both A and C'], 3, 'result = list1 creates a reference. Modifying it modifies the original.'),
    ('def find_max(numbers):\n    max_val = 0\n    for num in numbers:\n        if num > max_val:\n            max_val = num\n    return max_val\n\nprint(find_max([-5, -3, -1]))', ['Initialize: max_val = numbers[0] or float("-inf")', 'The code is correct', 'Use max() built-in', 'Both A and C'], 3, 'If all numbers are negative, max_val=0 is wrong. Initialize to first element or -inf.'),
    ('class ShoppingCart:\n    items = []\n    def add_item(self, item):\n        self.items.append(item)', ['Initialize items in __init__ as instance attribute', 'items = [] is correct', 'Use class items', 'Use self.items = [] in add_item'], 0, 'items is a class variable shared by all ShoppingCart instances.'),
    ('def parse_int(s):\n    try:\n        return int(s)\n    except:\n        return None\n\nprint(parse_int("123"))\nprint(parse_int("abc"))', ['Use except ValueError: instead of bare except', 'The code is correct', 'Return 0 instead of None', 'Use isdigit() check'], 0, 'Bare except catches too broadly. Use except ValueError for int() conversion.'),
    ('def get_value(d, key, default=None):\n    if key in d:\n        return d[key]\n    elif default:\n        return default\n    return None', ['Use: return d.get(key, default)', 'The code is correct', 'elif default: fails when default=0 or default=False', 'Use try/except'], 2, 'elif default: is falsy for default=0, False, or empty string. Should be: elif default is not None.'),
    ('def chunk_list(lst, size):\n    return [lst[i:i+size] for i in range(0, len(lst), size)]\n\nprint(chunk_list([1,2,3,4,5], 0))', ['Add: if size <= 0: raise ValueError', 'The code is correct', 'Use while loop', 'Return empty list'], 0, 'size=0 causes infinite range or empty chunks. Validate the size parameter.'),
    ('def flatten_dict(d, parent_key="", sep="."):\n    items = []\n    for k, v in d.items():\n        new_key = f"{parent_key}{sep}{k}" if parent_key else k\n        if isinstance(v, dict):\n            items.extend(flatten_dict(v, new_key, sep).items())\n        else:\n            items.append((new_key, v))\n    return dict(items)', ['The code is correct for nested dict flattening', 'Use recursion incorrectly', 'Missing base case', 'Use stack instead'], 0, 'This is actually a correct implementation for flattening nested dictionaries.'),
    ('def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid\n        else:\n            high = mid\n    return -1', ['low = mid + 1 and high = mid - 1', 'low = mid is correct', 'Use mid = (low + high) / 2', 'The code is correct'], 0, 'Without +1/-1, the loop can get stuck when low=mid or high=mid.'),
    ('def is_palindrome(s):\n    return s == s[::-1]\n\nprint(is_palindrome("Racecar"))', ['Normalize: s = s.lower() before comparison', 'The code is correct', 'Use s.lower() == s.lower()[::-1]', 'Both A and C'], 3, '"Racecar" reversed is "racecaR" which is not equal. Normalize case first.'),
    ('def remove_none(lst):\n    for item in lst:\n        if item is None:\n            lst.remove(item)\n    return lst\n\nprint(remove_none([1, None, 2, None, 3]))', ['Use list comprehension: [x for x in lst if x is not None]', 'The code is correct', 'Use filter()', 'Both A and C'], 3, 'Removing items while iterating can skip elements. Use list comprehension or filter.'),
    ('def connect_db(host, port=5432, db="postgres"):\n    return f"Connecting to {host}:{port}/{db}"\n\nprint(connect_db("localhost", db="mydb"))', ['This is correct — uses keyword argument to skip port', 'Must provide port', 'Error: missing argument', 'Use connect_db("localhost", 5432, "mydb")'], 0, 'Keyword arguments allow skipping default parameters. This is correct Python.'),
    ('class Vector:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n    \n    def __add__(self, other):\n        return Vector(self.x + other.x, self.y + other.y)\n\nv1 = Vector(1, 2)\nv2 = Vector(3, 4)\nprint(v1 + v2)', ['Add __repr__ or __str__ to see readable output', 'The code is correct', 'Use v1.add(v2)', 'Error'], 0, '__add__ works but the result prints as a memory address without __repr__ or __str__.'),
    ('def retry(func, max_retries=3):\n    for i in range(max_retries):\n        try:\n            return func()\n        except Exception:\n            continue\n    raise Exception("Max retries exceeded")', ['Add delay between retries: time.sleep()', 'The code is correct', 'Use while loop', 'Log failures'], 0, 'Retrying immediately without delay can hammer a failing service. Add exponential backoff.'),
    ('def unique_ordered(lst):\n    seen = set()\n    result = []\n    for item in lst:\n        if item not in seen:\n            seen.add(item)\n            result.append(item)\n    return result', ['The code is correct — preserves order while removing duplicates', 'Use list(set(lst))', 'Use dict.fromkeys()', 'Both A and C are valid approaches'], 0, 'This is a correct implementation for order-preserving deduplication.'),
    ('class LinkedList:\n    def __init__(self):\n        self.head = None\n    \n    def append(self, value):\n        new_node = Node(value)\n        if not self.head:\n            self.head = new_node\n            return\n        current = self.head\n        while current:\n            current = current.next\n        current.next = new_node', ['while current.next: (not while current:)', 'The code is correct', 'Use recursion', 'Use for loop'], 0, 'while current: goes to None, then current.next fails. Use while current.next:.'),
    ('def download_file(url):\n    response = requests.get(url)\n    with open("file.txt", "w") as f:\n        f.write(response.text)', ['Check response.status_code == 200 before writing', 'The code is correct', 'Add timeout parameter', 'Both A and C'], 3, 'Should verify the response status and add a timeout to requests.get().'),
    ('def format_name(name):\n    return name.strip().title()\n\nprint(format_name(None))', ['Add None check: if name is None: return ""', 'The code is correct', 'Use str(name)', 'Use name or ""'], 0, 'Calling .strip() on None raises AttributeError. Add a None guard.'),
]

for code, opts, ci, expl in bh_py_medium:
    questions.append(q(nid('bh-py-m'), 'bug-hunter', 'python', 'medium', code, opts, ci, expl))

# --- Hard ---
bh_py_hard = [
    ('class Counter:\n    count = 0\n    def increment(self):\n        self.count += 1\n        return self.count\n\na = Counter()\nb = Counter()\na.increment()\nprint(b.count)', ['count should be initialized in __init__', 'Use Counter.__count', 'self.count is wrong', 'b.count returns 1 is correct'], 0, 'count is a class variable shared by all instances.'),
    ('def throttle(max_calls, period):\n    calls = []\n    def decorator(func):\n        def wrapper(*args, **kwargs):\n            now = time.time()\n            calls[:] = [c for c in calls if now - c < period]\n            if len(calls) >= max_calls:\n                raise Exception("Rate limited")\n            calls.append(now)\n            return func(*args, **kwargs)\n        return wrapper\n    return decorator', ['calls is shared across all decorated functions', 'Use a dict instead of list', 'The code is correct', 'Use nonlocal calls'], 0, 'The calls list is shared between ALL decorated functions.'),
    ('class Singleton:\n    _instance = None\n    def __new__(cls):\n        if cls._instance is None:\n            cls._instance = super().__new__(cls)\n        return cls._instance', ['Not thread-safe — add threading.Lock', 'The code is correct', 'Use a module instead', 'Use __init__'], 0, 'Two threads could both see _instance as None and create two instances.'),
    ('def memoize(func):\n    cache = {}\n    def wrapper(*args):\n        if args not in cache:\n            cache[args] = func(*args)\n        return cache[args]\n    return wrapper', ['args is unhashable for mutable arguments like lists — use **kwargs handling', 'The code is correct', 'Use functools.lru_cache', 'Both A and C'], 3, 'Lists/dicts as args cause TypeError. lru_cache handles this better.'),
    ('class Property:\n    def __init__(self, getter):\n        self.getter = getter\n        self.setter = None\n    \n    def __set_name__(self, owner, name):\n        self.name = name\n    \n    def __get__(self, obj, objtype=None):\n        if obj is None:\n            return self\n        return self.getter(obj)', ['Missing __set__ for a full property descriptor', 'The code is correct', 'Use @property decorator', 'Both A and C'], 3, 'Without __set__, the property is read-only. Use @property or add __set__.'),
    ('import threading\n\nclass SharedCounter:\n    def __init__(self):\n        self.value = 0\n    \n    def increment(self):\n        self.value += 1', ['Use threading.Lock or atomic operations', 'The code is correct', 'Use multiprocessing', 'Use asyncio'], 0, 'self.value += 1 is not atomic. Race conditions can occur with multiple threads.'),
    ('def deep_copy(obj):\n    if isinstance(obj, dict):\n        return {k: deep_copy(v) for k, v in obj.items()}\n    elif isinstance(obj, list):\n        return [deep_copy(item) for item in obj]\n    return obj', ['Missing handling for sets, tuples, and custom objects', 'The code is correct', 'Use copy.deepcopy()', 'Both A and C'], 3, 'This only handles dict/list. Use copy.deepcopy() for complete deep copying.'),
    ('class Observable:\n    def __init__(self):\n        self._observers = []\n    \n    def subscribe(self, observer):\n        self._observers.append(observer)\n    \n    def notify(self, event):\n        for observer in self._observers:\n            observer(event)', ['No unsubscribe method — observers can never be removed', 'The code is correct', 'Use weak references', 'Both A and C'], 3, 'Without unsubscribe, observers are kept forever (memory leak). Weak refs also help.'),
    ('def async_fetch(urls):\n    results = []\n    for url in urls:\n        response = requests.get(url)\n        results.append(response.json())\n    return results', ['Use asyncio/aiohttp for concurrent requests', 'The code is correct', 'Use threading', 'Use multiprocessing'], 0, 'Sequential requests are slow. Use async for concurrent I/O.'),
    ('class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef serialize(root):\n    if not root:\n        return "null"\n    return f"{root.val},{serialize(root.left)},{serialize(root.right)}"', ['Missing deserialize function to reconstruct the tree', 'The code is correct', 'Use JSON format', 'Use BFS instead'], 0, 'Serialization without deserialization is incomplete. Both are needed.'),
]

for code, opts, ci, expl in bh_py_hard:
    questions.append(q(nid('bh-py-h'), 'bug-hunter', 'python', 'hard', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# BUG HUNTER — JAVASCRIPT
# ═══════════════════════════════════════════════════════

bh_js_easy = [
    ('function greet(name) {\n  return "Hello " + Name;\n}\nconsole.log(greet("Alice"));', ['return "Hello " + name;', 'return "Hello " + nane;', 'return Hello + name;', 'return "Hello" + name;'], 0, 'JavaScript is case-sensitive. "Name" is not "name".'),
    ('const arr = [1, 2, 3];\narr.push(4);\narr = [5, 6];', ['Change const to let', 'Remove arr = [5, 6]', 'Use arr.concat instead', 'Both A and B fix different issues'], 3, 'const prevents reassignment. Either use let, or remove the reassignment.'),
    ('if (x = 10) {\n  console.log("x is ten");\n}', ['if (x === 10)', 'if (x == 10)', 'if (x := 10)', 'Both A or B work, A is preferred'], 3, '= is assignment. Use === (strict) or == (loose) for comparison.'),
    ('let nums = [1, 2, 3, 4, 5];\nlet doubled = nums.map(n => { n * 2 });\nconsole.log(doubled);', ['nums.map(n => n * 2)', 'nums.map(n => { return n * 2; })', 'Both A and B', 'nums.map(function(n) n * 2)'], 2, 'Curly braces without return make the arrow function return undefined.'),
    ('console.log(typeof null);', ['"object"', '"null"', '"undefined"', '"boolean"'], 0, 'typeof null returns "object" — a famous JavaScript bug.'),
    ('console.log("5" + 3);', ['"53"', '8', '"53" or 8 depending on context', 'Error'], 0, '+ with a string concatenates. "5" + 3 = "53".'),
    ('let a = [1, 2, 3];\nlet b = a;\nb.push(4);\nconsole.log(a.length);', ['4', '3', 'undefined', 'Error'], 0, 'Arrays are reference types. b = a makes both point to the same array.'),
    ('console.log(0.1 + 0.2 === 0.3);', ['false', 'true', 'undefined', 'NaN'], 0, '0.1 + 0.2 = 0.30000000000000004 due to floating-point precision.'),
    ('function test() {\n  console.log(this);\n}\nconst obj = { method: test };\nobj.method();', ['this refers to obj', 'this refers to window', 'this is undefined', 'Error'], 0, 'When called as obj.method(), this refers to obj.'),
    ('const obj = { a: 1 };\nObject.freeze(obj);\nobj.a = 2;\nconsole.log(obj.a);', ['1', '2', 'undefined', 'Error'], 0, 'Object.freeze() prevents modification. Assignment silently fails in non-strict mode.'),
    ('let x = 5;\nlet x = 10;\nconsole.log(x);', ['Cannot redeclare let variable — use let x = 5; then x = 10;', '10', '5', 'Error in strict mode only'], 0, 'let does not allow redeclaration in the same scope. Use x = 10 without let.'),
    ('console.log([] == false);', ['true', 'false', 'Error', 'undefined'], 0, '[] coerces to "" then 0, false coerces to 0. 0 == 0 is true.'),
    ('var x = 1;\nfunction foo() {\n  console.log(x);\n  var x = 2;\n}\nfoo();', ['undefined (hoisting)', '1', '2', 'Error'], 0, 'var x is hoisted to the top of the function, so console.log sees undefined.'),
    ('console.log(NaN === NaN);', ['false', 'true', 'NaN', 'Error'], 0, 'NaN is not equal to anything, including itself. Use Number.isNaN().'),
    ('let arr = [1, 2, 3];\ndelete arr[1];\nconsole.log(arr.length);', ['3', '2', 'undefined', 'Error'], 0, 'delete removes the element but leaves a hole. Array length stays 3.'),
    ('console.log(typeof undefined);', ['"undefined"', '"object"', '"null"', '"boolean"'], 0, 'typeof undefined is "undefined".'),
    ('console.log("hello"[0]);', ['"h"', '"hello"', 'undefined', 'Error'], 0, 'Strings support bracket notation for character access in modern JavaScript.'),
    ('const x = 5;\nx = 10;', ['Assignment to const variable — use let instead', 'x becomes 10', 'Error only in strict mode', 'x remains 5'], 0, 'const variables cannot be reassigned. Use let if you need to reassign.'),
    ('console.log(1 + "2" + 3);', ['"123"', '6', '"15"', '123'], 0, '1 + "2" = "12" (concat), then "12" + 3 = "123" (concat).'),
    ('function sum(a, b) {\n  return\n  a + b;\n}', ['Move return and a + b to the same line', 'The code is correct', 'Use return (a + b)', 'Both A and C'], 3, 'ASI inserts semicolon after return. Must put value on same line or use parentheses.'),
]

for code, opts, ci, expl in bh_js_easy:
    questions.append(q(nid('bh-js-e'), 'bug-hunter', 'javascript', 'easy', code, opts, ci, expl))

bh_js_medium = [
    ('const obj = { a: 1, b: 2 };\nconst copy = obj;\ncopy.a = 99;\nconsole.log(obj.a);', ['obj.a is 99 — use spread: const copy = {...obj}', 'obj.a is 1', 'obj.a is undefined', 'Error'], 0, 'Objects are assigned by reference. Use spread or Object.assign for shallow copy.'),
    ('async function fetchUser(id) {\n  const response = fetch(`/api/users/${id}`);\n  const data = response.json();\n  return data;\n}', ['Add await before fetch and .json()', 'Add await before fetch only', 'Add await before .json() only', 'Use .then() chain'], 0, 'Both fetch() and .json() return Promises. Both need await.'),
    ('const arr = [1, 2, 3, 4, 5];\nconst result = arr.filter(x => x > 2).sort((a, b) => a - b);\nresult.push(6);\nconsole.log(arr.length);', ['arr.length is 5 — filter creates new array', 'arr.length is 6', 'arr.length is 3', 'Error'], 0, 'filter() returns a new array. Mutating result doesn\'t affect arr.'),
    ('function Counter() {\n  this.count = 0;\n  this.increment = () => {\n    this.count++;\n  };\n}\nconst c = new Counter();\nconst inc = c.increment;\ninc();\nconsole.log(c.count);', ['c.count is 1 — arrow function binds this correctly', 'c.count is 0', 'c.count is undefined', 'Error'], 0, 'Arrow functions capture this from enclosing scope.'),
    ('class Animal {\n  constructor(name) {\n    this.name = name;\n  }\n  speak() {\n    return this.name + " makes a noise";\n  }\n}\nclass Dog extends Animal {\n  speak() {\n    return this.name + " barks";\n  }\n}\nconst d = new Dog("Rex");\nd.speak();', ['This code is correct — returns "Rex barks"', 'super.speak() must be called first', 'constructor is missing in Dog', 'this.name is undefined'], 0, 'This is valid JS inheritance. Dog overrides speak().'),
    ('const obj = { a: 1, b: 2 };\nfor (let key in obj) {\n  console.log(key);\n}', ['Logs "a" then "b"', 'Logs 1 then 2', 'Logs undefined', 'Error'], 0, 'for...in iterates over enumerable keys (strings), not values.'),
    ('let arr = [1, 2, 3];\narr.forEach((item, i) => {\n  if (item === 2) arr.splice(i, 1);\n});\nconsole.log(arr);', ['Use filter instead: arr = arr.filter(x => x !== 2)', 'The code is correct', 'Use arr.delete(2)', 'Use arr.remove(2)'], 0, 'Modifying array during forEach can skip elements. Use filter() instead.'),
    ('const promise = new Promise((resolve, reject) => {\n  throw new Error("failed");\n  resolve("success");\n});', ['resolve after throw is unreachable — but the error is caught by the Promise', 'resolve runs anyway', 'Both throw and resolve execute', 'Error propagates'], 0, 'throw inside Promise constructor rejects the promise. resolve is never reached.'),
    ('const a = { x: 1 };\nconst b = { x: 1 };\nconsole.log(a === b);', ['false — different object references', 'true — same properties', 'Error', 'undefined'], 0, 'Two objects with same properties are not equal by reference.'),
    ('console.log([..."hello"]);', ['["h", "e", "l", "l", "o"]', '["hello"]', '[104, 101, 108, 108, 111]', 'Error'], 0, 'Spread operator on a string creates an array of individual characters.'),
    ('setTimeout(() => console.log(1), 0);\nPromise.resolve().then(() => console.log(2));\nconsole.log(3);', ['3, 2, 1', '1, 2, 3', '3, 1, 2', '1, 3, 2'], 0, 'Microtasks (Promise) run before macrotasks (setTimeout).'),
    ('const user = { name: "Alice" };\nObject.seal(user);\nuser.name = "Bob";\nuser.age = 30;\nconsole.log(user.name, user.age);', ['"Bob" undefined — seal allows edits but not additions', '"Alice" undefined', '"Bob" 30', 'Error'], 0, 'Object.seal() allows modifying existing properties but prevents adding new ones.'),
    ('let a = [1, 2, 3];\nlet b = [1, 2, 3];\nconsole.log(a == b);', ['false — arrays compared by reference', 'true — same values', 'Error', 'undefined'], 0, 'Arrays are objects and compared by reference, not value.'),
    ('function foo() {\n  return\n  { bar: "hello" };\n}\nconsole.log(foo());', ['undefined — ASI inserts semicolon after return', '{ bar: "hello" }', '"hello"', 'Error'], 0, 'JavaScript inserts a semicolon after return. The object literal is never returned.'),
    ('const [a, , c] = [1, 2, 3];\nconsole.log(a, c);', ['1 3', '1 2', '2 3', 'undefined undefined'], 0, 'Destructuring with a skip (,) ignores the second element.'),
]

for code, opts, ci, expl in bh_js_medium:
    questions.append(q(nid('bh-js-m'), 'bug-hunter', 'javascript', 'medium', code, opts, ci, expl))

bh_js_hard = [
    ('function createFunctions() {\n  var funcs = [];\n  for (var i = 0; i < 3; i++) {\n    funcs.push(function() { return i; });\n  }\n  return funcs;\n}\nvar fns = createFunctions();\nconsole.log(fns[0]());', ['Use let instead of var in the for loop', 'Use IIFE', 'Both A and B', 'Use forEach'], 2, 'var is function-scoped, all closures share the same i. let or IIFE fixes this.'),
    ('const debounce = (fn, ms) => {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(fn(...args), ms);\n  };\n};', ['timer = setTimeout(() => fn(...args), ms);', 'timer = setTimeout(fn, ms, ...args);', 'Both A and B', 'timer = setTimeout(fn.apply(this, args), ms);'], 2, 'fn(...args) calls fn immediately. Wrap in arrow function or pass args to setTimeout.'),
    ('class EventEmitter {\n  constructor() {\n    this.events = {};\n  }\n  on(event, listener) {\n    if (!this.events[event]) this.events[event] = [];\n    this.events[event].push(listener);\n  }\n  emit(event, ...args) {\n    this.events[event].forEach(listener => listener(...args));\n  }\n}', ['Add null check in emit: if (!this.events[event]) return;', 'Use for loop', 'The code is correct', 'Add off() method'], 0, 'emit() crashes if event has no listeners.'),
    ('class MyArray extends Array {\n  last() {\n    return this[this.length - 1];\n  }\n}\nconst arr = new MyArray(1, 2, 3);\nconst filtered = arr.filter(x => x > 1);\nconsole.log(filtered.last);', ['filtered is a regular Array, not MyArray — override Symbol.species', 'The code is correct', 'Use arr.last() instead', 'filtered.last returns 3'], 0, 'Built-in methods return Array instances, not MyArray. Override Symbol.species.'),
    ('const obj = new Proxy({}, {\n  get(target, prop) {\n    return target[prop];\n  }\n});\nconsole.log(obj.foo.bar);', ['Add check: if (target[prop] === undefined) return {} or throw', 'The code is correct', 'Use Reflect.get', 'Use has trap'], 0, 'Accessing .bar on undefined throws TypeError. Need to handle undefined properties.'),
    ('async function processData() {\n  const data = await fetchData();\n  const result = await process(data);\n  return result;\n}', ['Run independent awaits concurrently: Promise.all([fetchData(), ...])', 'The code is correct', 'Use callbacks', 'Use generators'], 0, 'Sequential awaits are slow if operations are independent. Use Promise.all().'),
    ('function deepClone(obj) {\n  return JSON.parse(JSON.stringify(obj));\n}\n\nconst obj = { date: new Date(), fn: () => {} };\nconst clone = deepClone(obj);', ['JSON.stringify loses Date objects (becomes strings) and functions (omitted)', 'The code is correct', 'Use Object.assign', 'Use spread operator'], 0, 'JSON serialization loses Dates, functions, undefined, and circular references.'),
    ('class PubSub {\n  constructor() {\n    this.subscribers = {};\n  }\n  subscribe(event, callback) {\n    if (!this.subscribers[event]) this.subscribers[event] = [];\n    this.subscribers[event].push(callback);\n  }\n  publish(event, data) {\n    this.subscribers[event].forEach(cb => cb(data));\n  }\n}', ['No unsubscribe, no error handling in publish, callbacks are not weak refs', 'The code is correct', 'Use EventTarget instead', 'Use RxJS'], 0, 'Missing: unsubscribe, try/catch around callbacks, and weak references for memory safety.'),
    ('function memoize(fn) {\n  const cache = new Map();\n  return function(...args) {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    return result;\n  };\n}', ['JSON.stringify can collide for different args and fails on circular refs', 'The code is correct', 'Use WeakMap', 'Use Object keys'], 0, 'JSON.stringify({a:1,b:2}) === JSON.stringify({b:2,a:1}) is false. Also circular refs fail.'),
    ('const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));\n\nasync function retry(fn, retries = 3) {\n  while (retries--) {\n    try {\n      return await fn();\n    } catch (e) {\n      if (!retries) throw e;\n    }\n  }\n}', ['Add exponential backoff: await sleep(2 ** (3 - retries) * 1000)', 'The code is correct', 'Use recursive approach', 'Use Promise.race'], 0, 'Retrying without delay hammers the service. Add exponential backoff.'),
]

for code, opts, ci, expl in bh_js_hard:
    questions.append(q(nid('bh-js-h'), 'bug-hunter', 'javascript', 'hard', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# BUG HUNTER — JAVA
# ═══════════════════════════════════════════════════════

bh_ja_easy = [
    ('public class Main {\n  public static void main(String[] args) {\n    String s = "Hello";\n    if (s = "Hello") {\n      System.out.println("Hi");\n    }\n  }\n}', ['if (s.equals("Hello"))', 'if (s == "Hello")', 'if (s := "Hello")', 'if (s === "Hello")'], 0, 'Single = is assignment in Java. Use .equals() for String comparison.'),
    ('int[] arr = {1, 2, 3};\nfor (int i = 1; i <= arr.length; i++) {\n  System.out.println(arr[i]);\n}', ['for (int i = 0; i < arr.length; i++)', 'for (int i = 0; i <= arr.length; i++)', 'for (int i = 1; i < arr.length; i++)', 'for (int i = 0; i < arr.length - 1; i++)'], 0, 'Arrays are 0-indexed. Start at 0, go up to (not including) length.'),
    ('public static int add(int a, int b) {\n  int sum = a + b;\n}', ['Add: return sum;', 'Change to: return a + b;', 'Both A and B work', 'Add: System.out.println(sum);'], 2, 'Method declares int return but has no return statement.'),
    ('String name = null;\nSystem.out.println(name.length());', ['Check: if (name != null)', 'Use: Optional.ofNullable(name)', 'Both A and B', 'Use name?.length()'], 2, 'Calling .length() on null throws NullPointerException.'),
    ('double result = 10 / 3;\nSystem.out.println(result);', ['double result = 10.0 / 3;', 'double result = (double) 10 / 3;', 'Both A and B', 'double result = 10 / 3.0;'], 2, '10 / 3 is integer division = 3. Either operand must be double.'),
    ('String s = "hello";\ns = s + " world";\nSystem.out.println(s);', ['This code is correct — strings are immutable but s can be reassigned', 's is still "hello"', 'Error', 's is "helloworld"'], 0, 'Strings are immutable but the reference variable s can be reassigned.'),
    ('int x = 5;\nif (x = 5) {\n  System.out.println("five");\n}', ['if (x == 5)', 'if (x = 5) is correct', 'if (x.equals(5))', 'if (x === 5)'], 0, 'In Java, = is assignment. Use == for comparison.'),
    ('public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello World")\n  }\n}', ['Add semicolon after println statement', 'The code is correct', 'Add closing brace', 'Remove public'], 0, 'Java statements must end with a semicolon.'),
    ('int[] numbers = new int[5];\nSystem.out.println(numbers[5]);', ['Use numbers[4] (last valid index)', 'numbers[5] returns 0', 'numbers[5] returns null', 'The code is correct'], 0, 'Array of size 5 has indices 0-4. Index 5 is out of bounds.'),
    ('if ("hello" == "hello") {\n  System.out.println("equal");\n}', ['Works due to string interning, but should use .equals()', 'Always correct', 'Error', 'Never works'], 0, '== compares references. Works for literals due to interning but .equals() is correct.'),
    ('public void method() {\n  return "hello";\n}', ['Method is void — cannot return a value', 'The code is correct', 'Change void to String', 'Both A and C'], 3, 'void methods cannot return a value. Either change return type or remove return value.'),
    ('boolean result = "5" == 5;', ['Use "5".equals(String.valueOf(5)) or Integer.parseInt("5") == 5', 'The code is correct', 'result is true', 'Compilation error'], 0, 'Cannot compare String with int using ==. Different types.'),
    ('int x = 10;\nint y = 0;\nint z = x / y;', ['Add: if (y != 0) before division', 'z is infinity', 'z is 0', 'z is null'], 0, 'Division by zero with integers throws ArithmeticException.'),
    ('String[] names = {"Alice", "Bob"};\nSystem.out.println(names.length());', ['Use names.length (without parentheses)', 'names.length() is correct', 'Use names.size()', 'Use names.count()'], 0, 'Arrays use .length (a property), not .length() (a method).'),
    ('public class Person {\n  String name;\n  public Person(String name) {\n    name = name;\n  }\n}', ['this.name = name;', 'Change parameter name', 'Use setName(name)', 'name = this.name;'], 0, 'name = name assigns the parameter to itself (shadowing). Use this.name.'),
]

for code, opts, ci, expl in bh_ja_easy:
    questions.append(q(nid('bh-ja-e'), 'bug-hunter', 'java', 'easy', code, opts, ci, expl))

bh_ja_medium = [
    ('List<String> list = new ArrayList<>();\nlist.add("A");\nlist.add("B");\nfor (String item : list) {\n  if (item.equals("A")) {\n    list.remove(item);\n  }\n}', ['Use Iterator.remove() or list.removeIf()', 'The code is correct', 'Use list.delete()', 'Collect to remove later'], 0, 'Removing during for-each causes ConcurrentModificationException.'),
    ('public boolean equals(Object other) {\n  if (other instanceof Person) {\n    Person p = (Person) other;\n    return this.name.equals(p.name);\n  }\n  return false;\n}', ['Add null check and override hashCode()', 'The code is correct', 'Use getClass() instead', 'Only add null check'], 0, 'equals() should check for null, and hashCode() must be overridden.'),
    ('try {\n  FileReader fr = new FileReader("data.txt");\n} catch (Exception e) {\n  e.printStackTrace();\n} finally {\n  fr.close();\n}', ['Declare fr before try or use try-with-resources', 'The code is correct', 'Move close() inside try', 'Use catch instead of finally'], 0, 'fr is scoped to try block and inaccessible in finally.'),
    ('public class Stack {\n  private int[] data = new int[10];\n  private int size = 0;\n  public void push(int val) {\n    data[size] = val;\n    size++;\n  }\n  public int pop() {\n    size--;\n    return data[size];\n  }\n}', ['Add bounds check in both push and pop', 'Only check push', 'Only check pop', 'The code is correct'], 0, 'No bounds checking — push can overflow, pop can go negative.'),
    ('class Singleton {\n  private static Singleton instance;\n  private Singleton() {}\n  public static Singleton getInstance() {\n    if (instance == null) {\n      instance = new Singleton();\n    }\n    return instance;\n  }\n}', ['Make synchronized or use double-checked locking with volatile', 'The code is correct', 'Use enum', 'Both A and C are valid'], 3, 'Not thread-safe. Synchronize, use enum, or double-checked locking.'),
]

for code, opts, ci, expl in bh_ja_medium:
    questions.append(q(nid('bh-ja-m'), 'bug-hunter', 'java', 'medium', code, opts, ci, expl))

bh_ja_hard = [
    ('ExecutorService executor = Executors.newFixedThreadPool(5);\nfor (int i = 0; i < 100; i++) {\n  executor.execute(() -> {\n    sharedCounter++;\n  });\n}\nexecutor.shutdown();', ['Use AtomicInteger or synchronized block', 'The code is correct', 'Use ReentrantLock', 'Both A and C'], 0, 'sharedCounter++ is not atomic. Use AtomicInteger or synchronization.'),
    ('class Singleton {\n  private static Singleton instance;\n  private Singleton() {}\n  public static Singleton getInstance() {\n    if (instance == null) {\n      instance = new Singleton();\n    }\n    return instance;\n  }\n}', ['Use double-checked locking with volatile, or enum', 'The code is correct', 'Use synchronized method', 'Both A and C'], 3, 'Not thread-safe. Multiple threads could create instances.'),
]

for code, opts, ci, expl in bh_ja_hard:
    questions.append(q(nid('bh-ja-h'), 'bug-hunter', 'java', 'hard', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# BUG HUNTER — C++
# ═══════════════════════════════════════════════════════

bh_cp_easy = [
    ('int arr[5];\nfor (int i = 0; i <= 5; i++) {\n  arr[i] = i * 2;\n}', ['i < 5 or i <= 4', 'i <= 5 is correct', 'i < 6', 'Use arr.at(i)'], 0, 'Array of size 5 has indices 0-4. i<=5 writes out of bounds.'),
    ('int* ptr = new int(42);\n// use ptr...\n// end of function, no delete', ['Add delete ptr; or use smart pointer', 'The code is correct', 'Use malloc', 'Use free()'], 0, 'Memory leak — new without delete. Use smart pointers.'),
    ('int a = 10;\nint &ref;\nref = a;', ['int &ref = a; (reference must be initialized)', 'int *ref = &a;', 'Both work differently', 'Use int &&ref = a;'], 0, 'References must be initialized at declaration.'),
    ('int x = 5;\ncout << "Value: " + x << endl;', ['cout << "Value: " << x << endl;', 'cout << "Value: " + to_string(x);', 'Both A and B', 'printf("Value: %d", x);'], 2, '"Value: " + x does pointer arithmetic. Use << operator or to_string.'),
    ('string s = "hello";\nif (s == "hello") {\n  cout << "match";\n}', ['This code is correct', 'Use s.compare("hello") == 0', 'Use strcmp(s, "hello")', 'Use s.equals("hello")'], 0, 'C++ std::string supports == operator for comparison.'),
]

for code, opts, ci, expl in bh_cp_easy:
    questions.append(q(nid('bh-cp-e'), 'bug-hunter', 'cpp', 'easy', code, opts, ci, expl))

bh_cp_medium = [
    ('class Animal {\npublic:\n  virtual void speak() { cout << "noise"; }\n};\nclass Dog : public Animal {\npublic:\n  void speak() { cout << "woof"; }\n};\nAnimal a = Dog();\na.speak();', ['Use Animal& or Animal* for polymorphism', 'Make speak() pure virtual', 'Add override', 'Use dynamic_cast'], 0, 'Object slicing — assigning Dog to Animal copies only Animal part.'),
    ('vector<int> v = {1, 2, 3, 4, 5};\nfor (auto it = v.begin(); it != v.end(); it++) {\n  if (*it == 3) {\n    v.erase(it);\n  }\n}', ['it = v.erase(it); or use remove_if with erase', 'The code is correct', 'Use v.delete(it)', 'Use v.remove(3)'], 0, 'erase() invalidates the iterator. Use returned iterator or remove_if idiom.'),
    ('class Buffer {\n  int* data;\n  int size;\npublic:\n  Buffer(int s) : size(s), data(new int[s]) {}\n  ~Buffer() { delete[] data; }\n};\nBuffer a(10);\nBuffer b = a;', ['Add copy constructor / assignment operator, or delete copy', 'The code is correct', 'Use unique_ptr', 'Both A and C'], 3, 'Default copy does shallow copy — both destructors delete same pointer.'),
]

for code, opts, ci, expl in bh_cp_medium:
    questions.append(q(nid('bh-cp-m'), 'bug-hunter', 'cpp', 'medium', code, opts, ci, expl))

bh_cp_hard = [
    ('shared_ptr<Node> a = make_shared<Node>();\nshared_ptr<Node> b = make_shared<Node>();\na->next = b;\nb->next = a;', ['Use weak_ptr for one reference to break cycle', 'Use unique_ptr', 'Use raw pointer', 'Manually reset()'], 0, 'Circular shared_ptr references prevent deallocation. Use weak_ptr.'),
    ('template<typename T>\nclass Stack {\n  T* data;\n  int sz, cap;\npublic:\n  void push(const T& val) {\n    if (sz == cap) {\n      cap *= 2;\n      T* newData = new T[cap];\n      memcpy(newData, data, sz * sizeof(T));\n      delete[] data;\n      data = newData;\n    }\n    data[sz++] = val;\n  }\n};', ['Use std::copy instead of memcpy (handles non-POD)', 'memcpy is fine', 'Use std::vector<T>', 'Both A and C'], 3, 'memcpy does bitwise copy, not proper for non-POD types.'),
]

for code, opts, ci, expl in bh_cp_hard:
    questions.append(q(nid('bh-cp-h'), 'bug-hunter', 'cpp', 'hard', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# BUG HUNTER — CSS
# ═══════════════════════════════════════════════════════

bh_cs_easy = [
    ('.box {\n  margin-top: 10px\n  padding: 20px;\n  background: red;\n}', ['Add semicolon after 10px', 'Remove margin-top', 'Change . to #', 'Add quotes'], 0, 'CSS requires semicolons between declarations.'),
    ('.container {\n  width: 100%;\n  padding: 20px;\n}', ['Add: box-sizing: border-box;', 'Remove padding', 'Use max-width', 'Add overflow: hidden'], 0, 'Default box-model adds padding on top of width.'),
    ('.text {\n  font-size: 16;\n  color: #333;\n}', ['font-size: 16px; (missing unit)', 'font-size: 16rem;', 'font-size: 16em;', 'Add px to color'], 0, 'CSS values need units (except 0).'),
    ('.flex-container {\n  display: flex;\n  align-content: center;\n}', ['Use align-items: center; instead', 'Use justify-content: center;', 'Add flex-wrap: wrap;', 'Use vertical-align'], 0, 'align-content centers rows. align-items centers items on cross axis.'),
    ('#header .nav li {\n  color: blue;\n}\n.header .nav li {\n  color: red;\n}', ['Second rule should use #header not .header', 'First rule should use .header', 'Both rules conflict', 'Add !important'], 0, '#header targets id, .header targets class. Different selectors.'),
]

for code, opts, ci, expl in bh_cs_easy:
    questions.append(q(nid('bh-cs-e'), 'bug-hunter', 'css', 'easy', code, opts, ci, expl))

bh_cs_medium = [
    ('.parent {\n  position: relative;\n}\n.child {\n  position: absolute;\n  top: 50%;\n  transform: translate(-50%, -50%);\n}', ['Need left: 50% too for horizontal centering', 'The code is correct', 'Use margin: auto', 'Use flexbox'], 0, 'translate(-50%, -50%) with only top: 50% is incomplete.'),
    ('@media (max-width: 768px) {\n  .sidebar { display: none; }\n}\n@media (min-width: 768px) {\n  .sidebar { display: block; }\n}', ['Use min-width: 769px for the second rule', 'Both are correct', 'Use 767px', 'Add orientation check'], 0, 'At exactly 768px both rules match. Use 769px for the breakpoint.'),
]

for code, opts, ci, expl in bh_cs_medium:
    questions.append(q(nid('bh-cs-m'), 'bug-hunter', 'css', 'medium', code, opts, ci, expl))

bh_cs_hard = [
    ('.card {\n  display: grid;\n  grid-template-rows: auto 1fr auto;\n  height: 100vh;\n}\n.card-content {\n  overflow: auto;\n}', ['Add min-height: 0; to .card-content', 'Use height: 0', 'Remove height: 100vh', 'Use flexbox'], 0, 'Grid items have implicit min-height: auto. Set min-height: 0.'),
]

for code, opts, ci, expl in bh_cs_hard:
    questions.append(q(nid('bh-cs-h'), 'bug-hunter', 'css', 'hard', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# BUG HUNTER — HTML
# ═══════════════════════════════════════════════════════

bh_ht_easy = [
    ('<a href="https://example.com" target="_blank">\n  Click here\n</a>', ['Add rel="noopener noreferrer"', 'Remove target="_blank"', 'Use window.open', 'Add rel="nofollow"'], 0, 'target="_blank" without rel="noopener" is a security risk.'),
    ('<img src="photo.jpg">', ['Add alt attribute: alt="description"', 'Add width and height', 'Add title', 'Close with </img>'], 0, 'Every <img> must have an alt attribute.'),
    ('<ul>\n  <li>Item 1</li>\n  <div>Not a list item!</div>\n  <li>Item 3</li>\n</ul>', ['Move <div> outside <ul>', 'Replace <div> with <li>', 'Both work', 'Use <ol>'], 0, '<ul> only allows <li> as direct children.'),
    ('<form>\n  <input type="text" name="email">\n  <button>Submit</button>\n</form>', ['Add type="submit", method, and action attributes', 'The code is correct', 'Only add type="submit"', 'Only add method'], 0, 'Multiple improvements needed for proper form functionality.'),
    ('<meta name="viewport" content="width=1024">', ['content="width=device-width, initial-scale=1"', 'content="width=device-width"', 'Add maximum-scale=1', 'Add user-scalable=no'], 0, 'Fixed width viewport prevents mobile scaling.'),
]

for code, opts, ci, expl in bh_ht_easy:
    questions.append(q(nid('bh-ht-e'), 'bug-hunter', 'html', 'easy', code, opts, ci, expl))

bh_ht_medium = [
    ('<table>\n  <tr><th>Name</th><th>Age</th></tr>\n  <tr><td>Alice</td><td>30</td></tr>\n</table>', ['Wrap header in <thead> and data in <tbody>', 'The code is correct', 'Use <caption>', 'Replace <th> with <td>'], 0, 'Semantically, headers should be in <thead> and data in <tbody>.'),
    ('<nav>\n  <a href="#home">Home</a>\n  <a href="#about">About</a>\n</nav>', ['Wrap in <ul><li> for accessibility', 'Add role="navigation"', 'Use <button>', 'The code is correct'], 0, 'Screen readers handle nav links better as list items.'),
]

for code, opts, ci, expl in bh_ht_medium:
    questions.append(q(nid('bh-ht-m'), 'bug-hunter', 'html', 'medium', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# WHAT'S THE OUTPUT — PYTHON
# ═══════════════════════════════════════════════════════

wo_py_easy = [
    ('x = [1, 2, 3]\nprint(x[-1])', ['3', '1', '-1', 'Error'], 0, 'Negative indices count from the end.'),
    ('print(type(3 / 2))', ["<class 'float'>", "<class 'int'>", "<class 'double'>", "Error"], 0, '/ always returns float in Python 3.'),
    ('x = "hello"\nprint(x[1:3])', ['el', 'he', 'ell', 'hl'], 0, 'Slicing [1:3] gets indices 1 and 2.'),
    ('print(bool(""))\nprint(bool("0"))', ['False\nTrue', 'True\nFalse', 'False\nFalse', 'True\nTrue'], 0, 'Empty string is falsy. Non-empty is truthy.'),
    ('a = [1, 2, 3]\nb = a\nb.append(4)\nprint(len(a))', ['4', '3', 'Error', '5'], 0, 'b = a creates a reference, not a copy.'),
    ('print(2 ** 3)', ['8', '6', '9', '5'], 0, '** is exponentiation: 2^3 = 8.'),
    ('print("hello" * 3)', ['hellohellohello', 'hello3', 'hello hello hello', 'Error'], 0, 'String multiplication repeats the string.'),
    ('print(len([1, [2, 3], 4]))', ['3', '5', '4', 'Error'], 0, 'len() counts top-level elements, not nested.'),
    ('x = {1, 2, 3}\nprint(type(x))', ["<class 'set'>", "<class 'dict'>", "<class 'list'>", "<class 'tuple'>"], 0, '{} with elements creates a set, not a dict.'),
    ('print(10 % 3)', ['1', '3', '0', '3.33'], 0, '% is modulo: remainder of 10/3 = 1.'),
    ('print("abc" > "ab")', ['True', 'False', 'Error', 'None'], 0, 'String comparison is lexicographic. "abc" > "ab".'),
    ('x = [1, 2, 3]\nprint(2 in x)', ['True', 'False', '2', 'Error'], 0, 'The "in" operator checks membership.'),
    ('print(int("42"))', ['42', '"42"', 'Error', '42.0'], 0, 'int() converts a string to an integer.'),
    ('x = "Hello World"\nprint(x.split()[0])', ['Hello', 'World', 'Hello World', 'Error'], 0, 'split() splits on whitespace, [0] gets first word.'),
    ('print(round(2.5))', ['2', '3', '2.5', 'Error'], 0, 'Python uses banker\'s rounding: round(2.5) = 2 (rounds to even).'),
]

for code, opts, ci, expl in wo_py_easy:
    questions.append(q(nid('wo-py-e'), 'whats-output', 'python', 'easy', code, opts, ci, expl))

wo_py_medium = [
    ('def func(a, b=[]):\n    b.append(a)\n    return b\n\nprint(func(1))\nprint(func(2))', ['[1]\n[1, 2]', '[1]\n[2]', '[1, 2]\n[1, 2]', 'Error'], 0, 'Mutable default arguments persist between calls.'),
    ('print(0.1 + 0.2 == 0.3)', ['False', 'True', 'Error', 'None'], 0, '0.1 + 0.2 = 0.30000000000000004 (floating point).'),
    ('a = (1, [2, 3], 4)\na[1].append(5)\nprint(a)', ['(1, [2, 3, 5], 4)', 'TypeError', '(1, [2, 3], 4)', '(1, 2, 3, 5, 4)'], 0, 'Tuple is immutable, but its mutable contents can change.'),
    ('x = {"a": 1, "b": 2, "c": 3}\nprint(list(x.keys())[0])', ['a', '1', 'Unpredictable', 'Error'], 2, 'In Python 3.7+, dicts preserve order, but relying on it is fragile.'),
    ('print([x**2 for x in range(5) if x % 2 == 0])', ['[0, 4, 16]', '[0, 1, 4, 9, 16]', '[4, 16]', '[0, 4]'], 0, 'List comprehension with filter: even numbers squared.'),
]

for code, opts, ci, expl in wo_py_medium:
    questions.append(q(nid('wo-py-m'), 'whats-output', 'python', 'medium', code, opts, ci, expl))

wo_py_hard = [
    ('class A:\n    x = 1\n\nclass B(A):\n    pass\n\nclass C(A):\n    pass\n\nB.x = 2\nprint(A.x, B.x, C.x)', ['1 2 1', '1 2 2', '2 2 2', '1 1 1'], 0, 'B.x = 2 sets B\'s own attribute. C still inherits from A.'),
    ('funcs = [lambda: i for i in range(3)]\nprint([f() for f in funcs])', ['[2, 2, 2]', '[0, 1, 2]', '[0, 0, 0]', 'Error'], 0, 'Lambdas capture i by reference. By execution time, i = 2.'),
    ('class Meta(type):\n    def __call__(cls, *args, **kwargs):\n        print("meta")\n        return super().__call__(*args, **kwargs)\n\nclass A(metaclass=Meta):\n    pass\n\na = A()', ['Prints "meta" then creates instance', 'Error', 'Only prints "meta"', 'Infinite loop'], 0, 'Metaclass __call__ intercepts instance creation.'),
    ('def gen():\n    for i in range(3):\n        yield i * 2\n\ng = gen()\nprint(next(g))\nprint(next(g))', ['0\n2', '0\n1', '2\n4', '0\n4'], 0, 'Generator yields values lazily: 0*2=0, then 1*2=2.'),
]

for code, opts, ci, expl in wo_py_hard:
    questions.append(q(nid('wo-py-h'), 'whats-output', 'python', 'hard', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# WHAT'S THE OUTPUT — JAVASCRIPT
# ═══════════════════════════════════════════════════════

wo_js_easy = [
    ('console.log(typeof null);', ['"object"', '"null"', '"undefined"', '"boolean"'], 0, 'typeof null returns "object" — a famous JS bug.'),
    ('console.log("5" + 3);', ['"53"', '8', '"53" or 8', 'Error'], 0, '+ with string concatenates.'),
    ('console.log(0.1 + 0.2 === 0.3);', ['false', 'true', 'undefined', 'NaN'], 0, 'Floating-point precision issue.'),
    ('let a = [1, 2, 3];\nlet b = a;\nb.push(4);\nconsole.log(a.length);', ['4', '3', 'undefined', 'Error'], 0, 'Arrays are reference types.'),
    ('console.log(typeof []);', ['"object"', '"array"', '"list"', '"undefined"'], 0, 'Arrays are objects in JavaScript.'),
    ('console.log(1 + "2" + 3);', ['"123"', '6', '"15"', '123'], 0, 'Left-to-right: 1+"2"="12", "12"+3="123".'),
    ('console.log(true + true);', ['2', '"truetrue"', 'true', '1'], 0, 'true coerces to 1. 1+1=2.'),
    ('console.log("b" + "a" + +"a" + "a");', ['"baNaNa"', '"baNa"', '"baaa"', 'Error'], 0, '++"a" = NaN (unary plus on "a"). "b"+"a"+NaN+"a" = "baNaNa".'),
    ('console.log([] + []);', ['""', '[]', '0', 'Error'], 0, 'Empty arrays coerce to empty strings. ""+"" = ""'),
    ('console.log(typeof NaN);', ['"number"', '"NaN"', '"undefined"', '"object"'], 0, 'NaN is technically a number type in JavaScript.'),
    ('console.log(3 > 2 > 1);', ['false', 'true', 'Error', 'undefined'], 0, '(3>2)=true, then true>1=false (true coerces to 1).'),
    ('console.log("hello".length);', ['5', '6', 'undefined', 'Error'], 0, 'Strings have a .length property.'),
    ('console.log(null == undefined);', ['true', 'false', 'Error', 'null'], 0, 'null and undefined are loosely equal.'),
    ('console.log(null === undefined);', ['false', 'true', 'Error', 'null'], 0, 'Strict equality checks type too. Different types.'),
    ('console.log(+"");', ['0', '""', 'NaN', 'Error'], 0, 'Unary plus converts to number. Empty string becomes 0.'),
]

for code, opts, ci, expl in wo_js_easy:
    questions.append(q(nid('wo-js-e'), 'whats-output', 'javascript', 'easy', code, opts, ci, expl))

wo_js_medium = [
    ('console.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);', ['1 4 3 2', '1 2 3 4', '1 4 2 3', '1 3 4 2'], 0, 'Microtasks (Promise) run before macrotasks (setTimeout).'),
    ('const obj = { a: 1 };\nObject.freeze(obj);\nobj.a = 2;\nconsole.log(obj.a);', ['1', '2', 'undefined', 'Error'], 0, 'Object.freeze() prevents modification.'),
    ('function foo() {\n  return\n  { bar: "hello" };\n}\nconsole.log(foo());', ['undefined', '{ bar: "hello" }', '"hello"', 'Error'], 0, 'ASI inserts semicolon after return.'),
    ('console.log([..."hello"]);', ['["h","e","l","l","o"]', '["hello"]', '[104,101,108,108,111]', 'Error'], 0, 'Spread on string creates array of characters.'),
    ('let a = {x: 1};\nlet b = {x: 1};\nconsole.log(a == b);', ['false', 'true', 'Error', 'undefined'], 0, 'Objects compared by reference, not value.'),
]

for code, opts, ci, expl in wo_js_medium:
    questions.append(q(nid('wo-js-m'), 'whats-output', 'javascript', 'medium', code, opts, ci, expl))

wo_js_hard = [
    ('var b = 1;\nfunction outer() {\n  var b = 2;\n  function inner() {\n    console.log(b);\n    var b = 3;\n  }\n  inner();\n}\nouter();', ['undefined (hoisting)', '2', '3', '1'], 0, 'var b is hoisted inside inner(), so console.log sees undefined.'),
    ('console.log((() => {}).length);', ['0', '1', 'undefined', 'Error'], 0, 'Arrow function with no params has .length = 0.'),
    ('const x = [1, 2, 3];\nx[10] = 11;\nconsole.log(x.length);', ['11', '3', '4', 'Error'], 0, 'Setting index 10 creates holes. Length becomes 11.'),
    ('async function f() {\n  return 1;\n}\nf().then(alert);', ['Alerts 1 (async functions return promises)', 'Error', 'Alerts undefined', 'Alerts [1]'], 0, 'Async functions always return a Promise that resolves with the return value.'),
]

for code, opts, ci, expl in wo_js_hard:
    questions.append(q(nid('wo-js-h'), 'whats-output', 'javascript', 'hard', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# WHAT'S THE OUTPUT — JAVA
# ═══════════════════════════════════════════════════════

wo_ja_easy = [
    ('System.out.println(10 / 3);', ['3', '3.33', '3.0', 'Error'], 0, 'Integer division truncates the decimal.'),
    ('System.out.println("Hello" + 5);', ['"Hello5"', '"Hello5.0"', 'Error', '55'], 0, 'String + int concatenates.'),
    ('int x = 5;\nSystem.out.println(x++);', ['5', '6', 'Error', '4'], 0, 'x++ is post-increment: returns 5, then x becomes 6.'),
    ('System.out.println(5 == 5.0);', ['true', 'false', 'Error', '0'], 0, 'int and double with same value are equal with ==.'),
    ('String s = "hello";\nSystem.out.println(s.length());', ['5', '6', '4', 'Error'], 0, 'String.length() returns the number of characters.'),
]

for code, opts, ci, expl in wo_ja_easy:
    questions.append(q(nid('wo-ja-e'), 'whats-output', 'java', 'easy', code, opts, ci, expl))

wo_ja_medium = [
    ('Integer a = 127;\nInteger b = 127;\nSystem.out.println(a == b);', ['true (Integer cache -128 to 127)', 'false', 'Error', 'null'], 0, 'Integer caches values -128 to 127. Same reference within range.'),
    ('Integer a = 200;\nInteger b = 200;\nSystem.out.println(a == b);', ['false (outside cache range)', 'true', 'Error', 'null'], 0, 'Outside cache range, Integer creates new objects. Use .equals().'),
    ('String s1 = "hello";\nString s2 = "hello";\nSystem.out.println(s1 == s2);', ['true (string interning)', 'false', 'Error', 'null'], 0, 'String literals are interned. Same literal = same reference.'),
]

for code, opts, ci, expl in wo_ja_medium:
    questions.append(q(nid('wo-ja-m'), 'whats-output', 'java', 'medium', code, opts, ci, expl))

wo_ja_hard = [
    ('class Parent {\n  static { System.out.print("A"); }\n  { System.out.print("B"); }\n  Parent() { System.out.print("C"); }\n}\nclass Child extends Parent {\n  static { System.out.print("D"); }\n  { System.out.print("E"); }\n  Child() { System.out.print("F"); }\n}\nnew Child();', ['ADBCEF', 'ABCDEF', 'DACBEF', 'DACBFE'], 0, 'Order: parent static, child static, parent instance, parent constructor, child instance, child constructor.'),
]

for code, opts, ci, expl in wo_ja_hard:
    questions.append(q(nid('wo-ja-h'), 'whats-output', 'java', 'hard', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# WHAT'S THE OUTPUT — C++
# ═══════════════════════════════════════════════════════

wo_cp_easy = [
    ('int x = 5;\ncout << x / 2 << endl;', ['2', '2.5', '2.0', 'Error'], 0, 'Integer division truncates: 5/2 = 2.'),
    ('cout << sizeof(int) << endl;', ['4 (typically)', '2', '8', '1'], 0, 'sizeof(int) is typically 4 bytes on modern systems.'),
    ('int a = 10;\nint &ref = a;\nref = 20;\ncout << a << endl;', ['20', '10', 'Error', '0'], 0, 'Reference is an alias. Changing ref changes a.'),
]

for code, opts, ci, expl in wo_cp_easy:
    questions.append(q(nid('wo-cp-e'), 'whats-output', 'cpp', 'easy', code, opts, ci, expl))

wo_cp_medium = [
    ('class Base {\npublic:\n  virtual void f() { cout << "A"; }\n};\nclass Derived : public Base {\npublic:\n  void f() override { cout << "B"; }\n};\nBase* p = new Derived();\np->f();', ['B', 'A', 'AB', 'Error'], 0, 'Virtual function dispatch calls Derived::f().'),
]

for code, opts, ci, expl in wo_cp_medium:
    questions.append(q(nid('wo-cp-m'), 'whats-output', 'cpp', 'medium', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# WHAT'S THE OUTPUT — CSS
# ═══════════════════════════════════════════════════════

wo_cs_easy = [
    ('.box { color: red; }\n.box { color: blue; }\n/* What color does .box have? */', ['blue (last rule wins in cascade)', 'red', 'purple', 'Error'], 0, 'In CSS, when specificity is equal, the last rule wins.'),
    ('.box { margin: 10px 20px; }\n/* What is margin-bottom? */', ['10px', '20px', '0', 'auto'], 0, 'margin: 10px 20px = top/bottom 10px, left/right 20px.'),
]

for code, opts, ci, expl in wo_cs_easy:
    questions.append(q(nid('wo-cs-e'), 'whats-output', 'css', 'easy', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# WHAT'S THE OUTPUT — HTML
# ═══════════════════════════════════════════════════════

wo_ht_easy = [
    ('<h1>Title</h1>\n<p>Paragraph</p>\n<!-- How many block elements? */', ['2 (h1 and p)', '1', '3', '0'], 0, 'h1 and p are both block-level elements.'),
    ('<ul>\n  <li>A</li>\n  <li>B</li>\n</ul>\n<!-- How many list items render? */', ['2', '1', '3', '0'], 0, 'Two <li> elements render as two list items.'),
]

for code, opts, ci, expl in wo_ht_easy:
    questions.append(q(nid('wo-ht-e'), 'whats-output', 'html', 'easy', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# CODE COMPLETION — PYTHON
# ═══════════════════════════════════════════════════════

cc_py_easy = [
    ('def add(a, b):\n    ____', ['return a + b', 'return a - b', 'print(a + b)', 'a + b'], 0, 'Function should return the sum.'),
    ('numbers = [1, 2, 3, 4, 5]\nevens = [n for n in numbers if ____]', ['n % 2 == 0', 'n % 2 == 1', 'n / 2 == 0', 'n == 2'], 0, 'n % 2 == 0 checks if a number is even.'),
    ('name = "Alice"\nprint(____.upper())', ['name', '"alice"', 'Name', 'str'], 0, 'Call .upper() on the name variable.'),
    ('my_list = [3, 1, 4, 1, 5]\nprint(____(my_list))', ['sorted', 'sort', 'order', 'arrange'], 0, 'sorted() returns a new sorted list.'),
    ('x = "42"\ny = ____(x)', ['int', 'str', 'float', 'num'], 0, 'int() converts string to integer.'),
    ('my_dict = {"name": "Alice"}\nprint(my_dict____)', ['["name"]', '.name', '("name")', '{"name"}'], 0, 'Dictionary values accessed with bracket notation.'),
    ('for i in ____(5):\n    print(i)', ['range', 'loop', 'iterate', 'list'], 0, 'range(5) generates numbers 0-4.'),
    ('result = 10 ____ 3  # 3.33...', ['/ ', '//', '%', '*'], 0, '/ does floating-point division.'),
    ('if x ____ 5:\n    print("equal")', ['==', '=', '===', '!='], 0, '== is the equality comparison operator.'),
    ('text = "Hello World"\nprint(text.____())', ['lower', 'LOWER', 'downcase', 'small'], 0, '.lower() converts string to lowercase.'),
]

for code, opts, ci, expl in cc_py_easy:
    questions.append(q(nid('cc-py-e'), 'code-completion', 'python', 'easy', code, opts, ci, expl))

cc_py_medium = [
    ('def reverse_string(s):\n    return ____', ['s[::-1]', 's.reverse()', 's[::-1] or reversed(s)', 's[-1]'], 0, 's[::-1] reverses a string using slicing.'),
    ('def merge_dicts(a, b):\n    return {____a, ____b}', ['**a, **b', '*a, *b', 'a, b', 'a + b'], 0, '** unpacks dictionaries into a new dict.'),
    ('data = [1, 2, 3, 4, 5]\nresult = list(____(lambda x: x * 2, data))', ['map', 'filter', 'reduce', 'apply'], 0, 'map() applies a function to each element.'),
    ('def safe_get(d, key, default=None):\n    return d.____(key, default)', ['get', 'fetch', 'find', 'access'], 0, 'dict.get(key, default) returns default if key is missing.'),
    ('evens = list(____(lambda x: x % 2 == 0, range(10)))', ['filter', 'map', 'reduce', 'select'], 0, 'filter() keeps only elements where predicate is True.'),
]

for code, opts, ci, expl in cc_py_medium:
    questions.append(q(nid('cc-py-m'), 'code-completion', 'python', 'medium', code, opts, ci, expl))

cc_py_hard = [
    ('def memoize(func):\n    cache = {}\n    def wrapper(*args):\n        if args not in ____:\n            cache[args] = func(*args)\n        return cache[args]\n    return wrapper', ['cache', 'func', 'wrapper', 'args'], 0, 'Check the cache dict before calling the function.'),
    ('from functools import ____\n@____(maxsize=128)\ndef expensive(n):\n    return n ** n', ['lru_cache', 'cache', 'memoize', 'cached'], 0, 'functools.lru_cache adds memoization with LRU eviction.'),
    ('class Meta(type):\n    def __new__(cls, name, bases, dct):\n        dct[\'class_id\'] = name.lower()\n        return super().__new__(cls, name, bases, ____)', ['dct', 'name', 'bases', 'cls'], 0, 'Pass the modified dct to the parent __new__.'),
]

for code, opts, ci, expl in cc_py_hard:
    questions.append(q(nid('cc-py-h'), 'code-completion', 'python', 'hard', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# CODE COMPLETION — JAVASCRIPT
# ═══════════════════════════════════════════════════════

cc_js_easy = [
    ('const arr = [1, 2, 3];\nconst doubled = arr.____(n => n * 2);', ['map', 'filter', 'reduce', 'forEach'], 0, 'map() creates a new array by transforming each element.'),
    ('const obj = { a: 1, b: 2 };\nconst keys = Object.____(obj);', ['keys', 'values', 'entries', 'properties'], 0, 'Object.keys() returns an array of the object\'s keys.'),
    ('const arr = [1, 2, 3, 4, 5];\nconst evens = arr.____(n => n % 2 === 0);', ['filter', 'map', 'find', 'reduce'], 0, 'filter() creates a new array with elements that pass the test.'),
    ('const result = "hello".____();', ['toUpperCase', 'upper', 'Upper', 'toUpper'], 0, '.toUpperCase() converts a string to uppercase.'),
    ('const arr = [3, 1, 2];\narr.____();', ['sort', 'sorted', 'order', 'arrange'], 0, '.sort() sorts array elements in place.'),
    ('console.log(____(3.7));', ['Math.floor', 'int', 'Math.round', 'floor'], 0, 'Math.floor() rounds down to the nearest integer.'),
    ('const obj = { name: "Alice" };\nconst copy = { ____obj, age: 30 };', ['...', '**', '&', '...'], 0, 'Spread operator (...) copies properties from obj.'),
    ('async function getData() {\n  const res = ____ fetch("/api/data");\n  return res.json();\n}', ['await', 'async', 'yield', 'return'], 0, 'await pauses until the Promise resolves.'),
    ('const [a, b] = [1, 2];\nconsole.log(____);', ['a', '[1,2]', '{1,2}', '1,2'], 0, 'Destructuring assigns a=1. Print a to see 1.'),
    ('console.log(typeof ____);', ['undefined', 'null', 'NaN', 'void'], 0, 'typeof undefined is "undefined".'),
]

for code, opts, ci, expl in cc_js_easy:
    questions.append(q(nid('cc-js-e'), 'code-completion', 'javascript', 'easy', code, opts, ci, expl))

cc_js_medium = [
    ('const result = arr.____((acc, curr) => acc + curr, 0);', ['reduce', 'map', 'filter', 'forEach'], 0, 'reduce() accumulates values with an initializer.'),
    ('const obj = { a: 1, b: 2 };\nconst entries = Object.____(obj);', ['entries', 'keys', 'values', 'pairs'], 0, 'Object.entries() returns [key, value] pairs.'),
    ('const promise = new ____((resolve, reject) => {\n  resolve(42);\n});', ['Promise', 'Future', 'Task', 'Deferred'], 0, 'Promise is the constructor for asynchronous values.'),
    ('const unique = [____new Set(arr)];', ['...', '**', '&', '@'], 0, 'Spread Set into array: [...new Set(arr)] removes duplicates.'),
    ('const fn = (name = "World") => `Hello, ____!`;', ['${name}', 'name', '{name}', '%name%'], 0, 'Template literals use ${} for interpolation.'),
]

for code, opts, ci, expl in cc_js_medium:
    questions.append(q(nid('cc-js-m'), 'code-completion', 'javascript', 'medium', code, opts, ci, expl))

cc_js_hard = [
    ('class EventEmitter {\n  constructor() {\n    this.events = {};\n  }\n  on(event, callback) {\n    if (!this.events[event]) this.events[event] = [];\n    this.events[event].____(callback);\n  }\n}', ['push', 'add', 'set', 'append'], 0, 'push() adds callback to the listeners array.'),
    ('const debounce = (fn, ms) => {\n  let timer;\n  return (...args) => {\n    ____(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n};', ['clearTimeout', 'clearInterval', 'cancelTimeout', 'stopTimeout'], 0, 'clearTimeout() cancels the previous pending timeout.'),
    ('function* idGenerator() {\n  let id = 0;\n  while (true) {\n    ____ id++;\n  }\n}', ['yield', 'return', 'emit', 'produce'], 0, 'yield pauses the generator and returns the value.'),
]

for code, opts, ci, expl in cc_js_hard:
    questions.append(q(nid('cc-js-h'), 'code-completion', 'javascript', 'hard', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# CODE COMPLETION — JAVA
# ═══════════════════════════════════════════════════════

cc_ja_easy = [
    ('List<String> list = new ____<>();', ['ArrayList', 'LinkedList', 'HashMap', 'HashSet'], 0, 'ArrayList is the most common List implementation.'),
    ('System.out.____("Hello");', ['println', 'print', 'write', 'output'], 0, 'println() prints with a newline.'),
    ('String s = "hello";\nSystem.out.println(s.____());', ['toUpperCase', 'upper', 'toUpperCase()', 'Upper'], 0, '.toUpperCase() converts string to uppercase.'),
    ('int[] arr = {5, 3, 1, 4, 2};\nArrays.____(arr);', ['sort', 'sorted', 'order', 'arrange'], 0, 'Arrays.sort() sorts the array in place.'),
    ('Map<String, Integer> map = new ____<>();', ['HashMap', 'ArrayList', 'HashSet', 'TreeMap'], 0, 'HashMap is the most common Map implementation.'),
    ('if (s != null && s.____("hello")) {', ['equals', '==', '===', 'contains'], 0, '.equals() compares String content.'),
]

for code, opts, ci, expl in cc_ja_easy:
    questions.append(q(nid('cc-ja-e'), 'code-completion', 'java', 'easy', code, opts, ci, expl))

cc_ja_medium = [
    ('List<String> filtered = list.____()\n    .filter(s -> s.length() > 3)\n    .collect(Collectors.toList());', ['stream', 'iterator', 'parallelStream', 'list'], 0, '.stream() creates a Stream for functional operations.'),
    ('Optional<String> opt = Optional.____("hello");', ['of', 'ofNullable', 'empty', 'from'], 0, 'Optional.of() wraps a non-null value.'),
    ('list.forEach(item -> System.out.____(item));', ['println', 'print', 'write', 'log'], 0, 'println() prints each item with a newline.'),
    ('String result = list.____()\n    .map(String::toUpperCase)\n    .collect(Collectors.joining(","));', ['stream', 'iterator', 'toArray', 'parallel'], 0, 'stream() starts the pipeline for functional processing.'),
]

for code, opts, ci, expl in cc_ja_medium:
    questions.append(q(nid('cc-ja-m'), 'code-completion', 'java', 'medium', code, opts, ci, expl))

cc_ja_hard = [
    ('<T> List<T> filter(List<T> list, ____<T> predicate) {\n    return list.stream().filter(predicate).collect(Collectors.toList());\n}', ['Predicate', 'Function', 'Consumer', 'Supplier'], 0, 'Predicate<T> is the functional interface for boolean-valued functions.'),
    ('CompletableFuture<String> future = CompletableFuture.____Async(() -> {\n    return fetchData();\n});', ['supply', 'run', 'call', 'execute'], 0, 'supplyAsync() starts an async task that returns a value.'),
]

for code, opts, ci, expl in cc_ja_hard:
    questions.append(q(nid('cc-ja-h'), 'code-completion', 'java', 'hard', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# CODE COMPLETION — C++
# ═══════════════════════════════════════════════════════

cc_cp_easy = [
    ('#include <____>\nusing namespace std;\nint main() {\n    cout << "Hello";\n    return 0;\n}', ['iostream', 'stdio.h', 'string', 'cmath'], 0, 'iostream provides cin and cout.'),
    ('vector<int> v = {1, 2, 3};\nv.____(4);', ['push_back', 'add', 'append', 'insert'], 0, 'push_back() adds an element to the end of a vector.'),
    ('string s = "hello";\ncout << s.____() << endl;', ['length', 'size', 'len', 'count'], 0, '.length() or .size() returns the string length.'),
    ('int* ptr = ____ int(42);', ['new', 'malloc', 'create', 'alloc'], 0, 'new allocates memory on the heap.'),
]

for code, opts, ci, expl in cc_cp_easy:
    questions.append(q(nid('cc-cp-e'), 'code-completion', 'python', 'easy', code, opts, ci, expl))

cc_cp_medium = [
    ('auto it = find(v.begin(), v.end(), ____);\nif (it != v.end()) {\n    v.erase(it);\n}', ['target', 'value', '3', 'item'], 2, 'find() takes the value to search for.'),
    ('sort(v.begin(), v.end(), ____<int>());', ['greater', 'less', 'compare', 'descending'], 0, 'greater<int>() sorts in descending order.'),
]

for code, opts, ci, expl in cc_cp_medium:
    questions.append(q(nid('cc-cp-m'), 'code-completion', 'cpp', 'medium', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# CODE COMPLETION — CSS
# ═══════════════════════════════════════════════════════

cc_cs_easy = [
    ('.center {\n  display: ____;\n  justify-content: center;\n  align-items: center;\n}', ['flex', 'block', 'grid', 'inline'], 0, 'Flexbox centers content with justify-content and align-items.'),
    ('.box {\n  ____-sizing: border-box;\n  width: 100%;\n  padding: 20px;\n}', ['box', 'content', 'margin', 'border'], 0, 'box-sizing: border-box includes padding in width.'),
    ('.text {\n  color: ____;\n}', ['red', '#FF0000', 'rgb(255,0,0)', 'All of the above are valid'], 3, 'CSS accepts named colors, hex, and rgb().'),
    ('.responsive {\n  max-width: 100%;\n  height: ____;\n}', ['auto', '100%', '0', 'inherit'], 0, 'height: auto maintains aspect ratio with max-width.'),
]

for code, opts, ci, expl in cc_cs_easy:
    questions.append(q(nid('cc-cs-e'), 'code-completion', 'css', 'easy', code, opts, ci, expl))

cc_cs_medium = [
    ('@____ (max-width: 768px) {\n  .sidebar {\n    display: none;\n  }\n}', ['media', 'screen', 'query', 'breakpoint'], 0, '@media defines responsive breakpoints.'),
    ('.grid {\n  display: grid;\n  grid-template-____: repeat(3, 1fr);\n}', ['columns', 'rows', 'areas', 'cells'], 0, 'grid-template-columns defines column tracks.'),
]

for code, opts, ci, expl in cc_cs_medium:
    questions.append(q(nid('cc-cs-m'), 'code-completion', 'css', 'medium', code, opts, ci, expl))

# ═══════════════════════════════════════════════════════
# CODE COMPLETION — HTML
# ═══════════════════════════════════════════════════════

cc_ht_easy = [
    ('<____ src="script.js"></____>', ['script', 'link', 'style', 'js'], 0, '<script> tag includes JavaScript files.'),
    ('<a ____="https://example.com">Link</a>', ['href', 'src', 'link', 'url'], 0, 'href attribute specifies the URL for links.'),
    ('<____ type="submit">Click me</____>', ['button', 'input', 'submit', 'link'], 0, '<button type="submit"> creates a submit button.'),
    ('<img ____="photo.jpg" alt="A photo">', ['src', 'href', 'link', 'source'], 0, 'src attribute specifies the image URL.'),
    ('<____ rel="stylesheet" href="styles.css">', ['link', 'style', 'css', 'import'], 0, '<link rel="stylesheet"> includes CSS files.'),
]

for code, opts, ci, expl in cc_ht_easy:
    questions.append(q(nid('cc-ht-e'), 'code-completion', 'html', 'easy', code, opts, ci, expl))

cc_ht_medium = [
    ('<____ name="viewport" content="width=device-width, initial-scale=1">', ['meta', 'link', 'head', 'viewport'], 0, '<meta name="viewport"> enables responsive design.'),
    ('<form ____="POST" action="/submit">\n  <input type="text" name="email">\n</form>', ['method', 'type', 'action', 'enctype'], 0, 'method attribute specifies HTTP method.'),
]

for code, opts, ci, expl in cc_ht_medium:
    questions.append(q(nid('cc-ht-m'), 'code-completion', 'html', 'medium', code, opts, ci, expl))


# ═══════════════════════════════════════════════════════
# Now generate the TypeScript file
# ═══════════════════════════════════════════════════════

# Count per category
from collections import Counter
cat_counts = Counter()
for qq in questions:
    cat_counts[(qq['game'], qq['language'], qq['difficulty'])] += 1

print("=== Question counts per category ===")
for game in GAMES:
    for lang in LANGUAGES:
        for diff in DIFFICULTIES:
            c = cat_counts.get((game, lang, diff), 0)
            if c > 0:
                print(f"  {game} / {lang} / {diff}: {c}")
            else:
                print(f"  {game} / {lang} / {diff}: 0 ⚠️")

print(f"\nTotal questions: {len(questions)}")

# Fix the one cc-cp-e that had language 'python' instead of 'cpp'
for qq in questions:
    if qq['id'].startswith('cc-cp-e'):
        qq['language'] = 'cpp'

# Generate TypeScript
def escape_js(s):
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('"', '\\"')

ts_lines = []
ts_lines.append("export interface GameQuestion {")
ts_lines.append("  id: string;")
ts_lines.append("  game: 'bug-hunter' | 'whats-output' | 'code-completion';")
ts_lines.append("  language: string;")
ts_lines.append("  difficulty: 'easy' | 'medium' | 'hard';")
ts_lines.append("  code: string;")
ts_lines.append("  options: string[];")
ts_lines.append("  correctIndex: number;")
ts_lines.append("  explanation: string;")
ts_lines.append("}")
ts_lines.append("")
ts_lines.append("export const LANGUAGES = [")
ts_lines.append("  { id: 'python', name: 'Python', icon: 'fa-brands fa-python' },")
ts_lines.append("  { id: 'javascript', name: 'JavaScript', icon: 'fa-brands fa-js' },")
ts_lines.append("  { id: 'java', name: 'Java', icon: 'fa-brands fa-java' },")
ts_lines.append("  { id: 'cpp', name: 'C++', icon: 'fa-solid fa-code' },")
ts_lines.append("  { id: 'css', name: 'CSS', icon: 'fa-brands fa-css3-alt' },")
ts_lines.append("  { id: 'html', name: 'HTML', icon: 'fa-brands fa-html5' },")
ts_lines.append("];")
ts_lines.append("")
ts_lines.append("export const DIFFICULTIES = [")
ts_lines.append("  { id: 'easy', name: 'Easy', color: 'var(--success-color)' },")
ts_lines.append("  { id: 'medium', name: 'Medium', color: 'var(--warning-color)' },")
ts_lines.append("  { id: 'hard', name: 'Hard', color: 'var(--error-color)' },")
ts_lines.append("];")
ts_lines.append("")
ts_lines.append("export const GAMES = [")
ts_lines.append("  { id: 'bug-hunter', name: 'Bug Hunter', icon: 'fa-solid fa-bug', color: 'var(--accent)', desc: 'Find and fix bugs in code snippets' },")
ts_lines.append("  { id: 'whats-output', name: \"What's the Output?\", icon: 'fa-solid fa-terminal', color: 'var(--accent)', desc: 'Predict what the code outputs' },")
ts_lines.append("  { id: 'code-completion', name: 'Code Completion', icon: 'fa-solid fa-puzzle-piece', color: 'var(--accent)', desc: 'Fill in the missing code' },")
ts_lines.append("];")
ts_lines.append("")
ts_lines.append("const Q: GameQuestion[] = [")

prev_game = None
prev_lang = None
for qq in questions:
    game = qq['game']
    lang = qq['language']
    diff = qq['difficulty']
    if game != prev_game or lang != prev_lang:
        ts_lines.append(f"  // ═══════════════════════════════════════════")
        ts_lines.append(f"  // {game.upper()} — {lang.upper()}")
        ts_lines.append(f"  // ═══════════════════════════════════════════")
        prev_game = game
        prev_lang = lang
    
    diff_comment = f"  // {diff.capitalize()}"
    # Add diff comment if different from previous
    ts_lines.append(diff_comment)
    
    code_escaped = qq['code'].replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
    opts_str = "[" + ", ".join(f"'{escape_js(o)}'" for o in qq['options']) + "]"
    
    ts_lines.append(f"  {{ id: '{qq['id']}', game: '{game}', language: '{lang}', difficulty: '{diff}',")
    ts_lines.append(f"    code: '{qq['code'].replace(chr(39), chr(92)+chr(39)).replace(chr(10), chr(92)+'n')}',")
    ts_lines.append(f"    options: {opts_str},")
    ts_lines.append(f"    correctIndex: {qq['correctIndex']}, explanation: '{qq['explanation'].replace(chr(39), chr(92)+chr(39))}' }},")

ts_lines.append("];")
ts_lines.append("")
ts_lines.append("export function getShuffledQuestions(game: string, language: string, difficulty: string, count: number = 5): GameQuestion[] {")
ts_lines.append("  const filtered = Q.filter(q => q.game === game && q.language === language && q.difficulty === difficulty);")
ts_lines.append("  const shuffled = [...filtered].sort(() => Math.random() - 0.5);")
ts_lines.append("  return shuffled.slice(0, count);")
ts_lines.append("}")
ts_lines.append("")

output = "\n".join(ts_lines)
output_path = "/home/z/my-project/src/lib/gameQuestions.ts"
with open(output_path, "w") as f:
    f.write(output)

print(f"\nWritten {len(questions)} questions to {output_path}")
