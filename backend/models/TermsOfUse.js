const mongoose = require('mongoose');

const termsOfUseSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    default: '<h1>Terms of Use</h1><p>No terms of use have been published yet.</p>'
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

// Ensure only one terms of use document exists
termsOfUseSchema.statics.getTermsOfUse = async function() {
  let terms = await this.findOne();
  if (!terms) {
    // Create default terms if none exists
    terms = new this({
      content: '<h1>Terms of Use</h1><p>No terms of use have been published yet.</p>',
      updatedBy: null // Will be set when admin updates it
    });
    await terms.save();
  }
  return terms;
};

module.exports = mongoose.model('TermsOfUse', termsOfUseSchema);
