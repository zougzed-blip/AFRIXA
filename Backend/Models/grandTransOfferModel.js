const mongoose = require('mongoose');

const grandTransportOfferSchema = new mongoose.Schema({
    demandeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RequestTransport', required: true },
    transporteurId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    montantPropose: { type: Number, required: true },
    delaiPropose: { type: String, required: true },

    jourDisponible: { type: String, required: true },
    heureDisponible: { type: String, required: true },

    couleurCamion: { type: String, required: true },
    plaqueImmatriculation: { type: String, required: true },

    description: { type: String },

    status: { 
        type: String, 
        enum: [
            "en_attente", 
            "accepté_par_client", 
            "refusé_par_client",
            "en_cours",    
            "livré"          
        ], 
        default: "en_attente" 
    },

    dateEnvoi: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GrandTransportOffer", grandTransportOfferSchema);