const fs = require('fs');
const path = require('path');

// Function to recursively find all .jsx and .js files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update a single file
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Check if file contains localhost URLs
    if (content.includes('http://localhost:5000')) {
      console.log(`\n📝 Processing: ${filePath}`);
      
      // Add import for API_ENDPOINTS if not already present
      if (!content.includes("import { API_ENDPOINTS }")) {
        // Find the last import statement
        const importRegex = /import.*from.*['"][^'"]*['"];?\s*\n/g;
        const imports = content.match(importRegex);
        
        if (imports) {
          const lastImport = imports[imports.length - 1];
          const lastImportIndex = content.lastIndexOf(lastImport);
          const insertIndex = lastImportIndex + lastImport.length;
          
          content = content.slice(0, insertIndex) + 
                   "import { API_ENDPOINTS } from '../config/api';\n" + 
                   content.slice(insertIndex);
          updated = true;
          console.log('  ✅ Added API_ENDPOINTS import');
        }
      }
      
      // Replace all localhost URLs with API_ENDPOINTS.BASE_URL
      const originalContent = content;
      
      // Replace image URLs and other static file URLs
      content = content.replace(
        /http:\/\/localhost:5000\/([^'"`\s]+)/g, 
        (match, path) => {
          console.log(`  🔄 Replacing: ${match}`);
          return `\${API_ENDPOINTS.BASE_URL}/${path}`;
        }
      );
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✅ Updated file successfully`);
        updated = true;
      } else {
        console.log(`  ⚠️  No changes needed`);
      }
    }
  } catch (error) {
    console.error(`  ❌ Error updating ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🚀 Final cleanup of localhost URLs...');

const frontendSrcPath = path.join(__dirname, 'frontend', 'src');
const files = findFiles(frontendSrcPath);

console.log(`Found ${files.length} files to check`);

let updatedCount = 0;
files.forEach(file => {
  const originalContent = fs.readFileSync(file, 'utf8');
  updateFile(file);
  const newContent = fs.readFileSync(file, 'utf8');
  if (originalContent !== newContent) {
    updatedCount++;
  }
});

console.log(`\n🎉 Final cleanup complete! Updated ${updatedCount} files.`);

// Check remaining localhost URLs
console.log('\n🔍 Checking for remaining localhost URLs...');
const remainingFiles = [];
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://localhost:5000')) {
    remainingFiles.push(file);
  }
});

if (remainingFiles.length > 0) {
  console.log(`⚠️  ${remainingFiles.length} files still contain localhost URLs:`);
  remainingFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
} else {
  console.log('✅ All localhost URLs have been successfully replaced!');
}
