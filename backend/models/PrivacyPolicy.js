const mongoose = require('mongoose');

const privacyPolicySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    default: '<h1>Privacy Policy</h1><p>No privacy policy has been published yet.</p>'
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

// Ensure only one privacy policy document exists
privacyPolicySchema.statics.getPrivacyPolicy = async function() {
  let policy = await this.findOne();
  if (!policy) {
    // Create default policy if none exists
    policy = new this({
      content: '<h1>Privacy Policy</h1><p>No privacy policy has been published yet.</p>',
      updatedBy: null // Will be set when admin updates it
    });
    await policy.save();
  }
  return policy;
};

module.exports = mongoose.model('PrivacyPolicy', privacyPolicySchema);