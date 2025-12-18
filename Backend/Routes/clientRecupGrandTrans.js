const express = require('express')
const router = express.Router()
const grandTransporteurController = require('../Controllers/grandTransController');
const authMiddleware = require('../Middleware/authenticationMiddlware');
const { roleMiddleware } = require('../Middleware/RoleMiddlware');

router.use(authMiddleware);
router.use(roleMiddleware('grand_transporteur'));


router.get('/grandTransportfetch/requests', grandTransporteurController.listRequests);
router.get('/grandTransportfetch/requests/counts', grandTransporteurController.getCounts);
router.get('/grandTransportfetch/request/:id', grandTransporteurController.getRequestById);

router.get('/grandTransportfetch/dashboard-stats', grandTransporteurController.getDashboardStats);

module.exports = router