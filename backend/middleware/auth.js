const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Auth middleware - Token received:', token ? 'Yes' : 'No');
    console.log('Auth middleware - JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's an admin token
    if (decoded.isAdmin) {
      // Find admin user in database
      const adminUser = await User.findById(decoded.id).select('-password');
      if (!adminUser || !adminUser.isAdmin) {
        return res.status(401).json({ message: 'Admin token is not valid' });
      }
      req.user = adminUser;
      return next();
    }
    
    // Regular user token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
