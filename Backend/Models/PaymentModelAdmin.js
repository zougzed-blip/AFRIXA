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
    }
}, { timestamps: true });

module.exports = mongoose.model('PaymentProof', paymentProofSchema);