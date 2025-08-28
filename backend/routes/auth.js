const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'id-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Register
router.post('/register', upload.single('idImage'), async (req, res) => {
  try {
    const { name, email, phone, address, city, password } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if ID image was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'ID image is required' });
    }
    
    // Create new user (let the pre-save hook hash the password)
    const user = new User({
      name,
      email,
      phone,
      address,
      city,
      idImage: req.file.path, // Store the file path
      password: password // Let the pre-save hook hash this
    });
    
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find admin user in database
    const adminUser = await User.findOne({ email, isAdmin: true });
    if (!adminUser) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    // Create admin token with admin privileges
    const adminToken = jwt.sign({ 
      id: adminUser._id, 
      email: adminUser.email,
      isAdmin: true 
    }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ 
      token: adminToken, 
      user: { 
        id: adminUser._id, 
        name: adminUser.name,
        email: adminUser.email,
        isAdmin: true
      } 
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Admin login failed' });
  }
});

// Get admin profile
router.get('/admin/profile', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      address: req.user.address,
      city: req.user.city,
      idImage: req.user.idImage,
      username: req.user.name // Using name as username for now
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ message: 'Failed to get admin profile' });
  }
});

// Update admin profile
router.put('/admin/profile', auth, async (req, res) => {
  try {
    const { username, email, phone, address, city, currentPassword, newPassword } = req.body;
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Get the full admin user document (including password for verification)
    const adminUser = await User.findById(req.user._id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Update profile fields if provided
    if (username && username.trim()) {
      adminUser.name = username.trim();
    }
    if (email && email.trim()) {
      adminUser.email = email.trim();
    }
    if (phone && phone.trim()) {
      adminUser.phone = phone.trim();
    }
    if (address && address.trim()) {
      adminUser.address = address.trim();
    }
    if (city && city.trim()) {
      adminUser.city = city.trim();
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminUser.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }

             adminUser.password = newPassword; // Let the middleware hash it
    }

         await adminUser.save();

     // If password was changed, generate a new token
     let newToken = null;
     if (newPassword) {
       newToken = jwt.sign({ 
         id: adminUser._id, 
         email: adminUser.email,
         isAdmin: true 
       }, process.env.JWT_SECRET, { expiresIn: '1d' });
     }

     res.json({ 
       message: 'Profile updated successfully',
       token: newToken, // Will be null if password wasn't changed
       user: {
         id: adminUser._id,
         name: adminUser.name,
         email: adminUser.email,
         phone: adminUser.phone,
         address: adminUser.address,
         city: adminUser.city,
         idImage: adminUser.idImage,
         username: adminUser.name
       }
     });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({ message: 'Failed to update admin profile' });
  }
});

module.exports = router;