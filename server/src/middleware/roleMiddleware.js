const allowedWorkspaceRoles = new Set(['admin', 'hr', 'recruiter']);

const requireHr = (req, res, next) => {
  if (!req.user || !allowedWorkspaceRoles.has(req.user.role)) {
    return res.status(403).json({
      message: 'Access denied. A valid workspace role is required.',
    });
  }

  return next();
};

module.exports = requireHr;
