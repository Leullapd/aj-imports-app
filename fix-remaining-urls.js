const fs = require('fs');
const path = require('path');

// Files that still need to be updated
const filesToUpdate = [
  'frontend/src/pages/UserPremiumOrdersAndPayments.jsx',
  'frontend/src/pages/UserOrdersAndPayments.jsx',
  'frontend/src/pages/PremiumOrder.jsx',
  'frontend/src/pages/PremiumCampaigns.jsx',
  'frontend/src/pages/PremiumCampaignDetail.jsx',
  'frontend/src/pages/CustomerProfile.jsx',
  'frontend/src/pages/AdminUsers.jsx',
  'frontend/src/pages/AdminPremiumOrders.jsx',
  'frontend/src/pages/AdminPremiumCampaigns.jsx',
  'frontend/src/pages/AdminOrdersAndPayments.jsx'
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
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
    
    // Replace all localhost URLs with API_ENDPOINTS
    const originalContent = content;
    
    // Replace common patterns
    content = content.replace(
      /http:\/\/localhost:5000\/api\/([^'"`\s]+)/g, 
      (match, endpoint) => {
        console.log(`  🔄 Replacing: ${match}`);
        return `\${API_ENDPOINTS.BASE_URL}/api/${endpoint}`;
      }
    );
    
    // Handle template literals
    content = content.replace(
      /`http:\/\/localhost:5000\/api\/([^`]+)`/g,
      (match, endpoint) => {
        console.log(`  🔄 Replacing template: ${match}`);
        return `\`\${API_ENDPOINTS.BASE_URL}/api/${endpoint}\``;
      }
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Updated file successfully`);
      updated = true;
    } else {
      console.log(`  ⚠️  No changes needed`);
    }
    
    return updated;
  } catch (error) {
    console.error(`  ❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🚀 Fixing remaining API URLs...');

let updatedCount = 0;
filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    if (updateFile(file)) {
      updatedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n🎉 Update complete! Updated ${updatedCount} files.`);
