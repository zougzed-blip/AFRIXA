const mongoose = require("mongoose");

// ==================== DESTINATION SCHEMA ====================
const destinationSchema = new mongoose.Schema({
  villeDepart: { type: String, required: true },
  villeArrivee: { type: String, required: true },
  prix: { type: Number, required: true },
  delai: { type: Number, default: 0 },
  unite: { type: String, default: 'colis' }
});

// ==================== TARIF SCHEMA ====================
const tarifSchema = new mongoose.Schema({
  destination: String,
  prix: Number,
  delai: Number,
  unite: { type: String, default: "colis" },
});

// ==================== LOCATION SCHEMA (pour agence) ====================
const locationSchema = new mongoose.Schema({
  pays: { type: String, required: true },
  ville: { type: String, required: true },
  adresse: { type: String, default: "" },
  telephone: { type: String, default: "" }
});

// ==================== USER SCHEMA ====================
const userSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true, 
      trim: true 
    },
    
    password: { 
      type: String, 
      required: true 
    },
    
    role: {         
      type: String,      
      enum: ["client", "agence", "admin"],
      required: true
    },

    isVerified: { 
      type: Boolean, 
      default: false 
    },
    
    // ==================== CLIENT ====================
    client: {
      fullName: String,
      telephone: String,
      adresse: String,
      photo: String,        
    },

    // ==================== AGENCE ====================
    agence: {
      agenceName: String,
      responsable: String,
      telephone: String,
      adresse: String,
      pays: { type: String, default: "RDC" },
      locations: [locationSchema],
      destinations: [String],
      tarifs: [tarifSchema], 
      services: [String],
      horaires: String,
      numeroAgrement: String,
      typesColis: [String],
      logo: String,
      document: String,
    },

    // ==================== PASSWORD RESET ====================
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    lastLogin: { type: Date },

  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

userSchema.index({ role: 1, isVerified: 1 });

userSchema.index({ resetPasswordToken: 1 }, { 
  sparse: true,
  unique: false 
});
userSchema.index({ "agence.agenceName": "text", "agence.pays": 1 });

// ==================== VIRTUELS/METHODS UTILES ====================
userSchema.virtual('displayName').get(function() {
  if (this.role === 'client' && this.client && this.client.fullName) {
    return this.client.fullName;
  }
  if (this.role === 'agence' && this.agence && this.agence.agenceName) {
    return this.agence.agenceName;
  }
  return this.email;
});

userSchema.virtual('phoneNumber').get(function() {
  if (this.role === 'client' && this.client && this.client.telephone) {
    return this.client.telephone;
  }
  if (this.role === 'agence' && this.agence && this.agence.telephone) {
    return this.agence.telephone;
  }
  return null;
});

// ==================== MIDDLEWARE ====================
userSchema.pre('save', function(next) {

  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  
  if (this.isModified('lastLogin')) {
    this.lastLogin = new Date();
  }
  
  next();
});

module.exports = mongoose.model("User", userSchema);