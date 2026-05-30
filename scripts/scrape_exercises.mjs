import ZAI from 'z-ai-web-dev-sdk';
import { writeFileSync } from 'fs';

const zai = await ZAI.create();

const urls = [
  // Python exercises - most needed (need 145 replacements)
  { url: 'https://www.w3resource.com/python-basic-exercises/', lang: 'python', topic: 'basic' },
  { url: 'https://www.w3resource.com/python-conditional-exercises/', lang: 'python', topic: 'conditional' },
  { url: 'https://www.w3resource.com/python-loops-exercises/', lang: 'python', topic: 'loops' },
  { url: 'https://www.w3resource.com/python-functions-exercises/', lang: 'python', topic: 'functions' },
  { url: 'https://www.w3resource.com/python-list-exercises/', lang: 'python', topic: 'list' },
  { url: 'https://www.w3resource.com/python-string-exercises/', lang: 'python', topic: 'string' },
  { url: 'https://www.w3resource.com/python-dictionary-exercises/', lang: 'python', topic: 'dict' },
  { url: 'https://www.w3resource.com/python-class-exercises/', lang: 'python', topic: 'class' },
  // JavaScript - sparse arrays need filling
  { url: 'https://www.w3resource.com/javascript-exercises/javascript-basic-exercises.php', lang: 'javascript', topic: 'basic' },
  { url: 'https://www.w3resource.com/javascript-exercises/javascript-functions-exercises.php', lang: 'javascript', topic: 'functions' },
  { url: 'https://www.w3resource.com/javascript-exercises/javascript-array-exercises.php', lang: 'javascript', topic: 'array' },
  // Java - need 96 replacements for hard
  { url: 'https://www.w3resource.com/java-exercises/basic/index.php', lang: 'java', topic: 'basic' },
  { url: 'https://www.w3resource.com/java-exercises/collection/index.php', lang: 'java', topic: 'collection' },
  { url: 'https://www.w3resource.com/java-exercises/exception/index.php', lang: 'java', topic: 'exception' },
  // C++ - sparse arrays
  { url: 'https://www.w3resource.com/cpp-exercises/', lang: 'cpp', topic: 'index' },
];

const results = {};

for (let i = 0; i < urls.length; i++) {
  const { url, lang, topic } = urls[i];
  console.log(`[${i+1}/${urls.length}] Fetching ${lang}/${topic}...`);
  
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await zai.functions.invoke('page_reader', { url });
      const text = result.data.html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!results[lang]) results[lang] = {};
      results[lang][topic] = { title: result.data.title, text: text.substring(0, 80000), url };
      console.log(`  ✓ Got ${text.length} chars`);
      break;
    } catch (e) {
      console.log(`  ✗ Attempt ${attempt+1} failed: ${e.message}`);
      if (attempt < 2) {
        const delay = (attempt + 1) * 20;
        console.log(`  Waiting ${delay}s...`);
        await new Promise(r => setTimeout(r, delay * 1000));
      }
    }
  }
  
  // Rate limit: wait 15s between requests
  if (i < urls.length - 1) {
    await new Promise(r => setTimeout(r, 15000));
  }
}

writeFileSync('/tmp/exercises_raw.json', JSON.stringify(results, null, 2));
console.log('\nDone! Saved to /tmp/exercises_raw.json');
for (const [lang, topics] of Object.entries(results)) {
  console.log(`  ${lang}: ${Object.keys(topics).join(', ')} (${Object.values(topics).reduce((s,t) => s + t.text.length, 0)} chars total)`);
}
