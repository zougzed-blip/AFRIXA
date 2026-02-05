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
const getDemandeByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

const updateDemandeStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    status: statusSchema,
    reason: z.string()
      .max(500, { message: "La raison ne peut pas dépasser 500 caractères" })
      .optional(),
    adjustedWeight: z.string()
      .max(50, { message: "Le poids ajusté est trop long" })
      .optional()
  })
});

const adjustWeightDemandeSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    poidsReel: z.string()
      .min(1, { message: "Le poids réel est requis" })
      .max(50, { message: "Le poids réel est trop long" }),
    motif: z.string()
      .max(500, { message: "Le motif ne peut pas dépasser 500 caractères" })
      .optional(),
    noteInterne: z.string()
      .max(1000, { message: "La note interne ne peut pas dépasser 1000 caractères" })
      .optional()
  })
});

const updateDemandeCompleteSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    status: statusSchema.optional(),
    prix: z.number()
      .positive({ message: "Le prix doit être positif" })
      .max(1000000, { message: "Le prix est trop élevé" })
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
const getPaiementByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

const updatePaiementStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    statut: paymentStatusSchema
  })
});

// ==================== NOTIFICATION VALIDATION ====================
const markNotificationAsReadSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

// ==================== PROFIL VALIDATION ====================
const updateProfileSchema = z.object({
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
      .optional(),
    
    agenceName: z.string()
      .min(2, { message: "Le nom de l'agence doit contenir au moins 2 caractères" })
      .max(100, { message: "Le nom de l'agence est trop long" })
      .optional(),
    
    responsable: z.string()
      .max(100, { message: "Le nom du responsable est trop long" })
      .optional(),
    
    pays: z.string()
      .max(50, { message: "Le pays est trop long" })
      .optional(),
    
    horaires: z.string()
      .max(100, { message: "Les horaires sont trop longs" })
      .optional(),
    
    numeroAgrement: z.string()
      .max(50, { message: "Le numéro d'agrément est trop long" })
      .optional()
  })
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

module.exports = {
  // Demande
  getDemandeByIdSchema,
  updateDemandeStatusSchema,
  adjustWeightDemandeSchema,
  updateDemandeCompleteSchema,
  
  // Paiement
  getPaiementByIdSchema,
  updatePaiementStatusSchema,
  
  // Notification
  markNotificationAsReadSchema,
  
  // Profile
  updateProfileSchema,  
  
  // Query
  paginationQuerySchema
};