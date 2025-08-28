const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const Campaign = require('../models/Campaign');
const PremiumCampaign = require('../models/PremiumCampaign');
const Order = require('../models/Order');
const PremiumOrder = require('../models/PremiumOrder');
const User = require('../models/User');
const Payment = require('../models/Payment');

// Get admin dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Fetch all counts
    const [
      totalProducts,
      totalCampaigns,
      totalPremiumCampaigns,
      totalOrders,
      totalPremiumOrders,
      totalUsers,
      totalPayments
    ] = await Promise.all([
      Product.countDocuments(),
      Campaign.countDocuments(),
      PremiumCampaign.countDocuments(),
      Order.countDocuments(),
      PremiumOrder.countDocuments(),
      User.countDocuments({ isAdmin: false }),
      Payment.countDocuments()
    ]);

    // Calculate total revenue
    const allOrders = await Order.find();
    const allPremiumOrders = await PremiumOrder.find();

    // Calculate revenue from regular orders
    const regularRevenue = allOrders.reduce((total, order) => {
      if (order.paymentPlan === 'full' && order.payment?.status === 'verified') {
        return total + (order.totalPrice || 0);
      } else if (order.paymentPlan === 'installment') {
        let revenue = 0;
        if (order.paymentRounds?.firstPayment?.status === 'verified') {
          revenue += (order.paymentRounds.firstPayment.amount || 0);
        }
        if (order.paymentRounds?.secondPayment?.status === 'verified') {
          revenue += (order.paymentRounds.secondPayment.amount || 0);
        }
        return total + revenue;
      }
      return total;
    }, 0);

    // Calculate revenue from premium orders
    const premiumRevenue = allPremiumOrders.reduce((total, order) => {
      if (order.paymentPlan === 'full' && order.paymentRounds?.firstPayment?.status === 'verified') {
        return total + (order.totalCost || 0);
      } else if (order.paymentPlan === 'installment') {
        let revenue = 0;
        if (order.paymentRounds?.firstPayment?.status === 'verified') {
          revenue += (order.paymentRounds.firstPayment.amount || 0);
        }
        if (order.paymentRounds?.secondPayment?.status === 'verified') {
          revenue += (order.paymentRounds.secondPayment.amount || 0);
        }
        return total + revenue;
      }
      return total;
    }, 0);

    const totalRevenue = regularRevenue + premiumRevenue;

    // Get active campaigns
    const activeCampaigns = await PremiumCampaign.countDocuments({ 
      isActive: true, 
      isCompleted: false 
    });

    res.json({
      totalProducts,
      totalCampaigns: totalCampaigns + totalPremiumCampaigns,
      totalOrders: totalOrders + totalPremiumOrders,
      totalUsers,
      totalRevenue,
      activeCampaigns,
      premiumOrders: totalPremiumOrders,
      regularOrders: totalOrders,
      premiumCampaigns: totalPremiumCampaigns,
      regularCampaigns: totalCampaigns
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching admin stats' });
  }
});

module.exports = router;
