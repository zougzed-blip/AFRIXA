const PaymentProof = require('../Models/paymentModel');
const Notification = require('../Models/NotificationModel');
const validateRequest = require('../Middleware/validateRequest');
const { uploadPaymentProofSchema } = require('../validation/paymentProofValidation');
const { businessLogger } = require('../config/logger');

// ==================== UPLOAD PAYMENT PROOF ====================
exports.uploadPaymentProof = [
  validateRequest(uploadPaymentProofSchema),
  async (req, res) => {
    try {
      const { clientName, codeColis, montant, devise, paymentMethod, method } = req.validatedData.body;
      
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

      const finalMethod = paymentMethod || method || 'mpsa';
      
      const newProof = await PaymentProof.create({
        user: req.user.id, 
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
        const notification = await Notification.create({
          userId: req.user.id,
          message: `Preuve de paiement envoyée pour le colis ${codeColis}. Nous vous enverrons un email après vérification.`,
          type: "success",
          data: {
            proofId: newProof._id,
            codeColis,
            clientName
          }
        });

        businessLogger.notification.created(
          notification._id,
          req.user.id,
          'payment_proof'
        );
      } catch (notificationError) {
        businessLogger.error(notificationError, { 
          context: 'uploadPaymentProof_notification', 
          userId: req.user?.id,
          proofId: newProof._id 
        });
      }

      res.json({
        success: true,
        message: "Preuve de paiement envoyée avec succès.",
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