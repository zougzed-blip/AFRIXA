const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authenticationMiddlware');
const { upload, uploadMiddlewareRegister } = require('../Middleware/uploadMiddlwareRegiste');
const clientController = require('../Controllers/clientController');
const { roleMiddleware } = require('../Middleware/RoleMiddlware');
const { upload3, uploadToCloudinaryMiddleware3, compressImage } = require('../Middleware/uploadProofMid');
const paymentProofController = require('../Controllers/paymentProofController');
const { validateMongoId } = require('../Middleware/validationMiddleware');
const ExchangeRate = require('../Models/ExchangeRate')
const mongoose = require('mongoose');

const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'ID invalide' });
  }
  next();
};

// ==================== ROUTES DE PAIEMENT ====================
router.post(
  "/upload-payment-proof",
  authMiddleware,
  roleMiddleware('client'),
  upload3.single("proofFile"),
  compressImage,
  uploadToCloudinaryMiddleware3,
  paymentProofController.uploadPaymentProof
)

router.get(
  "/agences",
  authMiddleware,
  paymentProofController.getAllAgences
)

// ==================== ROUTES DE PROFIL ====================
router.get('/profile', authMiddleware, clientController.getProfile);

router.put('/profile', 
    authMiddleware, 
    upload.single('avatar'), 
    uploadMiddlewareRegister, 
    clientController.updateProfile
);

// ==================== ROUTES DE DASHBOARD ====================
router.get('/dashboard', authMiddleware, clientController.getDashboard);


router.get('/history', authMiddleware, clientController.getAllClientHistory);


const getSimpleNotifications = async (req, res) => {
  try {
    res.json({ 
      success: true, 
      notifications: [] 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

router.get('/notifications', authMiddleware, getSimpleNotifications);

// ==================== ROUTES AGENCE ====================
router.post('/agence/request', authMiddleware, clientController.createDemandeAgence);
router.get('/agences-by-destination', authMiddleware, clientController.getAgencesByDestination);
router.get('/all-requests', authMiddleware, clientController.getAllClientRequests);

router.get('/all-history', authMiddleware, clientController.getAllClientHistory);

const checkSimpleUpdates = async (req, res) => {
  res.json({ 
    success: true, 
    updates: [], 
    timestamp: new Date() 
  });
};

const getSimpleAgenceUpdates = async (req, res) => {
  res.json({ 
    success: true, 
    updates: [], 
    timestamp: new Date() 
  });
};

router.get('/check-updates', authMiddleware, checkSimpleUpdates);
router.get('/agence-updates', authMiddleware, getSimpleAgenceUpdates);

// ==================== ROUTES AGENCE AVEC ID ====================
router.get('/agence-request/:id', 
  authMiddleware, 
  validateObjectId, 
  clientController.getAgenceRequestById
);

router.post('/agence-request/:id/rate', 
  authMiddleware, 
  validateObjectId, 
  clientController.rateAgenceRequest
);

// ==================== ROUTES DE NOTIFICATIONS AGENCE ====================
router.get('/agence-notifications', 
  authMiddleware, 
  clientController.getAgenceNotificationsForClient
);

router.get('/exchange-rates', authMiddleware, clientController.getExchangeRates);


module.exports = router;