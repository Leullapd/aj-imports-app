const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get all messages (sorted by createdAt)
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Post a new message
router.post('/', async (req, res) => {
  try {
    const { user, text, avatar } = req.body;
    const message = new Message({ user, text, avatar });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: 'Error saving message' });
  }
});

// Edit a message (only by original user within 10 minutes)
router.put('/:id', async (req, res) => {
  try {
    const { user, text } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    // Only allow editing by original user within 10 minutes
    const now = new Date();
    const created = new Date(message.createdAt);
    if (message.user !== user) return res.status(403).json({ message: 'Not allowed' });
    if ((now - created) > 10 * 60 * 1000) return res.status(403).json({ message: 'Edit window expired' });
    message.text = text;
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: 'Error editing message' });
  }
});

// Delete a message (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Delete message request received:', {
      messageId: req.params.id,
      userId: req.user._id,
      isAdmin: req.user.isAdmin
    });

    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ message: 'Only admins can delete messages' });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      console.log('Message not found:', req.params.id);
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.deleteOne();
    console.log('Message deleted successfully:', req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// Bulk delete messages (admin only)
router.delete('/bulk-delete', auth, async (req, res) => {
  try {
    console.log('Bulk delete messages request received:', {
      userId: req.user._id,
      isAdmin: req.user.isAdmin
    });

    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ message: 'Only admins can delete messages' });
    }

    const result = await Message.deleteMany({});
    console.log('Bulk delete result:', result.deletedCount, 'messages deleted');

    res.json({
      message: `Successfully deleted ${result.deletedCount} messages`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting messages:', error);
    res.status(500).json({ message: 'Error deleting messages' });
  }
});

// Mark message as read (admin only)
router.put('/:id/read', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Only admins can mark messages as read' });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.isRead = true;
    await message.save();
    
    res.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Error marking message as read' });
  }
});

// Mark all messages as read (admin only)
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Only admins can mark messages as read' });
    }

    const result = await Message.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.json({
      message: `Successfully marked ${result.modifiedCount} messages as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

module.exports = router;
