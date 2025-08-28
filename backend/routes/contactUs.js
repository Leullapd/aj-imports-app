const express = require('express');
const router = express.Router();
const ContactUs = require('../models/ContactUs');
const auth = require('../middleware/auth');

// Get contact us (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const contact = await ContactUs.getContactUs();
    res.json({
      content: contact.content,
      lastUpdated: contact.lastUpdated,
      updatedBy: contact.updatedBy
    });
  } catch (error) {
    console.error('Get contact us error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update contact us (admin only)
router.post('/admin', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    let contact = await ContactUs.findOne();
    
    if (contact) {
      // Update existing contact
      contact.content = content;
      contact.lastUpdated = new Date();
      contact.updatedBy = req.user._id;
    } else {
      // Create new contact
      contact = new ContactUs({
        content,
        updatedBy: req.user._id
      });
    }

    await contact.save();

    res.json({
      message: 'Contact Us updated successfully',
      content: contact.content,
      lastUpdated: contact.lastUpdated
    });
  } catch (error) {
    console.error('Update contact us error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get contact us (public - no authentication required)
router.get('/public', async (req, res) => {
  try {
    const contact = await ContactUs.getContactUs();
    res.json({
      content: contact.content,
      lastUpdated: contact.lastUpdated
    });
  } catch (error) {
    console.error('Get public contact us error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
