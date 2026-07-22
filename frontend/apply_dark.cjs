const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = {
  'bg-white': 'bg-white dark:bg-gray-800',
  'bg-gray-50': 'bg-gray-50 dark:bg-gray-900',
  'text-gray-900': 'text-gray-900 dark:text-gray-100',
  'text-gray-800': 'text-gray-800 dark:text-gray-200',
  'text-gray-700': 'text-gray-700 dark:text-gray-300',
  'text-gray-600': 'text-gray-600 dark:text-gray-400',
  'text-gray-500': 'text-gray-500 dark:text-gray-400',
  'border-gray-200': 'border-gray-200 dark:border-gray-700',
  'border-gray-100': 'border-gray-100 dark:border-gray-800',
  'border-gray-300': 'border-gray-300 dark:border-gray-600',
  'bg-gray-100': 'bg-gray-100 dark:bg-gray-800',
  'hover:bg-gray-50': 'hover:bg-gray-50 dark:hover:bg-gray-700',
  'hover:bg-gray-100': 'hover:bg-gray-100 dark:hover:bg-gray-700',
};

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const [search, replace] of Object.entries(replacements)) {
        // Regex to match whole words and prevent replacing already replaced classes
        // like replacing bg-white inside bg-white dark:bg-gray-800 again
        const regex = new RegExp(`(?<!dark:)\\b${search}\\b(?!\\s+dark:)`, 'g');
        const originalContent = content;
        content = content.replace(regex, replace);
        if (content !== originalContent) {
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(srcDir);
console.log('Done.');
