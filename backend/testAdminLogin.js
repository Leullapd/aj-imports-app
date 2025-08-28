const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const testAdminLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@ajimport.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('📋 Admin user found:');
    console.log('ID:', adminUser._id);
    console.log('Email:', adminUser.email);
    console.log('isAdmin:', adminUser.isAdmin);
    
    // Test password verification
    const isMatch = await bcrypt.compare('admin123', adminUser.password);
    console.log('🔑 Password match:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password verification failed');
      return;
    }
    
    // Create admin token (same as admin login route)
    const adminToken = jwt.sign({ 
      id: adminUser._id, 
      email: adminUser.email,
      isAdmin: true 
    }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    console.log('🎫 Admin token created:', adminToken ? 'Yes' : 'No');
    
    // Test token verification
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    console.log('🔍 Decoded token:');
    console.log('  ID:', decoded.id);
    console.log('  Email:', decoded.email);
    console.log('  isAdmin:', decoded.isAdmin);
    
    // Test auth middleware logic
    if (decoded.isAdmin) {
      const foundAdmin = await User.findById(decoded.id).select('-password');
      if (!foundAdmin || !foundAdmin.isAdmin) {
        console.log('❌ Auth middleware would reject this token');
      } else {
        console.log('✅ Auth middleware would accept this token');
        console.log('  User isAdmin:', foundAdmin.isAdmin);
      }
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testAdminLogin();
