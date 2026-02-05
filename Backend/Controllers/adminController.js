const User = require('../Models/User');
const { sendEmail } = require('../Helper/EmailServices');
const paymentProof = require('../Models/paymentModel');
const Notification = require('../Models/NotificationModel');
const DemandeAgence = require('../Models/agenceModel');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const validateRequest = require('../Middleware/validateRequest');
const {
  paginationQuerySchema,
  lastViewedQuerySchema,
  getUserByIdSchema,
  validateCompanySchema,
  toggleUserStatusSchema,
  verifyUserSchema,
  getRequestDetailsSchema,
  updatePaymentStatusSchema,
  viewPaymentProofSchema,
  updatePaymentProofStatusSchema,
  sendProofToCompanySchema,
  getOfferDetailsSchema,
  markNotificationAsReadSchema
} = require('../validation/adminValidation');
const { businessLogger } = require('../config/logger');
const axios = require('axios');

function getRoleLabel(role) {
  const roles = {
    'client': 'Client',
    'agence': 'Agence',
    'petit_transporteur': 'Petit Transporteur',
    'grand_transporteur': 'Grand Transporteur'
  };
  return roles[role] || role;
}

function getUserDisplayName(user) {
  if (user.role === 'client' && user.client) return user.client.fullName;
  if (user.role === 'agence' && user.agence) return user.agence.agenceName;
  if (user.role === 'petit_transporteur' && user.petitTransporteur) return user.petitTransporteur.fullName;
  if (user.role === 'grand_transporteur' && user.grandTransporteur) return user.grandTransporteur.entrepriseName;
  return user.email;
}

function getCompanyName(user) {
  if (user.role === 'agence' && user.agence) return user.agence.agenceName;
  if (user.role === 'petit_transporteur' && user.petitTransporteur) return user.petitTransporteur.fullName;
  if (user.role === 'grand_transporteur' && user.grandTransporteur) return user.grandTransporteur.entrepriseName;
  return user.email;
}

// ================================================== DASHBOARD ADMIN RECUP===============================================
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const clients = await User.countDocuments({ role: 'client' });
    const agences = await User.countDocuments({ role: 'agence', isVerified: true });
    const petitTransporteurs = await User.countDocuments({ role: 'petit_transporteur', isVerified: true });
    const grandTransporteurs = await User.countDocuments({ role: 'grand_transporteur', isVerified: true });
    const pendingValidation = await User.countDocuments({ 
      role: { $in: ['agence', 'petit_transporteur', 'grand_transporteur'] }, 
      isVerified: false 
    });

    const newClients = await User.countDocuments({ 
      role: 'client',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalUsers,
      clients,
      agences,
      petitTransporteurs,
      grandTransporteurs,
      pendingValidation,
      newClients,
      activeUsers
    });
  } catch (error) {
    businessLogger.error(error, { context: 'getDashboardStats', userId: req.user?.id });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ==========================================================ADMIN NOTIFICATIONS RECUP=========================================
exports.getNotifications = async (req, res) => {
  try {
    const notifications = [];
    
    const newUsers = await User.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).limit(5);
    
    newUsers.forEach(user => {
      notifications.push({
        type: 'info',
        title: 'Nouvelle inscription',
        message: `${getUserDisplayName(user)} s'est inscrit comme ${getRoleLabel(user.role)}`,
        createdAt: user.createdAt,
        read: false
      });
    });
    
    const pendingUsers = await User.find({
      role: { $in: ['agence', 'petit_transporteur', 'grand_transporteur'] },
      isVerified: false
    }).limit(5);
    
    pendingUsers.forEach(user => {
      notifications.push({
        type: 'warning',
        title: 'Validation en attente',
        message: `${getUserDisplayName(user)} attend la validation de son compte`,
        createdAt: user.createdAt,
        read: false
      });
    });
    
    const recentProofs = await paymentProof.find()
      .sort({ createdAt: -1 })
      .limit(3);
    
    recentProofs.forEach(proof => {
      notifications.push({
        type: 'success',
        title: 'Nouvelle preuve de paiement',
        message: `Preuve reçue pour le colis ${proof.codeColis}`,
        createdAt: proof.createdAt,
        read: false
      });
    });
    
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(notifications.slice(0, 10));
  } catch (error) {
    businessLogger.error(error, { context: 'getNotifications', userId: req.user?.id });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// =================================== LE CONTR POUR COMPTER LES NOTIFICATIONS================== ====================
exports.getNotificationsCount = async (req, res) => {
  try {
    let count = 0;
    
    const newUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    count += newUsers;
    
    const pendingUsers = await User.countDocuments({
      role: { $in: ['agence', 'petit_transporteur', 'grand_transporteur'] },
      isVerified: false
    });
    count += pendingUsers;
    
    const recentProofs = await paymentProof.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    count += recentProofs;
    
    res.json({ count });
  } catch (error) {
    businessLogger.error(error, { context: 'getNotificationsCount', userId: req.user?.id });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ============================================ PROFIL ADMIN========================== ====================
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin non trouvé' });
    }
    
    let name = 'Administrateur';
    let photo = null;
    
    if (admin.role === 'admin') {
      name = admin.email.split('@')[0];
    }
    
    res.json({
      name,
      email: admin.email,
      role: admin.role,
      photo
    });
  } catch (error) {
    businessLogger.error(error, { context: 'getAdminProfile', userId: req.user?.id });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ====================RECUP DES MES 5 DERNEIRES DEMANDES REXNTES ET ACTIVIRES=====================================
exports.getActivities = async (req, res) => {
  try {
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('email role createdAt client agence petitTransporteur grandTransporteur');

    const activities = recentUsers.map(user => ({
      user, 
      createdAt: user.createdAt
    }));

    res.json(activities);
  } catch (error) {
    businessLogger.error(error, { context: 'getActivities', userId: req.user?.id });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ==================== RECUP SOCIÉTÉS EN ATTENTE  D'UNE VALIDATION=========================================
exports.getPendingCompanies = async (req, res) => {
  try {
    const pendingCompanies = await User.find({
      role: { $in: ['agence', 'petit_transporteur', 'grand_transporteur'] },
      isVerified: false
    }).select('email role isVerified client petitTransporteur grandTransporteur agence');

    res.json(pendingCompanies);
  } catch (error) {
    businessLogger.error(error, { context: 'getPendingCompanies', userId: req.user?.id });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ==========================================RECUP DE TOUS LES UTILISATEURS =======================================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('email role isVerified client petitTransporteur grandTransporteur agence createdAt')
      .sort({ createdAt: -1 }); 

    res.json(users);
  } catch (error) {
    businessLogger.error(error, { context: 'getAllUsers', userId: req.user?.id });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ==================== ==============VOIR TOUS LE PROFIL UTILISATEUR ====================
exports.getUserById = [
  validateRequest(getUserByIdSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      
      const user = await User.findById(id).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.json(user);
    } catch (error) {
      businessLogger.error(error, { context: 'getUserById', userId: req.user?.id, targetUserId: id });
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
];

// ====================REPONSE DE VALIDATION SOCIÉTÉ ===========================================
const { demandeAccepteeTemplate, demandeEnAttenteTemplate } = require('../Emails/adminTemplates');

exports.validateCompany = [
  validateRequest(validateCompanySchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      const { accept } = req.validatedData.body;
      
      const user = await User.findById(id);

      if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

      let subject = '';
      let html = '';

      if (accept) {
        user.isVerified = true;
        subject = 'Votre demande a été acceptée ';
        html = demandeAccepteeTemplate(user.nom || user.email);
      } else {
        user.isVerified = false;
        subject = 'Votre demande est en attente ';
        html = demandeEnAttenteTemplate(user.nom || user.email);
      }

      await user.save();
      
      businessLogger.user.verify(user._id, req.user?.id);
      
      await sendEmail({ to: user.email, subject, html });

      res.json({
        message: `Statut mis à jour (${accept ? 'accepté' : 'en attente'}) et email envoyé à ${user.email}`,
        isVerified: user.isVerified
      });
    } catch (error) {
      businessLogger.error(error, { context: 'validateCompany', userId: req.user?.id, targetUserId: id });
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
];

// ======================== CHANGER STATUT UTILISATEUR (METTRE EN VERIFICATION)======================================
exports.toggleUserStatus = [
  validateRequest(toggleUserStatusSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

      user.isVerified = !user.isVerified;

      let subject = '';
      let html = '';

      if (user.isVerified) {
        subject = 'Votre compte est maintenant activé ';
        html = demandeAccepteeTemplate(user.nom || user.email);
      } else {
        subject = 'Votre compte est maintenant en attente ';
        html = demandeEnAttenteTemplate(user.nom || user.email);
      }

      await user.save();
      await sendEmail({ to: user.email, subject, html });

      res.json({ 
        message: `Utilisateur ${user.isVerified ? 'activé' : 'en attente'} et email envoyé`,
        isVerified: user.isVerified 
      });
    } catch (error) {
      businessLogger.error(error, { context: 'toggleUserStatus', userId: req.user?.id, targetUserId: id });
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
];

// =====================================OPEN L'ACCES POUR LES USERS (VERIFIER UTILISATEUR) ====================
exports.verifyUser = [
  validateRequest(verifyUserSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;

      const user = await User.findByIdAndUpdate(
        id,
        { isVerified: true },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }

      businessLogger.user.verify(user._id, req.user?.id);

      res.status(200).json({
        message: "Utilisateur vérifié avec succès",
        user
      });
    } catch (error) {
      businessLogger.error(error, { context: 'verifyUser', userId: req.user?.id, targetUserId: id });
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
];

// ==================================== CHANGER STATUT PAIEMENT AVEC EMAIL ==========================================
const { paiementAccepteTemplate, paiementRefuseTemplate } = require('../Emails/paymentTemplates');

// ===================================RECUP DES TOUTES  PREUVES DE PAIEMENT===================== ====================
exports.getAllPaymentProofs = async (req, res) => {
  try {
    const proofs = await paymentProof.find().sort({ createdAt: -1 });
    res.status(200).json(proofs);
  } catch(error) {
    businessLogger.error(error, { context: 'getAllPaymentProofs', userId: req.user?.id });
    res.status(500).json({message : 'Erreur serveur'});
  }
};

exports.getNewPaymentProofsCount = [
  validateRequest(lastViewedQuerySchema),
  async (req, res) => {
    try {
      const { lastViewed } = req.validatedData.query;
      let newCount = 0;
      
      if (lastViewed) {
        newCount = await paymentProof.countDocuments({
          createdAt: { $gt: new Date(lastViewed) }
        });
      } else {
        newCount = await paymentProof.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
      }
      
      res.status(200).json({ newCount });
    } catch (error) {
      businessLogger.error(error, { context: 'getNewPaymentProofsCount', userId: req.user?.id });
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
];

exports.viewPaymentProof = [
  validateRequest(viewPaymentProofSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      
      const proof = await paymentProof.findById(id);
      if (!proof) {
        return res.status(404).json({ message: 'Preuve non trouvée' });
      }

      const response = await axios({
        method: 'GET',
        url: proof.proofUrl,
        responseType: 'stream'
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="preuve-${proof.codeColis}.pdf"`);

      response.data.pipe(res);
    } catch (error) {
      businessLogger.error(error, { context: 'viewPaymentProof', userId: req.user?.id, proofId: id });
      res.status(500).json({ message: 'Erreur chargement PDF' });
    }
  }
];

  

// ================================================LES  NOTIFICATIONS =================================================
exports.markNotificationAsRead = [
  validateRequest(markNotificationAsReadSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      
      res.json({ message: 'Notification marquée comme lue' });
    } catch (error) {
      businessLogger.error(error, { context: 'markNotificationAsRead', userId: req.user?.id, notificationId: id });
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
];

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    businessLogger.error(error, { context: 'markAllNotificationsAsRead', userId: req.user?.id });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ========================RECUP LES PREUVE AUX ENTREPRISES POUR PREUVE ====================
exports.getCompaniesForProof = async (req, res) => {
  try {
    const companies = await User.find({
      role: { $in: ['agence', 'grand_transporteur', 'petit_transporteur'] },
      isVerified: true
    }).select('email role agence grandTransporteur petitTransporteur');
    
    res.json(companies);
  } catch (error) {
    businessLogger.error(error, { context: 'getCompaniesForProof', userId: req.user?.id });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ======================================== UPDATE PAYMENT PROOF STATUS ==========================================
exports.updatePaymentProofStatus = [
  validateRequest(updatePaymentProofStatusSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      const { status } = req.validatedData.body;

      const proof = await paymentProof.findByIdAndUpdate(
        id,
        { 
          status: status,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('user', 'email fullName');
      
      if (!proof) {
        return res.status(404).json({
          success: false,
          message: 'Preuve de paiement non trouvée'
        });
      }

      if (proof.user && proof.user._id) {
        await Notification.create({
          userId: proof.user._id,
          type: 'payment_proof',
          titre: `[${proof.codeColis}] Statut mis à jour: ${status}`,
          message: `Le statut de votre preuve de paiement pour ${proof.codeColis} est maintenant ${status}`,
          data: {
            proofId: proof._id,
            codeColis: proof.codeColis,
            status: status
          },
          date: new Date(),
          lu: false
        });
      }

      res.json({
        success: true,
        message: `Statut mis à jour: ${status}`,
        data: proof
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'updatePaymentProofStatus', 
        userId: req.user?.id, 
        proofId: id,
        status 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
];

// ================================= ENVOYER PREUVE À ENTREPRISE ====================
const storage = multer.memoryStorage();
exports.upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

exports.sendProofToCompany = [
  exports.upload.single('proofImage'),
  validateRequest(sendProofToCompanySchema),
  async (req, res) => {
    try {
      const { codeColis, montant, devise, method, destinataireId } = req.body;
   
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'Photo de preuve requise' 
        });
      }
     
      const destinataire = await User.findById(destinataireId);
      if (!destinataire) {
        return res.status(404).json({ 
          success: false,
          message: 'Destinataire non trouvé' 
        });
      }
      
      if (!['agence', 'grand_transporteur', 'petit_transporteur'].includes(destinataire.role)) {
        return res.status(400).json({ 
          success: false,
          message: 'Le destinataire doit être une entreprise' 
        });
      }
     
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'payment_proofs' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      
      const uploadResult = await uploadPromise;
      
      const newProof = new paymentProof({
        user: destinataireId, 
        codeColis: codeColis,
        clientName: destinataire.fullName || 
                   destinataire.agence?.agenceName || 
                   destinataire.grandTransporteur?.entrepriseName || 
                   destinataire.petitTransporteur?.fullName || 
                   'Entreprise',
        montant: parseFloat(montant),
        devise: devise,
        method: method,
        proofUrl: uploadResult.secure_url,
        uploadedBy: req.user.id, 
        destinataireId: destinataireId,
        status: 'en_attente',
        uploadedAt: new Date()
      });
      
      await newProof.save();
      
      businessLogger.payment.proofUploaded(
        newProof._id,
        codeColis,
        destinataireId,
        montant
      );
      
      await Notification.create({
        userId: destinataireId,
        type: 'payment_proof',
        titre: 'Nouvelle preuve de paiement reçue',
        message: `Une preuve de paiement de ${montant} ${devise} a été envoyée pour le colis ${codeColis}`,
        data: {
          paymentProofId: newProof._id,
          codeColis: codeColis,
          montant: montant,
          devise: devise,
          method: method
        },
        date: new Date(),
        lu: false
      });
      
      const currencySymbol = devise === 'ZAR' ? 'R' : devise === 'FC' ? 'FC' : '$';
      const methodLabels = {
        'agencemethod': 'Face to face',
        'mpsa': 'MPESA',
        'orange': 'Orange Money',
        'bank': 'Banque'
      };
      
      const subject = `Nouvelle preuve de paiement - ${codeColis}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a5f3f;">Nouvelle preuve de paiement</h2>
          <p>Bonjour <strong>${destinataire.agence?.agenceName || destinataire.grandTransporteur?.entrepriseName || destinataire.petitTransporteur?.fullName || 'Entreprise'}</strong>,</p>
          <p>Vous avez reçu une nouvelle preuve de paiement pour le colis <strong>${codeColis}</strong>.</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Détails du paiement :</strong></p>
            <ul style="list-style: none; padding-left: 0;">
              <li><strong>Code Colis :</strong> ${codeColis}</li>
              <li><strong>Montant :</strong> ${currencySymbol}${montant}</li>
              <li><strong>Devise :</strong> ${devise}</li>
              <li><strong>Méthode :</strong> ${methodLabels[method] || method}</li>
              <li><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</li>
            </ul>
          </div>
          
          <p>Connectez-vous à votre espace pour consulter la preuve.</p>
          <br>
          <p>Cordialement,<br>L'équipe AFRIXA LOGISTICS</p>
        </div>
      `;
      
      if (destinataire.email) {
        await sendEmail({ 
          to: destinataire.email, 
          subject, 
          html 
        });
      }
      
      res.json({ 
        success: true,
        message: 'Preuve envoyée avec succès',
        proof: {
          _id: newProof._id,
          codeColis: newProof.codeColis,
          montant: newProof.montant,
          devise: newProof.devise,
          method: newProof.method,
          clientName: newProof.clientName,
          proofUrl: newProof.proofUrl,
          status: newProof.status,
          uploadedAt: newProof.uploadedAt
        }
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'sendProofToCompany', 
        userId: req.user?.id,
        destinataireId,
        codeColis 
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
];