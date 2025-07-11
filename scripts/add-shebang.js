#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const shebang = '#!/usr/bin/env node\n';

const files = [
  'dist/scripts/check-jsdoc.js',
  'dist/scripts/generate-docs.js',
  'dist/scripts/simple-docs.js'
];

files.forEach(file => {
  try {
    const content = readFileSync(file, 'utf8');
    if (!content.startsWith('#!')) {
      writeFileSync(file, shebang + content);
      console.log(`Added shebang to ${file}`);
    }
  } catch (error) {
    console.warn(`Could not process ${file}:`, error.message);
  }
});