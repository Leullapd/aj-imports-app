const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const fixAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find admin user
    const adminUser = await User.findOne({ isAdmin: true });
    
    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }
    
    console.log('✅ Admin user found:', adminUser.email);
    console.log('Current password hash:', adminUser.password);
    
    // Check if password is already hashed
    const isHashed = adminUser.password.startsWith('$2b$') || adminUser.password.startsWith('$2a$');
    
    if (!isHashed) {
      console.log('🔄 Password is not hashed, updating...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser.password = hashedPassword;
      await adminUser.save();
      console.log('✅ Password hashed and updated');
    } else {
      console.log('✅ Password is already hashed');
    }
    
    // Test login
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, adminUser.password);
    console.log('🔑 Password test result:', isMatch ? '✅ Valid' : '❌ Invalid');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

fixAdmin();
