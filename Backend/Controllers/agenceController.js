const DemandeAgenceV2 = require('../Models/agenceModel');
const Paiement = require('../Models/paymentModel');
const Notification = require('../Models/NotificationModel');
const { sendEmail } = require('../Helper/EmailServices');
const User = require('../Models/User');
const mongoose = require('mongoose');
const validateRequest = require('../Middleware/validateRequest');
const {
  getDemandeByIdSchema,
  updateDemandeStatusSchema,
  adjustWeightDemandeSchema,
  updateDemandeCompleteSchema,
  getPaiementByIdSchema,
  updatePaiementStatusSchema,
  markNotificationAsReadSchema,
  updateProfileSchema,
  paginationQuerySchema
} = require('../validation/agenceValidation');
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

//==============================CREATION DES NOTIF=====================================================
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

function checkAgenceRole(req) {
    if (req.user.role !== 'agence') {
        throw new Error('Accès refusé. Seules les agences peuvent effectuer cette action.');
    }
}

function checkDemandeOwnership(demande, agenceId) {
    if (demande.agence.toString() !== agenceId.toString()) {
        throw new Error('Cette demande ne vous appartient pas.');
    }
}

//=====================================RECUP DE TOUTES LES DEMANDES

exports.listDemandes = async (req, res) => {
    try {
        const demandes = await DemandeAgenceV2.find({ agence: req.user._id })
            .sort({ createdAt: -1 })
            .populate('user', 'fullName email telephone')
            .lean();
        
        res.json({
            success: true,
            data: demandes
        });
    } catch (error) {
        businessLogger.error(error, { context: 'listDemandes', userId: req.user?.id });
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des demandes'
        });
    }
};

exports.getDemandeById = [
  validateRequest(getDemandeByIdSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      
      const demande = await DemandeAgenceV2.findOne({
        _id: id,
        agence: req.user._id 
      }).populate('user', 'fullName email telephone');
      
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
      businessLogger.error(error, { context: 'getDemandeById', userId: req.user?.id, demandeId: id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la demande'
      });
    }
  }
];

//====================================AJUSTER LE PRIC ET LE POID D'UNE DEMADE ET UPDATE LE STATUS DES DEMANDES=============================================

exports.updateDemandeStatus = [
  validateRequest(updateDemandeStatusSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      const { status, reason, adjustedWeight } = req.validatedData.body;
      
      checkAgenceRole(req);
      
      const demande = await DemandeAgenceV2.findOne({
        _id: id,
        agence: req.user._id
      }).populate('user', 'email fullName _id');
      
      if (!demande) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée'
        });
      }
      
      const ancienStatut = demande.status;
      demande.status = status;
      
      if (adjustedWeight !== undefined && adjustedWeight !== null && adjustedWeight !== '') {
        demande.poidsVolumeAjuste = adjustedWeight;
      }
      
      await demande.save();
      
      businessLogger.demande.updateStatus(
        demande._id,
        demande.codeColis,
        ancienStatut,
        status,
        req.user?.id
      );
      
      await createNotification(
        demande.user._id,
        'statut',
        `[${demande.codeColis}] Statut changé: ${ancienStatut} → ${status}`,
        `La demande ${demande.codeColis} est passée de ${ancienStatut} à ${status}`,
        { demandeId: demande._id, ancienStatut, nouveauStatut: status }
      );
      
      let description = reason || `Changement de statut de ${ancienStatut} à ${status}`;
      if (adjustedWeight !== undefined && adjustedWeight !== null && adjustedWeight !== '') {
        description += ` - Poids/Volume ajusté: ${adjustedWeight}`;
      }
      
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
          ${adjustedWeight ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Poids ajusté:</strong> ${adjustedWeight}</p>` : ''}
          ${reason ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Raison:</strong> ${reason}</p>` : ''}
        `;
        
        await sendEmailToClient(
          demande.user.email,
          demande.user.fullName || 'Client',
          `[${demande.codeColis}] Mise à jour statut - AFRIXA`,
          generateEmailTemplate(
            'MISE À JOUR DU STATUT',
            demande.user.fullName || 'Client',
            `Le statut de votre colis <strong>${demande.codeColis}</strong> a été mis à jour par notre agence.`,
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
      businessLogger.error(error, { 
        context: 'updateDemandeStatus', 
        userId: req.user?.id, 
        demandeId: id,
        status 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut'
      });
    }
  }
];

exports.adjustWeightDemande = [
  validateRequest(adjustWeightDemandeSchema),
  async (req, res) => {
    try {
      checkAgenceRole(req);
      
      const { id } = req.validatedData.params;
      const { poidsReel, motif, noteInterne } = req.validatedData.body;
      
      const demande = await DemandeAgenceV2.findById(id).populate('user', 'email fullName _id');
      
      if (!demande) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée'
        });
      }
      
      checkDemandeOwnership(demande, req.user._id);
      
      if (!['en_attente', 'acceptee', 'accepté'].includes(demande.status)) {
        return res.status(400).json({
          success: false,
          message: 'Impossible d\'ajuster le poids pour une demande avec ce statut'
        });
      }
      
      const ancienPoids = demande.poidOuTaille;
      
      if (poidsReel && poidsReel !== '') {
        demande.poidsVolumeAjuste = poidsReel;
      }
      
      let ajustementInfo = `Poids ajusté: ${ancienPoids} → ${poidsReel}`;
      
      if (motif && motif !== '') {
        ajustementInfo += ` | Motif: ${motif}`;
      }
      
      demande.description = demande.description ? 
        `${demande.description}` : ajustementInfo;
      
      demande.noteInterne = demande.noteInterne ? 
        `${demande.noteInterne}\n${ajustementInfo}` : ajustementInfo;
      
      await demande.save();
      
      businessLogger.demande.adjustWeight(
        demande._id,
        demande.codeColis,
        ancienPoids,
        poidsReel,
        req.user?.id
      );
      
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
          ${motif ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Motif d'ajustement:</strong> ${motif}</p>` : ''}
        `;
        
        await sendEmailToClient(
          demande.user.email,
          demande.user.fullName || 'Client',
          `[${demande.codeColis}] Ajustement de poids - AFRIXA`,
          generateEmailTemplate(
            'AJUSTEMENT DE POIDS',
            demande.user.fullName || 'Client',
            `Le poids de votre colis <strong>${demande.codeColis}</strong> a été ajusté par notre agence.`,
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
          poidsReel: poidsReel || null,
          motifAjustement: motif || null,
          status: demande.status,
          noteInterne: demande.noteInterne,
          dateAjustement: new Date()
        }
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'adjustWeightDemande', 
        userId: req.user?.id, 
        demandeId: id 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'ajustement'
      });
    }
  }
];

exports.updateDemandeComplete = [
  validateRequest(updateDemandeCompleteSchema),
  async (req, res) => {
    try {    
      checkAgenceRole(req);
      
      const { id } = req.validatedData.params;
      const { status, prix, delai, noteInterne, reason } = req.validatedData.body;
      
      const demande = await DemandeAgenceV2.findById(id).populate('user', 'email fullName _id');
      
      if (!demande) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée'
        });
      }
      
      checkDemandeOwnership(demande, req.user._id);
      
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
        
        await createNotification(
          demande.user._id,
          'statut',
          `[${demande.codeColis}] ${description}`,
          `Mise à jour complète pour le colis ${demande.codeColis}: ${description}`,
          { demandeId: demande._id, codeColis: demande.codeColis }
        );
 
        if (demande.user && demande.user.email) {
          const detailsHtml = `
            <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Code Colis:</strong> ${demande.codeColis}</p>
            <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Ancien statut:</strong> ${ancienStatut}</p>
            <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Nouveau statut:</strong> ${status}</p>
            ${prix ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Nouveau prix:</strong> ${prix} FC</p>` : ''}
            ${delai ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Délai:</strong> ${delai}</p>` : ''}
            ${reason ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Raison:</strong> ${reason}</p>` : ''}
          `;
          
          await sendEmailToClient(
            demande.user.email,
            demande.user.fullName || 'Client',
            `[${demande.codeColis}] Mise à jour complète - AFRIXA`,
            generateEmailTemplate(
              'MISE À JOUR COMPLÈTE',
              demande.user.fullName || 'Client',
              `Les informations de votre colis <strong>${demande.codeColis}</strong> ont été mises à jour par notre agence.`,
              detailsHtml,
              `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/dashboard`,
              'Voir les détails'
            )
          );
        }
      }

      if (prix !== undefined && prix !== null && prix !== ancienPrix && !status) {
        if (demande.user && demande.user.email) {
          const detailsHtml = `
            <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Code Colis:</strong> ${demande.codeColis}</p>
            <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Ancien prix:</strong> ${ancienPrix.toLocaleString()} FC</p>
            <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Nouveau prix:</strong> ${prix.toLocaleString()} FC</p>
            ${delai ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Délai:</strong> ${delai}</p>` : ''}
          `;
          
          await sendEmailToClient(
            demande.user.email,
            demande.user.fullName || 'Client',
            `[${demande.codeColis}] Mise à jour de prix - AFRIXA`,
            generateEmailTemplate(
              'MISE À JOUR DE PRIX',
              demande.user.fullName || 'Client',
              `Le prix de votre colis <strong>${demande.codeColis}</strong> a été mis à jour par notre agence.`,
              detailsHtml,
              `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/dashboard`,
              'Voir les détails'
            )
          );
        }
      }
      
      res.json({
        success: true,
        message: 'Demande mise à jour avec succès',
        data: demande
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'updateDemandeComplete', 
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

//=====================================RECUP DES TOUS LE PAIMENT=======================================

exports.listPaiements = async (req, res) => {
    try {
        const paiements = await Paiement.find()
            .sort({ createdAt: -1 })
            .lean();
        
        res.json({
            success: true,
            data: paiements
        });
    } catch (error) {
        businessLogger.error(error, { context: 'listPaiements', userId: req.user?.id });
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des paiements'
        });
    }
};

exports.getPaiementById = [
  validateRequest(getPaiementByIdSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      
      const paiement = await Paiement.findById(id);
      
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
      businessLogger.error(error, { context: 'getPaiementById', userId: req.user?.id, paiementId: id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du paiement'
      });
    }
  }
];

//==================================UPDATE LES PAIEMETN STATUS===================================
exports.updatePaiementStatus = [
  validateRequest(updatePaiementStatusSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedData.params;
      const { statut } = req.validatedData.body;
      
      const paiement = await Paiement.findById(id).populate('user', 'email fullName _id');
      
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

      await createNotification(
        paiement.user._id,
        'paiement',
        `[${paiement.codeColis}] Paiement ${statut}`,
        `Le paiement pour le colis ${paiement.codeColis} est maintenant ${statut}`,
        { paiementId: paiement._id, codeColis: paiement.codeColis, ancienStatut, nouveauStatut: statut }
      );

      await createHistorique(
        'paiement',
        paiement.codeColis,
        `Statut paiement changé: ${ancienStatut} → ${statut}`,
        ancienStatut,
        statut,
        req.user.fullName || req.user.email
      );

      if (paiement.user && paiement.user.email) {
        const statusMessages = {
          'en_attente': 'est en attente de traitement',
          'accepté': 'a été accepté',
          'refusé': 'a été refusé',
          'payé': 'a été confirmé comme payé',
          'annulé': 'a été annulé'
        };
        
        const message = statusMessages[statut] || 'a été mis à jour';
        
        const detailsHtml = `
          <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Code Colis:</strong> ${paiement.codeColis}</p>
          <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Référence:</strong> ${paiement.reference || paiement._id}</p>
          <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Montant:</strong> ${paiement.montant?.toLocaleString() || '0'} FC</p>
          <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Ancien statut:</strong> ${ancienStatut}</p>
          <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Nouveau statut:</strong> ${statut}</p>
          ${paiement.datePaiement ? `<p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Date paiement:</strong> ${new Date(paiement.datePaiement).toLocaleDateString()}</p>` : ''}
        `;
        
        await sendEmailToClient(
          paiement.user.email,
          paiement.user.fullName || 'Client',
          `[${paiement.codeColis}] Statut paiement - AFRIXA`,
          generateEmailTemplate(
            'STATUT DE PAIEMENT',
            paiement.user.fullName || 'Client',
            `Le paiement pour votre colis <strong>${paiement.codeColis}</strong> ${message}.`,
            detailsHtml,
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/dashboard`,
            'Voir les détails'
          )
        );
      }
      
      res.json({
        success: true,
        message: `Statut du paiement mis à jour: ${statut}`,
        data: paiement
      });
    } catch (error) {
      businessLogger.error(error, { 
        context: 'updatePaiementStatus', 
        userId: req.user?.id, 
        paiementId: id,
        statut 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut du paiement'
      });
    }
  }
];

//==================================GESTION DES NOTIFICATIONS===================================

exports.listNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        
        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        businessLogger.error(error, { context: 'listNotifications', userId: req.user?.id });
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des notifications'
        });
    }
};

exports.getUnreadNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user._id,
            lu: false
        }).lean();
        
        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        businessLogger.error(error, { context: 'getUnreadNotifications', userId: req.user?.id });
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des notifications non lues'
        });
    }
};

exports.markNotificationAsRead = [
  validateRequest(markNotificationAsReadSchema),
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
      businessLogger.error(error, { 
        context: 'markNotificationAsRead', 
        userId: req.user?.id, 
        notificationId: id 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la notification'
      });
    }
  }
];

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, lu: false },
            { $set: { lu: true } }
        );
        
        res.json({
            success: true,
            message: 'Toutes les notifications marquées comme lues'
        });
    } catch (error) {
        businessLogger.error(error, { context: 'markAllNotificationsAsRead', userId: req.user?.id });
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour des notifications'
        });
    }
};

//===================================RECUP DES TOUS LES HISTORIQUES======================================

exports.listHistorique = async (req, res) => {
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
        businessLogger.error(error, { context: 'listHistorique', userId: req.user?.id });
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'historique'
        });
    }
};

//===================================STATISTIQUES AGENCE NMOMBRE DE DEMANDE PAR STATUS======================================
exports.getStatsAgence = async (req, res) => {
    try {
        const agenceId = req.user._id;

        const stats = await DemandeAgenceV2.aggregate([
            { $match: { agence: agenceId } },
            { $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalPrix: { $sum: '$prix' }
            }}
        ]);

        const totalDemandes = await DemandeAgenceV2.countDocuments({ agence: agenceId });

        const totalRevenus = await DemandeAgenceV2.aggregate([
            { $match: { agence: agenceId, status: 'livree' } },
            { $group: { _id: null, total: { $sum: '$prix' } } }
        ]);

        const dernieresDemandes = await DemandeAgenceV2.find({ agence: agenceId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('codeColis status prix destination createdAt');
        
        res.json({
            success: true,
            data: {
                stats,
                totalDemandes,
                totalRevenus: totalRevenus[0]?.total || 0,
                dernieresDemandes
            }
        });
        
    } catch (error) {
        businessLogger.error(error, { context: 'getStatsAgence', userId: req.user?.id });
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
};

//===================================UPDATE PROFILE AGENCE======================================

exports.updateProfile = [
  validateRequest(updateProfileSchema),
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
      businessLogger.error(error, { context: 'updateProfile', userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du profil'
      });
    }
  }
];