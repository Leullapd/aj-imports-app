#!/usr/bin/env node

/**
 * Build script for production deployment
 * This script will:
 * 1. Update API URLs to production backend
 * 2. Build the frontend for production
 * 3. Create a deployment package
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build process...\n');

// Get backend URL from command line or environment
const backendUrl = process.argv[2] || process.env.BACKEND_URL;

if (!backendUrl) {
  console.error('❌ Please provide your backend URL');
  console.log('Usage: node build-for-production.js YOUR_BACKEND_URL');
  console.log('Example: node build-for-production.js https://your-app.railway.app');
  process.exit(1);
}

console.log(`🔗 Backend URL: ${backendUrl}\n`);

try {
  // Step 1: Update API URLs
  console.log('📝 Step 1: Updating API URLs...');
  execSync(`node update-api-urls.js "${backendUrl}"`, { stdio: 'inherit' });
  console.log('✅ API URLs updated\n');

  // Step 2: Install dependencies
  console.log('📦 Step 2: Installing dependencies...');
  process.chdir('frontend');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');

  // Step 3: Build frontend
  console.log('🔨 Step 3: Building frontend for production...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend built successfully\n');

  // Step 4: Create deployment package
  console.log('📦 Step 4: Creating deployment package...');
  const buildDir = path.join(process.cwd(), 'build');
  const deploymentDir = path.join(process.cwd(), '..', 'deployment-package');
  
  // Remove old deployment package if exists
  if (fs.existsSync(deploymentDir)) {
    fs.rmSync(deploymentDir, { recursive: true, force: true });
  }
  
  // Copy build files to deployment package
  fs.cpSync(buildDir, deploymentDir, { recursive: true });
  
  // Create deployment info file
  const deploymentInfo = {
    backendUrl: backendUrl,
    buildDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  fs.writeFileSync(
    path.join(deploymentDir, 'deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log('✅ Deployment package created\n');

  // Step 5: Display instructions
  console.log('🎉 Build process completed successfully!\n');
  console.log('📋 Next steps:');
  console.log('1. Upload all files from "deployment-package" folder to your Hostinger public_html');
  console.log('2. Make sure your domain points to Hostinger');
  console.log('3. Test your website to ensure everything works\n');
  
  console.log('📁 Files ready for upload:');
  console.log(`   Location: ${deploymentDir}`);
  console.log(`   Backend URL: ${backendUrl}`);
  console.log(`   Build Date: ${deploymentInfo.buildDate}\n`);

} catch (error) {
  console.error('❌ Build process failed:', error.message);
  process.exit(1);
}
