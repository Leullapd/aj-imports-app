const mongoose = require('mongoose');
const User = require('./models/User');
const PrivateMessage = require('./models/PrivateMessage');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testPrivateMessage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.log('❌ No admin user found. Please run setupAdmin.js first.');
      return;
    }
    console.log('✅ Admin user found:', adminUser.email);

    // Check if regular user exists, if not create one
    let regularUser = await User.findOne({ isAdmin: { $ne: true } });
    if (!regularUser) {
      console.log('🔄 Creating test regular user...');
      const hashedPassword = await bcrypt.hash('user123', 10);
      regularUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        phone: 'Test Phone',
        address: 'Test Address',
        city: 'Test City',
        idImage: 'test-id.jpg',
        isAdmin: false
      });
      await regularUser.save();
      console.log('✅ Test user created:', regularUser.email);
    } else {
      console.log('✅ Regular user found:', regularUser.email);
    }

    // Test creating a private message
    console.log('\n🔄 Testing private message creation...');
    const testMessage = new PrivateMessage({
      user: regularUser._id,
      admin: adminUser._id,
      message: 'This is a test private message',
      sender: 'user'
    });

    await testMessage.save();
    console.log('✅ Private message created successfully');

    // Test retrieving messages
    console.log('\n🔄 Testing message retrieval...');
    
    // Get user messages
    const userMessages = await PrivateMessage.find({ user: regularUser._id })
      .populate('admin', 'name email');
    console.log(`✅ Found ${userMessages.length} messages for user`);

    // Get admin messages
    const adminMessages = await PrivateMessage.find({ admin: adminUser._id })
      .populate('user', 'name email');
    console.log(`✅ Found ${adminMessages.length} messages for admin`);

    // Clean up test message
    await PrivateMessage.findByIdAndDelete(testMessage._id);
    console.log('✅ Test message cleaned up');

    console.log('\n✅ Private message test completed successfully!');
    console.log('\n💡 The private message system is working correctly.');
    console.log('   You can now test it in the frontend.');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error testing private message:', error);
    process.exit(1);
  }
}

testPrivateMessage();
