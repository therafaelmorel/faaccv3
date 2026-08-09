import { mkdir, readFile, writeFile } from 'node:fs/promises';

const indexUrl = new URL('../index.html', import.meta.url);
const [documentText, template] = await Promise.all([
  readFile(indexUrl, 'utf8'),
  readFile(new URL('../src/fact-app.html', import.meta.url), 'utf8')
]);
const pattern = /(<script type="__bundler\/template">)([\s\S]*?)(<\/script>)/;

if (!pattern.test(documentText)) throw new Error('Bundled FACT template not found in index.html.');

const encoded = JSON.stringify(template).replace(/<\/script>/gi, '<\\/script>');
const builtDocument = documentText.replace(pattern, (_match, start, _previous, end) => start + encoded + end);
const publicDirectory = new URL('../public/', import.meta.url);

await mkdir(publicDirectory, { recursive: true });
await Promise.all([
  writeFile(indexUrl, builtDocument),
  writeFile(new URL('index.html', publicDirectory), builtDocument)
]);
console.log('Built index.html and public/index.html from src/fact-app.html');
