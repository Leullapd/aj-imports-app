const express = require('express');
const PaymentMethod = require('../models/PaymentMethod');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all payment methods (public)
router.get('/', async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ isActive: true }).sort({ name: 1 });
    res.json(paymentMethods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all payment methods (admin only - includes inactive)
router.get('/admin', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const paymentMethods = await PaymentMethod.find().sort({ name: 1 });
    res.json(paymentMethods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new payment method (admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, code, description, icon, instructions, accountInfo } = req.body;

    // Validate required fields
    if (!name || !code || !description) {
      return res.status(400).json({ message: 'Name, code, and description are required' });
    }

    // Check if code already exists
    const existingMethod = await PaymentMethod.findOne({ code });
    if (existingMethod) {
      return res.status(400).json({ message: 'Payment method code already exists' });
    }

    const paymentMethod = new PaymentMethod({
      name,
      code,
      description,
      icon: icon || '💳',
      instructions: instructions || '',
      accountInfo: accountInfo || ''
    });

    await paymentMethod.save();
    res.status(201).json(paymentMethod);
  } catch (error) {
    console.error('Create payment method error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payment method (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, code, description, isActive, icon, instructions, accountInfo } = req.body;

    const paymentMethod = await PaymentMethod.findById(req.params.id);
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    // Check if code already exists (if changing)
    if (code && code !== paymentMethod.code) {
      const existingMethod = await PaymentMethod.findOne({ code });
      if (existingMethod) {
        return res.status(400).json({ message: 'Payment method code already exists' });
      }
    }

    paymentMethod.name = name || paymentMethod.name;
    paymentMethod.code = code || paymentMethod.code;
    paymentMethod.description = description || paymentMethod.description;
    paymentMethod.isActive = isActive !== undefined ? isActive : paymentMethod.isActive;
    paymentMethod.icon = icon || paymentMethod.icon;
    paymentMethod.instructions = instructions !== undefined ? instructions : paymentMethod.instructions;
    paymentMethod.accountInfo = accountInfo !== undefined ? accountInfo : paymentMethod.accountInfo;

    await paymentMethod.save();
    res.json(paymentMethod);
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete payment method (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const paymentMethod = await PaymentMethod.findById(req.params.id);
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    await PaymentMethod.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
