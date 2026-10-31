'use strict';
const { readdirSync } = require('node:fs');
const { join, extname } = require('node:path');
const { execFileSync } = require('node:child_process');
let count = 0;
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (['.js', '.cjs'].includes(extname(file))) {
      execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
      count++;
    }
  }
}
['src', 'test', 'scripts'].forEach(walk);
process.stdout.write(`${count} JavaScript dosyası sözdizimi kontrolünden geçti.\n`);
