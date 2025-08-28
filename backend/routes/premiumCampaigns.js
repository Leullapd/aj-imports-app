const express = require('express');
const router = express.Router();
const PremiumCampaign = require('../models/PremiumCampaign');
const PremiumOrder = require('../models/PremiumOrder');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/premium-campaigns/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'premium-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all premium campaigns (public)
router.get('/', async (req, res) => {
  try {
    const { category, status, limit = 10, page = 1 } = req.query;
    
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (status === 'ongoing') {
      const now = new Date();
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
      query.isCompleted = false;
    } else if (status === 'upcoming') {
      query.startDate = { $gt: new Date() };
    } else if (status === 'completed') {
      query.isCompleted = true;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const campaigns = await PremiumCampaign.find(query)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await PremiumCampaign.countDocuments(query);
    
    res.json({
      campaigns,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + campaigns.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get premium campaigns error:', error);
    res.status(500).json({ message: 'Error fetching premium campaigns' });
  }
});

// Get single premium campaign (public)
router.get('/:id', async (req, res) => {
  try {
    const campaign = await PremiumCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Premium campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    console.error('Get premium campaign error:', error);
    res.status(500).json({ message: 'Error fetching premium campaign' });
  }
});

// Create premium campaign (admin only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('Creating premium campaign...');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Campaign image is required' });
    }

    const {
      title,
      description,
      category,
      originalPrice,
      premiumPrice,
      shippingCost,
      airCargoCost,
      totalQuantity,
      startDate,
      endDate,
      shippingDeadline,
      shippingDuration,
      requirements,
      benefits
    } = req.body;

    const campaign = new PremiumCampaign({
      title,
      description,
      category,
      originalPrice: parseFloat(originalPrice),
      premiumPrice: parseFloat(premiumPrice),
      shippingCost: parseFloat(shippingCost),
      airCargoCost: parseFloat(airCargoCost),
      totalQuantity: parseInt(totalQuantity),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      shippingDeadline: new Date(shippingDeadline),
      shippingDuration: parseInt(shippingDuration),
      image: req.file.path,
      requirements: requirements ? JSON.parse(requirements) : [],
      benefits: benefits ? JSON.parse(benefits) : []
    });

    console.log('Campaign object before save:', campaign);
    await campaign.save();
    console.log('Campaign saved successfully');
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create premium campaign error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Error creating premium campaign', error: error.message });
  }
});

// Update premium campaign (admin only)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const campaign = await PremiumCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Premium campaign not found' });
    }

    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.image = req.file.path;
    }

    if (updateData.originalPrice) updateData.originalPrice = parseFloat(updateData.originalPrice);
    if (updateData.premiumPrice) updateData.premiumPrice = parseFloat(updateData.premiumPrice);
    if (updateData.shippingCost) updateData.shippingCost = parseFloat(updateData.shippingCost);
    if (updateData.airCargoCost) updateData.airCargoCost = parseFloat(updateData.airCargoCost);
    if (updateData.totalQuantity) updateData.totalQuantity = parseInt(updateData.totalQuantity);
    if (updateData.shippingDuration) updateData.shippingDuration = parseInt(updateData.shippingDuration);
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.shippingDeadline) updateData.shippingDeadline = new Date(updateData.shippingDeadline);
    if (updateData.requirements) updateData.requirements = JSON.parse(updateData.requirements);
    if (updateData.benefits) updateData.benefits = JSON.parse(updateData.benefits);

    const updatedCampaign = await PremiumCampaign.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedCampaign);
  } catch (error) {
    console.error('Update premium campaign error:', error);
    res.status(500).json({ message: 'Error updating premium campaign' });
  }
});

// Delete premium campaign (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const campaign = await PremiumCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Premium campaign not found' });
    }

    await PremiumCampaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Premium campaign deleted successfully' });
  } catch (error) {
    console.error('Delete premium campaign error:', error);
    res.status(500).json({ message: 'Error deleting premium campaign' });
  }
});



// Get premium campaign orders (admin only)
router.get('/:id/orders', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const orders = await PremiumOrder.find({ premiumCampaign: req.params.id })
      .populate('user', 'name email phone')
      .populate('premiumCampaign', 'title');

    res.json(orders);
  } catch (error) {
    console.error('Get premium campaign orders error:', error);
    res.status(500).json({ message: 'Error fetching premium campaign orders' });
  }
});

module.exports = router;
