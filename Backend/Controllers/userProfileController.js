const User = require('../Models/User');
const validateRequest = require('../Middleware/validateRequest');
const {
  updateGrandTransporteurProfileSchema,
  addTrajetSchema,
  deleteTrajetSchema,
  updateAgenceProfileSchema,
  deleteAgenceDestinationSchema
} = require('../validation/profileValidation');
const { businessLogger } = require('../config/logger');

// ==================== GET USER PROFILE ============================================
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('grandTransporteur', 'entrepriseName telephone adresse')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName || user.grandTransporteur?.entrepriseName,
        email: user.email,
        role: user.role,
        profilePhoto: user.grandTransporteur?.logo || user.client?.photo || user.agence?.logo || user.petitTransporteur?.photo,
        grandTransporteur: user.grandTransporteur
      }
    });
  } catch (error) {
    businessLogger.error(error, { context: 'getUserProfile', userId: req.user?.id });
    res.status(500).json({ message: 'Server Error' });
  }
};

// ==================== UPDATE GRAND TRANSPORTEUR PROFILE ====================
exports.updateGrandTransporteurProfile = [
  validateRequest(updateGrandTransporteurProfileSchema),
  async (req, res) => {
    try {
      const {
        entrepriseName,
        responsable,
        telephone,
        adresse,
        typeCamion,
        destinations,
        prixParKilo,
        capacite,
        provinces,
        photoUrl
      } = req.validatedData.body;

      const user = await User.findById(req.user._id || req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.grandTransporteur = {
        ...user.grandTransporteur,
        entrepriseName: entrepriseName || user.grandTransporteur?.entrepriseName,
        responsable: responsable || user.grandTransporteur?.responsable,
        telephone: telephone || user.grandTransporteur?.telephone,
        adresse: adresse || user.grandTransporteur?.adresse,
        typeCamion: Array.isArray(typeCamion) ? typeCamion : (typeCamion || user.grandTransporteur?.typeCamion || []),
        destinations: Array.isArray(destinations) ? destinations : (destinations || user.grandTransporteur?.destinations || []),
        prixParKilo: prixParKilo || user.grandTransporteur?.prixParKilo,
        capacite: capacite || user.grandTransporteur?.capacite,
        provinces: Array.isArray(provinces) ? provinces : (provinces || user.grandTransporteur?.provinces || []),
        logo: photoUrl || user.grandTransporteur?.logo,
        updatedAt: new Date()
      };

      await user.save();

      businessLogger.user.updateProfile(user._id, { 
        role: 'grand_transporteur',
        updates: { entrepriseName, typeCamion, destinations } 
      });

      res.status(200).json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: {
          grandTransporteur: user.grandTransporteur
        },
        photoUrl: user.grandTransporteur.logo
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'updateGrandTransporteurProfile', 
        userId: req.user?.id 
      });
      res.status(500).json({ message: 'Server Error' });
    }
  }
];

// ==================== ADD TRAJET =======================================================
exports.addTrajet = [
  validateRequest(addTrajetSchema),
  async (req, res) => {
    try {
      const { destination, prix, delai, unite } = req.validatedData.body;

      const user = await User.findById(req.user._id || req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const newTrajet = {
        destination,
        prix: Number(prix),
        delai: Number(delai),
        unite
      };

      if (!user.grandTransporteur) {
        user.grandTransporteur = {};
      }
      
      user.grandTransporteur.tarifs = user.grandTransporteur.tarifs || [];
      user.grandTransporteur.tarifs.push(newTrajet);

      await user.save();

      businessLogger.info('Trajet added', { 
        userId: user._id, 
        destination, 
        prix,
        role: user.role 
      });

      res.status(201).json({
        success: true,
        message: 'Trajet ajouté avec succès',
        data: {
          trajet: newTrajet
        }
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'addTrajet', 
        userId: req.user?.id,
        destination: req.validatedData.body?.destination 
      });
      res.status(500).json({ message: 'Server Error' });
    }
  }
];

// ==================== DELETE TRAJET =======================================================
exports.deleteTrajet = [
  validateRequest(deleteTrajetSchema),
  async (req, res) => {
    try {
      const { index } = req.validatedData.params;
      const userId = req.user._id || req.user.id;

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé"
        });
      }

      if (!user.grandTransporteur) {
        return res.status(400).json({
          success: false,
          message: "Profil transporteur non configuré"
        });
      }

      if (!user.grandTransporteur.tarifs || !Array.isArray(user.grandTransporteur.tarifs)) {
        return res.status(400).json({
          success: false,
          message: "Aucun trajet configuré"
        });
      }

      if (index < 0 || index >= user.grandTransporteur.tarifs.length) {
        return res.status(400).json({
          success: false,
          message: "Index de trajet invalide"
        });
      }

      const trajetSupprime = user.grandTransporteur.tarifs[index];
      user.grandTransporteur.tarifs.splice(index, 1);

      user.markModified('grandTransporteur.tarifs');
      await user.save();

      businessLogger.info('Trajet deleted', { 
        userId, 
        destination: trajetSupprime.destination,
        prix: trajetSupprime.prix,
        role: user.role 
      });

      res.status(200).json({
        success: true,
        message: "Trajet supprimé avec succès",
        data: {
          trajetSupprime: {
            destination: trajetSupprime.destination,
            prix: trajetSupprime.prix,
            delai: trajetSupprime.delai,
            unite: trajetSupprime.unite
          }
        }
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'deleteTrajet', 
        userId: req.user?.id,
        index 
      });
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression du trajet"
      });
    }
  }
];

// ==================== GET AGENCE PROFILE =======================================================
exports.getAgenceProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const profileData = {
      _id: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      profilePhoto: user.agence?.logo || null,
      fullName: user.agence?.agenceName || '',
      agence: {
        agenceName: user.agence?.agenceName || '',
        responsable: user.agence?.responsable || '',
        telephone: user.agence?.telephone || '',
        adresse: user.agence?.adresse || '',
        pays: user.agence?.pays || '',
        numeroAgrement: user.agence?.numeroAgrement || '',
        services: user.agence?.services || [],
        typesColis: user.agence?.typesColis || [],
        destinations: user.agence?.destinations || [], 
        tarifs: user.agence?.tarifs || [],             
        locations: user.agence?.locations || [],       
        horaires: user.agence?.horaires || '',
        logo: user.agence?.logo ? { url: user.agence.logo } : null
      }
    };

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    businessLogger.error(error, { 
      context: 'getAgenceProfile', 
      userId: req.user?.id 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

// ==================== UPDATE AGENCE PROFILE =================================================================
exports.updateAgenceProfile = [
  validateRequest(updateAgenceProfileSchema),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const {
        agenceName,
        responsable,
        telephone,
        adresse,
        pays,
        numeroAgrement,
        services,
        typesColis,
        destinations,
        tarifs,
        locations,
        horaires
      } = req.validatedData.body;

      const updateData = {
        'agence.agenceName': agenceName,
        'agence.responsable': responsable,
        'agence.telephone': telephone,
        'agence.adresse': adresse,
        'agence.pays': pays,
        'agence.numeroAgrement': numeroAgrement || '',
        'agence.services': Array.isArray(services) ? services : [],
        'agence.typesColis': Array.isArray(typesColis) ? typesColis : [],
        'agence.destinations': Array.isArray(destinations) ? destinations : [],
        'agence.tarifs': Array.isArray(tarifs) ? tarifs : [],
        'agence.locations': Array.isArray(locations) ? locations : [],
        'agence.horaires': horaires || ''
      };

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      const profileData = {
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profilePhoto: user.agence?.logo || null,
        fullName: user.agence?.agenceName || '',
        agence: user.agence
      };

      businessLogger.user.updateProfile(user._id, { 
        role: 'agence',
        updates: { agenceName, destinations: destinations?.length, tarifs: tarifs?.length } 
      });

      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: profileData
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'updateAgenceProfile', 
        userId: req.user?.id 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du profil'
      });
    }
  }
];

// ==================== DELETE TARIF ================================================================
exports.deleteAgenceDestination = [
  validateRequest(deleteAgenceDestinationSchema),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { index } = req.validatedData.body;

      const user = await User.findById(userId);

      if (!user || !user.agence || !user.agence.tarifs) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur ou tarifs non trouvés'
        });
      }

      if (index < 0 || index >= user.agence.tarifs.length) {
        return res.status(400).json({
          success: false,
          message: 'Index de tarif invalide'
        });
      }

      const tarifSupprime = user.agence.tarifs[index];
      user.agence.tarifs.splice(index, 1);
      await user.save();

      businessLogger.info('Agence tarif deleted', { 
        userId, 
        destination: tarifSupprime?.destination,
        prix: tarifSupprime?.prix,
        role: user.role 
      });

      res.json({
        success: true,
        message: 'Tarif supprimé avec succès',
        data: {
          tarifs: user.agence.tarifs
        }
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'deleteAgenceDestination', 
        userId: req.user?.id,
        index 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression'
      });
    }
  }
];

// ==================== UPLOAD AVATAR =================================================
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    const userId = req.user._id;
    const photoUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { 'agence.logo': photoUrl } },
      { new: true }
    ).select('-password');

    businessLogger.info('Avatar uploaded', { 
      userId, 
      photoUrl,
      role: user?.role 
    });

    res.json({
      success: true,
      message: 'Photo de profil mise à jour',
      photoUrl: photoUrl,
      data: user
    });
  } catch (error) {
    businessLogger.error(error, { 
      context: 'uploadAvatar', 
      userId: req.user?.id 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement'
    });
  }
};