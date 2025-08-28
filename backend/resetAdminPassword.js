const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const resetAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@ajimport.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('📋 Current admin user:');
    console.log('ID:', adminUser._id);
    console.log('Email:', adminUser.email);
    console.log('isAdmin:', adminUser.isAdmin);
    
    // Reset password to 'admin123' (will be hashed by pre-save hook)
    adminUser.password = 'admin123';
    await adminUser.save();
    
    console.log('✅ Admin password reset to: admin123');
    console.log('🔑 You can now login with:');
    console.log('   Email: admin@ajimport.com');
    console.log('   Password: admin123');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

resetAdminPassword();
