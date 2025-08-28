const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find admin user by email
    const adminUser = await User.findOne({ email: 'admin@ajimport.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('📋 Current admin user details:');
    console.log('Name:', adminUser.name);
    console.log('Email:', adminUser.email);
    console.log('isAdmin:', adminUser.isAdmin);
    console.log('ID:', adminUser._id);
    
    // Update isAdmin to true if it's not already
    if (!adminUser.isAdmin) {
      console.log('🔄 Updating isAdmin to true...');
      adminUser.isAdmin = true;
      await adminUser.save();
      console.log('✅ isAdmin updated to true');
    } else {
      console.log('✅ isAdmin is already true');
    }
    
    // Verify the update
    const updatedAdmin = await User.findOne({ email: 'admin@ajimport.com' });
    console.log('✅ Final isAdmin value:', updatedAdmin.isAdmin);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

checkAdmin();
