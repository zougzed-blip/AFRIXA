const express = require('express');
const router = express.Router();
const agenceController = require('../Controllers/agenceController');
const authMiddleware = require('../Middleware/authenticationMiddlware');
const { roleMiddleware } = require('../Middleware/RoleMiddlware');
const profileController = require('../Controllers/userProfileController');
const { validateMongoId } = require('../Middleware/validationMiddleware'); // Ajout
const { body } = require('express-validator');
const { validate } = require('../Middleware/validationMiddleware');
const mongoose = require('mongoose');

const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'ID invalide' });
  }
  next();
}

const validateDemandeStatus = [
  body('status').isIn(['en_attente', 'accepté', 'en_cours', 'livré', 'annulé']),
  validate
];

router.use(authMiddleware);
router.use(roleMiddleware('agence'));

router.get('/agence/demandes', agenceController.listDemandes);
router.get('/agence/demandes/:id', 
  validateObjectId, 
  validateMongoId, 
  agenceController.getDemandeById
);

router.patch('/agence/demandes/:id/status', 
  validateObjectId, 
  validateMongoId, 
  validateDemandeStatus, 
  agenceController.updateDemandeStatus
);

router.put('/agence/demandes/:id/adjust-prix', 
  validateObjectId, 
  validateMongoId,
  agenceController.adjustWeightDemande
);

router.put('/agence/demandes/:id/complete', 
  validateObjectId, 
  validateMongoId, 
  agenceController.updateDemandeComplete
);

router.get('/agence/paiements', agenceController.listPaiements);
router.get('/agence/paiements/:id', 
  validateObjectId, 
  validateMongoId, 
  agenceController.getPaiementById
);

router.put('/agence/paiements/:id/status', 
  validateObjectId, 
  validateMongoId, 
  agenceController.updatePaiementStatus
);

router.get('/agence/notifications', agenceController.listNotifications);
router.get('/agence/notifications/unread', agenceController.getUnreadNotifications);

router.patch('/agence/notifications/:id/read', 
  validateObjectId, 
  validateMongoId, 
  agenceController.markNotificationAsRead
);

router.patch('/agence/notifications/mark-all-read', agenceController.markAllNotificationsAsRead);

router.get('/agence/historique', agenceController.listHistorique);
router.get('/agence/profile', profileController.getAgenceProfile);
router.put('/agence/update-profile', profileController.updateAgenceProfile);
router.delete('/agence/delete-tarif', profileController.deleteAgenceDestination);

module.exports = router;