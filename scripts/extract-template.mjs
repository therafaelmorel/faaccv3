import { mkdir, readFile, writeFile } from 'node:fs/promises';

const documentText = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const match = documentText.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);

if (!match) throw new Error('Bundled FACT template not found in index.html.');

await mkdir(new URL('../src/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/fact-app.html', import.meta.url), JSON.parse(match[1]));
console.log('Extracted src/fact-app.html');
