import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createZAI } from '@/lib/zai';

const GAME_PROMPTS: Record<string, string> = {
  'bug-hunter': `Generate a coding question where the user must identify the bug in a code snippet. The code should contain exactly ONE bug (syntax error, logic error, or subtle issue). Provide 4 multiple-choice options where the correct answer fixes the bug. One option can be a trick ("the code is correct" or "both A and B") if appropriate.`,
  'whats-output': `Generate a coding question where the user must predict the output of a code snippet. The code should have a non-obvious output due to language quirks, type coercion, closures, scope, or similar concepts. Provide 4 multiple-choice options for the possible outputs.`,
  'code-completion': `Generate a coding question where the user must fill in the missing code (marked with ___) to make the snippet work correctly. Provide 4 multiple-choice options for what should replace ___.`,
};

const LANG_NAMES: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
  css: 'CSS',
  html: 'HTML',
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { game, language, difficulty, count = 5 } = await request.json();

    if (!game || !language || !difficulty) {
      return NextResponse.json({ error: 'game, language, and difficulty are required' }, { status: 400 });
    }

    const langName = LANG_NAMES[language] || language;
    const gamePrompt = GAME_PROMPTS[game];
    if (!gamePrompt) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const systemPrompt = `You are a coding challenge generator for a quiz game. Generate questions that are educational, accurate, and varied. Each question must be unique and not repeat common examples found online. Focus on real-world pitfalls and language-specific nuances.`;

    const userPrompt = `Generate ${count} unique ${difficulty}-difficulty coding questions for the game "${gamePrompt}".

Language: ${langName}
Difficulty: ${difficulty}

IMPORTANT: Return ONLY valid JSON matching this schema (no markdown, no code fences):
{
  "questions": [
    {
      "id": "ai-${game}-${language}-${difficulty}-N",
      "game": "${game}",
      "language": "${language}",
      "difficulty": "${difficulty}",
      "code": "the code snippet as a string with \\n for newlines",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0,
      "explanation": "Why the correct answer is right, in 1-2 sentences"
    }
  ]
}

Rules:
- correctIndex is 0-based (0 = first option)
- Code must be syntactically valid except for the intentional bug (bug-hunter)
- Options should be plausible — no obviously wrong answers
- For ${difficulty} difficulty: ${difficulty === 'easy' ? 'basic syntax, common mistakes, simple logic' : difficulty === 'medium' ? 'closures, scope, type coercion, async patterns, OOP concepts' : 'race conditions, memory management, subtle language quirks, advanced patterns'}
- Make questions diverse — don't repeat the same concept (e.g., don't make all questions about == vs ===)
- Each question's id should end in a unique number (1, 2, 3...)`;

    let questions;

    try {
      const zai = await createZAI();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 3000,
        temperature: 0.85,
      });

      const content = completion.choices?.[0]?.message?.content || '';
      // Try to parse JSON from the response — handle markdown fences
      let jsonStr = content.trim();
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonStr = fenceMatch[1].trim();
      }
      const parsed = JSON.parse(jsonStr);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        questions = parsed.questions.map((q: any, i: number) => ({
          id: q.id || `ai-${game}-${language}-${difficulty}-${i + 1}`,
          game: q.game || game,
          language: q.language || language,
          difficulty: q.difficulty || difficulty,
          code: q.code || '',
          options: q.options || [],
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
          explanation: q.explanation || '',
        }));
      }
    } catch (aiError) {
      console.error('AI question generation error:', aiError);
      // Return empty — the client will fall back to static questions
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ questions: [], source: 'fallback' });
    }

    return NextResponse.json({ questions, source: 'ai' });
  } catch (error) {
    console.error('Game questions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
