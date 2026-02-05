
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['demande', 'paiement', 'statut', 'prix_ajuste', 'offre', 'livraison', 'system', 'message'],
        default: 'system'
    },
    titre: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    utilisateurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lu: {
        type: Boolean,
        default: false
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);