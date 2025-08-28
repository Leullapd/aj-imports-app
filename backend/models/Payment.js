const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  paymentScreenshot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'verified', 'rejected']
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Generate unique payment ID
paymentSchema.pre('save', function(next) {
  if (!this.isNew) return next();
  
  // Generate a unique payment reference
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5);
  this.paymentId = `PAY-${timestamp}-${random}`.toUpperCase();
  
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
