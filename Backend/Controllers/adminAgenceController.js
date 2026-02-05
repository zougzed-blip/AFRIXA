const DemandeAgenceV2 = require('../Models/agenceModel');
const Paiement = require('../Models/paymentModel');
const Notification = require('../Models/NotificationModel');
const User = require('../Models/User');
const { sendEmail } = require('../Helper/EmailServices');
const mongoose = require('mongoose');
const validateRequest = require('../Middleware/validateRequest');
const {
  adminGetDemandeByIdSchema,
  adminUpdateDemandeStatusSchema,
  adminAdjustWeightDemandeSchema,
  adminUpdateDemandeCompleteSchema,
  adminGetPaiementByIdSchema,
  adminUpdatePaiementStatusSchema,
  adminMarkNotificationAsReadSchema,
  adminGetRevenueStatsSchema,
  adminGetFilteredDashboardDataSchema,
  adminUpdateProfileSchema,
  paginationQuerySchema
} = require('../validation/adminAgenceValidation');
const { businessLogger } = require('../config/logger');

const HistoriqueSchema = new mongoose.Schema({
    type: String,
    codeColis: String,
    description: String,
    ancienStatut: String,
    nouveauStatut: String,
    utilisateur: String,
    date: { type: Date, default: Date.now }
}, { timestamps: true });

const Historique = mongoose.models.Historique || mongoose.model('Historique', HistoriqueSchema);

// ==================== FONCTIONS UTILITAIRES ====================

async function createNotification(userId, type, titre, message, data = {}) {
    try {
        const notification = new Notification({
            type,
            titre,
            message,
            userId: userId,
            lu: false,
            data
        });
        await notification.save();
        businessLogger.notification.created(notification._id, userId, type);
        return notification;
    } catch (error) {
        businessLogger.error(error, { context: 'createNotification', userId });
        return null;
    }
}

async function createHistorique(type, codeColis, description, ancienStatut, nouveauStatut, utilisateur) {
    try {
        const historique = new Historique({
            type,
            codeColis,
            description,
            ancienStatut: ancienStatut || null,
            nouveauStatut: nouveauStatut || null,
            utilisateur
        });
        await historique.save();
        return historique;
    } catch (error) {
        businessLogger.error(error, { context: 'createHistorique', utilisateur });
        return null;
    }
}

async function sendEmailToClient(clientEmail, clientName, subject, htmlContent) {
    try {
        if (!clientEmail) {
            businessLogger.warning('Email client manquant', { clientName });
            return false;
        }

        await sendEmail({
            to: clientEmail,
            subject: subject,
            html: htmlContent
        });
        return true;
    } catch (emailError) {
        businessLogger.error(emailError, { context: 'sendEmailToClient', clientEmail });
        return false;
    }
}

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

// ==================================MA GESTION DES DEMANDES ===================================================================
exports.adminListDemandes = async (req, res) => {
    try {
        const demandes = await DemandeAgenceV2.find()
            .sort({ createdAt: -1 })
            .populate('user', 'fullName email telephone')
            .populate('agence', 'email agence.agenceName')
            .lean();
      
        const demandesFormatted = demandes.map(d => ({
            ...d,
            agenceName: d.agence?.agence?.agenceName || d.agence?.email || 'Agence'
        }));
        
        res.json({
            success: true,
            data: demandesFormatted
        });
    } catch (error) {
        businessLogger.error(error, { context: 'adminListDemandes', userId: req.user?.id });
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des demandes'
        });
    }
};

//=========================================MA GESTION DES DEMANDES PAR ID=====================================//
exports.adminGetDemandeById = [
  validateRequest(adminGetDemandeByIdSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      
      const demande = await DemandeAgenceV2.findById(id)
        .populate('user', 'fullName email telephone')
        .populate('agence', 'email agence.agenceName');
      
      if (!demande) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée'
        });
      }
      
      res.json({
        success: true,
        data: demande
      });
    } catch (error) {
      businessLogger.error(error, { context: 'adminGetDemandeById', userId: req.user?.id, demandeId: id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la demande'
      });
    }
  }
];

//=========================================MA MISE A JOUR DU STATUT DE LA DEMANDE PAR L ADMIN=====================================//
exports.adminUpdateDemandeStatus = [
  validateRequest(adminUpdateDemandeStatusSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      const { status, reason } = req.validatedData.body;
      
      const demande = await DemandeAgenceV2.findById(id)
        .populate('user', 'email fullName _id')
        .populate('agence', 'email agence.agenceName');
      
      if (!demande) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée'
        });
      }
      
      const ancienStatut = demande.status;
      demande.status = status;
      demande.dateModification = new Date();
      
      await demande.save();
      
      businessLogger.demande.updateStatus(
        demande._id, 
        demande.codeColis, 
        ancienStatut, 
        status, 
        req.user?.id
      );
      
      if (demande.user && demande.user._id) {
        await createNotification(
          demande.user._id,
          'statut',
          `[${demande.codeColis}] Statut changé: ${ancienStatut} → ${status}`,
          `La demande ${demande.codeColis} est passée de ${ancienStatut} à ${status}`,
          { demandeId: demande._id, ancienStatut, nouveauStatut: status }
        );
      }
      
      let description = reason || `Changement de statut de ${ancienStatut} à ${status}`;
      await createHistorique(
        'statut',
        demande.codeColis,
        description,
        ancienStatut,
        status,
        req.user.fullName || req.user.email
      );
  
      if (demande.user && demande.user.email) {
        const detailsHtml = `
          <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Code Colis:</strong> ${demande.codeColis}</p>
          <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Ancien statut:</strong> ${ancienStatut}</p>
          <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Nouveau statut:</strong> ${status}</p>
          ${reason ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Raison:</strong> ${reason}</p>` : ''}
        `;
        
        await sendEmailToClient(
          demande.user.email,
          demande.user.fullName || 'Client',
          `[${demande.codeColis}] Mise à jour statut - AFRIXA`,
          generateEmailTemplate(
            'MISE À JOUR DU STATUT',
            demande.user.fullName || 'Client',
            `Le statut de votre colis <strong>${demande.codeColis}</strong> a été mis à jour par l'administrateur.`,
            detailsHtml,
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/dashboard`,
            'Voir les détails'
          )
        );
      }
      
      res.json({
        success: true,
        message: 'Statut mis à jour avec succès',
        data: demande
      });
    } catch (error) {
      businessLogger.error(error, { context: 'adminUpdateDemandeStatus', userId: req.user?.id, demandeId: id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut'
      });
    }
  }
];

//=========================MES AJUSTEMENT DU POIDS DE LA DEMANDE PAR L ADMIN=====================================//
exports.adminAdjustWeightDemande = [
  validateRequest(adminAdjustWeightDemandeSchema),
  async (req, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'agence') {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé'
        });
      }

      const { id } = req.validatedData.params;
      const { poidsReel, motif, noteInterne } = req.validatedData.body;
      
      const demande = await DemandeAgenceV2.findById(id)
        .populate('user', 'email fullName _id')
        .populate('agence', 'email agence.agenceName');
      
      if (!demande) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée'
        });
      }
      
      if (!['en_attente', 'acceptee', 'accepté'].includes(demande.status)) {
        return res.status(400).json({
          success: false,
          message: 'Impossible d\'ajuster le poids pour une demande avec ce statut'
        });
      }
      
      const ancienPoids = demande.poidOuTaille;
      demande.poidsVolumeAjuste = poidsReel;
      demande.poidsReel = poidsReel;
      
      if (demande.prix && demande.prix > 0) {
        demande.prixFinal = demande.prix * poidsReel;
      }
      
      let ajustementInfo = `Poids ajusté: ${ancienPoids} → ${poidsReel}`;
      
      if (motif && motif !== '') {
        ajustementInfo += ` | Motif: ${motif}`;
      }
      
      demande.description = demande.description ? 
        `${demande.description}\n${ajustementInfo}` : ajustementInfo;
      
      demande.noteInterne = demande.noteInterne ? 
        `${demande.noteInterne}\n${ajustementInfo}` : ajustementInfo;
      
      demande.dateModification = new Date();
      await demande.save();
      
      businessLogger.demande.adjustWeight(
        demande._id,
        demande.codeColis,
        ancienPoids,
        poidsReel,
        req.user?.id
      );
      
      if (demande.user && demande.user._id) {
        await createNotification(
          demande.user._id,
          'poids_ajuste',
          `[${demande.codeColis}] Poids ajusté: ${ancienPoids} → ${poidsReel}`,
          `Poids ajusté pour le colis ${demande.codeColis} de ${ancienPoids} à ${poidsReel}`,
          {
            demandeId: demande._id,
            ancienPoids,
            nouveauPoids: poidsReel
          }
        );
      }
     
      await createHistorique(
        'poids_ajuste',
        demande.codeColis,
        ajustementInfo,
        demande.status,
        demande.status,
        req.user.fullName || req.user.email
      );
     
      if (demande.user && demande.user.email) {
        const detailsHtml = `
          <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Code Colis:</strong> ${demande.codeColis}</p>
          ${ancienPoids ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Poids déclaré:</strong> ${ancienPoids}</p>` : ''}
          ${poidsReel ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Poids réel:</strong> ${poidsReel}</p>` : ''}
          ${demande.prixFinal ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Prix final:</strong> ${demande.prixFinal.toLocaleString()} $</p>` : ''}
          ${motif ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Motif:</strong> ${motif}</p>` : ''}
        `;
        
        await sendEmailToClient(
          demande.user.email,
          demande.user.fullName || 'Client',
          `[${demande.codeColis}] Ajustement de poids - AFRIXA`,
          generateEmailTemplate(
            'AJUSTEMENT DE POIDS',
            demande.user.fullName || 'Client',
            `Le poids de votre colis <strong>${demande.codeColis}</strong> a été ajusté par l'administrateur.`,
            detailsHtml,
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/dashboard`,
            'Voir les détails'
          )
        );
      }
      
      res.json({
        success: true,
        message: 'Poids ajusté avec succès',
        data: {
          _id: demande._id,
          codeColis: demande.codeColis,
          poidsDeclare: ancienPoids,
          poidsReel: poidsReel,
          prixFinal: demande.prixFinal,
          motifAjustement: motif || null,
          status: demande.status,
          noteInterne: demande.noteInterne,
          dateAjustement: new Date()
        }
      });
    } catch (error) {
      businessLogger.error(error, { context: 'adminAdjustWeightDemande', userId: req.user?.id, demandeId: id });
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'ajustement'
      });
    }
  }
];

// ==================== MISE À JOUR COMPLÈTE DE LA DEMANDE PAR L'ADMIN ET LE PRIX AUSSI ====================
exports.adminUpdateDemandeComplete = [
  validateRequest(adminUpdateDemandeCompleteSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      const { status, prix, delai, noteInterne, reason } = req.validatedData.body;
      
      const demande = await DemandeAgenceV2.findById(id)
        .populate('user', 'email fullName _id')
        .populate('agence', 'email agence.agenceName');
      
      if (!demande) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée'
        });
      }
      
      const ancienStatut = demande.status;
      const ancienPrix = demande.prix;
      
      if (status) demande.status = status;
      if (prix !== undefined && prix !== null) demande.prix = parseFloat(prix);
      if (delai) demande.delai = delai;
      if (noteInterne) demande.noteInterne = noteInterne;
      
      demande.dateModification = new Date();
      await demande.save();
      
      if (status && status !== ancienStatut) {
        businessLogger.demande.updateStatus(
          demande._id,
          demande.codeColis,
          ancienStatut,
          status,
          req.user?.id
        );
        
        const description = `Changement de statut: ${ancienStatut} → ${status} | ${reason || 'Mis à jour'}`;
        
        await createHistorique(
          'statut',
          demande.codeColis,
          description,
          ancienStatut,
          status,
          req.user.fullName || req.user.email
        );
        
        if (demande.user && demande.user._id) {
          await createNotification(
            demande.user._id,
            'statut',
            `[${demande.codeColis}] ${description}`,
            `Mise à jour complète pour le colis ${demande.codeColis}`,
            { demandeId: demande._id, codeColis: demande.codeColis }
          );
        }
      }
      
      res.json({
        success: true,
        message: 'Demande mise à jour avec succès',
        data: demande
      });
    } catch (error) {
      businessLogger.error(error, { context: 'adminUpdateDemandeComplete', userId: req.user?.id, demandeId: id });
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
];

//=======================================MES RECUPERATIONS DES PAIEMENTS ET UPDATES MES STATUS PAR L ADMIN=====================================//
exports.adminListPaiements = async (req, res) => {
  try {
    const paiements = await Paiement.find()
      .sort({ createdAt: -1 })
      .populate('user', 'fullName email')
      .lean();
    
    res.json({
      success: true,
      data: paiements
    });
  } catch (error) {
    businessLogger.error(error, { context: 'adminListPaiements', userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements'
    });
  }
};

exports.adminGetPaiementById = [
  validateRequest(adminGetPaiementByIdSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      
      const paiement = await Paiement.findById(id)
        .populate('user', 'fullName email');
      
      if (!paiement) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: paiement
      });
    } catch (error) {
      businessLogger.error(error, { context: 'adminGetPaiementById', userId: req.user?.id, paiementId: id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du paiement'
      });
    }
  }
];

exports.adminUpdatePaiementStatus = [
  validateRequest(adminUpdatePaiementStatusSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      const { statut } = req.validatedData.body;

      const paiement = await Paiement.findById(id)
        .populate('user', 'email fullName _id');
      
      if (!paiement) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      const ancienStatut = paiement.statut || paiement.status || 'en_attente';
      paiement.statut = statut;
      paiement.status = statut;
      paiement.dateModification = new Date();
      
      await paiement.save();

      businessLogger.payment.statusUpdated(
        paiement._id,
        paiement.codeColis,
        ancienStatut,
        statut,
        req.user?.id
      );

      if (paiement.user && paiement.user._id) {
        await createNotification(
          paiement.user._id,
          'paiement',
          `[${paiement.codeColis}] Paiement ${statut}`,
          `Le paiement pour le colis ${paiement.codeColis} est maintenant ${statut}`,
          { paiementId: paiement._id, codeColis: paiement.codeColis }
        );
      }

      await createHistorique(
        'paiement',
        paiement.codeColis,
        `Statut paiement changé: ${ancienStatut} → ${statut}`,
        ancienStatut,
        statut,
        req.user.fullName || req.user.email
      );
      
      res.json({
        success: true,
        message: `Statut du paiement mis à jour: ${statut}`,
        data: paiement
      });
    } catch (error) {
      businessLogger.error(error, { context: 'adminUpdatePaiementStatus', userId: req.user?.id, paiementId: id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut du paiement'
      });
    }
  }
];

//========================================MES RECUP  POUR LES HISTORIQUES PAR L ADMIN=====================================//
exports.adminListHistorique = async (req, res) => {
  try {
    const historique = await Historique.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    res.json({
      success: true,
      data: historique
    });
  } catch (error) {
    businessLogger.error(error, { context: 'adminListHistorique', userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
};

//=======================================MES RECUPERATIONS DES STATS PAR L ADMIN=====================================//
exports.adminGetStats = async (req, res) => {
  try {
    const stats = await DemandeAgenceV2.aggregate([
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalPrix: { $sum: '$prix' }
      }}
    ]);

    const totalDemandes = await DemandeAgenceV2.countDocuments();
    const pendingDemandes = await DemandeAgenceV2.countDocuments({ status: 'en_attente' });

    const totalRevenus = await DemandeAgenceV2.aggregate([
      { $match: { status: { $in: ['livree', 'livré'] } } },
      { $group: { _id: null, total: { $sum: '$prix' } } }
    ]);

    const totalPaiements = await Paiement.countDocuments();
    const pendingPaiements = await Paiement.countDocuments({ statut: 'en_attente' });

    const dernieresDemandes = await DemandeAgenceV2.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('codeColis status prix destination createdAt')
      .populate('agence', 'agence.agenceName');
    
    res.json({
      success: true,
      data: {
        stats,
        totalDemandes,
        pendingDemandes,
        totalRevenus: totalRevenus[0]?.total || 0,
        totalPaiements,
        pendingPaiements,
        dernieresDemandes
      }
    });
  } catch (error) {
    businessLogger.error(error, { context: 'adminGetStats', userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

//=======================================MES RECUPERATIONS DES DONNEES DU DASHBOARD PAR L ADMIN=====================================//
exports.adminGetDashboardData = async (req, res) => {
  try {
    const totalDemandes = await DemandeAgenceV2.countDocuments();
    const pendingDemandes = await DemandeAgenceV2.countDocuments({ status: 'en_attente' });
    const livrees = await DemandeAgenceV2.countDocuments({ status: { $in: ['livree', 'livré'] } });
    
    const totalPaiements = await Paiement.countDocuments();
    const pendingPaiements = await Paiement.countDocuments({ statut: 'en_attente' });

    const revenue = await DemandeAgenceV2.aggregate([
      { $match: { status: { $in: ['livree', 'livré'] } } },
      { $group: { _id: null, total: { $sum: '$prix' } } }
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const revenueToday = await DemandeAgenceV2.aggregate([
      { $match: { 
        status: { $in: ['livree', 'livré'] },
        createdAt: { $gte: today }
      }},
      { $group: { _id: null, total: { $sum: '$prix' } } }
    ]);

    const successRate = totalDemandes > 0 
      ? `${((livrees / totalDemandes) * 100).toFixed(1)}%`
      : '0%';
    
    res.json({
      totalDemandes,
      pendingDemandes,
      livrees,
      totalPaiements,
      pendingPaiements,
      revenue: revenue[0]?.total || 0,
      revenueToday: revenueToday[0]?.total || 0,
      successRate
    });
  } catch (error) {
    businessLogger.error(error, { context: 'adminGetDashboardData', userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données dashboard'
    });
  }
};

//=======================================MES RECUPERATIONS DES NOTIFICATIONS PAR L ADMIN=====================================//
exports.adminListNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'email role')
      .lean();
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    businessLogger.error(error, { context: 'adminListNotifications', userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications'
    });
  }
};

exports.adminGetUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ lu: false })
      .populate('userId', 'email role')
      .lean();
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    businessLogger.error(error, { context: 'adminGetUnreadNotifications', userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications non lues'
    });
  }
};

exports.adminMarkNotificationAsRead = [
  validateRequest(adminMarkNotificationAsReadSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      
      const notification = await Notification.findById(id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification non trouvée'
        });
      }
      
      notification.lu = true;
      await notification.save();
      
      businessLogger.notification.markedAsRead(notification._id, notification.userId);
      
      res.json({
        success: true,
        message: 'Notification marquée comme lue'
      });
    } catch (error) {
      businessLogger.error(error, { context: 'adminMarkNotificationAsRead', userId: req.user?.id, notificationId: id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la notification'
      });
    }
  }
];

//=======================================MES RECUPERATIONS DES EVALUATIONS AVEC LES ETOILES DES AGENCES PAR L ADMIN=====================================//
exports.adminGetAllAgenceRatings = async (req, res) => {
  try {
    const ratedDemandes = await DemandeAgence.find({ 
      rating: { $exists: true, $ne: null } 
    })
    .select('codeColis fullName email rating destination prix delai createdAt status')
    .populate('agence', 'email agence.agenceName')
    .populate('user', 'fullName email')
    .sort({ createdAt: -1 });

    const ratings = ratedDemandes.map(demande => ({
      codeColis: demande.codeColis,
      nomClient: demande.fullName || demande.user?.fullName || 'Client',
      emailClient: demande.email || demande.user?.email || 'N/A',
      agenceName: demande.agence?.agence?.agenceName || 
                 demande.agence?.email || 'Agence',
      destination: demande.destination,
      rating: demande.rating,
      prix: demande.prix,
      delai: demande.delai,
      status: demande.status,
      createdAt: demande.createdAt
    }));

    res.status(200).json({
      success: true,
      data: ratings
    });
  } catch(error) {
    businessLogger.error(error, { context: 'adminGetAllAgenceRatings', userId: req.user?.id });
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur'
    });
  }
};

exports.adminMarkAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { lu: false },
      { $set: { lu: true } }
    );
    
    res.json({
      success: true,
      message: 'Toutes les notifications marquées comme lues'
    });
  } catch (error) {
    businessLogger.error(error, { context: 'adminMarkAllNotificationsAsRead', userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des notifications'
    });
  }
};

exports.adminUpdateProfile = [
  validateRequest(adminUpdateProfileSchema),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const updates = req.validatedData.body;
      
      if (req.file) {
        updates.profilePhoto = `/uploads/avatars/${req.file.filename}`;
      }
      
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true }
      ).select('-password');
      
      businessLogger.user.updateProfile(userId, updates);
      
      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: user,
        photoUrl: updates.profilePhoto
      });
    } catch (error) {
      businessLogger.error(error, { context: 'adminUpdateProfile', userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du profil'
      });
    }
  }
];

//================================LA RECUPERATION DE STAT REVENU ET LE CALCUL PAR CURRENCY PAR L ADMIN=====================================//
exports.adminGetRevenueStats = [
  validateRequest(adminGetRevenueStatsSchema),
  async (req, res) => {
    try {
      const { startDate, endDate, status, currency = 'USD' } = req.validatedData.query;
      
      let dateFilter = {};
      
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          dateFilter.createdAt.$gte = start;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          dateFilter.createdAt.$lte = end;
        }
      }
      
      let matchStage = {
        $and: [
          {
            $or: [
              { statut: { $regex: /accept|accepté|acceptee|accepte|confirmed|payé|paye/i } },
              { status: { $regex: /accept|accepté|acceptee|accepte|confirmed|payé|paye/i } }
            ]
          },
          { montant: { $exists: true, $gt: 0 } }
        ]
      };
      
      if (dateFilter.createdAt) {
        matchStage.$and.push(dateFilter);
      }
     
      const paiements = await Paiement.find(matchStage)
        .select('montant devise createdAt codeColis clientName')
        .lean();

      const totalsByCurrency = {
        USD: 0,
        FC: 0,
        ZAR: 0
      };
      
      paiements.forEach(p => {
        const devise = p.devise || 'USD';
        if (totalsByCurrency[devise] !== undefined) {
          totalsByCurrency[devise] += (p.montant || 0);
        }
      });

      const response = {
        success: true,
        paiements: paiements,
        totalsByCurrency: totalsByCurrency,
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
          paiementsCount: paiements.length
        }
      };
      
      res.json(response);
    } catch (error) {
      businessLogger.error(error, { 
        context: 'adminGetRevenueStats', 
        userId: req.user?.id,
        startDate,
        endDate 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paiements',
        paiements: []
      });
    }
  }
];

//========================================RECUPERER LES DONNER DANS LE DASHBOARD ENCORE=====================================================
exports.adminGetDashboardData2 = async (req, res) => {
  try {
    //===================1. DEMANDES=======================
    const totalDemandes = await DemandeAgenceV2.countDocuments();
    
    const pendingDemandes = await DemandeAgenceV2.countDocuments({ 
      status: { $regex: /attente|pending|en_attente/i } 
    });
    
    const accepteesDemandes = await DemandeAgenceV2.countDocuments({ 
      status: { $regex: /accept|accepté|acceptee|accepte/i } 
    });
    
    const livreesDemandes = await DemandeAgenceV2.countDocuments({ 
      status: { $regex: /livr|livré|livree|livre|completed/i } 
    });
    
    const annuleesDemandes = await DemandeAgenceV2.countDocuments({ 
      status: { $regex: /annul|annulé|annulee|annule|cancel/i } 
    });
    
    // ==================== 2. PAIEMENTS ====================
    const totalPaiements = await Paiement.countDocuments();
    
    const pendingPaiements = await Paiement.countDocuments({
      $or: [
        { statut: { $regex: /attente|pending|en_attente/i } },
        { status: { $regex: /attente|pending|en_attente/i } }
      ]
    });
    
    const acceptesPaiements = await Paiement.countDocuments({
      $or: [
        { statut: { $regex: /accept|accepté|acceptee|accepte|confirmed|payé|paye/i } },
        { status: { $regex: /accept|accepté|acceptee|accepte|confirmed|payé|paye/i } }
      ]
    });
    
    const refusesPaiements = await Paiement.countDocuments({
      $or: [
        { statut: { $regex: /refus|refusé|refusee|refuse|rejected/i } },
        { status: { $regex: /refus|refusé|refusee|refuse|rejected/i } }
      ]
    });
    
    // ==================== 3. REVENU EN USD PAR DÉFAUT ====================
    const paiementsAcceptes = await Paiement.find({
      $or: [
        { statut: { $regex: /accept|accepté|acceptee|accepte|confirmed|payé|paye/i } },
        { status: { $regex: /accept|accepté|acceptee|accepte|confirmed|payé|paye/i } }
      ],
      montant: { $exists: true, $gt: 0 }
    }).select('montant devise').lean();
    
    const EXCHANGE_RATES = { USD: 1, FC: 2800, ZAR: 18.5 };
    
    let revenueInUSD = 0;
    paiementsAcceptes.forEach(p => {
      const montant = p.montant || 0;
      const devise = p.devise || 'USD';
      const amountInUSD = montant / EXCHANGE_RATES[devise];
      revenueInUSD += amountInUSD;
    });
    
    const successRate = totalDemandes > 0 
      ? `${((livreesDemandes / totalDemandes) * 100).toFixed(1)}%`
      : '0%';
    
    const response = {
      totalDemandes,
      pendingDemandes,
      accepteesDemandes,
      livreesDemandes,
      annuleesDemandes,
      totalPaiements,
      pendingPaiements,
      acceptesPaiements,
      refusesPaiements,
      revenue: revenueInUSD,
      successRate
    };
    
    res.json(response);
  } catch (error) {
    businessLogger.error(error, { context: 'adminGetDashboardData2', userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données dashboard',
      fallbackData: {
        totalDemandes: 0,
        pendingDemandes: 0,
        accepteesDemandes: 0,
        livreesDemandes: 0,
        annuleesDemandes: 0,
        totalPaiements: 0,
        pendingPaiements: 0,
        acceptesPaiements: 0,
        refusesPaiements: 0,
        revenue: 0,
        successRate: '0%'
      }
    });
  }
};

// ==================== DASHBOARD FILTRER LE PAIEMENT PAR LA DATE================ ====================
exports.adminGetFilteredDashboardData = [
  validateRequest(adminGetFilteredDashboardDataSchema),
  async (req, res) => {
    try {
      const { startDate, endDate, status, currency = 'USD' } = req.validatedData.query;
      
      let filters = {};
      
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          filters.createdAt.$gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          filters.createdAt.$lte = end;
        }
      }
      
      if (status && status !== 'all') {
        filters.status = { $regex: new RegExp(status, 'i') };
      }
      
      const totalDemandes = await DemandeAgenceV2.countDocuments(filters);
      
      const pendingDemandes = await DemandeAgenceV2.countDocuments({
        ...filters,
        status: { $regex: /attente|pending|en_attente/i }
      });
      
      const accepteesDemandes = await DemandeAgenceV2.countDocuments({
        ...filters,
        status: { $regex: /accept|accepté|acceptee|accepte/i }
      });
      
      const livreesDemandes = await DemandeAgenceV2.countDocuments({
        ...filters,
        status: { $regex: /livr|livré|livree|livre|completed/i }
      });
      
      const annuleesDemandes = await DemandeAgenceV2.countDocuments({
        ...filters,
        status: { $regex: /annul|annulé|annulee|annule|cancel/i }
      });
     
      const revenueResult = await DemandeAgenceV2.aggregate([
        {
          $match: {
            ...filters,
            status: { $regex: /livr|livré|livree|livre|completed/i },
            prix: { $exists: true, $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$prix' }
          }
        }
      ]);
      
      let revenue = revenueResult[0]?.total || 0;
      
      if (currency === 'FC') revenue = revenue * 2500;
      if (currency === 'ZAR') revenue = revenue * 18;
      
      const successRate = totalDemandes > 0 
        ? `${((livreesDemandes / totalDemandes) * 100).toFixed(1)}%`
        : '0%';
      
      res.json({
        totalDemandes,
        pendingDemandes,
        accepteesDemandes,
        livreesDemandes,
        annuleesDemandes,
        revenue,
        currency,
        successRate,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          status: status || 'all',
          period: startDate || endDate ? 'filtered' : 'all'
        }
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'adminGetFilteredDashboardData', 
        userId: req.user?.id,
        startDate,
        endDate 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des données filtrées'
      });
    }
  }
];

// ==================== RECUP DES EVALUATIONS ===========
exports.adminGetAllAgenceRatings = async (req, res) => {
  try {
    const ratedDemandes = await DemandeAgenceV2.find({ 
      rating: { $exists: true, $ne: null } 
    })
    .select('codeColis rating createdAt fullName email') 
    .populate('user', 'fullName email')
    .populate('agence', 'agence.agenceName email')
    .sort({ createdAt: -1 })
    .lean();

    const ratings = ratedDemandes.map(demande => ({
      'Code Colis': demande.codeColis || 'N/A',
      'Client': demande.user?.fullName || demande.fullName || 'Client',
      'AGENCE': demande.agence?.agence?.agenceName || 
                demande.agence?.email || 
                'Agence',
      'Note': demande.rating ? `${demande.rating} ⭐` : 'Non noté',
      'Date': demande.createdAt ? 
              new Date(demande.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'N/A'
    }));

    const totalRatings = ratings.length;
    const averageRating = ratedDemandes.length > 0 ? 
      (ratedDemandes.reduce((sum, d) => sum + (d.rating || 0), 0) / ratedDemandes.length).toFixed(1) : 
      0;

  

    res.status(200).json({
      success: true,
      data: ratings,
      stats: {
        totalRatings,
        averageRating: parseFloat(averageRating),
        noteSur5: `${averageRating}/5`
      }
    });
  } catch(error) {
    businessLogger.error(error, { context: 'adminGetAllAgenceRatings', userId: req.user?.id });
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la récupération des évaluations'
    });
  }
};