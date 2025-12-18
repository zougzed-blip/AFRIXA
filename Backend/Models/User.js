const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
  
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {         
      type: String,      
      enum: ["client", "petit_transporteur", "grand_transporteur", "agence", "admin"],
      required: true
    },

    isVerified: { type: Boolean, default: false },

    client: {
      fullName: String,
      telephone: String,
      adresse: String,
      photo: String,        
    },

    petitTransporteur: {
      fullName: String,
      telephone: String,
      adresse: String,
      vehicleType: [String],          
      destinations: [String],        
      tarifs: [
        {
          destination: String,
          prix: Number,
          delai: Number,
          unite: { type: String, default: "colis" },
        },
      ],
      typesColis: [String],           
      capacite: Number,
      experience: String,
      photo: String,                   
    },

   
    grandTransporteur: {
      entrepriseName: String,
      responsable: String,
      telephone: String,
      adresse: String,
      typeCamion: [String],            
      destinations: [String],          
      tarifs: [
        {
          destination: String,
          prix: Number,
          delai: Number,
          unite: { type: String, default: "colis" },
        },
      ],
      numeroRC: String,
      anneeCreation: Number,
      nombreCamions: Number,
      provinces: [String],            
      logo: String,
      document: String,
    },

    agence: {
      agenceName: String,
      responsable: String,
      telephone: String,
      adresse: String,
      pays: String,
      locations: [                  
        {
          pays: String,
          ville: String,
          adresse: String,
          telephone: String,
        }
      ],
      destinations: [String],
      tarifs: [
        {
          destination: String,
          prix: Number,
          delai: Number,
          unite: { type: String, default: "colis" },
        },
      ],
      services: [String],
      horaires: String,
      numeroAgrement: String,
      typesColis: [String],
      logo: String,
      document: String,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
