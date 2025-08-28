const mongoose = require('mongoose');

const faqsSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    default: '<h1>Frequently Asked Questions</h1><p>No FAQs have been published yet.</p>'
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

// Ensure only one FAQs document exists
faqsSchema.statics.getFAQs = async function() {
  let faqs = await this.findOne();
  if (!faqs) {
    // Create default FAQs if none exists
    faqs = new this({
      content: '<h1>Frequently Asked Questions</h1><p>No FAQs have been published yet.</p>',
      updatedBy: null // Will be set when admin updates it
    });
    await faqs.save();
  }
  return faqs;
};

module.exports = mongoose.model('FAQs', faqsSchema);
