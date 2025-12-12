const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes

app.use('/api/students', require('./routes/students'));
app.use('/api/evaluators', require('./routes/evaluators'));
app.use('/api/admin', require('./routes/admin'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});