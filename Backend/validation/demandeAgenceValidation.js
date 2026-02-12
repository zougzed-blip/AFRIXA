const { z } = require('zod');

// ==================== SCHEMAS DE BASE ====================
const objectIdSchema = z.string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "ID invalide" });

const ratingSchema = z.number()
  .min(1, { message: "La note doit être au moins 1" })
  .max(5, { message: "La note ne peut pas dépasser 5" });

const phoneSchema = z.string()
  .regex(/^[+]?[\d\s\-()]{8,}$/, { message: "Numéro de téléphone invalide" });

// ==================== PROFILE VALIDATION ====================
const updateProfileSchema = z.object({
  body: z.object({
    email: z.string()
      .email({ message: "Format d'email invalide" })
      .optional(),
    
    fullName: z.string()
      .min(2, { message: "Le nom complet doit contenir au moins 2 caractères" })
      .max(100, { message: "Le nom complet est trop long" })
      .optional(),
    
    telephone: phoneSchema.optional(),
    
    adresse: z.string()
      .max(200, { message: "L'adresse est trop longue" })
      .optional(),
    
    photoUrl: z.string()
      .url({ message: "URL de photo invalide" })
      .optional()
  })
});

// ==================== REQUEST VALIDATION ====================
const getRequestDetailsSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

const getOffersByRequestSchema = z.object({
  params: z.object({
    requestId: objectIdSchema
  })
});

// ==================== OFFER VALIDATION ====================
const acceptRejectOfferSchema = z.object({
  params: z.object({
    offerId: objectIdSchema
  })
});


// ==================== AGENCE REQUEST VALIDATION ====================
const createDemandeAgenceSchema = z.object({
  body: z.object({
    fullName: z.string()
      .min(2, { message: "Le nom complet doit contenir au moins 2 caractères" })
      .max(100, { message: "Le nom complet est trop long" }),

    receveur: z.string()
      .min(2, { message: "Le nom complet doit contenir au moins 2 caractères" })
      .max(100, { message: "Le nom complet est trop long" }),  
    
    email: z.string()
      .email({ message: "Format d'email invalide" }),
    
    telephone: phoneSchema,
    
    destination: z.string()
      .min(2, { message: "La destination doit contenir au moins 2 caractères" })
      .max(100, { message: "La destination est trop longue" }),
    
    typeColis: z.string()
      .min(2, { message: "Le type de colis doit contenir au moins 2 caractères" })
      .max(50, { message: "Le type de colis est trop long" }),
    
    poidOuTaille: z.string()
      .min(1, { message: "Le poids/taille est requis" })
      .max(50, { message: "Le poids/taille est trop long" }),
    
    description: z.string()
      .max(500, { message: "La description ne peut pas dépasser 500 caractères" })
      .optional()
  })
});

// ==================== RATING VALIDATION ====================
const rateRequestSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    rating: ratingSchema
  })
});

const rateAgenceRequestSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    rating: ratingSchema
  })
});

const ratePetitTransportRequestSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    rating: ratingSchema
  })
});

// ==================== QUERY VALIDATION ====================
const getRequestByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

const getAgenceRequestByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});


const checkForUpdatesSchema = z.object({
  query: z.object({
    lastCheck: z.string()
      .datetime({ message: "Format de date invalide" })
      .optional()
  })
});

const getAgenceUpdatesSchema = z.object({
  query: z.object({
    lastCheck: z.string()
      .datetime({ message: "Format de date invalide" })
      .optional()
  })
});

// ==================== PAGINATION QUERY ====================
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

  updateProfileSchema,
  
  getRequestDetailsSchema,
  getOffersByRequestSchema,
  createDemandeAgenceSchema,
  
  acceptRejectOfferSchema,
  
  rateRequestSchema,
  rateAgenceRequestSchema,
  ratePetitTransportRequestSchema,
  
  getRequestByIdSchema,
  getAgenceRequestByIdSchema,
  checkForUpdatesSchema,
  getAgenceUpdatesSchema,
  paginationQuerySchema
};