const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
require('dotenv').config();

const testAdminAuth = async () => {
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
    console.log('Name:', adminUser.name);
    console.log('Email:', adminUser.email);
    console.log('isAdmin:', adminUser.isAdmin);
    console.log('ID:', adminUser._id);
    
    // Create admin token
    const adminToken = jwt.sign({ 
      id: adminUser._id, 
      email: adminUser.email,
      isAdmin: true 
    }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    console.log('\n🔑 Admin token created');
    console.log('Token:', adminToken);
    
    // Decode token to check contents
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    console.log('\n🔍 Decoded token:');
    console.log('ID:', decoded.id);
    console.log('Email:', decoded.email);
    console.log('isAdmin:', decoded.isAdmin);
    
    // Test the auth middleware logic
    console.log('\n🧪 Testing auth middleware logic:');
    if (decoded.isAdmin) {
      console.log('✅ Token has isAdmin: true');
      const foundAdmin = await User.findById(decoded.id).select('-password');
      if (foundAdmin && foundAdmin.isAdmin) {
        console.log('✅ Admin user found in database with isAdmin: true');
        console.log('✅ Auth middleware would allow access');
      } else {
        console.log('❌ Admin user not found or isAdmin is false');
      }
    } else {
      console.log('❌ Token does not have isAdmin: true');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testAdminAuth();
