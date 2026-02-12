const User = require('../Models/User');
const DemandeAgence = require('../Models/agenceModel');
const Notification = require('../Models/NotificationModel');
const mongoose = require('mongoose');
const validateRequest = require('../Middleware/validateRequest');
const {
  updateProfileSchema,
  createDemandeAgenceSchema,
  rateAgenceRequestSchema,
  getAgenceRequestByIdSchema,
  paginationQuerySchema
} = require('../validation/demandeAgenceValidation');
const { businessLogger } = require('../config/logger');

// ==================== PROFIL CLIENT ============================================
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json(user);
    } catch (error) {
        businessLogger.error(error, { context: 'getProfile', userId: req.user?.id });
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.updateProfile = [
  validateRequest(updateProfileSchema),
  async (req, res) => {
    try {
      const updateData = {};
      const { email, fullName, telephone, adresse, photoUrl } = req.validatedData.body;
      
      if (email) updateData.email = email;
      
      if (fullName || telephone || adresse) {
        updateData.client = {
          ...(fullName && { fullName }),
          ...(telephone && { telephone }),
          ...(adresse && { adresse })
        };
      }
      
      if (photoUrl) {
        if (!updateData.client) updateData.client = {};
        updateData.client.photo = photoUrl;
      }
      
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      
      businessLogger.user.updateProfile(user._id, updateData);
      
      res.json({ 
        success: true, 
        user,
        photoUrl: user.client.photo 
      });
    } catch (error) {
      businessLogger.error(error, { context: 'updateProfile', userId: req.user?.id });
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
];

// =====================================RECUPERER LES DONNEES IN DASHBOARD ====================
exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
            
        const lastAgence = await DemandeAgence.findOne({ user: userId })
            .sort({ date: -1 });
        
        let lastRequest = null;
        if (lastAgence) {
            lastRequest = {
                ...lastAgence.toObject(),
                type: 'agence'
            };
        }
        
        const agencePending = await DemandeAgence.countDocuments({ 
            user: userId, 
            status: 'en_attente' 
        });
        
        const agenceAccepted = await DemandeAgence.countDocuments({ 
            user: userId, 
            status: 'accepté' 
        });
        
        res.json({
            lastRequest,
            stats: {
                pending: agencePending,
                accepted: agenceAccepted
            }
        });
    } catch (error) {
      businessLogger.error(error, { context: 'getDashboard', userId: req.user?.id });
      res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ====================FAIRE UNE DEMANDE A UNE AGENCE=================================================
exports.createDemandeAgence = [
  validateRequest(createDemandeAgenceSchema),
  async (req, res) => {
    try {
      const {
        fullName, email, telephone,receveur,
        destination,
        typeColis, poidOuTaille,
        description
      } = req.validatedData.body;

      const userId = req.user.id;
      
      const normalizeDestination = (dest) => {
        if (!dest) return '';
        return dest.toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/\s*-\s*/g, '-')
          .trim();
      };

      const destinationNormalized = normalizeDestination(destination);
      
      const agence = await User.findOne({
        role: 'agence',
        isVerified: true
      });

      if (!agence) {
        return res.status(404).json({
          success: false,
          message: 'Aucune agence disponible'
        });
      }

      const tarifs = agence.agence?.tarifs || [];
      let tarifTrouve = null;
      
      for (const t of tarifs) {
        const tarifDest = normalizeDestination(t.destination);
        if (tarifDest === destinationNormalized) {
          tarifTrouve = t;
          break;
        }
      }

      if (!tarifTrouve) {
        return res.status(400).json({
          success: false,
          message: 'Destination non disponible'
        });
      }

      const codeColis = `AGENCE-${Date.now().toString().slice(-6)}`;
      
      const newDemande = new DemandeAgence({
        fullName,
        email,
        telephone,
        receveur,
        user: userId,
        agence: agence._id,
        destination: tarifTrouve.destination,
        typeColis,
        poidOuTaille,
        description,
        codeColis,
        rating: null,
        prix: tarifTrouve.prix,
        delai: tarifTrouve.delai || 'Non spécifié',
        status: 'en_attente',
        date: new Date()
      });

      await newDemande.save();

      businessLogger.demande.create(
        newDemande._id,
        codeColis,
        req.user.id,
        'agence'
      );

      res.json({
        success: true,
        message: 'Demande agence créée avec succès !',
        demande: {
          _id: newDemande._id,
          codeColis: newDemande.codeColis,
          fullName: newDemande.fullName,
          receveur: newDemande.receveur,
          destination: newDemande.destination,
          prix: newDemande.prix,
          delai: newDemande.delai,
          status: newDemande.status,
          user: newDemande.user
        },
        prix: newDemande.prix,
        delai: newDemande.delai,
        agenceName: agence.agence?.agenceName || 'Agence'
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'createDemandeAgence', 
        userId: req.user?.id 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
];

// ==================== TOUTES LES DEMANDES AGENCE ====================
exports.getAllClientRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const agenceRequests = await DemandeAgence.find({ user: userId });
        
        const allRequests = [
            ...agenceRequests.map(r => ({ 
                ...r.toObject(), 
                type: 'agence',
                date: r.date || r.createdAt || new Date()
            }))
        ];
        
        allRequests.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const formattedRequests = allRequests.map(request => {
            return {
                _id: request._id,
                codeColis: request.codeColis,
                status: request.status,
                date: request.date,
                type: request.type,
                prix: request.prix || 0,
                fullName: request.fullName,
                email: request.email,
                receveur: request.receveur,
                telephone: request.telephone,
                destination: request.destination,
                typeColis: request.typeColis,
                poidOuTaille: request.poidOuTaille,
                description: request.description,
                rating: request.rating || null
            };
        });
        
        res.json({
            success: true,
            requests: formattedRequests
        });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'getAllClientRequests', 
        userId: req.user?.id 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur'
      });
    }
};

// ====================RECUP  TOUT L'HISTORIQUE ================================================================
exports.getAllClientHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const agenceRequests = await DemandeAgence.find({ user: userId });
        
        const allRequests = [
            ...agenceRequests.map(r => ({ 
                ...r.toObject(), 
                type: 'agence',
                date: r.date || r.createdAt || new Date()
            }))
        ];
        
        const completedRequests = allRequests.filter(r => 
            r.status === 'livré' || 
            r.status === 'refusé' || 
            r.status === 'annulé' ||
            r.status === 'refusé_par_client'
        );
        
        completedRequests.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const formattedRequests = completedRequests.map(request => {
            return {
                _id: request._id,
                codeColis: request.codeColis,
                status: request.status,
                date: request.date,
                type: request.type,
                prix: request.prix || 0,
                rating: request.rating || null,
                fullName: request.fullName,
                email: request.email,
                receveur: request.receveur,
                telephone: request.telephone,
                destination: request.destination,
                typeColis: request.typeColis,
                poidOuTaille: request.poidOuTaille,
                description: request.description
            };
        });
        
        res.json({
            success: true,
            requests: formattedRequests
        });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'getAllClientHistory', 
        userId: req.user?.id 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur'
      });
    }
};

// ==================== RECUP DETAILS D'UNE DEMANDE AGENCE ====================-=-----------======
exports.getAgenceRequestById = [
  validateRequest(getAgenceRequestByIdSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      const userId = req.user.id;
      
      const demande = await DemandeAgence.findOne({ 
        _id: id,
        user: userId 
      });
      
      if (!demande) {
        return res.status(404).json({ 
          success: false, 
          message: 'Demande non trouvée' 
        });
      }
      
      res.json({
        success: true,
        demande
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'getAgenceRequestById', 
        userId: req.user?.id, 
        demandeId: id 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur'
      });
    }
  }
];

// ==================== ÉVALUER OU COTR AVEC LES ETOILES UNE DEMANDE AGENCE ====================
exports.rateAgenceRequest = [
  validateRequest(rateAgenceRequestSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      const { rating } = req.validatedData.body;
      const userId = req.user.id;

      const demande = await DemandeAgence.findOne({ 
        _id: id, 
        user: userId 
      });

      if (!demande) {
        return res.status(404).json({ 
          success: false, 
          message: 'Demande non trouvée' 
        });
      }

      if (demande.status !== 'livré') {
        return res.status(400).json({ 
          success: false, 
          message: 'Vous ne pouvez noter que les demandes livrées' 
        });
      }

      if (demande.rating) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cette demande a déjà été notée' 
        });
      }
      
      demande.rating = rating;
      demande.ratedAt = new Date();
      await demande.save();

      businessLogger.info('Agence request rated', { 
        userId, 
        demandeId: id, 
        rating 
      });

      res.json({ 
        success: true, 
        message: 'Merci pour votre évaluation!',
        demande 
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'rateAgenceRequest', 
        userId: req.user?.id, 
        demandeId: id 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }
  }
];

// ==================== NOTIFICATIONS AGENCE POUR CLIENT ============================================================
exports.getAgenceNotificationsForClient = async (req, res) => {
    try {
        const userId = req.user.id;
  
        const userNotifications = await Notification.find({
            userId: userId,
            type: { $in: ['statut', 'poids_ajuste', 'agence_info'] } 
        })
        .sort({ date: -1 })
        .limit(20);
        
        const paymentNotifications = await Notification.find({
            userId: userId,
            $or: [
                { type: { $regex: /payment|paiement/i } },
                { message: { $regex: /paiement|payment|preuve|verification/i } }
            ]
        })
        .sort({ date: -1 })
        .limit(10);
   
        const allNotifications = [...userNotifications, ...paymentNotifications];
        
        const formattedNotifications = allNotifications.map(notif => {
            let type = 'agence_info';
            let title = 'Notification Agence';
            
            if (notif.type.includes('payment') || notif.message?.match(/paiement|payment|preuve|vérification/i)) {
                type = 'payment';
                title = 'Paiement';
                
                if (notif.message?.includes('accepté') || notif.message?.includes('vérifié')) {
                    type = 'payment_success';
                    title = 'Paiement Accepté';
                } else if (notif.message?.includes('rejeté') || notif.message?.includes('refusé')) {
                    type = 'payment_error';
                    title = 'Paiement Rejeté';
                } else if (notif.message?.includes('en attente')) {
                    type = 'payment_warning';
                    title = 'Paiement en Attente';
                }
            } else {
                switch(notif.type) {
                    case 'statut':
                        type = 'agence_status';
                        title = 'Changement de statut';
                        break;
                    case 'poids_ajuste':
                        type = 'agence_weight';
                        title = 'Poids ajusté';
                        break;
                    case 'success':
                        type = 'success';
                        title = 'Succès';
                        break;
                }
            }
            
            const extractedData = {};
  
            const weightMatch = notif.message?.match(/Poids déclaré: ([^|]+)\s*\|\s*Poids réel: ([^|]+)/i);
            if (weightMatch) {
                extractedData.oldWeight = weightMatch[1].trim();
                extractedData.newWeight = weightMatch[2].trim();
            }
            
            const statusMatch = notif.message?.match(/statut: ([^→]+) → ([^|]+)/);
            if (statusMatch) {
                extractedData.oldStatus = statusMatch[1].trim();
                extractedData.newStatus = statusMatch[2].trim();
            }
            
            const codeMatch = notif.message?.match(/colis (\w+-\w+)/);
            if (codeMatch) {
                extractedData.codeColis = codeMatch[1];
            }
            
            return {
                id: notif._id,
                type: type,
                title: title,
                message: notif.message || 'Notification',
                date: notif.date,
                read: notif.isRead || false,
                ...extractedData
            };
        });

        res.json({
            success: true,
            notifications: formattedNotifications
        });
        
    } catch (error) {
      businessLogger.error(error, { 
        context: 'getAgenceNotificationsForClient', 
        userId: req.user?.id 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur'
      });
    }
};