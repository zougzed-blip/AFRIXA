const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authenticationMiddlware');
const { roleMiddleware } = require('../Middleware/RoleMiddlware');
const adminMid = require('../Middleware/administrationMiddleware')
const ExchangeRate = require('../Models/ExchangeRate');

router.get('/exchange-rates', 
    authMiddleware, 
    roleMiddleware(['admin', 'agence']),
    async (req, res) => {
        try {
            const rates = await ExchangeRate.find();
            
            const result = {
                FC: rates.find(r => r.currency === 'FC')?.rate || null,
                ZAR: rates.find(r => r.currency === 'ZAR')?.rate || null
            };
            
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
    }
);

router.post('/exchange-rate', 
    authMiddleware, 
    roleMiddleware(['admin', 'agence']),
    async (req, res) => {
        try {
            const { currency, rate } = req.body;
            
            if (!currency || !rate || rate <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Données invalides' 
                });
            }

            await ExchangeRate.findOneAndUpdate(
                { currency },
                { rate },
                { upsert: true }
            );

            res.json({ 
                success: true, 
                message: `Taux ${currency} défini` 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Erreur serveur' 
            });
        }
    }
);

module.exports = router;