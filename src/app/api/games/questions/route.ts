import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const VALID_GAMES = ['bug-hunter', 'whats-output', 'code-completion'];
const VALID_LANGS = ['python', 'javascript', 'java', 'cpp', 'css', 'html'];
const VALID_DIFFS = ['easy', 'medium', 'hard'];

const LANG_NAMES: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
  css: 'CSS',
  html: 'HTML',
};

const GAME_DESC: Record<string, string> = {
  'bug-hunter': 'Find the bug in the code and pick the correct fix',
  'whats-output': 'Predict what the code outputs',
  'code-completion': 'Fill in the missing code',
};

function buildPrompt(game: string, language: string, difficulty: string, count: number): string {
  const lang = LANG_NAMES[language] || language;
  const gameDesc = GAME_DESC[game] || game;

  const difficultyGuidance = {
    easy: 'basic syntax, common pitfalls, simple language features, beginner-level concepts',
    medium: 'intermediate features, standard library, OOP concepts, closures, generators, type coercion, scope rules',
    hard: 'advanced edge cases, metaclasses, template metaprogramming, memory model, concurrency gotchas, obscure language quirks',
  };

  const topicGuidance = {
    python: 'list comprehensions, dict methods, string methods, decorators, generators, context managers, unpacking, walrus operator, f-strings, type hints, dataclasses, itertools, collections',
    javascript: 'promises, async/await, closures, hoisting, prototype chain, type coercion, destructuring, spread/rest, optional chaining, generators, symbols, weak refs, event loop',
    java: 'generics, streams, lambdas, autoboxing, override rules, access modifiers, string pool, serialization, records, sealed classes, pattern matching, Optional, CompletableFuture',
    cpp: 'pointers, references, RAII, move semantics, smart pointers, template deduction, SFINAE, constexpr, undefined behavior, operator overloading, const correctness, STL containers, memory layout',
    css: 'specificity, box model, flexbox, grid, positioning, stacking context, custom properties, cascade layers, container queries, pseudo-elements, overflow, transform, transition, animation',
    html: 'semantic elements, accessibility, form validation, data attributes, shadow DOM, custom elements, meta tags, link types, input types, slots, template element, dialog element',
  };

  return `Generate ${count} diverse, interesting programming quiz questions for a "${gameDesc}" game in ${lang} at ${difficulty} difficulty.

CRITICAL RULES:
- DO NOT generate simple arithmetic/math operation questions like "print(5 * 12)", "cout << 10 % 3", "System.out.println(44 - 9)", etc. Those are BANNED.
- Focus on: ${difficultyGuidance[difficulty as keyof typeof difficultyGuidance]}
- Topics should include: ${topicGuidance[language as keyof typeof topicGuidance] || 'language-specific features'}
- Each question must test REAL programming knowledge, not basic math
- Code snippets should be realistic and practical
- Make questions varied — cover different topics and language features across the ${count} questions
- For "bug-hunter": show code WITH a bug, and the options should be possible fixes
- For "whats-output": show code and options should be possible outputs
- For "code-completion": show code with a blank (___) and options should be possible completions

Return ONLY valid JSON in this exact format (no markdown, no code fences):
[
  {
    "id": "ai-${game}-${language}-${difficulty}-<unique>",
    "game": "${game}",
    "language": "${language}",
    "difficulty": "${difficulty}",
    "code": "<the code snippet as a string, use \\n for newlines>",
    "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
    "correctIndex": <0-3>,
    "explanation": "<why the answer is correct>"
  }
]`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game');
  const language = searchParams.get('language');
  const difficulty = searchParams.get('difficulty');
  const count = Math.min(Math.max(parseInt(searchParams.get('count') || '5'), 1), 10);

  if (!game || !VALID_GAMES.includes(game)) {
    return NextResponse.json({ error: 'Invalid game' }, { status: 400 });
  }
  if (!language || !VALID_LANGS.includes(language)) {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
  }
  if (!difficulty || !VALID_DIFFS.includes(difficulty)) {
    return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 });
  }

  try {
    const zai = await ZAI.create();
    const prompt = buildPrompt(game, language, difficulty, count);

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a programming quiz question generator. Generate diverse, interesting questions that test real programming knowledge. Never generate simple math operation questions. Always return valid JSON only, no markdown or explanation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'AI returned empty response' }, { status: 500 });
    }

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let questions;
    try {
      questions = JSON.parse(jsonStr);
    } catch {
      const match = jsonStr.match(/\[[\s\S]*\]/);
      if (match) {
        questions = JSON.parse(match[0]);
      } else {
        console.error('Failed to parse AI response:', jsonStr.substring(0, 200));
        return NextResponse.json({ error: 'Failed to parse questions' }, { status: 500 });
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions generated' }, { status: 500 });
    }

    const validQuestions = questions
      .filter((q: any) => {
        if (!q.code || !q.options || !Array.isArray(q.options) || q.correctIndex === undefined || !q.explanation) {
          return false;
        }
        const mathPattern = /^(print|System\.out\.println|cout\s*<<)\s*\(\s*\d+\s*[+\-*/%]\s*\d+\s*\)?\s*;?\s*$/;
        if (mathPattern.test(q.code.trim())) {
          return false;
        }
        return true;
      })
      .map((q: any, i: number) => ({
        id: q.id || `ai-${game}-${language}-${difficulty}-${Date.now()}-${i}`,
        game,
        language,
        difficulty,
        code: q.code,
        options: q.options.slice(0, 4),
        correctIndex: Math.min(Math.max(q.correctIndex, 0), 3),
        explanation: q.explanation,
      }));

    if (validQuestions.length === 0) {
      return NextResponse.json({ error: 'No valid questions generated' }, { status: 500 });
    }

    return NextResponse.json({ questions: validQuestions });
  } catch (error: any) {
    console.error('Game questions API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions', details: error.message },
      { status: 500 }
    );
  }
}
