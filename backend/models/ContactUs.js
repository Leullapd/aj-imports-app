const mongoose = require('mongoose');

const contactUsSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    default: '<h1>Contact Us</h1><p>No contact information has been published yet.</p>'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure only one contact us document exists
contactUsSchema.statics.getContactUs = async function() {
  let contact = await this.findOne();
  if (!contact) {
    // Create default contact if none exists
    contact = new this({
      content: '<h1>Contact Us</h1><p>No contact information has been published yet.</p>',
      updatedBy: null // Will be set when admin updates it
    });
    await contact.save();
  }
  return contact;
};

module.exports = mongoose.model('ContactUs', contactUsSchema);
