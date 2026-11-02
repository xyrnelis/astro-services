import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

// Static build, preserving the original browser modules (source is public under AGPL).
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('src', 'dist/src', { recursive: true });
await cp('public', 'dist', { recursive: true });
await cp('LICENSE', 'dist/LICENSE');
await writeFile('dist/.nojekyll', '');
