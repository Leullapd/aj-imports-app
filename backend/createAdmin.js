const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ isAdmin: true });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
    } else {
      console.log('🔄 Creating admin user...');
      
      const adminUser = new User({
        name: 'Admin',
        email: 'admin@ajimport.com',
        password: 'admin123', // Use raw password, let middleware hash it
        phone: 'Admin Phone',
        address: 'Admin Address',
        city: 'Admin City',
        idImage: 'admin-id.jpg',
        isAdmin: true
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@ajimport.com');
      console.log('🔑 Password: admin123');
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

createAdmin();
