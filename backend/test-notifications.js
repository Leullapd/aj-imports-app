const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const Notification = require('./models/Notification');
const User = require('./models/User');

async function testNotifications() {
  try {
    console.log('Testing notification system...');

    // Find a user to test with
    const user = await User.findOne({ isAdmin: false });
    if (!user) {
      console.log('No regular user found. Creating a test user...');
      return;
    }

    console.log(`Testing with user: ${user.name} (${user._id})`);

    // Create a test notification
    const testNotification = new Notification({
      user: user._id,
      type: 'payment',
      title: 'Test Payment Verified!',
      message: 'Your first payment for order #123456 has been verified successfully.',
      status: 'success',
      data: {
        orderId: '123456',
        paymentRound: 'firstPayment'
      }
    });

    await testNotification.save();
    console.log('✅ Test notification created successfully');

    // Fetch notifications for the user
    const notifications = await Notification.find({ 
      user: user._id,
      read: false 
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${notifications.length} unread notifications for user`);

    // Test unread count
    const unreadCount = await Notification.countDocuments({
      user: user._id,
      read: false
    });

    console.log(`✅ Unread count: ${unreadCount}`);

    // Mark notification as read
    await Notification.findOneAndUpdate(
      { _id: testNotification._id, user: user._id },
      { read: true }
    );

    console.log('✅ Notification marked as read');

    // Verify unread count decreased
    const newUnreadCount = await Notification.countDocuments({
      user: user._id,
      read: false
    });

    console.log(`✅ New unread count: ${newUnreadCount}`);

    // Clean up test notification
    await Notification.findByIdAndDelete(testNotification._id);
    console.log('✅ Test notification cleaned up');

    console.log('🎉 All notification tests passed!');
  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  } finally {
    mongoose.connection.close();
  }
}

testNotifications();
