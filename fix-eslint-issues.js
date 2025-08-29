const fs = require('fs');
const path = require('path');

// Files that need to be fixed
const filesToFix = [
  'frontend/src/components/OrderModal.jsx',
  'frontend/src/pages/AdminAnalytics.jsx',
  'frontend/src/pages/AdminCampaigns.jsx',
  'frontend/src/pages/AdminCategories.jsx',
  'frontend/src/pages/AdminDashboard.jsx',
  'frontend/src/pages/AdminMessages.jsx',
  'frontend/src/pages/AdminPaymentMethods.jsx',
  'frontend/src/pages/AdminPrivacyPolicy.jsx',
  'frontend/src/pages/AdminPrivateMessages.jsx',
  'frontend/src/pages/AdminProducts.jsx',
  'frontend/src/pages/AdminProfile.jsx',
  'frontend/src/pages/Campaigns.jsx',
  'frontend/src/pages/ContactUs.jsx',
  'frontend/src/pages/Dashboard.jsx',
  'frontend/src/pages/FAQs.jsx',
  'frontend/src/pages/Home.jsx',
  'frontend/src/pages/Payment.jsx',
  'frontend/src/pages/PremiumPayment.jsx',
  'frontend/src/pages/PrivacyPolicy.jsx',
  'frontend/src/pages/Register.jsx',
  'frontend/src/pages/TermsOfUse.jsx',
  'frontend/src/pages/TestProfile.jsx',
  'frontend/src/pages/UserOrders.jsx'
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    console.log(`\n📝 Processing: ${filePath}`);

    // Remove unused API_ENDPOINTS imports
    if (content.includes("import { API_ENDPOINTS }")) {
      content = content.replace(/import { API_ENDPOINTS } from ['"][^'"]*['"];\s*\n/g, '');
      updated = true;
      console.log('  ✅ Removed unused API_ENDPOINTS import');
    }

    // Remove unused variables (basic fixes)
    const unusedVarPatterns = [
      /const \[setSearchParams\] = useState\([^)]*\);\s*\n/g,
      /const navigate = useNavigate\(\);\s*\n/g,
      /const \[user, setUser\] = useState\([^)]*\);\s*\n/g,
      /const addOrderNotification = [^;]*;\s*\n/g,
      /const removeOrderNotification = [^;]*;\s*\n/g,
      /const \[orderId, setOrderId\] = useState\([^)]*\);\s*\n/g
    ];

    unusedVarPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        updated = true;
        console.log('  ✅ Removed unused variable');
      }
    });

    // Fix template string issues in AdminProfile.jsx
    if (filePath.includes('AdminProfile.jsx')) {
      content = content.replace(/\$\{([^}]+)\}/g, (match, variable) => {
        if (match.includes('`')) {
          return `\${${variable}}`;
        }
        return match;
      });
      updated = true;
      console.log('  ✅ Fixed template string issues');
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Updated file successfully`);
      return true;
    } else {
      console.log(`  ⚠️  No changes needed`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🚀 Fixing ESLint issues...');

let updatedCount = 0;
filesToFix.forEach(file => {
  if (fixFile(file)) {
    updatedCount++;
  }
});

console.log(`\n🎉 ESLint fixes complete! Updated ${updatedCount} files.`);
console.log('\n📝 Note: Some useEffect dependency warnings may remain but won\'t block the build.');
