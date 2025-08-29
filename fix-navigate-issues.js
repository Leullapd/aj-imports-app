const fs = require('fs');
const path = require('path');

// Files that need navigate variable declaration
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

    // Check if file uses navigate but doesn't have the declaration
    if (content.includes('navigate(') && !content.includes('const navigate = useNavigate()')) {
      // Find where to add the navigate declaration
      const componentMatch = content.match(/const\s+(\w+)\s*=\s*\(\)\s*=>\s*{/);
      if (componentMatch) {
        // Add navigate declaration after the component function starts
        const insertPoint = content.indexOf('{', content.indexOf(componentMatch[0])) + 1;
        const navigateDeclaration = '\n  const navigate = useNavigate();\n';
        
        content = content.slice(0, insertPoint) + navigateDeclaration + content.slice(insertPoint);
        updated = true;
        console.log('  ✅ Added navigate declaration');
      }
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
console.log('🚀 Fixing navigate variable issues...');

let updatedCount = 0;
filesToFix.forEach(file => {
  if (fixFile(file)) {
    updatedCount++;
  }
});

console.log(`\n🎉 Navigate fixes complete! Updated ${updatedCount} files.`);
