const express = require('express');
const router = express.Router()
const PaymentProof = require('../Models/paymentModel')
const User = require('../Models/User')
const Notification = require('../Models/NotificationModel');
const {upload3, uploadToCloudinaryMiddleware3, compressImage} = require('../Middleware/uploadProofMid')
const authMiddleware = require('../Middleware/authenticationMiddlware'); 

const uploadPaymentProof = async (req, res) => {
  try {
    console.log("📤 Upload de preuve reçu...");
    console.log("📂 Fichier:", req.file);
    console.log("📝 Données:", req.body);
    console.log("👤 Utilisateur:", req.user); 

    if (!req.body.clientName || !req.body.codeColis) {
      return res.status(400).json({ 
        success: false,
        message: "Nom du client et code colis requis !" 
      });
    }

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

    // Créer la preuve de paiement
    const newProof = await PaymentProof.create({
      user: req.user.id, 
      clientName: req.body.clientName,
      codeColis: req.body.codeColis,
      proofUrl: req.file.cloudinaryUrl
    });

    console.log("✅ Preuve créée:", newProof);

    // Créer la notification
    try {
        const notification = await Notification.create({
            userId: req.user.id,
            message: `✅ Preuve de paiement envoyée pour le colis ${req.body.codeColis}. Nous vous enverrons un email après vérification.`,
            type: "success",
            data: {
                proofId: newProof._id,
                codeColis: req.body.codeColis,
                clientName: req.body.clientName
            }
        });
        
        console.log("✅ Notification sauvegardée:", notification._id);
      
    } catch (notificationError) {
        console.error("⚠️ Erreur notification:", notificationError);
    }

    // Réponse avec la notification
    res.json({
      success: true,
      message: "Preuve de paiement envoyée avec succès.",
      data: newProof,
      notificationSaved: true
    });

  } catch (err) {
    console.error("❌ Erreur uploadPaymentProof:", err);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur: " + err.message 
    });
  }
};

// ==================== UPLOAD PAYMENT PROOF ====================
router.post(
  "/upload-payment-proof",
  authMiddleware,
  upload3.single("proofFile"),
  compressImage,
  uploadToCloudinaryMiddleware3,
  uploadPaymentProof
);

module.exports = router;