
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SECRET = process.env.JWT_SECRET || 'supersecretjwtkey123';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'None',
  secure: true,
  domain: 'psyguage-backend.onrender.com',
};

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      SECRET,
      { expiresIn: '7d' } // longer expiry for persistence
    );

    // ✅ Return token in response instead of cookie
    res.json({
      message: 'Login successful',
      token,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: 'Server error during login' });
  }
});


// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS).json({ message: 'Logged out' });
});

// Verify token route
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    res.json({ user: decoded });
  } catch (err) {
    console.error("❌ Token verification error:", err);
    res.status(401).json({ message: 'Invalid token' });
  }
});


module.exports = router;
