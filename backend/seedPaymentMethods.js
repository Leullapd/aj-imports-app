const mongoose = require('mongoose');
const PaymentMethod = require('./models/PaymentMethod');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.log(err));

const defaultPaymentMethods = [
  {
    name: 'Bank Transfer',
    code: 'bank_transfer',
    description: 'Direct bank transfer to our account',
    icon: '🏦',
    instructions: 'Transfer the amount to our bank account and include your name as reference',
    accountInfo: 'Bank: Commercial Bank of Ethiopia\nAccount: 1000123456789\nName: AJ Import',
    isActive: true
  },
  {
    name: 'Telebirr',
    code: 'telebirr',
    description: 'Mobile money transfer via Telebirr',
    icon: '📱',
    instructions: 'Send money to our Telebirr account and include your name as reference',
    accountInfo: 'Telebirr: 0912345678\nName: AJ Import',
    isActive: true
  },
  {
    name: 'CBE Birr',
    code: 'cbe_birr',
    description: 'CBE Birr mobile banking transfer',
    icon: '💳',
    instructions: 'Use CBE Birr app to transfer funds to our account',
    accountInfo: 'CBE Birr: 1000123456789\nName: AJ Import',
    isActive: true
  },
  {
    name: 'Card Payment',
    code: 'card_payment',
    description: 'Credit/Debit card payment (Visa/Mastercard)',
    icon: '💳',
    instructions: 'Pay securely with your credit or debit card',
    accountInfo: 'Secure online payment gateway',
    isActive: true
  }
];

const seedPaymentMethods = async () => {
  try {
    // Clear existing payment methods
    await PaymentMethod.deleteMany({});
    console.log('Cleared existing payment methods');

    // Insert default payment methods
    const result = await PaymentMethod.insertMany(defaultPaymentMethods);
    console.log(`Seeded ${result.length} payment methods:`);
    
    result.forEach(method => {
      console.log(`- ${method.name} (${method.code})`);
    });

    console.log('Payment methods seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding payment methods:', error);
    process.exit(1);
  }
};

seedPaymentMethods();
