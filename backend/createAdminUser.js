const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@ajimport.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin',
      email: 'admin@ajimport.com',
      password: 'admin123', // This will be hashed by the pre-save hook
      phone: 'Admin Phone',
      address: 'Admin Address',
      city: 'Admin City',
      idImage: 'admin-id.jpg', // Required field
      isAdmin: true
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createAdminUser();
