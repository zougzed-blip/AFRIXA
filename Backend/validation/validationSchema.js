const { z } = require('zod');

const emailSchema = z.string()
  .email({ message: "Format d'email invalide" })
  .min(1, { message: "L'email est requis" });

const passwordSchema = z.string()
  .min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" })
  .max(100, { message: "Le mot de passe est trop long" });

const phoneSchema = z.string()
  .regex(/^[+]?[\d\s\-()]{8,}$/, { message: "Numéro de téléphone invalide" })
  .optional()
  .or(z.literal(''));

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["client", "agence", "admin"], {
    message: "Rôle invalide. Choisissez entre: client, agence, admin"
  }),
  nom: z.string().min(2, { message: "Le nom est requis" }),
  phone: phoneSchema,
  adresse: z.string().optional(),
  
  responsable: z.string().optional(),
  pays: z.string().optional(),
  services: z.union([z.string(), z.array(z.string())]).optional(),
  horaires: z.string().optional(),
  numeroAgrement: z.string().optional(),
  'types-colis': z.union([z.string(), z.array(z.string())]).optional(),
  destinations: z.union([z.string(), z.array(z.string())]).optional(),
  'ville-depart': z.union([z.string(), z.array(z.string())]).optional(),
  'ville-arrivee': z.union([z.string(), z.array(z.string())]).optional(),
  'prix-trajet': z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]).optional(),
  'delai-trajet': z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]).optional(),
}).refine(data => {

  if (data.role === 'agence' && !data.nom) {
    return false;
  }
  return true;
}, {
  message: "Le nom de l'agence est requis",
  path: ["nom"]
});

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});


const forgotPasswordSchema = z.object({
  email: emailSchema
});


const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "Le token est requis" }),
  password: passwordSchema
});


const verify2FASchema = z.object({
  userId: z.string().min(1, { message: "L'ID utilisateur est requis" }),
  code: z.string().length(6, { message: "Le code 2FA doit contenir 6 chiffres" })
    .regex(/^\d+$/, { message: "Le code 2FA doit contenir uniquement des chiffres" })
});


const validateWithZod = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          message: 'Validation échouée',
          errors
        });
      }
      req.validatedData = result.data;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Erreur de validation' });
    }
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verify2FASchema,
  validateWithZod
};