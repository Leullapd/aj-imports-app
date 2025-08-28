const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: Number,
  status: { type: String, default: 'pending' },
  shipmentDate: { type: Date }, // Day of shipment
  createdAt: { type: Date, default: Date.now },
  
  // Two-Payment System Fields
  paymentPlan: {
    type: String,
    enum: ['full', 'installment'],
    default: 'full'
  },
  paymentRounds: {
    firstPayment: {
      amount: { type: Number, required: true }, // 50% of total
      status: { type: String, enum: ['pending', 'paid', 'verified', 'rejected'], default: 'pending' },
      paymentDetails: {
        senderName: String,
        paymentMethod: String,
        transactionId: String,
        paymentDate: Date,
        paymentScreenshot: String,
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date,
        notes: String
      }
    },
    secondPayment: {
      amount: { type: Number, required: true }, // Remaining 50%
      status: { type: String, enum: ['pending', 'paid', 'verified', 'rejected'], default: 'pending' },
      dueDate: { type: Date, required: false }, // Only required for installment plans
      paymentDetails: {
        senderName: String,
        paymentMethod: String,
        transactionId: String,
        paymentDate: Date,
        paymentScreenshot: String,
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date,
        notes: String
      }
    }
  },
  overallPaymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'overdue'],
    default: 'pending'
  }
});

// Virtual for total price
OrderSchema.virtual('totalPrice').get(function() {
  return this.product?.price ? this.product.price * this.quantity : 0;
});

// Virtual for payment progress
OrderSchema.virtual('paymentProgress').get(function() {
  if (this.paymentPlan === 'full') {
    return this.paymentRounds?.firstPayment?.status === 'verified' ? 100 : 0;
  }
  
  let progress = 0;
  if (this.paymentRounds?.firstPayment?.status === 'verified') progress += 50;
  if (this.paymentRounds?.secondPayment?.status === 'verified') progress += 50;
  return progress;
});

// Virtual for next payment amount
OrderSchema.virtual('nextPaymentAmount').get(function() {
  if (this.paymentPlan === 'full') {
    return this.paymentRounds?.firstPayment?.status === 'pending' ? this.totalPrice : 0;
  }
  
  if (this.paymentRounds?.firstPayment?.status === 'pending') {
    return this.paymentRounds.firstPayment.amount;
  }
  if (this.paymentRounds?.secondPayment?.status === 'pending') {
    return this.paymentRounds.secondPayment.amount;
  }
  return 0;
});

// Ensure virtual fields are serialized
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', OrderSchema);