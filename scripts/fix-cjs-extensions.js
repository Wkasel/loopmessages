#!/usr/bin/env node

/**
 * Fix CommonJS imports by removing .js extensions and converting to CommonJS format
 */

const fs = require('fs');
const path = require('path');

function fixCjsFiles(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      fixCjsFiles(filePath);
    } else if (file.name.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove .js extensions from require() calls for CommonJS
      content = content.replace(/require\("([^"]+)\.js"\)/g, 'require("$1")');
      content = content.replace(/require\('([^']+)\.js'\)/g, "require('$1')");
      
      fs.writeFileSync(filePath, content);
    }
  }
}

// Fix CommonJS build
const cjsDir = path.join(__dirname, '..', 'dist', 'cjs');
if (fs.existsSync(cjsDir)) {
  console.log('Fixing CommonJS extensions...');
  fixCjsFiles(cjsDir);
  console.log('✅ CommonJS extensions fixed');
} else {
  console.log('❌ CJS directory not found');
}