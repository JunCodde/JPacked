/**
 * Script to rename CommonJS output files to .cjs extension
 * and update all require() statements to include .cjs extension
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

// Update require() statements to include .cjs extension
function fixRequireStatements(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixRequireStatements(filePath);
    } else if (file.endsWith('.cjs')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Pattern to match require() with relative paths (starting with ./ or ../)
      // that don't already have .cjs extension
      const requirePattern = /require\((["'])(\.\.?\/[^"']+?)(["'])\)/g;
      
      content = content.replace(requirePattern, (match, quote1, requirePath, quote2) => {
        // Skip if it's already .cjs, .json, or an absolute path/node_modules
        if (requirePath.endsWith('.cjs') || requirePath.endsWith('.json') || !requirePath.startsWith('.')) {
          return match;
        }
        
        // Check if the file exists as .cjs in the dist directory
        const dirPath = path.dirname(filePath);
        const resolvedPath = path.resolve(dirPath, requirePath);
        const cjsPath = resolvedPath + '.cjs';
        
        // Always add .cjs for relative imports (they should all be .cjs now)
        modified = true;
        return `require(${quote1}${requirePath}.cjs${quote2})`;
      });
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }
}

// First rename files
renameToCJS(distDir);

// Then fix require statements
fixRequireStatements(distDir);

console.log('✓ Renamed CommonJS files to .cjs extension');
console.log('✓ Updated require() statements to include .cjs extension');

