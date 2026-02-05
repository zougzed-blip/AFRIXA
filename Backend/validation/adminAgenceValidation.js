const { z } = require('zod');

// ==================== SCHEMAS DE BASE ====================
const objectIdSchema = z.string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "ID invalide" });

const statusSchema = z.enum(['en_attente', 'accepté', 'en_cours', 'livré', 'annulé'], {
  message: "Statut invalide. Valeurs autorisées: en_attente, accepté, en_cours, livré, annulé"
});

const paymentStatusSchema = z.enum(['en_attente', 'accepté', 'refusé', 'payé', 'annulé'], {
  message: "Statut de paiement invalide"
});

// ==================== DEMANDE VALIDATION ====================
const adminGetDemandeByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

const adminUpdateDemandeStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    status: statusSchema,
    reason: z.string()
      .max(500, { message: "La raison ne peut pas dépasser 500 caractères" })
      .optional()
  })
});

const adminAdjustWeightDemandeSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    poidsReel: z.union([z.string(), z.number()])
      .transform(val => parseFloat(val))
      .refine(val => val > 0, { message: "Le poids réel doit être positif" })
      .refine(val => val <= 10000, { message: "Le poids est trop élevé" }),
    
    motif: z.string()
      .max(500, { message: "Le motif ne peut pas dépasser 500 caractères" })
      .optional(),
    
    noteInterne: z.string()
      .max(1000, { message: "La note interne ne peut pas dépasser 1000 caractères" })
      .optional()
  })
});

const adminUpdateDemandeCompleteSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    status: statusSchema.optional(),
    prix: z.union([z.string(), z.number()])
      .transform(val => parseFloat(val))
      .refine(val => val >= 0, { message: "Le prix ne peut pas être négatif" })
      .refine(val => val <= 1000000, { message: "Le prix est trop élevé" })
      .optional(),
    
    delai: z.string()
      .max(50, { message: "Le délai est trop long" })
      .optional(),
    
    noteInterne: z.string()
      .max(1000, { message: "La note interne ne peut pas dépasser 1000 caractères" })
      .optional(),
    
    reason: z.string()
      .max(500, { message: "La raison ne peut pas dépasser 500 caractères" })
      .optional()
  })
});

// ==================== PAIEMENT VALIDATION ====================
const adminGetPaiementByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

const adminUpdatePaiementStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    statut: paymentStatusSchema
  })
});

// ==================== NOTIFICATION VALIDATION ====================
const adminMarkNotificationAsReadSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

// ==================== STATISTIQUES VALIDATION ====================
const adminGetRevenueStatsSchema = z.object({
  query: z.object({
    startDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)')
      .optional(),
    endDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)')
      .optional(),
    status: z.enum(['all', 'en_attente', 'accepté', 'refusé', 'payé', 'annulé'])
      .optional()
      .default('all'),
    currency: z.enum(['USD', 'FC', 'ZAR'])
      .optional()
      .default('USD')
  })
});

const adminGetFilteredDashboardDataSchema = z.object({
  query: z.object({
    startDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)')
      .optional(),
    
    endDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)')
      .optional(),
    
    status: z.string().optional(),
    
    currency: z.enum(['USD', 'FC', 'ZAR'])
      .optional()
      .default('USD')
  })
});

// ==================== PROFIL VALIDATION ====================
const adminUpdateProfileSchema = z.object({
  body: z.object({
    fullName: z.string()
      .min(2, { message: "Le nom complet doit contenir au moins 2 caractères" })
      .max(100, { message: "Le nom complet est trop long" })
      .optional(),
    
    email: z.string()
      .email({ message: "Format d'email invalide" })
      .optional(),
    
    telephone: z.string()
      .regex(/^[+]?[\d\s\-()]{8,}$/, { message: "Numéro de téléphone invalide" })
      .optional(),
    
    adresse: z.string()
      .max(200, { message: "L'adresse est trop longue" })
      .optional()
  })
});

// ==================== PAGINATION VALIDATION ====================
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

module.exports = {
  
  adminGetDemandeByIdSchema,
  adminUpdateDemandeStatusSchema,
  adminAdjustWeightDemandeSchema,
  adminUpdateDemandeCompleteSchema,
  
  adminGetPaiementByIdSchema,
  adminUpdatePaiementStatusSchema,

  adminMarkNotificationAsReadSchema,
  
  adminGetRevenueStatsSchema,
  adminGetFilteredDashboardDataSchema,

  adminUpdateProfileSchema,
  
  paginationQuerySchema
};