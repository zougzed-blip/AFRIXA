const mongoose = require("mongoose");

const paymentProofSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  clientName: { 
    type: String,
    required: true
  },
  codeColis: {
    type: String,
    required: true
  },
  montant: {
    type: Number,
    required: true
  },
  devise: {
    type: String,
    enum: ['USD', 'ZAR', 'FC'],
    default: 'USD'
  },
  proofUrl: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("PaymentProof", paymentProofSchema);