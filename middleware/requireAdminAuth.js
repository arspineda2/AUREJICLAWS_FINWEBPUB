const requireAdminAuth = function(req, res, next) {
  if (req.session && req.session.isAdminAuthenticated) {
    return next();
  }
  res.status(403).json({ success: false, message: 'Access Denied: You should be logged in as an admin.' });
}

module.exports = requireAdminAuth;