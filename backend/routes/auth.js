const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;
    const normalizedFullName = fullName?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();

    if (!normalizedFullName || !normalizedEmail || !normalizedPhone || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: 'Mobile number must contain 10 digits' });
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
      return res.status(400).json({ message: 'Password must contain 8 to 72 characters' });
    }

    if (typeof confirmPassword !== 'string' || password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const newUser = await User.create({
      fullName: normalizedFullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password
    });

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    return res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d', algorithm: 'HS256' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('fullName email phone role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load user' });
  }
});

module.exports = router;