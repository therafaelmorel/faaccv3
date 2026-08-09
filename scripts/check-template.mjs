import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/fact-app.html', import.meta.url), 'utf8');
const app = source.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/);

if (!app) throw new Error('FACT application logic not found.');

new Function('DCLogic', app[1])(class {});
console.log('FACT application JavaScript parses successfully.');
