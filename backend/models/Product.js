const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: String,
  category: String,
  image: String,
  price: Number,
  totalQuantity: Number,
  orderedQuantity: { type: Number, default: 0 },
  deadline: Date,
  shippingDeadline: Date, // New field for shipping deadline
  description: String,
  active: { type: Boolean, default: true }, // Added for visibility control
});

module.exports = mongoose.model('Product', ProductSchema);