const mongoose = require('mongoose');

const PremiumCampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Automotive', 'Health & Beauty', 'Toys', 'Food & Beverages', 'Other']
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  premiumPrice: {
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
  image: {
    type: String,
    required: true
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  orderedQuantity: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  shippingDeadline: {
    type: Date,
    required: true
  },
  shippingDuration: {
    type: Number,
    required: true,
    min: 1,
    max: 7, // 1-7 days for air cargo
    default: 2
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  requirements: {
    type: [String],
    default: []
  },
  benefits: {
    type: [String],
    default: []
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

// Update the updatedAt field before saving
PremiumCampaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for remaining quantity
PremiumCampaignSchema.virtual('remainingQuantity').get(function() {
  return this.totalQuantity - this.orderedQuantity;
});

// Virtual for quantity progress percentage
PremiumCampaignSchema.virtual('quantityProgress').get(function() {
  if (this.totalQuantity === 0) return 0;
  return Math.round((this.orderedQuantity / this.totalQuantity) * 100);
});

// Include virtuals in JSON output
PremiumCampaignSchema.set('toJSON', { virtuals: true });
PremiumCampaignSchema.set('toObject', { virtuals: true });

// Virtual for checking if campaign is full
PremiumCampaignSchema.virtual('isFull').get(function() {
  return this.orderedQuantity >= this.totalQuantity;
});

// Virtual for checking if campaign is ongoing
PremiumCampaignSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now && this.isActive && !this.isCompleted;
});

// Virtual for checking if campaign has started
PremiumCampaignSchema.virtual('hasStarted').get(function() {
  return new Date() >= this.startDate;
});

// Virtual for checking if campaign has ended
PremiumCampaignSchema.virtual('hasEnded').get(function() {
  return new Date() > this.endDate;
});





module.exports = mongoose.model('PremiumCampaign', PremiumCampaignSchema);
