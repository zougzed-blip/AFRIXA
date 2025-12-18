const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const { uploadToCloudinary } = require('../Helper/UploadProfile');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } 
});

// ==================== REGISTER ====================
const register = async (req, res) => {
  try {
    console.log('Body complet:', req.body);
    console.log('Fichiers reçus:', req.files);

    const { email, password, role, nom, phone, adresse } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, mot de passe et rôle sont requis' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

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

    // ==================== SPECIFICROLE ====================
    if (role === 'client') {
      userData.client = { 
        fullName: nom, 
        telephone: phone, 
        adresse: adresse 
      };
      if (req.files?.clientPhoto) {
        const fileUpload = await uploadToCloudinary(req.files.clientPhoto[0].buffer, 'user_photos');
        userData.client.photo = fileUpload.url;
      }
    } 

    else if (role === 'petit_transporteur') {
      userData.petitTransporteur = {
        fullName: nom,
        telephone: phone,
        adresse: adresse,
        vehicleType: uniqueArray(parseArrayData(req.body['mode-transport'])),
        destinations: uniqueArray(parseDestinationsData(req.body, 'petit_transporteur')),
        tarifs: uniqueTarifs(parseTarifsData(req.body, 'petit_transporteur')),
        capacite: req.body.capacite ? parseInt(req.body.capacite) : null,
        experience: req.body.experience || '',
        typesColis: uniqueArray(parseArrayData(req.body['types-colis'])),
        quartiers: parseArrayData(req.body.quartiers)
      };

      if (req.files?.petitLogo) {
        const fileUpload = await uploadToCloudinary(req.files.petitLogo[0].buffer, 'user_photos');
        userData.petitTransporteur.photo = fileUpload.url;
      }

      if (!userData.petitTransporteur.vehicleType.length) {
        return res.status(400).json({ message: 'Veuillez sélectionner au moins un type de véhicule' });
      }
    } 

    else if (role === 'grand_transporteur') {
      userData.grandTransporteur = {
        entrepriseName: nom,
        telephone: phone,
        adresse: adresse,
        typeCamion: uniqueArray(parseArrayData(req.body['type-transport'])),
        destinations: uniqueArray(parseDestinationsData(req.body, 'grand_transporteur')),
        tarifs: uniqueTarifs(parseTarifsData(req.body, 'grand_transporteur')),
        numeroRC: req.body.numeroRC || '',
        anneeCreation: req.body.anneeCreation ? parseInt(req.body.anneeCreation) : null,
        nombreCamions: req.body.nombreCamions ? parseInt(req.body.nombreCamions) : null,
        provinces: uniqueArray(parseArrayData(req.body.provinces))
      };

      if (req.files?.grandLogo) {
        const fileUpload = await uploadToCloudinary(req.files.grandLogo[0].buffer, 'company_docs');
        userData.grandTransporteur.logo = fileUpload.url;
      }

      if (!userData.grandTransporteur.entrepriseName) {
        return res.status(400).json({ message: 'Le nom de l\'entreprise est requis' });
      }
    } 

 
    else if (role === 'agence') {
      const locations = [];

      const locationCountries = Object.keys(req.body)
        .filter(key => key.startsWith('villes-'))
        .map(key => key.replace('villes-', ''));

      locationCountries.forEach(country => {
        const villes = parseArrayData(req.body[`villes-${country}`]);
        const adresses = parseArrayData(req.body[`adresses-${country}`]);
        const telephones = parseArrayData(req.body[`telephones-${country}`]);
        villes.forEach((ville, i) => {
          locations.push({
            pays: country.toUpperCase(),
            ville,
            adresse: adresses[i] || '',
            telephone: telephones[i] || ''
          });
        });
      });

      userData.agence = {
        agenceName: nom,
        responsable: req.body.responsable || '',
        telephone: phone,
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

    else return res.status(400).json({ message: 'Rôle invalide' });

    console.log('💾 Données à sauvegarder:', JSON.stringify(userData, null, 2));

    const user = await User.create(userData);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ 
      message: 'Compte créé avec succès', 
      user: userResponse 
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Données de validation invalides', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cette adresse email est déjà utilisée' });
    }
    res.status(500).json({ 
      message: 'Erreur lors de la création du compte', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
    });
  }
};

// ====================  UTILITAIRES ====================
function parseArrayData(data) {
  if (!data) return [];
  if (Array.isArray(data) && !data.some(item => Array.isArray(item))) return data.filter(Boolean);
  if (Array.isArray(data) && data.some(item => Array.isArray(item))) return [...new Set(data.flat(2).filter(Boolean))];
  if (typeof data === 'string') {
    try { return [...new Set(JSON.parse(data).flat(2).filter(Boolean))]; } 
    catch { return [...new Set(data.split(',').map(i => i.trim()).filter(Boolean))]; }
  }
  return [data].filter(Boolean);
}

function parseDestinationsData(formData, role) {
  if (formData.destinations) return parseArrayData(formData.destinations);
  if (role === 'agence') {
    const destinations = Object.keys(formData)
      .filter(k => k.startsWith('villes-'))
      .map(k => k.replace('villes-', ''));
    return destinations.length ? destinations.map(d => d.toUpperCase()) : ['RDC'];
  }
  if ((role === 'petit_transporteur' || role === 'grand_transporteur') && formData.villes) {
    const villes = parseArrayData(formData.villes);
    const pays = parseArrayData(formData.pays);
    const quartiers = parseArrayData(formData.quartiers);
    return villes.map((ville, i) => {
      const p = pays[i] || pays[0] || 'RDC';
      const q = quartiers[i] || '';
      return q ? `${q}, ${ville}, ${p}` : `${ville}, ${p}`;
    });
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
      if (d && a) tarifs.push({ destination: `${d} - ${a}`, prix, delai, unite: 'colis' });
    });
  } else if (formData.villes && formData.prix) {
    const villes = parseArrayData(formData.villes);
    const prix = parseFloat(formData.prix) || 0;
    const delais = parseArrayData(formData.delais);
    villes.forEach((v, i) => tarifs.push({ destination: v, prix, delai: delais[i] ? parseInt(delais[i]) : 0, unite: 'colis' }));
  } else if (formData.destination) {
    tarifs.push({ destination: formData.destination, prix: parseFloat(formData.prix) || 0, delai: parseInt(formData.delai) || 0, unite: formData.unite || 'colis' });
  }
  return tarifs;
}

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

// ==================== LOGIN ====================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Format d\'email invalide' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    if (user.isSuspended) return res.status(403).json({ message: 'Votre compte est suspendu.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

    let roleToReturn = user.role;
    if (password === process.env.ADMIN_SECRET) {
      roleToReturn = 'admin';
      if (user.role !== 'admin') await User.findByIdAndUpdate(user._id, { role: 'admin' });
    }

    const token = jwt.sign({ id: user._id, role: roleToReturn, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    res.cookie('authToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7*24*60*60*1000 });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ message: 'Connexion réussie', token, role: roleToReturn, userId: user._id, user: userResponse });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion', error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur' });
  }
};

// ==================== LOGOUT ====================
const logout = (req, res) => {
  try {
    res.clearCookie('authToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Erreur lors de la déconnexion', error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur' });
  }
};




module.exports = { register, login, logout, upload };
