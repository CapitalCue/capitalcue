#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build environment...');
console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);

// Check required files exist
const requiredFiles = [
  'src/hooks/use-auth.tsx',
  'src/components/ui/toaster.tsx',
  'src/lib/api-client.ts',
  'tsconfig.json',
  'next.config.js'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log('✅', file, 'exists');
  } else {
    console.log('❌', file, 'MISSING');
    allFilesExist = false;
  }
});

// Check tsconfig.json paths
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  console.log('📋 TypeScript paths:', JSON.stringify(tsconfig.compilerOptions.paths, null, 2));
}

// List src directory structure
console.log('\n📁 Source directory structure:');
function listDir(dir, prefix = '') {
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        console.log(prefix + '📁 ' + item + '/');
        if (prefix.length < 6) { // Limit depth
          listDir(itemPath, prefix + '  ');
        }
      } else {
        console.log(prefix + '📄 ' + item);
      }
    });
  } catch (err) {
    console.log(prefix + '❌ Error reading directory:', err.message);
  }
}

listDir(path.join(process.cwd(), 'src'));

if (allFilesExist) {
  console.log('\n✅ All required files exist. Build should proceed.');
  process.exit(0);
} else {
  console.log('\n❌ Some required files are missing. Build will likely fail.');
  process.exit(1);
}