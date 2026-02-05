const { z } = require('zod');


const createPaymentProofSchema = z.object({
  body: z.object({
    user: z.string().min(1, { message: "L'ID utilisateur est requis" })
      .regex(/^[0-9a-fA-F]{24}$/, { message: "ID utilisateur invalide" }),
    
    codeColis: z.string()
      .min(3, { message: "Le code colis doit contenir au moins 3 caractères" })
      .max(50, { message: "Le code colis est trop long" }),
    
    clientName: z.string()
      .min(2, { message: "Le nom du client doit contenir au moins 2 caractères" })
      .max(100, { message: "Le nom du client est trop long" })
      .regex(/^[a-zA-Z\s\-']+$/, { message: "Le nom ne peut contenir que des lettres" }),
    
    montant: z.number()
      .positive({ message: "Le montant doit être positif" })
      .max(1000000, { message: "Le montant est trop élevé" }),
    
    devise: z.enum(['FC', 'ZAR', 'USD'], {
      message: "Devise invalide. Choisissez entre: FC, ZAR, USD"
    }).default('FC'),
    
    method: z.enum(['agencemethod', 'mpsa', 'orange', 'bank'], {
      message: "Méthode de paiement invalide"
    }).default('agencemethod'),
    

    proofUrl: z.string()
      .url({ message: "URL de la preuve invalide" })
      .min(1, { message: "L'URL de la preuve est requise" }),
    
    uploadedBy: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: "ID uploader invalide" })
      .optional(),
    
    status: z.enum(['en_attente', 'accepté', 'refusé'], {
      message: "Statut invalide"
    }).default('en_attente')
  })
});

const updatePaymentProofSchema = z.object({
  body: z.object({
    status: z.enum(['en_attente', 'accepté', 'refusé'], {
      message: "Statut invalide"
    }).optional(),
    
    montant: z.number()
      .positive({ message: "Le montant doit être positif" })
      .max(1000000, { message: "Le montant est trop élevé" })
      .optional(),
    
    devise: z.enum(['FC', 'ZAR', 'USD'], {
      message: "Devise invalide"
    }).optional(),
    
    method: z.enum(['agencemethod', 'mpsa', 'orange', 'bank'], {
      message: "Méthode de paiement invalide"
    }).optional()
  }),
  
  params: z.object({
    id: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: "ID de preuve de paiement invalide" })
  })
});

// ==================== QUERY VALIDATION ====================
const paymentProofQuerySchema = z.object({
  query: z.object({
    status: z.enum(['en_attente', 'accepté', 'refusé']).optional(),
    user: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: "ID utilisateur invalide" })
      .optional(),
    method: z.enum(['agencemethod', 'mpsa', 'orange', 'bank']).optional(),
    startDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format de date invalide (YYYY-MM-DD)" })
      .optional(),
    endDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format de date invalide (YYYY-MM-DD)" })
      .optional(),
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

// ==================== PAYMENT PROOF UPLOAD VALIDATION ====================
const uploadPaymentProofSchema = z.object({
  body: z.object({
    clientName: z.string()
      .min(2, { message: "Le nom du client doit contenir au moins 2 caractères" })
      .max(100, { message: "Le nom du client est trop long" })
      .regex(/^[a-zA-Z\s\-']+$/, { message: "Le nom ne peut contenir que des lettres" }),
    
    codeColis: z.string()
      .min(3, { message: "Le code colis doit contenir au moins 3 caractères" })
      .max(50, { message: "Le code colis est trop long" }),
    
    montant: z.union([z.string(), z.number()])
      .transform(val => parseFloat(val))
      .refine(val => val >= 0, { message: "Le montant ne peut pas être négatif" })
      .refine(val => val <= 1000000, { message: "Le montant est trop élevé" })
      .optional()
      .default(0),
    
    devise: z.enum(['FC', 'ZAR', 'USD'], {
      message: "Devise invalide. Valeurs autorisées: FC, ZAR, USD"
    }).default('FC'),
    
    paymentMethod: z.enum(['agencemethod', 'mpsa', 'orange', 'bank'], {
      message: "Méthode de paiement invalide"
    }).optional(),
    
    method: z.enum(['agencemethod', 'mpsa', 'orange', 'bank'], {
      message: "Méthode de paiement invalide"
    }).optional()
  }).refine(data => {
    
    if (!data.paymentMethod && !data.method) {
      return false;
    }
    return true;
  }, {
    message: "La méthode de paiement est requise",
    path: ["paymentMethod"]
  })
});




module.exports = {
  createPaymentProofSchema,
  updatePaymentProofSchema,
  paymentProofQuerySchema,
  uploadPaymentProofSchema
};