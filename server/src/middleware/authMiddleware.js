const jwt = require('jsonwebtoken');

const User = require('../models/User');

const protect = async (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: 'JWT_SECRET is not configured.',
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Not authorized. Token is missing.',
    });
  }

  const token = authHeader.split(' ')[1];
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      message: 'Not authorized. Invalid token.',
    });
  }

  try {
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'Not authorized. User not found.',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    error.statusCode = 500;
    error.message = 'Authentication failed because the server could not verify the current user.';
    return next(error);
  }
};

module.exports = protect;
