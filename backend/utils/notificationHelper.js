const Notification = require('../models/Notification');

// Helper function to create notifications
const createNotification = async (userId, type, title, message, status = 'info', data = {}) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      status,
      data,
      read: false
    });

    await notification.save();
    console.log(`Notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Helper function to create payment verification notification
const createPaymentVerificationNotification = async (order, round, status, notes = '') => {
  try {
    const roundText = round === 'firstPayment' ? 'first' : 'second';
    const orderId = order._id.toString().slice(-6);
    
    let title, message, notificationStatus;
    
    if (status === 'verified') {
      title = 'Payment Verified!';
      message = `Your ${roundText} payment for order #${orderId} has been verified successfully.`;
      notificationStatus = 'success';
    } else if (status === 'rejected') {
      title = 'Payment Rejected';
      message = `Your ${roundText} payment for order #${orderId} was rejected.${notes ? ` Reason: ${notes}` : ''}`;
      notificationStatus = 'error';
    }

    await createNotification(
      order.user,
      'payment',
      title,
      message,
      notificationStatus,
      {
        orderId: order._id.toString(),
        paymentRound: round
      }
    );
  } catch (error) {
    console.error('Error creating payment verification notification:', error);
  }
};

// Helper function to create order status change notification
const createOrderStatusNotification = async (order, newStatus) => {
  try {
    const orderId = order._id.toString().slice(-6);
    const title = 'Order Status Updated';
    const message = `Your order #${orderId} status has been updated to: ${newStatus}`;
    
    await createNotification(
      order.user,
      'order',
      title,
      message,
      'info',
      {
        orderId: order._id.toString(),
        status: newStatus
      }
    );
  } catch (error) {
    console.error('Error creating order status notification:', error);
  }
};

// Helper function to create new message notification
const createMessageNotification = async (recipientId, senderName, messageText) => {
  try {
    const title = 'New Message';
    const message = `New message from ${senderName}: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`;
    
    await createNotification(
      recipientId,
      'message',
      title,
      message,
      'new',
      {
        senderName,
        message: messageText
      }
    );
  } catch (error) {
    console.error('Error creating message notification:', error);
  }
};

// Helper function to create new order notification for admin
const createNewOrderNotification = async (order) => {
  try {
    const orderId = order._id.toString().slice(-6);
    const title = 'New Order Received';
    const message = `New order #${orderId} received from ${order.user?.name || 'Customer'}`;
    
    // Find admin user
    const User = require('../models/User');
    const adminUser = await User.findOne({ isAdmin: true });
    
    if (adminUser) {
      await createNotification(
        adminUser._id,
        'order',
        title,
        message,
        'new',
        {
          orderId: order._id.toString(),
          customerName: order.user?.name || 'Customer'
        }
      );
    }
  } catch (error) {
    console.error('Error creating new order notification:', error);
  }
};

module.exports = {
  createNotification,
  createPaymentVerificationNotification,
  createOrderStatusNotification,
  createMessageNotification,
  createNewOrderNotification
};
