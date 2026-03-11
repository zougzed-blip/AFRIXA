const notFoundHandler = (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.redirect('/404');
};

const authErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError' || 
      err.message === 'Session expirée' ||
      err.message === 'Non authentifié') {
    
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Session expirée' 
      });
    }
    return res.redirect('/401');
  }
  
  next(err);
};

module.exports = {
  notFoundHandler,
  authErrorHandler
};