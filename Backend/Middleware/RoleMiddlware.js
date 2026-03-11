
const roleMiddleware = (expectedRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    const roles = Array.isArray(expectedRole) ? expectedRole : [expectedRole];
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit : rôle non autorisé' });
    }
    next();
  };
};

const verifiedMiddleware = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({ message: "Votre compte n'est pas encore vérifié." });
  }
  next();
};  



module.exports = { roleMiddleware, verifiedMiddleware};

