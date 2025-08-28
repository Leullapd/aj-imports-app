const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ isAdmin: true });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log(`   📧 Email: ${existingAdmin.email}`);
      console.log(`   👤 Name: ${existingAdmin.name}`);
      console.log(`   🆔 ID: ${existingAdmin._id}`);
      console.log(`   🔑 Is Admin: ${existingAdmin.isAdmin}`);
    } else {
      console.log('🔄 Creating admin user...');
      
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      
      const adminUser = new User({
        name: 'Admin',
        email: 'admin@ajimport.com',
        password: hashedPassword,
        phone: 'Admin Phone',
        address: 'Admin Address',
        city: 'Admin City',
        idImage: 'admin-id.jpg',
        isAdmin: true
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log(`   📧 Email: admin@ajimport.com`);
      console.log(`   🔑 Password: admin123`);
      console.log(`   🆔 ID: ${adminUser._id}`);
    }

    // Test admin login
    console.log('\n🔄 Testing admin login...');
    const adminUser = await User.findOne({ isAdmin: true });
    if (adminUser) {
      const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
      console.log(`   🔑 Password valid: ${isPasswordValid ? '✅ Yes' : '❌ No'}`);
    }

    // Count total users
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ isAdmin: true });
    const regularUsers = await User.countDocuments({ isAdmin: { $ne: true } });
    
    console.log('\n📊 User Statistics:');
    console.log(`   👥 Total Users: ${totalUsers}`);
    console.log(`   👨‍💼 Admin Users: ${adminUsers}`);
    console.log(`   👤 Regular Users: ${regularUsers}`);

    console.log('\n✅ Admin setup completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start the backend server: npm start');
    console.log('   2. Login to admin panel with: admin@ajimport.com / admin123');
    console.log('   3. Test private messaging functionality');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error during admin setup:', error);
    process.exit(1);
  }
}

setupAdmin();
