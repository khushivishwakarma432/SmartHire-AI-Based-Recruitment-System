const bcrypt = require('bcrypt');

const User = require('../models/User');
const ensureDatabaseConnection = require('../utils/ensureDatabaseConnection');
const generateToken = require('../utils/generateToken');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const registerUser = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const { name, email, password, role } = req.body;
    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({
        message: 'Name, email, and password are required.',
      });
    }

    if (normalizedName.length < 2) {
      return res.status(400).json({
        message: 'Name must be at least 2 characters long.',
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        message: 'Please provide a valid email address.',
      });
    }

    if (normalizedPassword.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long.',
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: 'User with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: role === 'hr' ? 'hr' : 'hr',
    });

    return res.status(201).json({
      message: 'User registered successfully.',
      token: generateToken(user._id),
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        message: 'Please provide a valid email address.',
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials.',
      });
    }

    const isPasswordValid = await bcrypt.compare(normalizedPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials.',
      });
    }

    return res.status(200).json({
      message: 'Login successful.',
      token: generateToken(user._id),
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    user: sanitizeUser(req.user),
  });
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
