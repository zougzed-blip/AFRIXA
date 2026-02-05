const mongoose = require('mongoose');

const paymentProofSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    codeColis: {
        type: String,
        required: true
    },
    clientName: {
        type: String,
        required: true
    },
    montant: {
        type: Number,
        required: true
    },
    devise: {
        type: String,
        required: true,
        enum: ['USD', 'ZAR', 'FC'],
        default: 'USD'
    },
    method: {
        type: String,
        required: true,
        enum: ['agencemethod', 'mpsa', 'orange', 'bank'],
        default: 'agencemethod'
    },
    proofUrl: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    destinataireId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['en_attente', 'accepté', 'refusé'],
        default: 'en_attente'
    }
}, { timestamps: true });

module.exports = mongoose.model('PaymentProof', paymentProofSchema);