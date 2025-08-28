const express = require('express');
const router = express.Router();
const PremiumOrder = require('../models/PremiumOrder');
const PremiumCampaign = require('../models/PremiumCampaign');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PrivateMessage = require('../models/PrivateMessage');
const User = require('../models/User');
const { extractUrlFromTransactionId } = require('../utils/transactionIdFilter');

// Configure multer for payment screenshot uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/premium-payments/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'premium-payment-' + uniqueSuffix + path.extname(file.originalname));
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

// Helper function to send premium payment rejection notification
const sendPremiumPaymentRejectionNotification = async (order, round, notes) => {
  try {
    // Find admin user
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.log('Admin user not found for notification');
      return;
    }

    // Populate campaign details if not already populated
    if (!order.premiumCampaign || typeof order.premiumCampaign === 'string') {
      await order.populate('premiumCampaign', 'title category');
    }

    const roundText = round === 'firstPayment' ? 'first' : 'second';
    const campaignTitle = order.premiumCampaign?.title || 'Unknown Campaign';
    const campaignCategory = order.premiumCampaign?.category || 'Unknown Category';
    
    const message = `Your ${roundText} payment for Premium Order #${order._id.toString().slice(-6)} (${campaignTitle} - ${campaignCategory}) has been rejected.${notes ? ` Reason: ${notes}` : ''} You can resubmit your payment with corrected information.`;

    const notification = new PrivateMessage({
      user: order.user,
      admin: adminUser._id,
      message,
      sender: 'admin'
    });

    await notification.save();
    console.log(`Premium payment rejection notification sent to user ${order.user}`);
  } catch (error) {
    console.error('Error sending premium payment rejection notification:', error);
  }
};

// Check transaction ID uniqueness
router.get('/check-transaction-id', auth, async (req, res) => {
  try {
    const { transactionId } = req.query;
    
    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    // Extract URL from transaction ID if it contains a URL
    const filteredTransactionId = extractUrlFromTransactionId(transactionId);

    const existingOrder = await PremiumOrder.findOne({ 
      transactionId: filteredTransactionId 
    });

    res.json({ exists: !!existingOrder });
  } catch (error) {
    console.error('Check transaction ID error:', error);
    res.status(500).json({ message: 'Error checking transaction ID' });
  }
});

// Get user's premium orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    console.log('Premium orders route - User authenticated:', req.user._id);
    console.log('Premium orders route - User name:', req.user.name);
    
    const orders = await PremiumOrder.find({ user: req.user._id })
      .populate('premiumCampaign', 'title image category premiumPrice airCargoCost endDate shippingDeadline')
      .sort({ createdAt: -1 });

    console.log('Fetched premium orders for user:', req.user._id);
    console.log('Number of orders:', orders.length);
    
    // Add calculated total amounts to each order
    const ordersWithAmounts = orders.map(order => {
      // Calculate the actual total amount based on payment rounds
      let totalAmount = 0;
      if (order.paymentPlan === 'full') {
        totalAmount = order.paymentRounds?.firstPayment?.amount || 0;
      } else if (order.paymentPlan === 'installment') {
        const firstAmount = order.paymentRounds?.firstPayment?.amount || 0;
        const secondAmount = order.paymentRounds?.secondPayment?.amount || 0;
        totalAmount = firstAmount + secondAmount;
      } else {
        totalAmount = order.totalCost || 0;
      }
      
      return {
        ...order.toObject(),
        totalAmount: totalAmount // Use calculated amount
      };
    });
    
    ordersWithAmounts.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        id: order._id,
        paymentPlan: order.paymentPlan,
        hasPaymentRounds: !!order.paymentRounds,
        totalAmount: order.totalAmount,
        firstPayment: order.paymentRounds?.firstPayment ? {
          status: order.paymentRounds.firstPayment.status,
          amount: order.paymentRounds.firstPayment.amount,
          senderName: order.paymentRounds.firstPayment.senderName,
          paymentMethod: order.paymentRounds.firstPayment.paymentMethod,
          transactionId: order.paymentRounds.firstPayment.transactionId
        } : null
      });
    });

    res.json(ordersWithAmounts);
  } catch (error) {
    console.error('Get user premium orders error:', error);
    res.status(500).json({ message: 'Error fetching premium orders' });
  }
});

// Get single premium order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await PremiumOrder.findById(req.params.id)
      .populate('premiumCampaign')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Premium order not found' });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Fetched single premium order:', {
      id: order._id,
      paymentPlan: order.paymentPlan,
      hasPaymentRounds: !!order.paymentRounds,
      firstPayment: order.paymentRounds?.firstPayment ? {
        status: order.paymentRounds.firstPayment.status,
        senderName: order.paymentRounds.firstPayment.senderName,
        paymentMethod: order.paymentRounds.firstPayment.paymentMethod,
        transactionId: order.paymentRounds.firstPayment.transactionId,
        paymentDate: order.paymentRounds.firstPayment.paymentDate,
        paymentScreenshot: order.paymentRounds.firstPayment.paymentScreenshot
      } : null
    });

    res.json(order);
  } catch (error) {
    console.error('Get premium order error:', error);
    res.status(500).json({ message: 'Error fetching premium order' });
  }
});

// Create premium order
router.post('/', auth, upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const {
      premiumCampaignId,
      quantity = 1,
      paymentPlan = 'full', // Default to full payment
      paymentMethod,
      senderName,
      transactionId,
      paymentDate,
      userNotes
    } = req.body;

    console.log('Creating premium order with payment details:', {
      premiumCampaignId,
      quantity,
      paymentPlan,
      paymentMethod,
      senderName,
      transactionId,
      paymentDate,
      hasScreenshot: !!req.file
    });

    const campaign = await PremiumCampaign.findById(premiumCampaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Premium campaign not found' });
    }

    if (!campaign.isOngoing) {
      return res.status(400).json({ message: 'Campaign is not active' });
    }

    if (campaign.isFull) {
      return res.status(400).json({ message: 'Campaign is full' });
    }

    // Check if quantity is available (including pending orders that haven't been paid yet)
    const availableQuantity = campaign.totalQuantity - (campaign.orderedQuantity || 0);
    if (parseInt(quantity) > availableQuantity) {
      return res.status(400).json({ message: `Only ${availableQuantity} units available` });
    }

    // Check if user already has an order for this campaign
    const existingOrder = await PremiumOrder.findOne({
      user: req.user._id,
      premiumCampaign: premiumCampaignId,
      status: { $nin: ['cancelled'] }
    });

    if (existingOrder) {
      return res.status(400).json({ message: 'You already have an order for this campaign' });
    }

    // Extract URL from transaction ID if it contains a URL
    const filteredTransactionId = transactionId ? extractUrlFromTransactionId(transactionId) : '';
    
    // Check if transaction ID is unique (if payment details are provided)
    if (filteredTransactionId && senderName && paymentMethod && paymentDate && req.file) {
      const existingTransaction = await PremiumOrder.findOne({ 
        $or: [
          { 'paymentRounds.firstPayment.transactionId': filteredTransactionId },
          { 'paymentRounds.secondPayment.transactionId': filteredTransactionId }
        ]
      });
      
      if (existingTransaction) {
        return res.status(400).json({ message: 'This transaction ID has already been used. Please use a unique transaction ID.' });
      }
    }

    const totalPrice = campaign.premiumPrice * quantity;
    const totalAirCargoCost = campaign.airCargoCost; // Air cargo cost is fixed, not multiplied by quantity

    // Calculate payment amounts based on payment plan
    let firstPaymentAmount, secondPaymentAmount;
    if (paymentPlan === 'full') {
      firstPaymentAmount = totalPrice + totalAirCargoCost;
      secondPaymentAmount = 0;
    } else {
      // Installment: 50% + air cargo cost for first payment, 50% for second payment
      firstPaymentAmount = (totalPrice * 0.5) + totalAirCargoCost;
      secondPaymentAmount = totalPrice * 0.5;
    }

    // Set due dates
    const now = new Date();
    const firstPaymentDueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    const secondPaymentDueDate = paymentPlan === 'installment' ? 
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : null; // 7 days from now for installment

    // Check if payment details are provided (for immediate payment submission)
    const hasPaymentDetails = senderName && paymentMethod && filteredTransactionId && paymentDate && req.file;
    
    const paymentRounds = {
      firstPayment: {
        amount: firstPaymentAmount,
        status: hasPaymentDetails ? 'pending' : 'pending',
        senderName: hasPaymentDetails ? senderName : '',
        paymentMethod: hasPaymentDetails ? paymentMethod : '',
        transactionId: hasPaymentDetails ? filteredTransactionId : '',
        paymentDate: hasPaymentDetails ? new Date(paymentDate) : null,
        paymentScreenshot: hasPaymentDetails ? req.file.filename : '',
        dueDate: firstPaymentDueDate,
        paymentDetails: {
          notes: '',
          verifiedBy: null,
          verifiedAt: null
        }
      },
      secondPayment: {
        amount: secondPaymentAmount,
        status: 'pending',
        senderName: '',
        paymentMethod: '',
        transactionId: '',
        paymentDate: null,
        paymentScreenshot: '',
        dueDate: secondPaymentDueDate,
        paymentDetails: {
          notes: '',
          verifiedBy: null,
          verifiedAt: null
        }
      }
    };

    console.log('Creating premium order with paymentRounds:', paymentRounds);

    const order = new PremiumOrder({
      user: req.user._id,
      premiumCampaign: premiumCampaignId,
      quantity: parseInt(quantity),
      totalPrice,
      shippingCost: 0, // Remove shipping cost for premium orders
      airCargoCost: totalAirCargoCost,
      paymentPlan,
      paymentRounds,
      overallPaymentStatus: 'pending',
      userNotes: userNotes || '',
      estimatedDelivery: new Date(Date.now() + campaign.shippingDuration * 24 * 60 * 60 * 1000)
    });

    console.log('Order object before save:', {
      paymentPlan: order.paymentPlan,
      hasPaymentRounds: !!order.paymentRounds,
      paymentRounds: order.paymentRounds
    });

    await order.save();

    // Send notification to admin about new premium order
    try {
      const { createNewOrderNotification } = require('../utils/notificationHelper');
      await createNewOrderNotification(order);
    } catch (notificationError) {
      console.error('Error sending new premium order notification:', notificationError);
    }

    console.log('Order saved successfully. PaymentRounds after save:', order.paymentRounds);

    res.status(201).json(order);
  } catch (error) {
    console.error('Create premium order error:', error);
    res.status(500).json({ message: 'Error creating premium order' });
  }
});

// Submit payment for specific round
router.post('/round/:orderId/:round', auth, upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const { orderId, round } = req.params;
    const { senderName, paymentMethod, transactionId, paymentDate } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }

    const order = await PremiumOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Premium order not found' });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if this round is already paid
    if (order.paymentRounds[round].status === 'verified') {
      return res.status(400).json({ message: 'This payment has already been verified' });
    }

    // Check if trying to submit second payment before first is verified
    if (round === 'secondPayment' && order.paymentRounds.firstPayment.status !== 'verified') {
      return res.status(400).json({ message: 'First payment must be verified before submitting second payment' });
    }

    // Extract URL from transaction ID if it contains a URL
    const filteredTransactionId = transactionId ? extractUrlFromTransactionId(transactionId) : '';
    
    // Check if transaction ID is unique
    if (filteredTransactionId) {
      const existingTransaction = await PremiumOrder.findOne({ 
        $or: [
          { 'paymentRounds.firstPayment.transactionId': filteredTransactionId },
          { 'paymentRounds.secondPayment.transactionId': filteredTransactionId }
        ]
      });
      
      if (existingTransaction) {
        return res.status(400).json({ message: 'This transaction ID has already been used. Please use a unique transaction ID.' });
      }
    }

    console.log('Before update - paymentRounds:', order.paymentRounds);
    console.log('Received payment data:', {
      senderName,
      paymentMethod,
      transactionId: filteredTransactionId,
      paymentDate,
      screenshot: req.file.filename
    });

    // Update the payment round
    order.paymentRounds[round] = {
      ...order.paymentRounds[round],
      senderName,
      paymentMethod,
      transactionId: filteredTransactionId,
      paymentDate: new Date(paymentDate),
      paymentScreenshot: req.file.filename, // Store only the filename, not full path
      status: 'pending'
    };

    console.log('After update - paymentRounds:', order.paymentRounds);

    await order.save();

    // Fetch the updated order to verify the save
    const updatedOrder = await PremiumOrder.findById(orderId);
    console.log('After save - paymentRounds:', updatedOrder.paymentRounds);
    console.log('Payment round updated successfully');

    res.json(order);
  } catch (error) {
    console.error('Submit premium payment error:', error);
    res.status(500).json({ message: 'Error submitting payment' });
  }
});

// Verify payment for specific round (admin only)
router.put('/verify/:orderId/:round', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { orderId, round } = req.params;
    const { status, notes } = req.body;

    const order = await PremiumOrder.findById(orderId).populate('premiumCampaign');
    if (!order) {
      return res.status(404).json({ message: 'Premium order not found' });
    }

    const previousStatus = order.paymentRounds[round].status;

    // Check if trying to undo a verification (not allowed for any payment)
    if (previousStatus === 'verified' && status !== 'verified') {
      return res.status(400).json({ 
        message: 'Payment verification cannot be undone. Once a payment is verified, it cannot be changed back.' 
      });
    }

    // Check if trying to undo a rejection
    if (previousStatus === 'rejected' && status !== 'rejected') {
      if (order.paymentPlan === 'full') {
        // For full payments, rejection cannot be undone
        return res.status(400).json({ 
          message: 'Payment rejection cannot be undone for full payment orders. Once a payment is rejected, it cannot be changed back.' 
        });
      } else if (round === 'firstPayment') {
        // For installment payments, first payment rejection cannot be undone
        return res.status(400).json({ 
          message: 'First payment rejection cannot be undone. Once a payment is rejected, it cannot be changed back.' 
        });
      } else if (round === 'secondPayment') {
        // For installment payments, second payment rejection CAN be undone
        console.log('Allowing second payment rejection to be undone for installment payment');
      }
    }

    // Update payment status
    order.paymentRounds[round].status = status;
    
    // Initialize paymentDetails if it doesn't exist
    if (!order.paymentRounds[round].paymentDetails) {
      order.paymentRounds[round].paymentDetails = {};
    }
    
    // Store rejection/verification notes
    if (status === 'rejected' || status === 'verified') {
      order.paymentRounds[round].paymentDetails.notes = notes || `Payment ${status} by admin`;
      order.paymentRounds[round].paymentDetails.verifiedBy = req.user._id;
      order.paymentRounds[round].paymentDetails.verifiedAt = new Date();
    }

    // Handle quantity based on payment status changes
    if (status === 'verified' && previousStatus !== 'verified') {
      const campaign = order.premiumCampaign;
      if (campaign && round === 'firstPayment') {
        // Only subtract quantity when first payment is verified
        campaign.orderedQuantity = (campaign.orderedQuantity || 0) + order.quantity;
        campaign.currentParticipants = (campaign.currentParticipants || 0) + 1;
        await campaign.save();
      }
    } else if (status === 'rejected') {
      // Handle rejection logic
      if (previousStatus === 'verified') {
        const campaign = order.premiumCampaign;
        if (campaign && round === 'firstPayment') {
          // Only return quantity when first payment is rejected
          campaign.orderedQuantity = Math.max(0, (campaign.orderedQuantity || 0) - order.quantity);
          campaign.currentParticipants = Math.max(0, (campaign.currentParticipants || 0) - 1);
          await campaign.save();
        }
        // For second payment rejection, keep the inventory deducted since item is already purchased
      }
      // If it was not previously verified, no quantity adjustment needed
      
      // Send rejection notification to user
      await sendPremiumPaymentRejectionNotification(order, round, notes);
    }

    // Update overall payment status
    if (order.paymentPlan === 'full') {
      order.overallPaymentStatus = order.paymentRounds.firstPayment.status === 'verified' ? 'completed' : 'pending';
    } else {
      if (order.paymentRounds.firstPayment.status === 'verified' && order.paymentRounds.secondPayment.status === 'verified') {
        order.overallPaymentStatus = 'completed';
      } else if (order.paymentRounds.firstPayment.status === 'verified') {
        order.overallPaymentStatus = 'partial';
      } else {
        order.overallPaymentStatus = 'pending';
      }
    }

    await order.save();

    // Send notification to user about payment verification/rejection
    try {
      const { createPaymentVerificationNotification } = require('../utils/notificationHelper');
      await createPaymentVerificationNotification(order, round, status, notes);
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
    }

    res.json(order);
  } catch (error) {
    console.error('Verify premium payment error:', error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
});

// Update premium order (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const {
      status,
      paymentStatus,
      trackingNumber,
      adminNotes,
      actualDelivery
    } = req.body;

    // Get the current order to check previous payment status
    const currentOrder = await PremiumOrder.findById(req.params.id)
      .populate('premiumCampaign');

    if (!currentOrder) {
      return res.status(404).json({ message: 'Premium order not found' });
    }

    // Handle quantity based on payment status changes
    if (paymentStatus && currentOrder.paymentStatus !== paymentStatus) {
      const campaign = currentOrder.premiumCampaign;
      if (campaign) {
        if (paymentStatus === 'verified' && currentOrder.paymentStatus !== 'verified') {
          // Subtract quantity from campaign when payment is verified
          campaign.orderedQuantity = (campaign.orderedQuantity || 0) + currentOrder.quantity;
          campaign.currentParticipants = (campaign.currentParticipants || 0) + 1;
        } else if (paymentStatus === 'rejected' && currentOrder.paymentStatus !== 'rejected') {
          // Don't subtract quantity if payment is rejected
          // Quantity was never subtracted in the first place
        }
        await campaign.save();
      }
    }

    // Check if trying to undo a rejection or verification (not allowed)
    if (currentOrder.paymentStatus === 'rejected' && paymentStatus !== 'rejected') {
      return res.status(400).json({ 
        message: 'Payment rejection cannot be undone. Once a payment is rejected, it cannot be changed back.' 
      });
    }
    
    if (currentOrder.paymentStatus === 'verified' && paymentStatus !== 'verified') {
      return res.status(400).json({ 
        message: 'Payment verification cannot be undone. Once a payment is verified, it cannot be changed back.' 
      });
    }

    const updateData = {};

    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (actualDelivery) updateData.actualDelivery = new Date(actualDelivery);

    const order = await PremiumOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('premiumCampaign').populate('user', 'name email phone');

    res.json(order);
  } catch (error) {
    console.error('Update premium order error:', error);
    res.status(500).json({ message: 'Error updating premium order' });
  }
});

// Get all premium orders (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status, overallPaymentStatus, limit = 20, page = 1 } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (overallPaymentStatus) query.overallPaymentStatus = overallPaymentStatus;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await PremiumOrder.find(query)
      .populate('user', 'name email phone')
      .populate('premiumCampaign', 'title category premiumPrice airCargoCost endDate shippingDeadline')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PremiumOrder.countDocuments(query);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + orders.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get premium orders error:', error);
    res.status(500).json({ message: 'Error fetching premium orders' });
  }
});

// Cancel premium order (user only)
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await PremiumOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Premium order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel order that is not pending' });
    }

    order.status = 'cancelled';
    await order.save();

    // Update campaign participant count
    const campaign = await PremiumCampaign.findById(order.premiumCampaign);
    if (campaign) {
      await campaign.leaveCampaign();
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Cancel premium order error:', error);
    res.status(500).json({ message: 'Error cancelling premium order' });
  }
});

// Delete premium order (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Delete premium order request received:', {
      orderId: req.params.id,
      userId: req.user._id,
      isAdmin: req.user.isAdmin
    });

    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ message: 'Only admins can delete premium orders' });
    }

    // Validate order ID format
    const orderId = req.params.id;
    console.log('Order ID received:', orderId, 'Length:', orderId.length);
    
    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Order ID does not match MongoDB ObjectId format:', orderId);
      
      // Try to find the order anyway (in case it's a different format)
      const order = await PremiumOrder.findById(orderId);
      if (!order) {
        console.log('Order not found with ID:', orderId);
        return res.status(404).json({ message: 'Premium order not found' });
      }
      console.log('Order found despite non-standard ID format');
    }

    const order = await PremiumOrder.findByIdAndDelete(orderId);
    if (!order) {
      console.log('Order not found for deletion:', orderId);
      return res.status(404).json({ message: 'Premium order not found' });
    }

    console.log('Premium order deleted successfully:', orderId);
    res.json({ message: 'Premium order deleted successfully' });
  } catch (error) {
    console.error('Error deleting premium order:', error);
    res.status(500).json({ message: 'Error deleting premium order' });
  }
});

// Bulk delete premium orders (admin only)
router.delete('/bulk-delete', auth, async (req, res) => {
  try {
    console.log('Bulk delete premium orders request received:', {
      status: req.body.status,
      userId: req.user._id,
      isAdmin: req.user.isAdmin
    });

    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ message: 'Only admins can delete premium orders' });
    }

    const { status } = req.body;
    console.log('Attempting bulk delete with status filter:', status);

    let deleteQuery = {};
    if (status) {
      deleteQuery.status = status;
    }

    const result = await PremiumOrder.deleteMany(deleteQuery);
    console.log('Bulk delete result:', result.deletedCount, 'premium orders deleted');

    res.json({
      message: `Successfully deleted ${result.deletedCount} premium orders`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting premium orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
