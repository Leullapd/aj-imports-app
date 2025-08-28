const express = require('express');
const router = express.Router();
const PrivacyPolicy = require('../models/PrivacyPolicy');
const auth = require('../middleware/auth');

// Get privacy policy (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const policy = await PrivacyPolicy.getPrivacyPolicy();
    res.json({
      content: policy.content,
      lastUpdated: policy.lastUpdated,
      updatedBy: policy.updatedBy
    });
  } catch (error) {
    console.error('Get privacy policy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update privacy policy (admin only)
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

    let policy = await PrivacyPolicy.findOne();
    
    if (policy) {
      // Update existing policy
      policy.content = content;
      policy.lastUpdated = new Date();
      policy.updatedBy = req.user._id;
    } else {
      // Create new policy
      policy = new PrivacyPolicy({
        content,
        updatedBy: req.user._id
      });
    }

    await policy.save();

    res.json({
      message: 'Privacy Policy updated successfully',
      content: policy.content,
      lastUpdated: policy.lastUpdated
    });
  } catch (error) {
    console.error('Update privacy policy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get privacy policy (public - no authentication required)
router.get('/public', async (req, res) => {
  try {
    const policy = await PrivacyPolicy.getPrivacyPolicy();
    res.json({
      content: policy.content,
      lastUpdated: policy.lastUpdated
    });
  } catch (error) {
    console.error('Get public privacy policy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
