const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const messagesRoutes = require('./routes/messages');
const paymentRoutes = require('./routes/payments');
const paymentMethodRoutes = require('./routes/paymentMethods');
const privateMessageRoutes = require('./routes/privateMessages');
const categoryRoutes = require('./routes/categories');
const premiumCampaignRoutes = require('./routes/premiumCampaigns');
const premiumOrderRoutes = require('./routes/premiumOrders');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const privacyPolicyRoutes = require('./routes/privacyPolicy');
const termsOfUseRoutes = require('./routes/termsOfUse');
const faqsRoutes = require('./routes/faqs');
const contactUsRoutes = require('./routes/contactUs');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/private-messages', privateMessageRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/premium-campaigns', premiumCampaignRoutes);
app.use('/api/premium-orders', premiumOrderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/privacy-policy', privacyPolicyRoutes);
app.use('/api/terms-of-use', termsOfUseRoutes);
app.use('/api/faqs', faqsRoutes);
app.use('/api/contact-us', contactUsRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/payment_screenshots', express.static(path.join(__dirname, 'uploads/payment_screenshots')));
app.use('/premium-campaigns', express.static(path.join(__dirname, 'uploads/premium-campaigns')));
app.use('/premium-payments', express.static(path.join(__dirname, 'uploads/premium-payments')));

app.get('/', (req, res) => {
  res.send('AJ Import API is running');
});

// Test endpoint to check database connection and basic operations
app.get('/api/test-db', async (req, res) => {
  try {
    const Order = require('./models/Order');
    
    // Test database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    // Count orders
    const orderCount = await Order.countDocuments();
    
    // Get a sample order to check ID format
    const sampleOrder = await Order.findOne();
    const sampleOrderId = sampleOrder ? sampleOrder._id.toString() : 'No orders found';
    
    res.json({
      message: 'Database test successful',
      dbStatus: dbStatus[dbState],
      orderCount: orderCount,
      sampleOrderId: sampleOrderId,
      sampleOrderIdLength: sampleOrderId.length,
      sampleOrderIdType: typeof sampleOrderId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      message: 'Database test failed',
      error: error.message
    });
  }
});



// Health check endpoint for deployment platforms
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));