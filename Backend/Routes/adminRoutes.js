const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authenticationMiddlware');
const adminMiddleware = require('../Middleware/administrationMiddleware');
const adminController = require('../Controllers/adminController');
const adminAgenceController = require('../Controllers/adminAgenceController');
const { upload, handleMulterError } = require('../Middleware/fileValidation');
const { body } = require('express-validator');
const { validate } = require('../Middleware/validationMiddleware');
const { validateMongoId, validateSearch } = require('../Middleware/validationMiddleware');
const mongoose = require('mongoose');

const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'ID invalide' });
  }
  next();
}

router.get('/dashboard', authMiddleware, adminMiddleware, adminController.getDashboardStats);
router.get('/notifications', authMiddleware, adminMiddleware, adminController.getNotifications);
router.get('/notifications/count', authMiddleware, adminMiddleware, adminController.getNotificationsCount);
router.post('/notifications/:id/read', authMiddleware, adminMiddleware, adminController.markNotificationAsRead);
router.post('/notifications/mark-all-read', authMiddleware, adminMiddleware, adminController.markAllNotificationsAsRead);
router.get('/profile', authMiddleware, adminMiddleware, adminController.getAdminProfile);

router.get('/activities', authMiddleware, adminMiddleware, adminController.getActivities);
router.get('/companies/pending', authMiddleware, adminMiddleware, adminController.getPendingCompanies);

router.get('/users', authMiddleware, adminMiddleware, adminController.getAllUsers);
router.get('/users/:id', authMiddleware, adminMiddleware, validateObjectId, adminController.getUserById);
router.post('/companies/:id/validate', authMiddleware, adminMiddleware, adminController.validateCompany);
router.post('/users/:id/toggle-status', authMiddleware, adminMiddleware, adminController.toggleUserStatus);
router.put('/verify-user/:id', authMiddleware, adminMiddleware, adminController.verifyUser);
router.get('/payment-proofs', authMiddleware, adminMiddleware, adminController.getAllPaymentProofs);

router.get('/payment-proofs/new-count', authMiddleware, adminMiddleware, adminController.getNewPaymentProofsCount);
router.get('/payment-proofs/:id/view', authMiddleware, adminMiddleware, adminController.viewPaymentProof);

router.get('/companies/for-proof', authMiddleware, adminMiddleware, adminController.getCompaniesForProof);
router.post('/send-proof', authMiddleware, adminMiddleware,  adminController.sendProofToCompany);


router.get('/agence/demandes', authMiddleware, adminMiddleware, validateSearch, adminAgenceController.adminListDemandes);
router.get('/agence/demandes/:id', authMiddleware, adminMiddleware, validateMongoId, adminAgenceController.adminGetDemandeById);
router.put('/agence/demandes/:id/status', authMiddleware, adminMiddleware, validateMongoId,
  body('status').isIn(['en_attente', 'accepté', 'en_cours', 'livré', 'annulé']),
  validate, adminAgenceController.adminUpdateDemandeStatus);

router.put('/agence/demandes/:id/adjust-weight', authMiddleware, adminMiddleware, adminAgenceController.adminAdjustWeightDemande);
router.put('/agence/demandes/:id/complete', authMiddleware, adminMiddleware, adminAgenceController.adminUpdateDemandeComplete);

router.get('/agence/paiements', authMiddleware, adminMiddleware, adminAgenceController.adminListPaiements);
router.get('/agence/paiements/:id', authMiddleware, adminMiddleware, adminAgenceController.adminGetPaiementById);
router.put('/agence/paiements/:id/status', authMiddleware, adminMiddleware, adminAgenceController.adminUpdatePaiementStatus);

router.put('/payment-proofs/:id/status', authMiddleware, adminMiddleware, adminController.updatePaymentProofStatus);

router.get('/agence/historique', authMiddleware, adminMiddleware, adminAgenceController.adminListHistorique);

router.get('/agence/stats', authMiddleware, adminMiddleware, adminAgenceController.adminGetStats);
router.get('/agence/dashboard/revenue', authMiddleware, adminMiddleware, adminAgenceController.adminGetRevenueStats);

router.get('/agence/dashboard', authMiddleware, adminMiddleware, adminAgenceController.adminGetDashboardData2);

router.get('/agence/dashboard/revenue', authMiddleware, adminMiddleware, adminAgenceController.adminGetRevenueStats);
router.get('/agence/all-ratings', authMiddleware, adminMiddleware, adminAgenceController.adminGetAllAgenceRatings);
router.get('/agence/ratings', authMiddleware, adminMiddleware);

router.get('/agence/notifications', authMiddleware, adminMiddleware, adminAgenceController.adminListNotifications);
router.get('/agence/notifications/unread', authMiddleware, adminMiddleware, adminAgenceController.adminGetUnreadNotifications);
router.put('/agence/notifications/:id/read', authMiddleware, adminMiddleware, adminAgenceController.adminMarkNotificationAsRead);
router.put('/agence/notifications/mark-all-read', authMiddleware, adminMiddleware, adminAgenceController.adminMarkAllNotificationsAsRead);

router.put('/agence/profile', authMiddleware, adminMiddleware, adminAgenceController.adminUpdateProfile);

module.exports = router;  