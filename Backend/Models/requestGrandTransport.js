
const mongoose = require('mongoose');

const requestTransportSchema = new mongoose.Schema({
    userId : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transporteurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    typeTransport : { type: String, enum: ['grand_transporteur'], required: true }, 
    nom: { type: String, required: true },
    email: { type: String, required: true },
    telephone: { type: String, required: true },
    ville: { type: String, required: true },
    commune: { type: String, required: true },
    adress:{type: String, required: true},
    villeDepart: { type: String, required: true },
    villeArrivee: { type: String, required: true },
    poidsVolume: { type: String, required: true },
    typeMarchandise: { type: String, required: true },
    typeCamion: { type: String, required: true },
    photoColis: { type: String },
    description: { type: String, required: true},
    codeColis: { type: String, unique: true, default: function() {
        return 'AFRIXA-' + Math.floor(10000 + Math.random() * 90000);
    }},
    status: { 
        type: String, 
        enum: [
            'en_attente',          
            'accepté_par_client',   
            'refusé_par_client',    
            'en_cours',             
            'livré',
            'refusé'                 
        ], 
        default: 'en_attente' 
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    paymentStatus: { type: String, enum: ["payé", "non_payé"], default: "non_payé" },
    date: { type: Date, default: Date.now }
},{ timestamps: true })

module.exports = mongoose.model('RequestTransport', requestTransportSchema);