const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory - FIXED PATH
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes with error handling
const loadRoute = (routePath, routeName) => {
    try {
        return require(routePath);
    } catch (error) {
        console.warn(`⚠️  ${routeName} route not found: ${routePath}`);
        const router = express.Router();
        router.all('*', (req, res) => {
            res.status(501).json({
                success: false,
                error: `${routeName} routes not implemented yet`
            });
        });
        return router;
    }
};

// Routes
app.use('/api/upload-debug', require('./routes/upload-debug'));
app.use('/api/students', loadRoute('./routes/students', 'Students'));
app.use('/api/evaluators', loadRoute('./routes/evaluators', 'Evaluators'));
app.use('/api/admin', loadRoute('./routes/admin', 'Admin'));
app.use('/api/auth', loadRoute('./routes/auth', 'Auth'));
app.use('/api/auth/evaluator', loadRoute('./routes/evaluatorAuth', 'Evaluator Auth'));
app.use('/api/upload', loadRoute('./routes/upload', 'Upload'));
app.use('/api/questions', loadRoute('./routes/questions', 'Questions'));
app.use('/api/evaluations', loadRoute('./routes/evaluations', 'Evaluations'));

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

// Health check route
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    res.json({ 
        status: 'OK',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    
    res.status(500).json({ 
        success: false,
        error: 'Something went wrong!' 
    });
});

// Handle 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found: ' + req.originalUrl
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API Test: http://localhost:${PORT}/api/test`);
    console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📍 File Upload: POST http://localhost:${PORT}/api/upload/answers`);
    console.log(`📍 File Access: GET http://localhost:${PORT}/api/uploads/{filename}`);
    console.log(`📍 Uploads Directory: ${path.join(__dirname, 'uploads')}`);
});