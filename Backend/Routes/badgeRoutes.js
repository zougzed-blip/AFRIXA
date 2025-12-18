const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authenticationMiddlware');
const RequestTransport = require('../Models/requestGrandTransport');
const GrandTransportOffer = require('../Models/grandTransOfferModel');

router.get('/transporteur/badge-counts', authMiddleware, async (req, res) => {
    try {
        const transporteurId = req.user._id;
        
        // Compteur demandes en attente
        const newDemands = await RequestTransport.countDocuments({
            status: 'en_attente'
        });
        
        // Compteur propositions en attente
        const pendingProposals = await GrandTransportOffer.countDocuments({
            transporteurId,
            status: 'en_attente'
        });
        
        // Compteur confirmés (acceptés + en cours + livrés)
        const confirmedCount = await GrandTransportOffer.countDocuments({
            transporteurId,
            status: { $in: ['accepté_par_client', 'en_cours', 'livré'] }
        });
        
        res.json({
            success: true,
            data: {
                newDemands,
                pendingProposals,
                confirmedCount
            }
        });
        
    } catch (error) {
        console.error('Error badge counts:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

module.exports = router;