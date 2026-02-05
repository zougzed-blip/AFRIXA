const jwt = require('jsonwebtoken');

const adminMiddleware = (req, res, next) => {
  const token = req.cookies?.authToken;

  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
   const MAX_SESSION = 8 * 60 * 60 * 1000; 
   const tokenAge = Date.now() - (decoded.iat * 1000);

    if (tokenAge > MAX_SESSION) {
    return res.status(401).json({ message: 'Session expirée' });
   }

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé : Admin uniquement" });
    }

    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};



module.exports = adminMiddleware;
