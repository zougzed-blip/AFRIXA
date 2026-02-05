const { z } = require('zod');

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const dataToValidate = {
        body: req.body,
        params: req.params,
        query: req.query
      };
      
      const result = schema.safeParse(dataToValidate);
      
      if (!result.success) {
        // Vérifier si errors existe avant d'utiliser map
        if (result.error && result.error.errors && Array.isArray(result.error.errors)) {
          const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }));
          
          return res.status(400).json({
            success: false,
            message: 'Validation échouée',
            errors
          });
        } else {
          // Si errors n'est pas disponible, retourner un message générique
          return res.status(400).json({
            success: false,
            message: 'Validation échouée',
            errors: [{ field: 'general', message: 'Données invalides' }]
          });
        }
      }
      
      req.validatedData = result.data;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation'
      });
    }
  };
};

module.exports = validateRequest;