/**
 * Script to rename CommonJS output files to .cjs extension
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

// Rename all .js files to .cjs in dist directory
function renameToCJS(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      renameToCJS(filePath);
    } else if (file.endsWith('.js') && !file.endsWith('.d.ts')) {
      const newPath = filePath.replace(/\.js$/, '.cjs');
      fs.renameSync(filePath, newPath);
    }
  }
}

renameToCJS(distDir);
console.log('✓ Renamed CommonJS files to .cjs extension');

