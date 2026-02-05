
const roleMiddleware = (expectedRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    if (req.user.role !== expectedRole) {
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

