const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  user: { type: String, required: true }, // user name or id
  text: { type: String, required: true },
  avatar: { type: String }, // optional avatar (first letter or emoji)
  isRead: { type: Boolean, default: false }, // track if message has been read by admin
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
