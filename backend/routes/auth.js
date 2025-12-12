const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide username and password' 
      });
    }

    // Find admin
    const admin = await Admin.findOne({ username, isActive: true });
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Update last login
    await admin.updateLastLogin();

    // Generate token
    const token = jwt.sign(
      { 
        id: admin._id, 
        username: admin.username, 
        role: admin.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Send response
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        displayName: admin.username.charAt(0).toUpperCase() + admin.username.slice(1),
        loginTime: new Date().toISOString()
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during login' 
    });
  }
});

// Verify token
router.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ 
      success: true, 
      user: decoded 
    });

  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
});

// Make sure this line is at the end
module.exports = router;