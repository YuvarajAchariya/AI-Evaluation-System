const express = require('express');
const router = express.Router();
const Evaluator = require('../models/Evaluator');
const jwt = require('jsonwebtoken');

// Evaluator login
router.post('/login', async (req, res) => {
  try {
    const { evaluatorId, password } = req.body;

    // Validation
    if (!evaluatorId || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Evaluator ID and password are required' 
      });
    }

    // Find evaluator
    const evaluator = await Evaluator.findOne({ 
      evaluatorId,
      isActive: true 
    });

    if (!evaluator) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid evaluator ID or password' 
      });
    }

    // Check password
    const isPasswordValid = await evaluator.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid evaluator ID or password' 
      });
    }

    // Update last login
    await evaluator.updateLastLogin();

    // Generate token
    const token = jwt.sign(
      { 
        id: evaluator._id, 
        evaluatorId: evaluator.evaluatorId,
        role: 'evaluator',
        name: evaluator.name,
        department: evaluator.department,
        subject: evaluator.subject
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' } // Shorter session for evaluators
    );

    // Send response
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: evaluator._id,
        evaluatorId: evaluator.evaluatorId,
        name: evaluator.name,
        email: evaluator.email,
        department: evaluator.department,
        subject: evaluator.subject,
        role: 'evaluator',
        loginTime: new Date().toISOString()
      },
      token
    });

  } catch (error) {
    console.error('Evaluator login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during login' 
    });
  }
});

// Get evaluator profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.role !== 'evaluator') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    const evaluator = await Evaluator.findById(decoded.id)
      .select('-password')
      .populate('assignedStudents', 'name rollNumber department');

    if (!evaluator) {
      return res.status(404).json({ 
        success: false, 
        error: 'Evaluator not found' 
      });
    }

    res.json({
      success: true,
      data: evaluator
    });

  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.role !== 'evaluator') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    const evaluator = await Evaluator.findById(decoded.id);
    
    if (!evaluator) {
      return res.status(404).json({ 
        success: false, 
        error: 'Evaluator not found' 
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await evaluator.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Current password is incorrect' 
      });
    }

    // Update password
    evaluator.password = newPassword;
    await evaluator.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to change password' 
    });
  }
});

module.exports = router;