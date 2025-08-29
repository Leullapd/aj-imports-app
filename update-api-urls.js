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
      console.log(`Updating: ${filePath}`);
      
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
        }
      }
      
      // Replace common API endpoints
      const replacements = [
        { from: "http://localhost:5000/api/auth/login", to: "API_ENDPOINTS.LOGIN" },
        { from: "http://localhost:5000/api/auth/register", to: "API_ENDPOINTS.REGISTER" },
        { from: "http://localhost:5000/api/auth/admin/login", to: "API_ENDPOINTS.ADMIN_LOGIN" },
        { from: "http://localhost:5000/api/products", to: "API_ENDPOINTS.PRODUCTS" },
        { from: "http://localhost:5000/api/campaigns", to: "API_ENDPOINTS.CAMPAIGNS" },
        { from: "http://localhost:5000/api/premium-campaigns", to: "API_ENDPOINTS.PREMIUM_CAMPAIGNS" },
        { from: "http://localhost:5000/api/orders", to: "API_ENDPOINTS.ORDERS" },
        { from: "http://localhost:5000/api/premium-orders", to: "API_ENDPOINTS.PREMIUM_ORDERS" },
        { from: "http://localhost:5000/api/payments", to: "API_ENDPOINTS.PAYMENTS" },
        { from: "http://localhost:5000/api/payment-methods", to: "API_ENDPOINTS.PAYMENT_METHODS" },
        { from: "http://localhost:5000/api/users", to: "API_ENDPOINTS.USERS" },
        { from: "http://localhost:5000/api/messages", to: "API_ENDPOINTS.MESSAGES" },
        { from: "http://localhost:5000/api/private-messages", to: "API_ENDPOINTS.PRIVATE_MESSAGES" },
        { from: "http://localhost:5000/api/categories", to: "API_ENDPOINTS.CATEGORIES" },
        { from: "http://localhost:5000/api/notifications", to: "API_ENDPOINTS.NOTIFICATIONS" },
        { from: "http://localhost:5000/api/analytics", to: "API_ENDPOINTS.ANALYTICS" },
        { from: "http://localhost:5000/api/privacy-policy", to: "API_ENDPOINTS.PRIVACY_POLICY" },
        { from: "http://localhost:5000/api/terms-of-use", to: "API_ENDPOINTS.TERMS_OF_USE" },
        { from: "http://localhost:5000/api/faqs", to: "API_ENDPOINTS.FAQS" },
        { from: "http://localhost:5000/api/contact-us", to: "API_ENDPOINTS.CONTACT_US" },
        { from: "http://localhost:5000/api/health", to: "API_ENDPOINTS.HEALTH" }
      ];
      
      replacements.forEach(({ from, to }) => {
        if (content.includes(from)) {
          content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
          updated = true;
        }
      });
      
      // Handle dynamic URLs that start with localhost
      content = content.replace(
        /http:\/\/localhost:5000\/api\/([^'"`\s]+)/g, 
        '`${API_ENDPOINTS.BASE_URL}/api/$1`'
      );
      
      if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🚀 Starting API URL update...');

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

console.log(`\n🎉 Update complete! Updated ${updatedCount} files.`);
console.log('\n📝 Next steps:');
console.log('1. Create frontend/.env file with: REACT_APP_API_BASE_URL=https://aj-test.onrender.com');
console.log('2. Test the application to ensure all API calls work');
console.log('3. Build and deploy the frontend');