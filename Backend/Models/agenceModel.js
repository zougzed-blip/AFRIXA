const mongoose = require('mongoose');

const DemandeAgenceSchemaV2 = new mongoose.Schema({
  fullName: { type: String, trim: true, required: true },
  email: { type: String, trim: true, required: true },
  telephone: { type: String, trim: true, required: true },
  receveur: { type: String, trim: true, required: true },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  agence: {
    
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  typeColis: { type: String, trim: true, required: true },
  poidOuTaille: { type: String, trim: true, required: true },
  
  destination: { type: String, required: true },
  prix: { type: Number, required: true },
  prixAjuste: { type: Number }, 
  poidsVolumeAjuste: { type: String }, 
  
  delai: { type: Number, required: true },
  description: { type: String, trim: true },
  photoduColis: { type: String },

  status: {
    type: String,
    enum: ['en_attente', 'accepté', 'en_cours', 'livré', 'annulé'],
    default: 'en_attente'
  },

  codeColis: { 
    type: String, 
    unique: true, 
    default: function() {
      return 'AGENCE-' + Math.floor(10000 + Math.random() * 90000);
    }
  },
rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('DemandeAgenceV2', DemandeAgenceSchemaV2);