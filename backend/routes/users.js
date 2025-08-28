const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const Order = require('../models/Order');
const PremiumOrder = require('../models/PremiumOrder');

// Get user profile (protected route)
router.get('/profile', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile (protected route)
router.put('/profile', auth, async (req, res) => {
  try {
    const { phone, password } = req.body;
    const updateData = {};

    // Only allow updating phone and password
    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Get user stats for dashboard
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get regular orders
    const regularOrders = await Order.find({ user: userId })
      .populate('product', 'name price');

    // Get premium orders
    const premiumOrders = await PremiumOrder.find({ user: userId })
      .populate('premiumCampaign', 'title premiumPrice');

    console.log(`Stats calculation for user ${userId}:`);
    console.log(`Regular orders found: ${regularOrders.length}`);
    console.log(`Premium orders found: ${premiumOrders.length}`);

    // Calculate regular order stats
    const totalOrders = regularOrders.length;
    
    const pendingPayments = regularOrders.filter(order => {
      // Handle legacy orders without paymentPlan
      if (!order.paymentPlan) {
        return order.paymentStatus === 'pending';
      }
      
      // Handle new orders with paymentRounds
      if (order.paymentPlan === 'full') {
        return order.paymentRounds?.firstPayment?.status === 'pending';
      } else if (order.paymentPlan === 'installment') {
        const firstStatus = order.paymentRounds?.firstPayment?.status || 'pending';
        const secondStatus = order.paymentRounds?.secondPayment?.status || 'pending';
        return firstStatus === 'pending' || (firstStatus === 'verified' && secondStatus === 'pending');
      }
      
      return false;
    }).length;

    const confirmedOrders = regularOrders.filter(order => {
      // Handle legacy orders without paymentPlan
      if (!order.paymentPlan) {
        return order.paymentStatus === 'completed';
      }
      
      // Handle new orders with paymentRounds
      if (order.paymentPlan === 'full') {
        return order.paymentRounds?.firstPayment?.status === 'verified';
      } else if (order.paymentPlan === 'installment') {
        const firstStatus = order.paymentRounds?.firstPayment?.status || 'pending';
        const secondStatus = order.paymentRounds?.secondPayment?.status || 'pending';
        return firstStatus === 'verified' && secondStatus === 'verified';
      }
      
      return false;
    }).length;

    const totalSpent = regularOrders.reduce((sum, order) => {
      // Handle legacy orders without paymentPlan
      if (!order.paymentPlan) {
        return order.paymentStatus === 'completed' ? sum + (order.totalPrice || 0) : sum;
      }
      
      // Handle new orders with paymentRounds - use actual payment amounts
      if (order.paymentPlan === 'full') {
        if (order.paymentRounds?.firstPayment?.status === 'verified') {
          return sum + (order.paymentRounds.firstPayment.amount || 0);
        }
      } else if (order.paymentPlan === 'installment') {
        const firstStatus = order.paymentRounds?.firstPayment?.status || 'pending';
        const secondStatus = order.paymentRounds?.secondPayment?.status || 'pending';
        if (firstStatus === 'verified' && secondStatus === 'verified') {
          const firstAmount = order.paymentRounds.firstPayment.amount || 0;
          const secondAmount = order.paymentRounds.secondPayment.amount || 0;
          return sum + firstAmount + secondAmount;
        }
      }
      
      return sum;
    }, 0);

    // Calculate premium order stats
    const premiumOrdersCount = premiumOrders.length;
    
    const premiumSpent = premiumOrders.reduce((sum, order) => {
      if (order.paymentPlan === 'full') {
        if (order.paymentRounds?.firstPayment?.status === 'verified') {
          return sum + (order.paymentRounds.firstPayment.amount || 0);
        }
      } else if (order.paymentPlan === 'installment') {
        const firstStatus = order.paymentRounds?.firstPayment?.status || 'pending';
        const secondStatus = order.paymentRounds?.secondPayment?.status || 'pending';
        if (firstStatus === 'verified' && secondStatus === 'verified') {
          const firstAmount = order.paymentRounds.firstPayment.amount || 0;
          const secondAmount = order.paymentRounds.secondPayment.amount || 0;
          return sum + firstAmount + secondAmount;
        }
      }
      
      return sum;
    }, 0);

    const stats = {
      totalOrders,
      pendingPayments,
      confirmedOrders,
      totalSpent,
      premiumOrders: premiumOrdersCount,
      premiumSpent,
      unreadMessages: 0 // This will be updated by the private messages system
    };

    console.log('Calculated stats:', stats);
    res.json(stats);

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;