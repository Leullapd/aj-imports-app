const mongoose = require('mongoose');

const PremiumOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  premiumCampaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PremiumCampaign',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    required: true,
    min: 0
  },
  airCargoCost: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentPlan: {
    type: String,
    enum: ['full', 'installment'],
    required: true
  },
  paymentRounds: {
    firstPayment: {
      amount: { type: Number, required: true },
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      senderName: { type: String, default: '' },
      paymentMethod: { type: String, default: '' },
      transactionId: { type: String, default: '' },
      paymentDate: { type: Date, default: null },
      paymentScreenshot: { type: String, default: '' },
      dueDate: { type: Date, required: true },
      paymentDetails: {
        notes: { type: String, default: '' },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: { type: Date }
      }
    },
    secondPayment: {
      amount: { type: Number, required: true },
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      senderName: { type: String, default: '' },
      paymentMethod: { type: String, default: '' },
      transactionId: { type: String, default: '' },
      paymentDate: { type: Date, default: null },
      paymentScreenshot: { type: String, default: '' },
      dueDate: { type: Date, required: false },
      paymentDetails: {
        notes: { type: String, default: '' },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: { type: Date }
      }
    }
  },
  overallPaymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'overdue'],
    default: 'pending'
  },
  // Legacy fields for backward compatibility
  paymentStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: ''
  },
  senderName: {
    type: String,
    default: ''
  },
  transactionId: {
    type: String,
    default: ''
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paymentScreenshot: {
    type: String,
    default: ''
  },
  trackingNumber: {
    type: String,
    default: null
  },
  estimatedDelivery: {
    type: Date,
    default: null
  },
  actualDelivery: {
    type: Date,
    default: null
  },
  adminNotes: {
    type: String,
    default: ''
  },
  userNotes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for payment progress
PremiumOrderSchema.virtual('paymentProgress').get(function() {
  if (this.paymentPlan === 'full') {
    return this.paymentRounds.firstPayment.status === 'verified' ? 100 : 0;
  } else {
    let progress = 0;
    if (this.paymentRounds.firstPayment.status === 'verified') progress += 50;
    if (this.paymentRounds.secondPayment.status === 'verified') progress += 50;
    return progress;
  }
});

// Virtual for next payment amount
PremiumOrderSchema.virtual('nextPaymentAmount').get(function() {
  if (this.paymentPlan === 'full') {
    return this.paymentRounds.firstPayment.status === 'pending' ? this.paymentRounds.firstPayment.amount : 0;
  } else {
    if (this.paymentRounds.firstPayment.status === 'pending') {
      return this.paymentRounds.firstPayment.amount;
    } else if (this.paymentRounds.firstPayment.status === 'verified' && this.paymentRounds.secondPayment.status === 'pending') {
      return this.paymentRounds.secondPayment.amount;
    }
    return 0;
  }
});

// Update the updatedAt field before saving
PremiumOrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total cost (premium orders: totalPrice + airCargoCost only)
PremiumOrderSchema.virtual('totalCost').get(function() {
  return this.totalPrice + this.airCargoCost;
});

// Virtual for delivery status
PremiumOrderSchema.virtual('deliveryStatus').get(function() {
  if (this.actualDelivery) return 'delivered';
  if (this.trackingNumber) return 'shipped';
  if (this.paymentStatus === 'paid') return 'confirmed';
  return 'pending';
});

// Include virtuals in JSON output
PremiumOrderSchema.set('toJSON', { virtuals: true });
PremiumOrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PremiumOrder', PremiumOrderSchema);
