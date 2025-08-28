const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('./models/Category');

const defaultCategories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: '📱',
    description: 'Electronic devices and gadgets',
    sortOrder: 1
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    icon: '👕',
    description: 'Clothing and fashion accessories',
    sortOrder: 2
  },
  {
    name: 'Kitchen',
    slug: 'kitchen',
    icon: '🍳',
    description: 'Kitchen appliances and utensils',
    sortOrder: 3
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    icon: '👜',
    description: 'Personal accessories and bags',
    sortOrder: 4
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    icon: '🏡',
    description: 'Home improvement and garden items',
    sortOrder: 5
  },
  {
    name: 'Sports',
    slug: 'sports',
    icon: '⚽',
    description: 'Sports equipment and gear',
    sortOrder: 6
  },
  {
    name: 'Automotive Parts',
    slug: 'automotive',
    icon: '🚗',
    description: 'Automotive parts and accessories',
    sortOrder: 7
  },
  {
    name: 'Security Items',
    slug: 'security',
    icon: '🔒',
    description: 'Security and safety equipment',
    sortOrder: 8
  },
  {
    name: 'Tools',
    slug: 'tools',
    icon: '🔧',
    description: 'Tools and hardware',
    sortOrder: 9
  },
  {
    name: 'Cosmetics',
    slug: 'cosmetics',
    icon: '💄',
    description: 'Beauty and cosmetic products',
    sortOrder: 10
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert default categories
    const categories = await Category.insertMany(defaultCategories);
    console.log(`Seeded ${categories.length} categories:`);
    
    categories.forEach(category => {
      console.log(`- ${category.icon} ${category.name} (${category.slug})`);
    });

    console.log('Category seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
