const { z } = require('zod');

// ==================== SCHEMAS DE BASE ====================
const objectIdSchema = z.string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "ID invalide" });

const phoneSchema = z.string()
  .regex(/^[+]?[\d\s\-()]{8,}$/, { message: "Numéro de téléphone invalide" })
  .optional()
  .or(z.literal(''));

// ==================== GRAND TRANSPORTEUR VALIDATION ====================
const updateGrandTransporteurProfileSchema = z.object({
  body: z.object({
    entrepriseName: z.string()
      .min(2, { message: "Le nom de l'entreprise doit contenir au moins 2 caractères" })
      .max(100, { message: "Le nom de l'entreprise est trop long" })
      .optional(),
    
    responsable: z.string()
      .max(100, { message: "Le nom du responsable est trop long" })
      .optional(),
    
    telephone: phoneSchema,
    
    adresse: z.string()
      .max(200, { message: "L'adresse est trop longue" })
      .optional(),
    
    typeCamion: z.union([z.string(), z.array(z.string())])
      .transform(val => Array.isArray(val) ? val : val ? val.split(',') : [])
      .optional(),
    
    destinations: z.union([z.string(), z.array(z.string())])
      .transform(val => Array.isArray(val) ? val : val ? val.split(',') : [])
      .optional(),
    
    prixParKilo: z.union([z.string(), z.number()])
      .transform(val => parseFloat(val))
      .refine(val => val >= 0, { message: "Le prix par kilo ne peut pas être négatif" })
      .refine(val => val <= 100000, { message: "Le prix par kilo est trop élevé" })
      .optional(),
    
    capacite: z.union([z.string(), z.number()])
      .transform(val => parseFloat(val))
      .refine(val => val >= 0, { message: "La capacité ne peut pas être négative" })
      .refine(val => val <= 1000, { message: "La capacité est trop élevée" })
      .optional(),
    
    provinces: z.union([z.string(), z.array(z.string())])
      .transform(val => Array.isArray(val) ? val : val ? val.split(',') : [])
      .optional(),
    
    photoUrl: z.string()
      .url({ message: "URL de photo invalide" })
      .optional()
  })
});

const addTrajetSchema = z.object({
  body: z.object({
    destination: z.string()
      .min(2, { message: "La destination doit contenir au moins 2 caractères" })
      .max(100, { message: "La destination est trop longue" }),
    
    prix: z.union([z.string(), z.number()])
      .transform(val => parseFloat(val))
      .refine(val => val > 0, { message: "Le prix doit être positif" })
      .refine(val => val <= 1000000, { message: "Le prix est trop élevé" }),
    
    delai: z.union([z.string(), z.number()])
      .transform(val => parseFloat(val))
      .refine(val => val >= 0, { message: "Le délai ne peut pas être négatif" })
      .refine(val => val <= 365, { message: "Le délai ne peut pas dépasser 365 jours" }),
    
    unite: z.enum(['colis', 'kg', 'm3', 'jour'], {
      message: "Unité invalide. Valeurs autorisées: colis, kg, m3, jour"
    }).default('colis')
  })
});

const deleteTrajetSchema = z.object({
  params: z.object({
    index: z.string()
      .regex(/^\d+$/, { message: "L'index doit être un nombre" })
      .transform(Number)
      .refine(val => val >= 0, { message: "L'index ne peut pas être négatif" })
  })
});

// ==================== AGENCE VALIDATION ====================
const updateAgenceProfileSchema = z.object({
  body: z.object({
    agenceName: z.string()
      .min(2, { message: "Le nom de l'agence doit contenir au moins 2 caractères" })
      .max(100, { message: "Le nom de l'agence est trop long" })
      .optional(),
    
    responsable: z.string()
      .max(100, { message: "Le nom du responsable est trop long" })
      .optional(),
    
    telephone: phoneSchema,
    
    adresse: z.string()
      .max(200, { message: "L'adresse est trop longue" })
      .optional(),
    
    pays: z.string()
      .max(50, { message: "Le pays est trop long" })
      .optional(),
    
    numeroAgrement: z.string()
      .max(50, { message: "Le numéro d'agrément est trop long" })
      .optional(),
    
    services: z.union([z.string(), z.array(z.string())])
      .transform(val => Array.isArray(val) ? val : val ? val.split(',') : [])
      .optional(),
    
    typesColis: z.union([z.string(), z.array(z.string())])
      .transform(val => Array.isArray(val) ? val : val ? val.split(',') : [])
      .optional(),
    
    destinations: z.union([z.string(), z.array(z.string())])
      .transform(val => Array.isArray(val) ? val : val ? val.split(',') : [])
      .optional(),
    
    tarifs: z.union([z.string(), z.array(z.any())])
      .transform(val => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        }
        return Array.isArray(val) ? val : [];
      })
      .refine(val => Array.isArray(val), { message: "Les tarifs doivent être un tableau" })
      .optional(),
    
    locations: z.union([z.string(), z.array(z.any())])
      .transform(val => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        }
        return Array.isArray(val) ? val : [];
      })
      .refine(val => Array.isArray(val), { message: "Les locations doivent être un tableau" })
      .optional(),
    
    horaires: z.string()
      .max(200, { message: "Les horaires sont trop longs" })
      .optional()
  })
});

const deleteAgenceDestinationSchema = z.object({
  body: z.object({
    index: z.union([z.string(), z.number()])
      .transform(val => Number(val))
      .refine(val => !isNaN(val), { message: "L'index doit être un nombre" })
      .refine(val => val >= 0, { message: "L'index ne peut pas être négatif" })
  })
});

module.exports = {
  // Grand Transporteur
  updateGrandTransporteurProfileSchema,
  addTrajetSchema,
  deleteTrajetSchema,
  
  // Agence
  updateAgenceProfileSchema,
  deleteAgenceDestinationSchema
};