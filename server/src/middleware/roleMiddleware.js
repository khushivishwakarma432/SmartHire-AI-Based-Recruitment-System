const requireHr = (req, res, next) => {
  if (!req.user || req.user.role !== 'hr') {
    return res.status(403).json({
      message: 'Access denied. HR role required.',
    });
  }

  return next();
};

module.exports = requireHr;
