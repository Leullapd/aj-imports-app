const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get all categories (admin only - includes inactive)
router.get('/admin', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Create new category (admin only)
router.post('/', auth, async (req, res) => {
  try {
    console.log('Category creation request received');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { name, icon, description, sortOrder } = req.body;
    
    console.log('Extracted data:', { name, icon, description, sortOrder });

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      console.log('Category already exists:', existingCategory);
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    const categoryData = {
      name: name.trim(),
      icon: icon || '📦',
      description: description?.trim(),
      sortOrder: sortOrder || 0
    };
    
    console.log('Creating category with data:', categoryData);

    const category = new Category(categoryData);

    await category.save();
    console.log('Category saved successfully:', category);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
});

// Update category (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { name, icon, description, active, sortOrder } = req.body;

    // Check if name is being changed and if it conflicts with existing category
    if (name) {
      const existingCategory = await Category.findOne({ 
        name: name.trim(), 
        _id: { $ne: req.params.id } 
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name?.trim(),
        icon,
        description: description?.trim(),
        active,
        sortOrder
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
});

// Delete category (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

// Toggle category active status (admin only)
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.active = !category.active;
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling category status', error: error.message });
  }
});

module.exports = router;
