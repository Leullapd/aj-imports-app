const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test function to verify admin token
function testAdminToken(token) {
  try {
    console.log('Testing admin token...');
    console.log('Token:', token);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    if (decoded.isAdmin) {
      console.log('✅ Valid admin token');
      console.log('Admin ID:', decoded.id);
      console.log('Admin Email:', decoded.email);
      console.log('Is Admin:', decoded.isAdmin);
    } else {
      console.log('❌ Token is not an admin token');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Token validation failed:', error.message);
    return false;
  }
}

// If a token is provided as command line argument, test it
if (process.argv[2]) {
  testAdminToken(process.argv[2]);
} else {
  console.log('Usage: node testAdminToken.js <token>');
  console.log('This will help debug admin token validation issues.');
}
