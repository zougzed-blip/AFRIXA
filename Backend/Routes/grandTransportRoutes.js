const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authenticationMiddlware');
const { roleMiddleware } = require('../Middleware/RoleMiddlware');
const { upload2, uploadToCloudinaryMiddleware2 } = require('../Middleware/uploadMiddleware'); // ✅ CORRIGER LE NOM
const {
    createRequestGrandTransport,
    getClientRequests,
    getRequestById
} = require('../Controllers/requestGrandTransport');


router.post('/grandTransport/request',
    authMiddleware,
    roleMiddleware('client'),
    upload2.single('photo'), 
    uploadToCloudinaryMiddleware2, 
    createRequestGrandTransport
);

router.get('/grandTransport/requests',
    authMiddleware,
    roleMiddleware('client'),
    getClientRequests
);

router.get('/grandTransport/request/:id',
    authMiddleware,
    roleMiddleware('client'),
    getRequestById
);

const paymentProof = require('../Models/paymentModel');

// ==================== RÉCUPÉRER MES PREUVES DE PAIEMENT ====================
router.get('/my-payment-proofs', authMiddleware, async (req, res) => {
    try {
        console.log('👤 User ID qui demande ses preuves:', req.user.id);
        
        const proofs = await paymentProof.find({ 
            user: req.user.id  // Filtrer par SON ID
        })
        .sort({ createdAt: -1 })
        .populate('user', 'email'); // Optionnel: peupler avec info user
        
        console.log('📄 Preuves trouvées:', proofs.length);
        
        res.status(200).json({
            success: true,
            count: proofs.length,
            data: proofs
        });
        
    } catch (error) {
        console.error('Erreur récupération preuves:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
});

module.exports = router;
// Dans le même fichier grandTransportRoutes.js
router.get('/dashboard-payments', authMiddleware, async (req, res) => {
    try {
        const lastPayments = await paymentProof.find({ 
            user: req.user.id 
        })
        .sort({ createdAt: -1 })
        .limit(5) // Juste les 5 derniers pour le dashboard
        .select('codeColis montant devise createdAt');
        
        // Calculer le total
        const totalResult = await paymentProof.aggregate([
            { $match: { user: req.user.id } },
            { $group: { _id: null, total: { $sum: '$montant' } } }
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                lastPayments: lastPayments,
                total: totalResult.length > 0 ? totalResult[0].total : 0
            }
        });
        
    } catch (error) {
        console.error('Erreur dashboard paiements:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
});
module.exports = router;