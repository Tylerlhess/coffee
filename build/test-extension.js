// Test file to validate extension structure
// This file verifies that all required files are present

const requiredFiles = [
  'manifest.json',
  'content.js',
  'background.js',
  'popup.html',
  'popup.js',
  'README.md'
];

const optionalFiles = [
  'icon128.svg',
  'icon48.png',
  'icon16.png'
];

console.log('Coffee Extension Structure Check');
console.log('==============================');

// Check required files
requiredFiles.forEach(file => {
  const fs = require('fs');
  if (fs.existsSync(file)) {
    console.log(`✓ ${file} - OK`);
  } else {
    console.log(`✗ ${file} - MISSING`);
  }
});

// Check optional files
optionalFiles.forEach(file => {
  const fs = require('fs');
  if (fs.existsSync(file)) {
    console.log(`✓ ${file} - OK`);
  } else {
    console.log(`- ${file} - OPTIONAL, NOT FOUND`);
  }
});

console.log('\nExtension structure validation complete.');