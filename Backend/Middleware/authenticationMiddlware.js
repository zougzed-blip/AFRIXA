const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const token = 
      req.cookies.authToken || 
      req.headers.authorization?.split(" ")[1] || 
      req.query.token;

    if (!token) {
      return res.status(401).json({ message: "Vous devez être connecté" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    req.user = {
      id: user._id,
      _id: user._id,
      role: user.role,
      isVerified: user.isVerified
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

module.exports = authMiddleware;