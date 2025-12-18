const express = require('express')
const authMiddleware = require('../Middleware/authenticationMiddlware')
const Notification = require('../Models/NotificationModel')
const router = express.Router()

// ==================== GET NOTIFICATIONS ====================
router.get("/notifications", authMiddleware, async (req, res) => {
    try {
        console.log("📥 GET /notifications - User ID:", req.user.id);
        
        const notifications = await Notification.find({ 
            userId: req.user.id 
        }).sort({ date: -1 });
        
        console.log(`✅ ${notifications.length} notifications trouvées`);
        
        res.json({
            success: true,
            notifications: notifications.map(n => ({
                id: n._id,
                message: n.message,
                type: n.type,
                date: n.date,
                isRead: n.isRead,
                data: n.data
            }))
        });
    } catch (error) {
        console.error("❌ Erreur GET notifications:", error);
        res.status(500).json({ 
            success: false, 
            message: "Erreur lors de la récupération des notifications" 
        });
    }
});

// ==================== ADD NOTIFICATION ====================
router.post("/notifications", authMiddleware, async (req, res) => {
    try {
        const { message, type = "info", data } = req.body;
        
        console.log("📤 POST /notifications - User ID:", req.user.id);

        const notif = await Notification.create({
            userId: req.user.id,
            message,
            type,
            data
        });

        console.log("✅ Notification créée:", notif._id);

        res.json({
            success: true,
            message: "Notification ajoutée",
            notification: {
                id: notif._id,
                message: notif.message,
                type: notif.type,
                date: notif.date,
                isRead: notif.isRead,
                data: notif.data
            }
        });

    } catch (err) {
        console.error("❌ Erreur POST notifications:", err);
        res.status(500).json({
            success: false,
            message: "Erreur serveur"
        });
    }
});

// ==================== MARK AS READ ====================
router.patch("/notifications/:id/read", authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification non trouvée"
            });
        }

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error("❌ Erreur PATCH notification:", error);
        res.status(500).json({
            success: false,
            message: "Erreur serveur"
        });
    }
});

// ==================== DELETE NOTIFICATION ====================
router.delete("/notifications/:id", authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification non trouvée"
            });
        }

        res.json({
            success: true,
            message: "Notification supprimée"
        });
    } catch (error) {
        console.error("❌ Erreur DELETE notification:", error);
        res.status(500).json({
            success: false,
            message: "Erreur serveur"
        });
    }
});

module.exports = router