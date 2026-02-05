const Notification = require('../Models/NotificationModel');

// ==================== GET NOTIFICATIONS ====================
exports.getNotifications = async (req, res) => {
    try {

        const notifications = await Notification.find({ 
            userId: req.user.id 
        }).sort({ date: -1 });
        
        console.log(`${notifications.length} notifications trouvées`);
        
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
        res.status(500).json({ 
            success: false, 
            message: "Erreur lors de la récupération des notifications" 
        });
    }
};

// ==================== ADD NOTIFICATION ====================
exports.addNotification = async (req, res) => {
    try {
        const { message, type = "info", data } = req.body;

        const notif = await Notification.create({
            userId: req.user.id,
            message,
            type,
            data
        });

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
        res.status(500).json({
            success: false,
            message: "Erreur serveur"
        });
    }
};

// ==================== MARK AS READ ====================
exports.markAsRead = async (req, res) => {
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
        res.status(500).json({
            success: false,
            message: "Erreur serveur"
        });
    }
}

// ==================== DELETE NOTIFICATION ====================
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        })

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification non trouvée"
            })
        }

        res.json({
            success: true,
            message: "Notification supprimée"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur serveur"
        })
    }
}