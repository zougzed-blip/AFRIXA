const { body, param, query, validationResult } = require('express-validator');
const mongoSanitize = require('express-mongo-sanitize');


const sanitizeInput = (req, res, next) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.params);
  mongoSanitize.sanitize(req.query);
  next();
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateDemandeAgence = [
  body('fullName').trim().escape().notEmpty().isLength({ max: 100 }),
  body('email').trim().normalizeEmail().isEmail(),
  body('telephone').trim().matches(/^[0-9+\-\s()]+$/),
  body('codeColis').trim().escape().notEmpty().isLength({ max: 50 }),
  body('destination').trim().escape().notEmpty(),
  body('poidOuTaille').isFloat({ min: 0 }),
  body('prix').optional().isFloat({ min: 0 }),
  validate
];

const validateMongoId = [
  param('id').isMongoId().withMessage('ID invalide'),
  validate
];


const validateSearch = [
  query('search').optional().trim().escape().isLength({ max: 100 }),
  query('status').optional().isIn(['en_attente', 'accepté', 'en_cours', 'livré', 'annulé']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate
];


const validatePriceAdjustment = [
  body('nouveauPrix').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  validate
];


const validateAgenceProfile = [
  body('nomAgence').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('telephone').optional().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Numéro de téléphone invalide'),
  validate
];


module.exports = {
  sanitizeInput,
  validate,
  validateDemandeAgence,
  validateMongoId,
  validateSearch,
  validatePriceAdjustment,
  validateAgenceProfile,
  
};