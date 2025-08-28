const express = require('express');
const router = express.Router();
const TermsOfUse = require('../models/TermsOfUse');
const auth = require('../middleware/auth');

// Get terms of use (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const terms = await TermsOfUse.getTermsOfUse();
    res.json({
      content: terms.content,
      lastUpdated: terms.lastUpdated,
      updatedBy: terms.updatedBy
    });
  } catch (error) {
    console.error('Get terms of use error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update terms of use (admin only)
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

    let terms = await TermsOfUse.findOne();
    
    if (terms) {
      // Update existing terms
      terms.content = content;
      terms.lastUpdated = new Date();
      terms.updatedBy = req.user._id;
    } else {
      // Create new terms
      terms = new TermsOfUse({
        content,
        updatedBy: req.user._id
      });
    }

    await terms.save();

    res.json({
      message: 'Terms of Use updated successfully',
      content: terms.content,
      lastUpdated: terms.lastUpdated
    });
  } catch (error) {
    console.error('Update terms of use error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get terms of use (public - no authentication required)
router.get('/public', async (req, res) => {
  try {
    const terms = await TermsOfUse.getTermsOfUse();
    res.json({
      content: terms.content,
      lastUpdated: terms.lastUpdated
    });
  } catch (error) {
    console.error('Get public terms of use error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
