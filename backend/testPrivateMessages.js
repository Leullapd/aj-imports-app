const mongoose = require('mongoose');
const User = require('./models/User');
const PrivateMessage = require('./models/PrivateMessage');
require('dotenv').config();

const testPrivateMessages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Check if admin user exists
    const adminUser = await User.findOne({ isAdmin: true });
    console.log('Admin user:', adminUser ? adminUser.email : 'Not found');
    
    // Check if there are any regular users
    const regularUsers = await User.find({ isAdmin: { $ne: true } });
    console.log('Regular users count:', regularUsers.length);
    
    // Check if there are any private messages
    const privateMessages = await PrivateMessage.find({});
    console.log('Private messages count:', privateMessages.length);
    
    if (privateMessages.length > 0) {
      console.log('Sample private message:', privateMessages[0]);
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
};

testPrivateMessages();
