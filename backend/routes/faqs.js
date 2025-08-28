const express = require('express');
const router = express.Router();
const FAQs = require('../models/FAQs');
const auth = require('../middleware/auth');

// Get FAQs (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const faqs = await FAQs.getFAQs();
    res.json({
      content: faqs.content,
      lastUpdated: faqs.lastUpdated,
      updatedBy: faqs.updatedBy
    });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update FAQs (admin only)
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

    let faqs = await FAQs.findOne();
    
    if (faqs) {
      // Update existing FAQs
      faqs.content = content;
      faqs.lastUpdated = new Date();
      faqs.updatedBy = req.user._id;
    } else {
      // Create new FAQs
      faqs = new FAQs({
        content,
        updatedBy: req.user._id
      });
    }

    await faqs.save();

    res.json({
      message: 'FAQs updated successfully',
      content: faqs.content,
      lastUpdated: faqs.lastUpdated
    });
  } catch (error) {
    console.error('Update FAQs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get FAQs (public - no authentication required)
router.get('/public', async (req, res) => {
  try {
    const faqs = await FAQs.getFAQs();
    res.json({
      content: faqs.content,
      lastUpdated: faqs.lastUpdated
    });
  } catch (error) {
    console.error('Get public FAQs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
