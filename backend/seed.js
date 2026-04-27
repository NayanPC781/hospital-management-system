require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
};

const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@hospital.com';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      specialization: ''
    });

    await admin.save();
    console.log('Admin account created successfully!');
    console.log('Email: admin@hospital.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

connectDB().then(seedAdmin);