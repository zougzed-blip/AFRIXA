const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authenticationMiddlware');
const notificationController = require('../Controllers/notificationController');

router.get("/notifications", authMiddleware, notificationController.getNotifications);
router.post("/notifications", authMiddleware, notificationController.addNotification);
router.patch("/notifications/:id/read", authMiddleware, notificationController.markAsRead);
router.delete("/notifications/:id", authMiddleware, notificationController.deleteNotification);

module.exports = router;