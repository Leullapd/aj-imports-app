const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all orders or filter by user
router.get('/', async (req, res) => {
  try {
    const filter = req.query.user ? { user: req.query.user } : {};
    
    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('product', 'title image category price deadline shippingDeadline')
      .sort({ createdAt: -1 }); // Sort by newest first
    
    // Add payment information and campaign data to each order
    const ordersWithPayments = await Promise.all(orders.map(async (order) => {
      // Check for legacy payment first
      const legacyPayment = await Payment.findOne({ orderId: order._id });
      
      // Find the campaign that contains this product
      const Campaign = require('../models/Campaign');
      const campaign = await Campaign.findOne({ products: order.product._id });
      
      // Create consistent payment object structure
      let payment = null;
      
      if (legacyPayment) {
        // Use legacy payment data
        payment = {
          status: legacyPayment.status,
          verifiedAt: legacyPayment.verifiedAt,
          notes: legacyPayment.notes,
          senderName: legacyPayment.senderName,
          paymentMethod: legacyPayment.paymentMethod,
          transactionId: legacyPayment.transactionId,
          paymentScreenshot: legacyPayment.paymentScreenshot,
          paymentDate: legacyPayment.paymentDate,
          amount: order.totalPrice || 0
        };
      } else if (order.paymentPlan === 'full' && order.paymentRounds?.firstPayment) {
        // Use new payment structure for full payment
        const firstPayment = order.paymentRounds.firstPayment;
        const paymentDetails = firstPayment.paymentDetails || {};
        
        // Try to get payment method from multiple possible locations
        let paymentMethod = paymentDetails.paymentMethod;
        if (!paymentMethod && firstPayment.paymentMethod) {
          paymentMethod = firstPayment.paymentMethod;
        }
        
        payment = {
          status: firstPayment.status,
          verifiedAt: firstPayment.verifiedAt,
          notes: paymentDetails.notes,
          senderName: paymentDetails.senderName,
          paymentMethod: paymentMethod,
          transactionId: paymentDetails.transactionId,
          paymentScreenshot: paymentDetails.paymentScreenshot,
          paymentDate: paymentDetails.paymentDate,
          amount: firstPayment.amount
        };
      }
      
      return {
        ...order.toObject(),
        payment: payment,
        campaign: campaign ? {
          _id: campaign._id,
          title: campaign.title,
          deadline: campaign.deadline,
          shippingDeadline: campaign.shippingDeadline
        } : null
      };
    }));
    
    // Filter by payment status if provided
    let filteredOrders = ordersWithPayments;
    if (req.query.paymentStatus) {
      filteredOrders = ordersWithPayments.filter(order => {
        if (req.query.paymentStatus === 'no-payment') {
          return !order.payment;
        }
        return order.payment && order.payment.status === req.query.paymentStatus;
      });
    }
    
    res.json(filteredOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get user's own orders (protected route)
router.get('/my-orders', auth, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    
    let query = Order.find({ user: req.user.id })
      .populate('product', 'name price image category')
      .sort({ createdAt: -1 }); // Sort by newest first
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const orders = await query;
    
    // Add campaign information and calculate proper amounts to each order
    const ordersWithCampaigns = await Promise.all(orders.map(async (order) => {
      // Find the campaign that contains this product
      const Campaign = require('../models/Campaign');
      const campaign = await Campaign.findOne({ products: order.product._id });
      
      // Calculate the actual total amount based on payment rounds
      let totalAmount = 0;
      if (order.paymentPlan === 'full') {
        totalAmount = order.paymentRounds?.firstPayment?.amount || 0;
      } else if (order.paymentPlan === 'installment') {
        const firstAmount = order.paymentRounds?.firstPayment?.amount || 0;
        const secondAmount = order.paymentRounds?.secondPayment?.amount || 0;
        totalAmount = firstAmount + secondAmount;
      } else {
        totalAmount = order.totalPrice || 0;
      }
      
      return {
        ...order.toObject(),
        totalAmount: totalAmount, // Use calculated amount instead of virtual
        campaign: campaign ? {
          _id: campaign._id,
          title: campaign.title,
          deadline: campaign.deadline,
          shippingDeadline: campaign.shippingDeadline
        } : null
      };
    }));
    
    res.json(ordersWithCampaigns);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get single order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('product', 'title image category price deadline shippingDeadline');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Add payment information and campaign data
    const legacyPayment = await Payment.findOne({ orderId: order._id });
    
    // Find the campaign that contains this product
    const Campaign = require('../models/Campaign');
    const campaign = await Campaign.findOne({ products: order.product._id });
    
    // Create consistent payment object structure
    let payment = null;
    
    if (legacyPayment) {
      // Use legacy payment data
      payment = {
        status: legacyPayment.status,
        verifiedAt: legacyPayment.verifiedAt,
        notes: legacyPayment.notes,
        senderName: legacyPayment.senderName,
        paymentMethod: legacyPayment.paymentMethod,
        transactionId: legacyPayment.transactionId,
        paymentScreenshot: legacyPayment.paymentScreenshot,
        paymentDate: legacyPayment.paymentDate,
        amount: order.totalPrice || 0
      };
    } else if (order.paymentPlan === 'full' && order.paymentRounds?.firstPayment) {
      // Use new payment structure for full payment
      const firstPayment = order.paymentRounds.firstPayment;
      const paymentDetails = firstPayment.paymentDetails || {};
      
      // Try to get payment method from multiple possible locations
      let paymentMethod = paymentDetails.paymentMethod;
      if (!paymentMethod && firstPayment.paymentMethod) {
        paymentMethod = firstPayment.paymentMethod;
      }
      
      payment = {
        status: firstPayment.status,
        verifiedAt: firstPayment.verifiedAt,
        notes: paymentDetails.notes,
        senderName: paymentDetails.senderName,
        paymentMethod: paymentMethod,
        transactionId: paymentDetails.transactionId,
        paymentScreenshot: paymentDetails.paymentScreenshot,
        paymentDate: paymentDetails.paymentDate,
        amount: firstPayment.amount
      };
    }
    
    const orderWithPayment = {
      ...order.toObject(),
      payment: payment,
      campaign: campaign ? {
        _id: campaign._id,
        title: campaign.title,
        deadline: campaign.deadline,
        shippingDeadline: campaign.shippingDeadline
      } : null
    };
    
    res.json(orderWithPayment);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { user, product, quantity, paymentPlan = 'full' } = req.body;

    // Validate required fields
    if (!user || !product || !quantity) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate payment plan
    if (!['full', 'installment'].includes(paymentPlan)) {
      return res.status(400).json({ message: 'Invalid payment plan' });
    }

    // Check if product exists
    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if quantity is available (including pending orders that haven't been paid yet)
    const availableQuantity = productDoc.totalQuantity - (productDoc.orderedQuantity || 0);
    if (quantity > availableQuantity) {
      return res.status(400).json({ message: `Only ${availableQuantity} units available` });
    }

    // Calculate total price
    const totalPrice = productDoc.price * quantity;
    
    // Calculate payment amounts based on plan
    let firstPaymentAmount, secondPaymentAmount, secondPaymentDueDate;
    
    if (paymentPlan === 'full') {
      firstPaymentAmount = totalPrice;
      secondPaymentAmount = 0;
      secondPaymentDueDate = null;
    } else {
      // Installment plan: 50% each
      firstPaymentAmount = Math.ceil(totalPrice * 0.5); // Round up for first payment
      secondPaymentAmount = totalPrice - firstPaymentAmount; // Remaining amount
      
      // Set second payment due date to 30 days from now
      secondPaymentDueDate = new Date();
      secondPaymentDueDate.setDate(secondPaymentDueDate.getDate() + 30);
    }

    // Create order with payment plan
    const orderData = {
      user,
      product,
      quantity,
      paymentPlan,
      paymentRounds: {
        firstPayment: {
          amount: firstPaymentAmount,
          status: 'pending'
        },
        secondPayment: {
          amount: secondPaymentAmount,
          status: 'pending'
        }
      },
      overallPaymentStatus: 'pending',
      status: 'pending'
    };

    // Only add dueDate for installment plans
    if (paymentPlan === 'installment') {
      orderData.paymentRounds.secondPayment.dueDate = secondPaymentDueDate;
    }

    const order = new Order(orderData);

    await order.save();

    // Send notification to admin about new order
    try {
      const { createNewOrderNotification } = require('../utils/notificationHelper');
      await createNewOrderNotification(order);
    } catch (notificationError) {
      console.error('Error sending new order notification:', notificationError);
    }

    // Don't subtract quantity until payment is verified
    // Quantity will be subtracted when payment is verified in payments.js

    res.status(201).json({
      message: 'Order created successfully',
      _id: order._id,
      order: order,
      paymentPlan: paymentPlan,
      firstPaymentAmount: firstPaymentAmount,
      secondPaymentAmount: secondPaymentAmount,
      secondPaymentDueDate: secondPaymentDueDate
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status and shipmentDate
router.put('/:id', async (req, res) => {
  try {
    const updateFields = { status: req.body.status };
    if (req.body.shipmentDate !== undefined) {
      updateFields.shipmentDate = req.body.shipmentDate;
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Error updating order' });
  }
});

// Bulk delete orders (MUST come before /:id route)
router.delete('/bulk-delete', auth, async (req, res) => {
  try {
    console.log('Bulk delete request received:', {
      status: req.body.status,
      userId: req.user._id,
      isAdmin: req.user.isAdmin
    });

    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ message: 'Only admins can delete orders' });
    }

    const { status } = req.body;
    console.log('Attempting bulk delete with status filter:', status);

    let deleteQuery = {};
    if (status) {
      deleteQuery.status = status;
    }

    console.log('Bulk delete query:', deleteQuery);
    const result = await Order.deleteMany(deleteQuery);
    console.log('Bulk delete result:', result.deletedCount, 'orders deleted');

    res.json({ 
      message: `Successfully deleted ${result.deletedCount} orders`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error bulk deleting orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete single order
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Delete order request received:', {
      orderId: req.params.id,
      userId: req.user._id,
      isAdmin: req.user.isAdmin
    });

    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ message: 'Only admins can delete orders' });
    }

    // Validate order ID format - be more flexible
    const orderId = req.params.id;
    console.log('Order ID received:', orderId, 'Length:', orderId.length);
    
    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Order ID does not match MongoDB ObjectId format:', orderId);
      
      // Try to find the order anyway (in case it's a different format)
      const order = await Order.findById(orderId);
      if (!order) {
        console.log('Order not found with ID:', orderId);
        return res.status(404).json({ message: 'Order not found' });
      }
      console.log('Order found despite non-standard ID format:', orderId);
    }

    console.log('Attempting to delete order:', req.params.id);
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      console.log('Order not found:', req.params.id);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    console.log('Order deleted successfully:', req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order' });
  }
});

module.exports = router;