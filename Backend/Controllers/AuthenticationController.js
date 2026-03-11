const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const { uploadToCloudinary } = require('../Helper/UploadProfile');
const { sendEmail } = require('../Helper/EmailServices');
const multer = require('multer');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verify2FASchema,
  validateWithZod
} = require('../validation/validationSchema');
const { businessLogger } = require('../config/logger');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } 
});

const validateRegister = validateWithZod(registerSchema);
const validateLogin = validateWithZod(loginSchema);
const validateForgotPassword = validateWithZod(forgotPasswordSchema);
const validateResetPassword = validateWithZod(resetPasswordSchema);
const validateVerify2FA = validateWithZod(verify2FASchema);
function generateEmailTemplate(title, clientName, message, details, actionUrl = null, buttonText = null) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f7fa;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #004732; margin-bottom: 10px; border-bottom: 3px solid #C59B33; padding-bottom: 10px;">
                    ${title}
                </h2>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 25px;">
                <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                    Bonjour <strong>${clientName}</strong>,
                </p>
                
                <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">
                    ${message}
                </p>
                
                <div style="background: linear-gradient(135deg, #f9f5e7, #fff); padding: 20px; border-radius: 8px; border-left: 4px solid #C59B33;">
                    ${details}
                </div>
                
                ${actionUrl ? `
                <p style="color: #666; margin-top: 25px; text-align: center;">
                    <a href="${actionUrl}" 
                       style="background: #004732; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        ${buttonText || 'Voir les détails'}
                    </a>
                </p>
                ` : ''}
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="margin-bottom: 5px;">AFRIXA LOGISTICS - Transport & Logistique</p>
                <p style="margin: 0;">© ${new Date().getFullYear()} Tous droits réservés</p>
            </div>
        </div>
    `;
}

const register = [
  upload.fields([
    { name: 'clientPhoto', maxCount: 1 },
    { name: 'agenceLogo', maxCount: 1 }
  ]),
  validateRegister,
  async (req, res) => {
    try {
      const { email, password, role, nom, phone, adresse, ...restData } = req.validatedData;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let userData = { 
        email, 
        password: hashedPassword, 
        role,
        isVerified: (role === "client") ? true : false
      };

      if (role === 'client') {
        userData.client = { 
          fullName: nom, 
          telephone: phone || '', 
          adresse: adresse || '' 
        };
        
        if (req.files?.clientPhoto) {
          const fileUpload = await uploadToCloudinary(req.files.clientPhoto[0].buffer, 'user_photos');
          userData.client.photo = fileUpload.url;
        }
      } 
    
      else if (role === 'agence') {
        const locations = parseAgencyLocations(req.body);
        
        userData.agence = {
          agenceName: nom,
          responsable: req.body.responsable || '',
          telephone: phone || '',
          adresse: adresse || '',
          pays: req.body.pays || 'RDC',
          locations, 
          destinations: uniqueArray(parseDestinationsData(req.body, 'agence')),
          tarifs: uniqueTarifs(parseTarifsData(req.body, 'agence')),
          services: uniqueArray(parseArrayData(req.body.services)),
          horaires: req.body.horaires || '',
          numeroAgrement: req.body.numeroAgrement || '',
          typesColis: uniqueArray(parseArrayData(req.body['types-colis']))
        };

        if (req.files?.agenceLogo) {
          const fileUpload = await uploadToCloudinary(req.files.agenceLogo[0].buffer, 'company_docs');
          userData.agence.logo = fileUpload.url;
        }

        if (!userData.agence.agenceName) {
          return res.status(400).json({ message: 'Le nom de l\'agence est requis' });
        }
      } 

      else {
        return res.status(400).json({ message: 'Rôle invalide' });
      }

      const user = await User.create(userData);
      const userResponse = user.toObject();
      delete userResponse.password;

      businessLogger.user.register(user._id, email, role);

      res.status(201).json({ 
        message: 'Compte créé avec succès', 
        user: userResponse 
      });

    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        businessLogger.warning('Validation error in register', { errors, email: req.validatedData?.email });
        return res.status(400).json({ message: 'Données de validation invalides' });
      }
      if (error.code === 11000) {
        businessLogger.warning('Duplicate email in register', { email: req.validatedData?.email });
        return res.status(400).json({ message: 'Cette adresse email est déjà utilisée' });
      }
      
      businessLogger.error(error, { context: 'register', email: req.validatedData?.email });
      res.status(500).json({ 
        message: 'Erreur lors de la création du compte'
      });
    }
  }
];

const login = [
  validateLogin,
  async (req, res) => {
    try {
      const { email, password } = req.validatedData;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        businessLogger.warning('Login attempt with non-existent email', { email });
        return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
      }

      if (user.isSuspended) {
        businessLogger.warning('Login attempt with suspended account', { email, userId: user._id });
        return res.status(403).json({ message: 'Votre compte est suspendu.' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        businessLogger.warning('Login attempt with incorrect password', { email, userId: user._id });
        return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7h' }
      );

      user.lastLogin = new Date();
      await user.save();

      res.cookie('authToken', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
});

      const userResponse = user.toObject();
      delete userResponse.password;

      businessLogger.user.login(user._id, email);

      res.status(200).json({
        message: 'Connexion réussie',
        role: user.role,
        userId: user._id,
        user: userResponse
      });

    } catch (error) {
      businessLogger.error(error, { context: 'login', email: req.validatedData?.email });
      res.status(500).json({ 
        message: 'Une erreur est survenue'
      });
    }
  }
];

const verify2FA = [
  validateVerify2FA,
  async (req, res) => {
    try {
      const { userId, code } = req.validatedData;

      const user = await User.findById(userId);
      if (!user || !user.twoFA?.enabled) {
        businessLogger.warning('2FA verification failed - 2FA not configured', { userId });
        return res.status(400).json({ message: '2FA non configuré' });
      }

      const verified = speakeasy.totp({
        secret: user.twoFA.secret,
        encoding: 'base32',
        token: code,
        window: 1
      });

      if (!verified) {
        businessLogger.warning('2FA verification failed - invalid code', { userId });
        return res.status(401).json({ message: 'Code 2FA invalide' });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7h' }
      );

      res.cookie('authToken', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
});

      businessLogger.user.login(user._id, user.email, '2FA verified');

      res.status(200).json({ message: 'Connexion réussie', token });

    } catch (err) {
      businessLogger.error(err, { context: 'verify2FA', userId: req.validatedData?.userId });
      res.status(500).json({ message: 'Erreur 2FA' });
    }
  }
];

const forgotPassword = [
  validateForgotPassword,
  async (req, res) => {
    const { email } = req.validatedData;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        businessLogger.warning('Forgot password attempt for non-existent email', { email });
        return res.status(404).json({ message: 'Email introuvable' });
      }

      const token = crypto.randomBytes(20).toString('hex');
      
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; 
      await user.save();

    
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

      const details = `
        <div style="text-align: left;">
          <p style="margin: 5px 0;"><strong>Email :</strong> ${user.email}</p>
          <p style="margin: 5px 0;"><strong>Lien de réinitialisation :</strong></p>
          <p style="margin: 10px 0; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 14px;">
            ${resetUrl}
          </p>
          <p style="margin: 10px 0 0 0; color: #ff6b6b;"><strong>⚠️ Ce lien expire dans 1 heure</strong></p>
        </div>
      `;

      const htmlContent = generateEmailTemplate(
        'Réinitialisation du mot de passe',
        user.name || user.firstName || 'Client',
        'Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.',
        details,
        resetUrl,
        'Réinitialiser mon mot de passe'
      );

      const emailSent = await sendEmail(
        user.email,
        user.name || user.firstName || 'Client',
        'Réinitialisation du mot de passe - AFRIXA LOGISTICS',
        htmlContent
      );

      if (emailSent) {
        businessLogger.info('Password reset email sent', { email, userId: user._id });
        return res.status(200).json({ message: 'Email envoyé ! Vérifie ta boîte mail.' });
      } else {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        throw new Error("Échec de l'envoi de l'email");
      }

    } catch (error) {
      businessLogger.error(error, { context: 'forgotPassword', email });
      res.status(500).json({ message: "Erreur lors de l'envoi de l'email. Veuillez réessayer." });
    }
  }
];
const resetPassword = [
  validateResetPassword,
  async (req, res) => {
    const { token, password } = req.validatedData;

    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        businessLogger.warning('Invalid or expired reset password token', { token });
        return res.status(400).json({ message: 'Token invalide ou expiré' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      businessLogger.info('Password reset successful', { userId: user._id, email: user.email });

      res.status(200).json({ message: 'Mot de passe changé avec succès !' });
    } catch (err) {
      businessLogger.error(err, { context: 'resetPassword', token: token?.substring(0, 10) + '...' });
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
];

const logout = (req, res) => {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;
    
    res.clearCookie('authToken', { 
    httpOnly: true, 
    secure: false,
    sameSite: 'lax'
});
    
    if (userId) {
      businessLogger.user.logout(userId, email);
    }
    
    res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    businessLogger.error(error, { context: 'logout', userId: req.user?.id });
    res.status(500).json({ 
      message: 'Erreur lors de la déconnexion'
    });
  }
};

function uniqueArray(arr) {
  return [...new Set(arr)];
}

function uniqueTarifs(arr) {
  const seen = new Set();
  return arr.filter(item => {
    const key = `${item.destination}-${item.prix}-${item.delai}-${item.unite}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseArrayData(data) {
  if (!data) return [];
  if (Array.isArray(data) && !data.some(item => Array.isArray(item))) {
    return data.filter(Boolean);
  }
  if (Array.isArray(data) && data.some(item => Array.isArray(item))) {
    return [...new Set(data.flat(2).filter(Boolean))];
  }
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return [...new Set(parsed.flat(2).filter(Boolean))];
    } catch {
      return [...new Set(data.split(',').map(i => i.trim()).filter(Boolean))];
    }
  }
  return [data].filter(Boolean);
}

function parseDestinationsData(formData, role) {
  if (formData.destinations) {
    return parseArrayData(formData.destinations);
  }
  
  if (role === 'agence') {
    const destinations = Object.keys(formData)
      .filter(k => k.startsWith('villes-'))
      .map(k => k.replace('villes-', ''));
    
    return destinations.length ? 
      destinations.map(d => d.toUpperCase()) : 
      ['RDC'];
  }
  
  return [];
}

function parseTarifsData(formData, role) {
  const tarifs = [];
  
  if (formData['ville-depart'] && formData['ville-arrivee']) {
    const departs = parseArrayData(formData['ville-depart']);
    const arrivees = parseArrayData(formData['ville-arrivee']);
    const prixList = parseArrayData(formData['prix-trajet']);
    const delaisList = parseArrayData(formData['delai-trajet']);
    
    departs.forEach((d, i) => {
      const a = arrivees[i] || '';
      const prix = prixList[i] ? parseFloat(prixList[i]) : 0;
      const delai = delaisList[i] ? parseInt(delaisList[i]) : 0;
      
      if (d && a) {
        tarifs.push({ 
          destination: `${d} - ${a}`, 
          prix, 
          delai, 
          unite: 'colis' 
        });
      }
    });
  } 
  
  else if (formData.villes && formData.prix) {
    const villes = parseArrayData(formData.villes);
    const prix = parseFloat(formData.prix) || 0;
    const delais = parseArrayData(formData.delais);
    
    villes.forEach((v, i) => {
      tarifs.push({ 
        destination: v, 
        prix, 
        delai: delais[i] ? parseInt(delais[i]) : 0, 
        unite: 'colis' 
      });
    });
  } 
  
  else if (formData.destination) {
    tarifs.push({ 
      destination: formData.destination, 
      prix: parseFloat(formData.prix) || 0, 
      delai: parseInt(formData.delai) || 0, 
      unite: formData.unite || 'colis' 
    });
  }
  
  return tarifs;
}

function parseAgencyLocations(formData) {
  const locations = [];
  
  const locationCountries = Object.keys(formData)
    .filter(key => key.startsWith('villes-'))
    .map(key => key.replace('villes-', ''));
  

  locationCountries.forEach(country => {
    const villes = parseArrayData(formData[`villes-${country}`]);
    const adresses = parseArrayData(formData[`adresses-${country}`]);
    const telephones = parseArrayData(formData[`telephones-${country}`]);
    
    villes.forEach((ville, i) => {
      locations.push({
        pays: country.toUpperCase(),
        ville,
        adresse: adresses[i] || '',
        telephone: telephones[i] || ''
      });
    });
  });
  
  return locations;
}

// ==================== AJOUT SEULEMENT CE QUE TU AS DEMANDÉ ====================
const revokedTokens = new Map();

const refreshToken = async (req, res) => {
  try {
    const oldToken = req.cookies.authToken;
    
    if (!oldToken) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    
    if (revokedTokens.has(oldToken)) {
      return res.status(401).json({ message: 'Token révoqué' });
    }
    
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
    
    revokedTokens.set(oldToken, Date.now() + 3600000);
    
    const newToken = jwt.sign(
      { id: decoded.id, role: decoded.role, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: '7h' }
    );
    
    res.cookie('authToken', newToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
});
    
    res.json({ 
      message: 'Token rafraîchi avec succès',
      accessToken: newToken
    });
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré, veuillez vous reconnecter' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' });
    }
    
    businessLogger.error(error, { context: 'refreshToken' });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ==================== MODULE EXPORTS (AJOUTE refreshToken) ====================
module.exports = { 
  register, 
  login, 
  logout, 
  forgotPassword, 
  resetPassword, 
  verify2FA,
  refreshToken,
  upload,
};