const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  title: String,
  description: String,
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deadline: Date,
  shippingDeadline: Date, // New field for shipping deadline
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Campaign', CampaignSchema);