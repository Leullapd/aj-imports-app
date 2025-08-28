const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const PrivateMessage = require('../models/PrivateMessage');
const User = require('../models/User');
const { extractUrlFromTransactionId } = require('../utils/transactionIdFilter');

const router = express.Router();

// Helper function to send payment rejection notification
const sendPaymentRejectionNotification = async (order, round, notes) => {
  try {
    // Find admin user
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.log('Admin user not found for notification');
      return;
    }

    // Populate product details if not already populated
    if (!order.product || typeof order.product === 'string') {
      await order.populate('product', 'name category');
    }

    const roundText = round === 'first' ? 'first' : 'second';
    const productName = order.product?.name || 'Unknown Product';
    const productCategory = order.product?.category || 'Unknown Category';
    
    const message = `Your ${roundText} payment for Order #${order._id.toString().slice(-6)} (${productName} - ${productCategory}) has been rejected.${notes ? ` Reason: ${notes}` : ''} You can resubmit your payment with corrected information.`;

    const notification = new PrivateMessage({
      user: order.user,
      admin: adminUser._id,
      message,
      sender: 'admin'
    });

    await notification.save();
    console.log(`Payment rejection notification sent to user ${order.user}`);
  } catch (error) {
    console.error('Error sending payment rejection notification:', error);
  }
};

// Configure multer for payment screenshot uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/payment_screenshots');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'), false);
    }
  }
});

// Submit payment for specific round (new two-payment system)
router.post('/round/:orderId/:round', upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const { orderId, round } = req.params;
    const { senderName, paymentMethod, transactionId, paymentDate } = req.body;

    // Validate required fields
    if (!senderName || !paymentMethod || !transactionId || !paymentDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate round
    if (!['first', 'second'].includes(round)) {
      return res.status(400).json({ message: 'Invalid payment round' });
    }

    // Check if payment screenshot was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if payment round is valid for this order
    const paymentRound = order.paymentRounds[`${round}Payment`];
    if (!paymentRound) {
      return res.status(400).json({ message: 'Invalid payment round for this order' });
    }

    // Check if payment for this round can be submitted
    if (paymentRound.status === 'verified') {
      return res.status(400).json({ message: `Payment for ${round} round is already verified` });
    }
    
    // Allow resubmission if payment was rejected
    if (paymentRound.status === 'rejected') {
      console.log(`Allowing resubmission of ${round} payment for order ${orderId}`);
    }

    // For second payment, check if first payment is verified
    if (round === 'second') {
      const firstPaymentStatus = order.paymentRounds.firstPayment.status;
      if (firstPaymentStatus !== 'verified') {
        return res.status(400).json({ 
          message: 'Cannot submit second payment. First payment must be verified by admin before submitting second payment.' 
        });
      }
    }

    // Extract URL from transaction ID if it contains a URL
    const filteredTransactionId = extractUrlFromTransactionId(transactionId);
    
    // Check if transaction ID is unique
    const existingTransaction = await Order.findOne({
      $or: [
        { 'paymentRounds.firstPayment.paymentDetails.transactionId': filteredTransactionId },
        { 'paymentRounds.secondPayment.paymentDetails.transactionId': filteredTransactionId }
      ]
    });
    
    if (existingTransaction) {
      return res.status(400).json({ message: 'Transaction ID already exists' });
    }

    // Update the payment round with payment details
    order.paymentRounds[`${round}Payment`].status = 'paid';
    order.paymentRounds[`${round}Payment`].paymentDetails = {
      senderName,
      paymentMethod,
      transactionId: filteredTransactionId,
      paymentDate: new Date(paymentDate),
      paymentScreenshot: req.file.filename
    };

    // Update overall payment status
    const firstStatus = order.paymentRounds.firstPayment.status;
    const secondStatus = order.paymentRounds.secondPayment.status;
    
    if (firstStatus === 'verified' && secondStatus === 'verified') {
      order.overallPaymentStatus = 'completed';
    } else if (firstStatus === 'verified' || secondStatus === 'verified') {
      order.overallPaymentStatus = 'partial';
    } else {
      order.overallPaymentStatus = 'pending';
    }

    await order.save();

    res.status(201).json({
      message: `${round} payment submitted successfully`,
      order: order
    });

  } catch (error) {
    console.error('Payment submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify payment for specific round (admin only)
router.put('/verify/:orderId/:round', auth, async (req, res) => {
  try {
    console.log('Payment verification request:', { orderId: req.params.orderId, round: req.params.round, status: req.body.status });
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ message: 'Access denied' });
    }

    const { orderId, round } = req.params;
    const { status, notes } = req.body;

    // Validate status
    if (!['verified', 'rejected'].includes(status)) {
      console.log('Invalid status:', status);
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Validate round
    if (!['first', 'second'].includes(round)) {
      console.log('Invalid round:', round);
      return res.status(400).json({ message: 'Invalid payment round' });
    }

    // Find order
    const order = await Order.findById(orderId).populate('product');
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    const paymentRound = order.paymentRounds[`${round}Payment`];
    if (!paymentRound) {
      console.log('Payment round not found:', round);
      return res.status(400).json({ message: 'Payment round not found' });
    }

    // Check if trying to undo verification (not allowed)
    if (paymentRound.status === 'verified' && status !== 'verified') {
      return res.status(400).json({ 
        message: 'Payment verification cannot be undone. Once a payment is verified, it cannot be changed back.' 
      });
    }

    // Check if trying to undo rejection (only allowed for second payment)
    if (paymentRound.status === 'rejected' && status !== 'rejected') {
      if (round === 'first') {
        return res.status(400).json({ 
          message: 'First payment rejection cannot be undone. Once a payment is rejected, it cannot be changed back.' 
        });
      } else if (round === 'second') {
        // Allow undoing second payment rejection since item is already purchased
        console.log('Allowing second payment rejection to be undone');
      }
    }

    // Handle quantity based on payment verification/rejection
    const previousStatus = paymentRound.status;
    
    // Update payment round status
    paymentRound.status = status;
    
    // Initialize paymentDetails if it doesn't exist
    if (!paymentRound.paymentDetails) {
      paymentRound.paymentDetails = {};
    }
    
    paymentRound.paymentDetails.verifiedBy = req.user.id;
    paymentRound.paymentDetails.verifiedAt = new Date();
    paymentRound.paymentDetails.notes = notes;
    
    if (status === 'verified' && previousStatus !== 'verified') {
      // Add quantity to product when payment is verified
      if (order.product) {
        order.product.orderedQuantity = (order.product.orderedQuantity || 0) + order.quantity;
        await order.product.save();
      }
    } else if (status === 'rejected') {
      // Handle rejection logic
      if (previousStatus === 'verified') {
        // If it was previously verified, handle quantity adjustment
        if (round === 'first' && order.product) {
          // Only remove quantity for first payment rejection (not second payment)
          order.product.orderedQuantity = Math.max(0, (order.product.orderedQuantity || 0) - order.quantity);
          await order.product.save();
        }
        // For second payment rejection, keep the inventory deducted since item is already purchased
      }
      // If it was not previously verified, no quantity adjustment needed
      
      // Send rejection notification to user
      await sendPaymentRejectionNotification(order, round, notes);
    }

    // Update overall payment status
    const firstStatus = order.paymentRounds.firstPayment.status;
    const secondStatus = order.paymentRounds.secondPayment.status;
    
    if (firstStatus === 'verified' && secondStatus === 'verified') {
      order.overallPaymentStatus = 'completed';
      order.status = 'confirmed';
    } else if (firstStatus === 'verified' && secondStatus !== 'verified') {
      order.overallPaymentStatus = 'partial';
    } else if (firstStatus === 'rejected' || secondStatus === 'rejected') {
      order.overallPaymentStatus = 'rejected';
    } else {
      order.overallPaymentStatus = 'pending';
    }

    await order.save();

    // Send notification to user about payment verification/rejection
    try {
      const { createPaymentVerificationNotification } = require('../utils/notificationHelper');
      await createPaymentVerificationNotification(order, round, status, notes);
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
    }

    console.log(`Payment verification successful: ${round} payment ${status} for order ${orderId}`);
    res.json({
      message: `${round} payment ${status} successfully`,
      order: order
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit payment (legacy - for backward compatibility)
router.post('/', upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const { orderId, senderName, paymentMethod, transactionId, paymentDate } = req.body;

    // Validate required fields
    if (!orderId || !senderName || !paymentMethod || !transactionId || !paymentDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if payment screenshot was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment) {
      return res.status(400).json({ message: 'Payment already submitted for this order' });
    }

    // Extract URL from transaction ID if it contains a URL
    const filteredTransactionId = extractUrlFromTransactionId(transactionId);
    
    // Check if transaction ID is unique
    const existingTransaction = await Payment.findOne({ transactionId: filteredTransactionId });
    if (existingTransaction) {
      return res.status(400).json({ message: 'Transaction ID already exists' });
    }

    // Create payment record
    const payment = new Payment({
      orderId,
      senderName,
      paymentMethod,
      transactionId: filteredTransactionId,
      paymentDate: new Date(paymentDate),
      paymentScreenshot: req.file.filename
    });

    await payment.save();

    // Update order status to 'payment_pending'
    order.status = 'payment_pending';
    await order.save();

    res.status(201).json({
      message: 'Payment submitted successfully',
      payment: {
        id: payment._id,
        paymentId: payment.paymentId,
        status: payment.status
      }
    });

  } catch (error) {
    console.error('Payment submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all payments (admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payments = await Payment.find()
      .populate({
        path: 'orderId',
        select: 'product quantity status',
        populate: {
          path: 'product',
          select: 'title description price image'
        }
      })
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'orderId',
        select: 'product quantity status',
        populate: {
          path: 'product',
          select: 'title description price image'
        }
      })
      .populate('verifiedBy', 'name');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is admin or the payment belongs to their order
    if (!req.user.isAdmin) {
      const order = await Order.findById(payment.orderId);
      if (order.user.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify payment (admin only)
router.put('/:id/verify', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, notes } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if trying to undo a rejection or verification (not allowed)
    if (payment.status === 'rejected' && status !== 'rejected') {
      return res.status(400).json({ 
        message: 'Payment rejection cannot be undone. Once a payment is rejected, it cannot be changed back.' 
      });
    }
    
    if (payment.status === 'verified' && status !== 'verified') {
      return res.status(400).json({ 
        message: 'Payment verification cannot be undone. Once a payment is verified, it cannot be changed back.' 
      });
    }

    payment.status = status;
    // Only set verifiedBy if it's a valid ObjectId (not admin string)
    if (req.user.id !== 'admin') {
    payment.verifiedBy = req.user.id;
    }
    payment.verifiedAt = new Date();
    payment.notes = notes;

    await payment.save();

    // Update order status and handle quantity based on payment verification
    const order = await Order.findById(payment.orderId).populate('product');
    if (order && order.product) {
      if (status === 'verified') {
        order.status = 'confirmed';
        // Subtract quantity from product when payment is verified
        order.product.orderedQuantity = (order.product.orderedQuantity || 0) + order.quantity;
        await order.product.save();
      } else if (status === 'rejected') {
        order.status = 'payment_rejected';
        // Don't subtract quantity if payment is rejected
      }
      await order.save();
    }

    res.json({
      message: `Payment ${status}`,
      payment
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payment status by order ID (admin only)
router.put('/:orderId/status', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, notes } = req.body;

    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found for this order' });
    }

    // Check if trying to undo a rejection or verification (not allowed)
    if (payment.status === 'rejected' && status !== 'rejected') {
      return res.status(400).json({ 
        message: 'Payment rejection cannot be undone. Once a payment is rejected, it cannot be changed back.' 
      });
    }
    
    if (payment.status === 'verified' && status !== 'verified') {
      return res.status(400).json({ 
        message: 'Payment verification cannot be undone. Once a payment is verified, it cannot be changed back.' 
      });
    }

    payment.status = status;
    // Only set verifiedBy if it's a valid ObjectId (not admin string)
    if (req.user.id !== 'admin') {
      payment.verifiedBy = req.user.id;
    }
    payment.verifiedAt = new Date();
    payment.notes = notes;

    await payment.save();

    // Update order status and handle quantity based on payment verification
    const order = await Order.findById(payment.orderId).populate('product');
    if (order && order.product) {
      if (status === 'verified') {
        order.status = 'confirmed';
        // Subtract quantity from product when payment is verified
        order.product.orderedQuantity = (order.product.orderedQuantity || 0) + order.quantity;
        await order.product.save();
      } else if (status === 'rejected') {
        order.status = 'payment_rejected';
        // Don't subtract quantity if payment is rejected
      }
      await order.save();
    }

    res.json({
      message: `Payment status updated to ${status}`,
      payment
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payments by user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // Check if user is requesting their own payments or is admin
    if (req.params.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find orders by user, then find payments for those orders
    const userOrders = await Order.find({ user: req.params.userId });
    const orderIds = userOrders.map(order => order._id);

    const payments = await Payment.find({ orderId: { $in: orderIds } })
      .populate('orderId', 'product quantity totalPrice status')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
