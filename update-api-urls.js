#!/usr/bin/env node

/**
 * Script to update all API URLs from localhost to production backend URL
 * Usage: node update-api-urls.js YOUR_BACKEND_URL
 * Example: node update-api-urls.js https://your-app.railway.app
 */

const fs = require('fs');
const path = require('path');

// Get backend URL from command line arguments
const backendUrl = process.argv[2];

if (!backendUrl) {
  console.error('❌ Please provide your backend URL as an argument');
  console.log('Usage: node update-api-urls.js YOUR_BACKEND_URL');
  console.log('Example: node update-api-urls.js https://your-app.railway.app');
  process.exit(1);
}

// Validate URL format
if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
  console.error('❌ Backend URL must start with http:// or https://');
  process.exit(1);
}

console.log(`🔄 Updating API URLs to: ${backendUrl}`);

// Function to recursively find all .js and .jsx files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update API URLs in a file
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Replace localhost:5000 with backend URL
    const oldUrl = 'http://localhost:5000';
    if (content.includes(oldUrl)) {
      content = content.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), backendUrl);
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
const frontendDir = path.join(__dirname, 'frontend', 'src');
const files = findFiles(frontendDir);

console.log(`📁 Found ${files.length} files to check`);

let updatedCount = 0;
files.forEach(file => {
  if (updateFile(file)) {
    updatedCount++;
  }
});

console.log(`\n🎉 Update complete!`);
console.log(`📊 Updated ${updatedCount} files`);
console.log(`🔗 All API calls now point to: ${backendUrl}`);

if (updatedCount === 0) {
  console.log('\n⚠️  No files were updated. This might mean:');
  console.log('   - API URLs are already updated');
  console.log('   - No localhost:5000 references found');
  console.log('   - Files are in a different location');
}
