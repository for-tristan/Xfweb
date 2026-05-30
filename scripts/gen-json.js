const { execSync } = require('child_process');
const { writeFileSync, readFileSync, existsSync } = require('fs');

const OUTPUT = 'src/lib/questions-data.json';
const TARGET = 100;
const BATCH = 5; // generate 5 per API call
const GAMES = ['bug-hunter', 'whats-output', 'code-completion'];
const LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'css', 'html'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const PROMPTS = {
  'bug-hunter': 'Identify the bug in a code snippet. ONE bug, 4 options. Can include trick "the code is correct".',
  'whats-output': 'Predict the output of a code snippet. Non-obvious due to language quirks, closures, etc. 4 options.',
  'code-completion': 'Fill in missing code (___). 4 options.',
};
const LN = { python: 'Python', javascript: 'JavaScript', java: 'Java', cpp: 'C++', css: 'CSS', html: 'HTML' };
const DH = { easy: 'basic syntax, common mistakes, simple logic', medium: 'closures, scope, type coercion, async, OOP', hard: 'race conditions, memory, subtle quirks, advanced patterns' };

process.on('uncaughtException', e => { console.error('ERR:', e.message); try { writeFileSync(OUTPUT, JSON.stringify(all)); } catch {} process.exit(1); });

const cfg = JSON.parse(readFileSync('.z-ai-config', 'utf-8'));
const curlH = `-H "Content-Type: application/json" -H "Authorization: Bearer ${cfg.apiKey}" -H "X-Z-AI-From: Z" -H "X-Chat-Id: ${cfg.chatId}" -H "X-User-Id: ${cfg.userId}" -H "X-Token: ${cfg.token}"`;

let all = [];
if (existsSync(OUTPUT)) try { all = JSON.parse(readFileSync(OUTPUT, 'utf-8')); } catch {}
const cnt = (g, l, d) => all.filter(q => q.game === g && q.language === l && q.difficulty === d).length;

function callAPI(game, lang, diff, n) {
  const prompt = `Generate ${n} unique ${diff}-difficulty coding questions.\nGame: ${PROMPTS[game]}\nLanguage: ${LN[lang]}\nFocus: ${DH[diff]}\n\nReturn ONLY valid JSON (no markdown fences, no code blocks):\n{"questions":[{"id":"${game}-${lang}-${diff}-N","game":"${game}","language":"${lang}","difficulty":"${diff}","code":"snippet with \\n","options":["A","B","C","D"],"correctIndex":0,"explanation":"1-2 sentences"}]}\n\nRules:\n- correctIndex is 0-based\n- Options must be plausible\n- Diverse concepts — each question about a different topic\n- Realistic code, not contrived examples\n- Be creative and explore lesser-known language features`;

  const body = JSON.stringify({
    messages: [
      { role: 'system', content: 'You are a coding challenge generator for a quiz game. Generate unique, varied, educational questions. Each question must cover a DIFFERENT concept. Be creative.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 4000, temperature: 0.95, thinking: { type: 'disabled' },
  });

  writeFileSync('/tmp/zai-q.json', body);
  try {
    const raw = execSync(`curl -s --connect-timeout 5 --max-time 45 -X POST "${cfg.baseUrl}/chat/completions" ${curlH} -d @/tmp/zai-q.json`, { encoding: 'utf-8', timeout: 50000 });
    const data = JSON.parse(raw);
    let txt = data.choices?.[0]?.message?.content || '';
    const f = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (f) txt = f[1].trim();
    return JSON.parse(txt).questions || [];
  } catch (e) { console.log(`  API error: ${e.message?.substring(0, 60)}`); return []; }
}

// Process one combo then exit — the outer loop restarts us
let processed = 0;
for (const game of GAMES) {
  for (const lang of LANGUAGES) {
    for (const diff of DIFFICULTIES) {
      const ex = cnt(game, lang, diff);
      if (ex >= TARGET) continue;

      const need = Math.min(BATCH, TARGET - ex);
      console.log(`${game}/${lang}/${diff}: ${ex}/${TARGET} generating ${need}...`);
      const qs = callAPI(game, lang, diff, need);
      if (qs.length === 0) {
        console.log(`  Skipped (API error)`);
        // Mark as done to skip this combo in future runs
        // by adding a placeholder so count changes
        continue;
      }
      let got = 0;
      for (const q of qs) {
        if (!q.code || q.code.length < 5) continue;
        const opts = Array.isArray(q.options) ? q.options : [];
        if (opts.length < 2) continue;
        all.push({ id: q.id || `${game}-${lang}-${diff}-${all.length}`, game: q.game || game, language: q.language || lang, difficulty: q.difficulty || diff, code: q.code, options: opts, correctIndex: q.correctIndex ?? 0, explanation: q.explanation || '' });
        got++;
      }
      writeFileSync(OUTPUT, JSON.stringify(all));
      console.log(`  +${got} (total: ${all.length})`);
      processed++;
      if (processed >= 3) {
        // Process 5 combos then exit — prevents memory/time issues
        console.log('Batch done. Restart for more.');
        process.exit(0);
      }
    }
  }
}
console.log(`\nAll done! Total: ${all.length}`);
