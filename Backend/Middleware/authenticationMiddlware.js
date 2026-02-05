const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const token = 
  req.cookies.authToken || 
  req.headers.authorization?.split(" ")[1] || 
  req.query.token; 

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Vous devez être connecté" 
      });
    }

    try {
    
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: "Utilisateur non trouvé" 
        });
      }

      if (user.role !== 'client' && !user.isVerified) {
        return res.status(403).json({ 
          success: false,
          message: "Compte en attente de vérification" 
        });
      }

      if (user.isSuspended) {
        return res.status(403).json({ 
          success: false,
          message: "Compte suspendu" 
        });
      }

      req.user = user;
      next();

    } catch (jwtError) {

      if (jwtError.name === 'TokenExpiredError') {

        return res.status(401).json({ 
          success: false,
          message: "Session expirée",
          code: "TOKEN_EXPIRED"
        });
      }
      throw jwtError; 
    }
    
  } catch (error) {
    if (res.headersSent) return;
    
    return res.status(401).json({ 
      success: false,
      message: "Authentification échouée"
    });
  }
};

module.exports = authMiddleware;