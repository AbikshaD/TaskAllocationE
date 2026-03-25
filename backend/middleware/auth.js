const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const hostOnly = (req, res, next) => {
  if (req.user && req.user.role === 'host') return next();
  res.status(403).json({ message: 'Access denied. Host only.' });
};

const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'host')) return next();
  res.status(403).json({ message: 'Access denied. Admin only.' });
};

const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'student') return next();
  res.status(403).json({ message: 'Access denied. Students only.' });
};

module.exports = { protect, hostOnly, adminOnly, studentOnly };
