const express = require('express');
const PrivateMessage = require('../models/PrivateMessage');
const auth = require('../middleware/auth');

const router = express.Router();

// Get private messages for a user
router.get('/user', auth, async (req, res) => {
  try {
    console.log('GET /user - User:', req.user);
    console.log('GET /user - User ID:', req.user.id);
    
    const messages = await PrivateMessage.find({ user: req.user.id })
      .populate('admin', 'name')
      .sort({ createdAt: -1 });
    
    console.log('GET /user - Found messages:', messages.length);
    console.log('GET /user - Messages:', messages.map(m => ({ id: m._id, message: m.message.substring(0, 20) + '...', createdAt: m.createdAt })));
    res.json(messages);
  } catch (error) {
    console.error('Get user private messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get private messages for admin (all conversations)
router.get('/admin', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find admin user in database
    const adminUser = await require('../models/User').findOne({ isAdmin: true });
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const messages = await PrivateMessage.find({ admin: adminUser._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Get admin private messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation between admin and specific user
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find admin user in database
    const adminUser = await require('../models/User').findOne({ isAdmin: true });
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const messages = await PrivateMessage.find({
      user: req.params.userId,
      admin: adminUser._id
    }).sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send private message (user to admin)
router.post('/user', auth, async (req, res) => {
  try {
    console.log('POST /user - Request body:', req.body);
    console.log('POST /user - User:', req.user);
    
    const { message } = req.body;
    
    if (!message) {
      console.log('POST /user - No message provided');
      return res.status(400).json({ message: 'Message is required' });
    }

    // Find admin user
    const adminUser = await require('../models/User').findOne({ isAdmin: true });
    console.log('POST /user - Admin user found:', adminUser ? adminUser.email : 'Not found');
    
    if (!adminUser) {
      console.log('POST /user - Admin not found');
      return res.status(404).json({ message: 'Admin not found' });
    }

    const privateMessage = new PrivateMessage({
      user: req.user.id,
      admin: adminUser._id,
      message,
      sender: 'user'
    });

    console.log('POST /user - Creating message:', privateMessage);
    await privateMessage.save();
    console.log('POST /user - Message saved successfully with ID:', privateMessage._id);
    
    const populatedMessage = await PrivateMessage.findById(privateMessage._id)
      .populate('admin', 'name');
    
    console.log('POST /user - Sending response:', populatedMessage);
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send user private message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send private message (admin to user)
router.post('/admin/:userId', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Find admin user in database
    const adminUser = await require('../models/User').findOne({ isAdmin: true });
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const privateMessage = new PrivateMessage({
      user: req.params.userId,
      admin: adminUser._id,
      message,
      sender: 'admin'
    });

    await privateMessage.save();
    
    const populatedMessage = await PrivateMessage.findById(privateMessage._id)
      .populate('user', 'name email');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send admin private message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as read
router.put('/read/:messageId', auth, async (req, res) => {
  try {
    const message = await PrivateMessage.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only the recipient can mark as read
    if (req.user.isAdmin && message.sender === 'user') {
      message.isRead = true;
    } else if (!req.user.isAdmin && message.sender === 'admin') {
      message.isRead = true;
    }

    await message.save();
    res.json(message);
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all messages in a conversation as read
router.put('/conversation/read/:userId', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find admin user in database
    const adminUser = await require('../models/User').findOne({ isAdmin: true });
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Mark all unread messages from user to admin as read
    await PrivateMessage.updateMany(
      {
        user: req.params.userId,
        admin: adminUser._id,
        sender: 'user',
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Mark conversation read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all admin messages as read for a user
router.put('/user/read-all', auth, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find admin user in database
    const adminUser = await require('../models/User').findOne({ isAdmin: true });
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Mark all unread messages from admin to user as read
    await PrivateMessage.updateMany(
      {
        user: req.user.id,
        admin: adminUser._id,
        sender: 'admin',
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'All admin messages marked as read' });
  } catch (error) {
    console.error('Mark user messages read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count for user
router.get('/user/unread-count', auth, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find admin user in database
    const adminUser = await require('../models/User').findOne({ isAdmin: true });
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const unreadCount = await PrivateMessage.countDocuments({
      user: req.user.id,
      admin: adminUser._id,
      sender: 'admin',
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count for admin (all users)
router.get('/admin/unread-count', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find admin user in database
    const adminUser = await require('../models/User').findOne({ isAdmin: true });
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const unreadCount = await PrivateMessage.countDocuments({
      admin: adminUser._id,
      sender: 'user',
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get admin unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count for specific user (admin view)
router.get('/admin/unread-count/:userId', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find admin user in database
    const adminUser = await require('../models/User').findOne({ isAdmin: true });
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const unreadCount = await PrivateMessage.countDocuments({
      user: req.params.userId,
      admin: adminUser._id,
      sender: 'user',
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get user unread count for admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
