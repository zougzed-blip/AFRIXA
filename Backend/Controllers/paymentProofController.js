const PaymentProof = require('../Models/paymentModel');
const Notification = require('../Models/NotificationModel');
const User = require('../Models/User')
const validateRequest = require('../Middleware/validateRequest');
const { uploadPaymentProofSchema } = require('../validation/paymentProofValidation');
const { businessLogger } = require('../config/logger');


exports.uploadPaymentProof = [
  validateRequest(uploadPaymentProofSchema),
  async (req, res) => {
    try {
    
      const { clientName, codeColis, montant, devise, paymentMethod, method, agenceId } = req.validatedData.body;
      
      if (!req.file || !req.file.cloudinaryUrl) {
        return res.status(400).json({ 
          success: false,
          message: "Preuve de paiement requise !" 
        });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false,
          message: "Utilisateur non authentifié !" 
        });
      }
      if (!agenceId) {
        return res.status(400).json({
          success: false,
          message: "Veuillez sélectionner une agence destinataire !"
        });
      }

      const agence = await User.findById(agenceId);
      if (!agence || agence.role !== 'agence') {
        return res.status(404).json({
          success: false,
          message: "Agence non trouvée !"
        });
      }

      const finalMethod = paymentMethod || method || 'mpsa';
      
      const newProof = await PaymentProof.create({
        user: req.user.id, 
        destinataireId: agenceId, 
        clientName,
        codeColis,
        montant,
        devise,
        method: finalMethod,
        proofUrl: req.file.cloudinaryUrl,
        uploadedBy: req.user.id, 
        status: 'en_attente'
      });

      businessLogger.payment.proofUploaded(
        newProof._id,
        codeColis,
        req.user.id,
        montant
      );

      try {

        await Notification.create({
          userId: req.user.id,
          message: `Preuve de paiement envoyée à l'agence ${agence.agence?.agenceName || agence.email} pour le colis ${codeColis}`,
          type: "success",
          data: {
            proofId: newProof._id,
            codeColis,
            clientName,
            agenceId,
            agenceName: agence.agence?.agenceName || agence.email
          }
        })

        await Notification.create({
          userId: agenceId,
          message: `Nouvelle preuve de paiement pour le colis ${codeColis} - ${montant} ${devise}`,
          type: "info",
          data: {
            proofId: newProof._id,
            codeColis,
            clientName,
            montant,
            devise
          }
        });

      } catch (notificationError) {
        businessLogger.error(notificationError, { 
          context: 'uploadPaymentProof_notification', 
          userId: req.user?.id,
          proofId: newProof._id 
        });
      }

      res.json({
        success: true,
        message: `Preuve de paiement envoyée avec succès à l'agence ${agence.agence?.agenceName || agence.email}.`,
        data: newProof,
        notificationSaved: true
      });
    } catch (err) {
      businessLogger.error(err, { 
        context: 'uploadPaymentProof', 
        userId: req.user?.id,
        codeColis: req.validatedData.body?.codeColis 
      });
      res.status(500).json({ 
        success: false,
        message: "Erreur serveur"
      });
    }
  }
];

exports.getAllAgences = async (req, res) => {
  try {
    const agences = await User.find({ role: 'agence' })
      .select('_id email agence.agenceName fullName agence.logo agence.locations')
      .sort({ 'agence.agenceName': 1 })
      .lean();

    const formattedAgences = agences.map(a => ({
      id: a._id,
      nom: a.agence?.agenceName || a.fullName || a.email,
      email: a.email,
      logo: a.agence?.logo || null,
      ville: a.agence?.locations?.[0]?.ville || 'Adresse non spécifiée' 
    }));

    res.json({ success: true, data: formattedAgences });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};