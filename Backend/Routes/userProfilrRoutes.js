const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authenticationMiddlware');
const { roleMiddleware } = require('../Middleware/RoleMiddlware');
const userProfileController = require('../Controllers/userProfileController');
const { upload, uploadMiddlewareRegister } = require('../Middleware/uploadMiddlwareRegiste');


router.get('/user/profile', authMiddleware, userProfileController.getUserProfile);
router.put('/user/profile/grand-transporteur', 
    authMiddleware, 
    roleMiddleware('grand_transporteur'), 
    upload.single('avatar'), 
    uploadMiddlewareRegister,
    userProfileController.updateGrandTransporteurProfile
);
router.post('/user/profile/trajet', 
    authMiddleware, 
    roleMiddleware('grand_transporteur'), 
    userProfileController.addTrajet
);
router.delete('/user/profile/trajet/:index', 
    authMiddleware, 
    roleMiddleware('grand_transporteur'), 
    userProfileController.deleteTrajet
);

module.exports = router;