const { z } = require('zod');

// ==================== SCHEMAS DE BASE ====================
const objectIdSchema = z.string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "ID invalide" });

const ratingSchema = z.number()
  .min(1, { message: "La note doit être au moins 1" })
  .max(5, { message: "La note ne peut pas dépasser 5" });

const phoneSchema = z.string()
  .regex(/^[+]?[\d\s\-()]{8,}$/, { message: "Numéro de téléphone invalide" })
  .optional()
  .or(z.literal(''));

const currencySchema = z.enum(['FC', 'ZAR', 'USD'], {
  message: "Devise invalide. Valeurs autorisées: FC, ZAR, USD"
});

const paymentMethodSchema = z.enum(['agencemethod', 'mpsa', 'orange', 'bank'], {
  message: "Méthode de paiement invalide"
});

const paymentStatusSchema = z.enum(['en_attente', 'accepté', 'refusé'], {
  message: "Statut de paiement invalide"
});

// ==================== QUERY VALIDATION ====================
const paginationQuerySchema = z.object({
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, { message: "Le numéro de page doit être un nombre" })
      .transform(Number)
      .default("1"),
    limit: z.string()
      .regex(/^\d+$/, { message: "La limite doit être un nombre" })
      .transform(Number)
      .default("10")
  })
});

const lastViewedQuerySchema = z.object({
  query: z.object({
    lastViewed: z.string()
      .datetime({ message: "Format de date invalide" })
      .optional()
  })
});

// ==================== USER VALIDATION ====================
const getUserByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

const validateCompanySchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    accept: z.boolean({ message: "La valeur accept doit être un booléen" })
  })
});

const toggleUserStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

const verifyUserSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

// ==================== TRANSPORT REQUEST VALIDATION ====================
const getRequestDetailsSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

const updatePaymentStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    paymentStatus: z.enum(['payé', 'non_payé'], {
      message: "Statut de paiement invalide. Valeurs autorisées: payé, non_payé"
    })
  })
});

// ==================== PAYMENT PROOF VALIDATION ====================
const viewPaymentProofSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

const updatePaymentProofStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    status: paymentStatusSchema
  })
});

const sendProofToCompanySchema = z.object({
  body: z.object({
    codeColis: z.string()
      .min(3, { message: "Le code colis doit contenir au moins 3 caractères" })
      .max(50, { message: "Le code colis est trop long" }),
    
    montant: z.union([z.string(), z.number()])
      .transform(val => parseFloat(val))
      .refine(val => val > 0, { message: "Le montant doit être positif" })
      .refine(val => val <= 1000000, { message: "Le montant est trop élevé" }),
    
    devise: currencySchema.default('FC'),
    
    method: paymentMethodSchema,
    
    destinataireId: objectIdSchema
  })
});

// ==================== OFFER VALIDATION ====================
const getOfferDetailsSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

// ==================== NOTIFICATION VALIDATION ====================
const markNotificationAsReadSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

module.exports = {
  // Query
  paginationQuerySchema,
  lastViewedQuerySchema,
  
  // User
  getUserByIdSchema,
  validateCompanySchema,
  toggleUserStatusSchema,
  verifyUserSchema,
  
  // Transport
  getRequestDetailsSchema,
  updatePaymentStatusSchema,
  
  // Payment Proof
  viewPaymentProofSchema,
  updatePaymentProofStatusSchema,
  sendProofToCompanySchema,
  
  // Offer
  getOfferDetailsSchema,
  
  // Notification
  markNotificationAsReadSchema
};