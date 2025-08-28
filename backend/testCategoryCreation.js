const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('./models/Category');

async function testCategoryCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Test category creation
    const testCategory = new Category({
      name: 'Test Category',
      icon: '🧪',
      description: 'This is a test category',
      sortOrder: 1
    });

    await testCategory.save();
    console.log('Test category created successfully:', testCategory);

    // Clean up - delete the test category
    await Category.findByIdAndDelete(testCategory._id);
    console.log('Test category deleted');

    console.log('Category creation test passed!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing category creation:', error);
    process.exit(1);
  }
}

testCategoryCreation();
