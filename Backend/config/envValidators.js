
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
      businessLogger.info('NODE_ENV forcé à production');
    }
    Object.entries(this.required).forEach(([key, desc]) => {
      if (!process.env[key]) {
        errors.push(`${key}: ${desc} manquant`);
      }
    });

    if (process.env.NODE_ENV === 'production') {
      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET trop court');
      }
    }

    if (errors.length > 0) {
      errors.forEach(err => businessLogger.error(err, { context: 'envValidator' }));
      
      businessLogger.error('Configuration .env invalide - Arrêt de l\'application', {
        missingVars: errors
      });
      
      process.exit(1);
    }

    businessLogger.info('Configuration .env validée avec succès', {
      env: process.env.NODE_ENV,
      port: process.env.PORT,
      hasMongo: !!process.env.MONGO_URI,
      hasCloudinary: !!process.env.CLOUDINARY_CLOUD_NAME
    });

    if (process.env.NODE_ENV !== 'production') {
      businessLogger.warning('Mode développement activé - Sécurité réduite');
    }
  }
};

module.exports = { validateEnv: () => envValidator.validate() };