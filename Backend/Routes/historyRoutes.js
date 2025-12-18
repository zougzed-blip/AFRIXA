const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authenticationMiddlware');
const GrandTransportOffer = require('../Models/grandTransOfferModel');
const RequestTransport = require('../Models/requestGrandTransport');



router.get('/transporteur/history', authMiddleware, async (req, res) => {
    try {
        const transporteurId = req.user._id;
        
        const offers = await GrandTransportOffer.find({ transporteurId })
            .populate('demandeId', 'codeColis nom email villeDepart villeArrivee status')
            .sort({dateEnvoi: -1, createdAt: -1 })
            .lean();
        
        const history = offers.map(offer => ({
            _id: offer._id,
            type: offer.status === 'en_attente' ? 'proposition' : offer.status,
            demandeId: offer.demandeId,
            montantPropose: offer.montantPropose,
            createdAt: offer.createdAt || offer.dateEnvoi || new Date(),
            date: offer.createdAt || offer.dateEnvoi || new Date(),
            status: offer.status
        }));
        
        res.json({
            success: true,
            data: history
        });
        
    } catch (error) {
        console.error(' Error history:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur' 
        });
    }
});

router.patch('/transporteur/offer/:offerId/status', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        const { status } = req.body;
        
        console.log('Demande de mise à jour:', { offerId, status, userId: req.user._id });
        
        const validStatuses = ['en_cours', 'livré'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false,
                message: `Statut invalide. Utilisez: ${validStatuses.join(' ou ')}` 
            });
        }
        
       
        const offer = await GrandTransportOffer.findOne({
            _id: offerId,
            transporteurId: req.user._id
        }).populate('demandeId', 'codeColis nom email status')
        
        if (!offer) {
            return res.status(404).json({ 
                success: false,
                message: 'Offre non trouvée ou vous n\'êtes pas autorisé' 
            });
        }
        
        console.log(' Offre trouvée, statut actuel:', offer.status);
        
        if (status === 'en_cours' && offer.status !== 'accepté_par_client') {
            return res.status(400).json({ 
                success: false,
                message: 'Seules les offres acceptées peuvent être mises en cours' 
            });
        }
        
        if (status === 'livré' && offer.status !== 'en_cours') {
            return res.status(400).json({ 
                success: false,
                message: 'Seules les offres en cours peuvent être marquées comme livrées' 
            });
        }
        
        offer.status = status;
        await offer.save();
        
        console.log(' Offre mise à jour avec le statut:', status);
        
        if (offer.demandeId) {
            await RequestTransport.findByIdAndUpdate(
                offer.demandeId,
                { status: status },
                { new: true }
            );
            console.log(' Demande principale mise à jour');
        }

        try {
            if ((status === 'en_cours' || status === 'livré') && offer.demandeId && offer.demandeId.email) {
                const { sendEmail } = require('../Helper/EmailServices');
                
                const statusText = {
                    'en_cours': 'en cours de livraison',
                    'livré': 'livré avec succès'
                };
                
                await sendEmail({
                    to: offer.demandeId.email,
                    subject: `Statut mis à jour - ${offer.demandeId.codeColis} - AFRIXA`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f7fa;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h2 style="color: #004732; margin-bottom: 10px; border-bottom: 3px solid #C59B33; padding-bottom: 10px;">
                                    STATUT MIS À JOUR
                                </h2>
                            </div>
                            
                            <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 25px;">
                                <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                                    Bonjour <strong>${offer.demandeId.nom}</strong>,
                                </p>
                                
                                <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">
                                    Le statut de votre colis a été mis à jour.
                                </p>
                                
                                <div style="background: linear-gradient(135deg, #f9f5e7, #fff); padding: 20px; border-radius: 8px; border-left: 4px solid #C59B33;">
                                    <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Code Colis:</strong> ${offer.demandeId.codeColis}</p>
                                    <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Nouveau Statut:</strong> ${statusText[status] || status}</p>
                                    <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                                
                                <p style="color: #666; margin-top: 25px; text-align: center;">
                                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/dashboard" 
                                       style="background: #004732; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                        Voir le statut
                                    </a>
                                </p>
                            </div>
                            
                            <div style="text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee;">
                                <p style="margin-bottom: 5px;">AFRIXA LOGISTICS - Transport & Logistique</p>
                                <p style="margin: 0;">© ${new Date().getFullYear()} Tous droits réservés</p>
                            </div>
                        </div>
                    `
                });
                console.log('Email envoyé à:', offer.demandeId.email);
            } else {
                console.log(' Email non envoyé - pas de destinataire ou statut non concerné');
            }
        } catch (emailError) {
            console.error(' Erreur envoi email statut:', emailError);
        }
        
        res.json({
            success: true,
            message: `Statut mis à jour: ${status}`,
            data: {
                _id: offer._id,
                status: offer.status,
                demandeId: offer.demandeId
            }
        });
        
    } catch (error) {
        console.error(' Error update status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur',
            error: error.message 
        });
    }
})
module.exports = router;