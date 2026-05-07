const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { query, body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();
const RESET_TOKEN_MINUTES = 15;
const FORGOT_PASSWORD_MESSAGE = 'If an account exists, password reset instructions have been sent.';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

const isSmtpConfigured = () => {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendPasswordResetLink = async ({ user, resetUrl }) => {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Password reset link for ${user.email}: ${resetUrl}`);
    }
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: 'Reset your Hospital Management password',
    text: [
      `Hello ${user.firstName},`,
      '',
      `Use this link to reset your password. It expires in ${RESET_TOKEN_MINUTES} minutes:`,
      resetUrl,
      '',
      'If you did not request this, you can ignore this email.'
    ].join('\n')
  });
};

const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6, max: 20 }).withMessage('Password must be 6-20 characters')
], validate, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, specialization } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    if (role && role !== 'patient') {
      return res.status(400).json({ message: 'Invalid role. Only patient registration is allowed.' });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'patient',
      specialization: ''
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        specialization: user.specialization
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/forgot-password', [
  body('email').trim().isEmail().withMessage('Valid email is required')
], validate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || user.isActive === false) {
      return res.json({ message: FORGOT_PASSWORD_MESSAGE });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashResetToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl.replace(/\/$/, '')}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetLink({ user, resetUrl });
    } catch (mailErr) {
      user.passwordResetToken = '';
      user.passwordResetExpires = null;
      await user.save();
      return res.status(500).json({ message: 'Could not send reset email. Please try again later.' });
    }

    res.json({ message: FORGOT_PASSWORD_MESSAGE });
  } catch (err) {
    res.status(500).json({ message: 'Password reset request failed' });
  }
});

router.post('/reset-password/:token', [
  body('password').isLength({ min: 6, max: 20 }).withMessage('Password must be 6-20 characters'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
], validate, async (req, res) => {
  try {
    const passwordResetToken = hashResetToken(req.params.token);
    const user = await User.findOne({
      passwordResetToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user || user.isActive === false) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    user.password = req.body.password;
    user.passwordResetToken = '';
    user.passwordResetExpires = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Password reset failed' });
  }
});

router.post('/login', [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: 'This account is inactive' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        specialization: user.specialization
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

module.exports = router;
