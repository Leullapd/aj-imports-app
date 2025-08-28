const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Campaign = require('../models/Campaign');
const PremiumCampaign = require('../models/PremiumCampaign');
const Order = require('../models/Order');
const PremiumOrder = require('../models/PremiumOrder');
const User = require('../models/User');
const Message = require('../models/Message');

// Get comprehensive analytics dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // 1. Campaign Analytics
    const campaigns = await Campaign.find();
    const premiumCampaigns = await PremiumCampaign.find();

    const campaignAnalytics = {
      total: campaigns.length + premiumCampaigns.length,
      regular: {
        total: campaigns.length,
        active: campaigns.length, // All regular campaigns are considered active
        completed: 0, // Regular campaigns don't have completion status
        pending: 0
      },
      premium: {
        total: premiumCampaigns.length,
        active: premiumCampaigns.filter(c => c.isActive && !c.isCompleted).length,
        completed: premiumCampaigns.filter(c => c.isCompleted).length,
        pending: premiumCampaigns.filter(c => !c.isActive && !c.isCompleted).length
      }
    };

    // 2. Revenue Analytics
    const allOrders = await Order.find().populate('user');
    const allPremiumOrders = await PremiumOrder.find().populate('premiumCampaign user');

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

    const revenueAnalytics = {
      total: regularRevenue + premiumRevenue,
      regular: regularRevenue,
      premium: premiumRevenue,
      weekly: 0,
      monthly: 0,
      yearly: 0
    };

    // Calculate time-based revenue
    const weeklyOrders = allOrders.filter(order => 
      order.createdAt >= oneWeekAgo && 
      ((order.paymentPlan === 'full' && order.payment?.status === 'verified') ||
       (order.paymentPlan === 'installment' && 
        (order.paymentRounds?.firstPayment?.status === 'verified' || 
         order.paymentRounds?.secondPayment?.status === 'verified')))
    );

    const monthlyOrders = allOrders.filter(order => 
      order.createdAt >= oneMonthAgo && 
      ((order.paymentPlan === 'full' && order.payment?.status === 'verified') ||
       (order.paymentPlan === 'installment' && 
        (order.paymentRounds?.firstPayment?.status === 'verified' || 
         order.paymentRounds?.secondPayment?.status === 'verified')))
    );

    const yearlyOrders = allOrders.filter(order => 
      order.createdAt >= oneYearAgo && 
      ((order.paymentPlan === 'full' && order.payment?.status === 'verified') ||
       (order.paymentPlan === 'installment' && 
        (order.paymentRounds?.firstPayment?.status === 'verified' || 
         order.paymentRounds?.secondPayment?.status === 'verified')))
    );

    revenueAnalytics.weekly = weeklyOrders.reduce((total, order) => {
      if (order.paymentPlan === 'full') {
        return total + (order.totalPrice || 0);
      } else {
        let revenue = 0;
        if (order.paymentRounds?.firstPayment?.status === 'verified') {
          revenue += (order.paymentRounds.firstPayment.amount || 0);
        }
        if (order.paymentRounds?.secondPayment?.status === 'verified') {
          revenue += (order.paymentRounds.secondPayment.amount || 0);
        }
        return total + revenue;
      }
    }, 0);

    revenueAnalytics.monthly = monthlyOrders.reduce((total, order) => {
      if (order.paymentPlan === 'full') {
        return total + (order.totalPrice || 0);
      } else {
        let revenue = 0;
        if (order.paymentRounds?.firstPayment?.status === 'verified') {
          revenue += (order.paymentRounds.firstPayment.amount || 0);
        }
        if (order.paymentRounds?.secondPayment?.status === 'verified') {
          revenue += (order.paymentRounds.secondPayment.amount || 0);
        }
        return total + revenue;
      }
    }, 0);

    revenueAnalytics.yearly = yearlyOrders.reduce((total, order) => {
      if (order.paymentPlan === 'full') {
        return total + (order.totalPrice || 0);
      } else {
        let revenue = 0;
        if (order.paymentRounds?.firstPayment?.status === 'verified') {
          revenue += (order.paymentRounds.firstPayment.amount || 0);
        }
        if (order.paymentRounds?.secondPayment?.status === 'verified') {
          revenue += (order.paymentRounds.secondPayment.amount || 0);
        }
        return total + revenue;
      }
    }, 0);

    // 3. Popular Campaigns Analysis
    const campaignStats = campaigns.map(campaign => {
      // For regular campaigns, we'll use products associated with the campaign
      const campaignOrders = allOrders.filter(order => 
        order.product && campaign.products && campaign.products.includes(order.product.toString())
      );
      
      const revenue = campaignOrders.reduce((total, order) => {
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

             return {
         id: campaign._id,
         title: campaign.title,
         type: 'regular',
         orders: campaignOrders.length,
         revenue: revenue,
         status: 'active', // Regular campaigns are always active
         createdAt: campaign.createdAt
       };
    });

    const premiumCampaignStats = premiumCampaigns.map(campaign => {
      const campaignOrders = allPremiumOrders.filter(order => 
        order.premiumCampaign && order.premiumCampaign._id.toString() === campaign._id.toString()
      );
      
      const revenue = campaignOrders.reduce((total, order) => {
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

             return {
         id: campaign._id,
         title: campaign.title,
         type: 'premium',
         orders: campaignOrders.length,
         revenue: revenue,
         status: campaign.isCompleted ? 'completed' : (campaign.isActive ? 'active' : 'pending'),
         createdAt: campaign.createdAt
       };
    });

    const popularCampaigns = [...campaignStats, ...premiumCampaignStats]
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);

    const topRevenueCampaigns = [...campaignStats, ...premiumCampaignStats]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // 4. User Analytics
    const users = await User.find({ isAdmin: false });
    const userAnalytics = {
      total: users.length,
      newUsers: users.filter(user => user.createdAt >= oneMonthAgo).length,
      activeUsers: users.filter(user => {
        const userOrders = allOrders.filter(order => 
          order.user && order.user._id.toString() === user._id.toString()
        );
        const userPremiumOrders = allPremiumOrders.filter(order => 
          order.user && order.user._id.toString() === user._id.toString()
        );
        return userOrders.length > 0 || userPremiumOrders.length > 0;
      }).length,
      repeatBuyers: users.filter(user => {
        const userOrders = allOrders.filter(order => 
          order.user && order.user._id.toString() === user._id.toString()
        );
        const userPremiumOrders = allPremiumOrders.filter(order => 
          order.user && order.user._id.toString() === user._id.toString()
        );
        return (userOrders.length + userPremiumOrders.length) > 1;
      }).length,
      premiumUsers: users.filter(user => {
        const userPremiumOrders = allPremiumOrders.filter(order => 
          order.user && order.user._id.toString() === user._id.toString()
        );
        return userPremiumOrders.length > 0;
      }).length
    };

    // 5. Payment Breakdown
    const paymentBreakdown = {
      fullPayment: {
        regular: allOrders.filter(order => 
          order.paymentPlan === 'full' && order.payment?.status === 'verified'
        ).length,
        premium: allPremiumOrders.filter(order => 
          order.paymentPlan === 'full' && order.paymentRounds?.firstPayment?.status === 'verified'
        ).length
      },
      installment: {
        regular: allOrders.filter(order => 
          order.paymentPlan === 'installment' && 
          (order.paymentRounds?.firstPayment?.status === 'verified' || 
           order.paymentRounds?.secondPayment?.status === 'verified')
        ).length,
        premium: allPremiumOrders.filter(order => 
          order.paymentPlan === 'installment' && 
          (order.paymentRounds?.firstPayment?.status === 'verified' || 
           order.paymentRounds?.secondPayment?.status === 'verified')
        ).length
      }
    };

    // 6. Time-based User Activity
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = new Array(7).fill(0);

    allOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      hourlyActivity[orderDate.getHours()]++;
      dailyActivity[orderDate.getDay()]++;
    });

    allPremiumOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      hourlyActivity[orderDate.getHours()]++;
      dailyActivity[orderDate.getDay()]++;
    });

    // 7. Recent Activity
    const recentOrders = [...allOrders, ...allPremiumOrders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    const recentMessages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      campaignAnalytics,
      revenueAnalytics,
      popularCampaigns,
      topRevenueCampaigns,
      userAnalytics,
      paymentBreakdown,
      timeAnalytics: {
        hourlyActivity,
        dailyActivity
      },
      recentActivity: {
        orders: recentOrders,
        messages: recentMessages
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching analytics data', error: error.message });
  }
});

module.exports = router;
