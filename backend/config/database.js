const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-evaluation-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create default admin accounts
    await createDefaultAdmins();
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const createDefaultAdmins = async () => {
  const Admin = require('../models/Admin');
  
  const defaultAdmins = [
    { username: 'admin', password: 'admin123', role: 'superadmin' },
    { username: 'superadmin', password: 'super123', role: 'superadmin' },
    { username: 'administrator', password: 'admin@2024', role: 'admin' }
  ];

  for (const adminData of defaultAdmins) {
    const existingAdmin = await Admin.findOne({ username: adminData.username });
    if (!existingAdmin) {
      const admin = new Admin(adminData);
      await admin.save();
      console.log(`Default admin created: ${adminData.username}`);
    }
  }
};

module.exports = connectDB;