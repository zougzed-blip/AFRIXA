const crypto = require('crypto');
const { businessLogger } = require('./logger');

const envValidator = {
  required: {
    MONGO_URI: 'URI MongoDB',
    JWT_SECRET: 'Secret JWT (min 32 chars)',
    SESSION_SECRET: 'Secret Session (min 32 chars)',
    COOKIE_SECRET: 'Secret Cookie (min 32 chars)',
    CLOUDINARY_CLOUD_NAME: 'Nom Cloudinary',
    CLOUDINARY_API_KEY: 'Clé API Cloudinary',
    CLOUDINARY_API_SECRET: 'Secret Cloudinary'
  },
  
  validate() {
    const errors = [];
    
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production';
    }
    
    Object.entries(this.required).forEach(([key, desc]) => {
      if (!process.env[key]) {
        errors.push(`${key}: ${desc} manquant`); I
      }
    });
    
    if (process.env.NODE_ENV === 'production') {
      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET trop court');
      }
    }
    
    if (errors.length > 0) {
      console.error('ERREUR CONFIGURATION - Variables manquantes:');
      console.error(errors.join('\n'));
      process.exit(1);
    }
    
    console.log('Configuration validée avec succès');
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(' Mode développement');
    }
  }
};

module.exports = { validateEnv: () => envValidator.validate() };
