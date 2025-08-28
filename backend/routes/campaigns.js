const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate('products').populate('createdBy', 'name email');
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaigns' });
  }
});

// Get single campaign
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('products').populate('createdBy', 'name email');
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaign' });
  }
});

// Create a new campaign
router.post('/', async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ message: 'Error creating campaign' });
  }
});

// Update a campaign
router.put('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('products').populate('createdBy', 'name email');
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ message: 'Error updating campaign' });
  }
});

// Delete a campaign
router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting campaign' });
  }
});

module.exports = router;