
const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const GrandTransport = require('../Models/requestGrandTransport');
const GrandTransportOffer = require('../Models/grandTransOfferModel'); 
const authMiddleware = require('../Middleware/authenticationMiddlware')
const { upload, uploadMiddlewareRegister } = require('../Middleware/uploadMiddlwareRegiste');

// ==================== PROFIL CLIENT ====================
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json(user);
    } catch (error) {
        console.error('Erreur profil:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


// ==================== PROFIL CLIENT ====================
router.put('/profile', 
    authMiddleware, 
    upload.single('avatar'), 
    uploadMiddlewareRegister, 
    async (req, res) => {
        try {
            console.log('FILE UPLOADED:', req.file);
            console.log('CLOUDINARY RESULT:', req.body.photoUrl); // Vérifie cette ligne
            
            const updateData = {};
            if (req.body.email) updateData.email = req.body.email;
            
            if (req.body.fullName || req.body.telephone || req.body.adresse) {
                updateData.client = {
                    ...(req.body.fullName && { fullName: req.body.fullName }),
                    ...(req.body.telephone && { telephone: req.body.telephone }),
                    ...(req.body.adresse && { adresse: req.body.adresse })
                };
            }
         
            if (req.body.photoUrl) {
                if (!updateData.client) updateData.client = {};
                updateData.client.photo = req.body.photoUrl; 
            }
            
            const user = await User.findByIdAndUpdate(
                req.user.id,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select('-password');
            
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }
            
            res.json({ 
                success: true, 
                user,
                photoUrl: user.client.photo 
            });
            
        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
);

// ==================== DASHBOARD ====================
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const lastRequest = await GrandTransport.findOne({ userId: req.user.id })
            .sort({ date: -1 })
            .populate('transporteurId', 'grandTransporteur.entrepriseName grandTransporteur.logo');

      
        const pendingCount = await GrandTransport.countDocuments({ 
            userId: req.user.id, 
            status: 'en_attente' 
        });
        
        const acceptedCount = await GrandTransport.countDocuments({ 
            userId: req.user.id, 
            status: 'accepté' 
        });
        
        res.json({
            lastRequest,
            stats: {
                pending: pendingCount,
                accepted: acceptedCount
            }
        });
    } catch (error) {
        console.error('Erreur dashboard:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// ==================== DEMANDES EN COURS ====================
router.get('/requests', authMiddleware, async (req, res) => {
    try {
        const requests = await GrandTransport.find({ 
            userId: req.user.id,
            status: { $in: ['en_attente', 'accepté', 'en_cours'] }
        }).populate('transporteurId', 'grandTransporteur.entrepriseName grandTransporteur.logo')
        .sort({ date: -1 });
        
        res.json({ requests });
    } catch (error) {
        console.error('Erreur demandes:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


// ==================== HISTORIQUE ====================
router.get('/history', authMiddleware, async (req, res) => {
    try {
       
        const historyRequests = await GrandTransport.find({ 
            userId: req.user.id,
            status: { $in: ['livré', 'refusé', 'annulé'] }  
        }).populate('transporteurId', 'grandTransporteur.entrepriseName grandTransporteur.logo')
        .sort({ date: -1 });
        
        if (!historyRequests || historyRequests.length === 0) {
            return res.json({ success: true, requests: [] });
        }
        
    
        const formattedRequests = historyRequests.map(request => ({
            _id: request._id,
            codeColis: request.codeColis,
            nom: request.nom,
            email: request.email,
            telephone: request.telephone,
            villeDepart: request.villeDepart,
            villeArrivee: request.villeArrivee,
            typeCamion: request.typeCamion,
            typeMarchandise: request.typeMarchandise,
            poidsVolume: request.poidsVolume,
            status: request.status,  
            date: request.date,
            rating: request.rating,
            transporteurId: request.transporteurId
        }));
        
        res.json({ success: true, requests: formattedRequests });
    } catch (error) {
        console.error('Erreur historique:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// ==================== DÉTAILS D'UNE DEMANDE ====================
router.get('/grandTransport/request/:id', authMiddleware, async (req, res) => {
    try {
        const request = await GrandTransport.findOne({ 
            _id: req.params.id, 
            userId: req.user.id 
        });
        
        if (!request) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }
        
        res.json({ request });
    } catch (error) {
        console.error('Erreur détails demande:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// ==================== TOUTES LES OFFRES REÇUES ====================
router.get('/grandTransport/all-offers', authMiddleware, async (req, res) => {
    try {
        
        const clientRequests = await GrandTransport.find({ userId: req.user.id });
        
        if (!clientRequests || clientRequests.length === 0) {
            return res.json({ success: true, offers: [] });
        }
        
        const requestIds = clientRequests.map(req => req._id);
        
       
          const offers = await GrandTransportOffer.find({ 
          demandeId: { $in: requestIds },
          status: { $in: ['en_attente', 'accepté_par_client', 'refusé_par_client', 'en_cours', 'livré'] }
       })
        .populate('demandeId', 'codeColis villeDepart villeArrivee typeCamion date')
        .populate('transporteurId', 'role fullName email phone photo grandTransporteur.entrepriseName grandTransporteur.logo')
        .sort({ dateEnvoi: -1 });
        
        res.json({ success: true, offers });
    } catch (error) {
        console.error('Erreur toutes les offres:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// ==================== OFFRES POUR UNE DEMANDE SPÉCIFIQUE ====================
router.get('/offers/:requestId', authMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        
        const request = await GrandTransport.findOne({
            _id: requestId,
            userId: req.user.id
        });
        
        if (!request) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }
        
        // Récupérer les offres pour cette demande
        const offers = await GrandTransportOffer.find({ 
            demandeId: requestId 
        })
        .populate('transporteurId', 'fullName email phone photo')
        .sort({ dateEnvoi: -1 });
        
        res.json({ offers });
    } catch (error) {
        console.error('Erreur offres:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// ==================== ACCEPTER UNE OFFRE ====================
router.put('/grandTransport/offers/:offerId/accept', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        
        const offer = await GrandTransportOffer.findById(offerId)
            .populate('demandeId');
        
        if (!offer) {
            return res.status(404).json({ message: 'Offre non trouvée' });
        }
        
        // Vérifier que la demande appartient au client
        if (offer.demandeId.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        
        // Vérifier que l'offre est encore en attente
        if (offer.status !== 'en_attente') {
            return res.status(400).json({ message: 'Cette offre a déjà été traitée' });
        }
        
        // Mettre à jour le statut de l'offre
        offer.status = 'accepté_par_client';
        await offer.save();
        
        await GrandTransport.findByIdAndUpdate(offer.demandeId._id, {
            status: 'accepté',
            transporteurId: offer.transporteurId._id
        });
        
       
        await GrandTransportOffer.updateMany(
            { 
                demandeId: offer.demandeId._id,
                _id: { $ne: offerId },
                status: 'en_attente'
            },
            { status: 'refusé_par_client' }
        );
        
        res.json({ 
            success: true, 
            message: 'Offre acceptée avec succès',
            offer 
        });
    } catch (error) {
        console.error('Erreur acceptation:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


// ==================== REFUSER UNE OFFRE ====================
router.put('/grandTransport/offers/:offerId/reject', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        
        const offer = await GrandTransportOffer.findById(offerId)
            .populate('demandeId')
        
        if (!offer) {
            return res.status(404).json({ message: 'Offre non trouvée' });
        }
        
        // Vérifier que la demande appartient au client
        if (offer.demandeId.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        
        // Vérifier que l'offre est encore en attente
        if (offer.status !== 'en_attente') {
            return res.status(400).json({ message: 'Cette offre a déjà été traitée' });
        }
        
      
        offer.status = 'refusé_par_client';
        await offer.save();
        
        await GrandTransport.findByIdAndUpdate(offer.demandeId._id, {
            status: 'refusé'
        });
        
        res.json({ 
            success: true, 
            message: 'Offre refusée avec succès',
            offer 
        });
    } catch (error) {
        console.error('Erreur refus:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// ==================== NOTIFICATIONS ====================
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const clientRequests = await GrandTransport.find({ userId: req.user.id });
        
        if (!clientRequests || clientRequests.length === 0) {
            return res.json({ success: true, notifications: [] });
        }
        
        const offers = await GrandTransportOffer.find({
            demandeId: { $in: clientRequests.map(req => req._id) }
        })
        .populate('demandeId', 'codeColis')
        .populate('transporteurId', 'fullName')
        .sort({ dateEnvoi: -1 })
        .limit(5); 
        
        const notifications = offers.map(offer => {
            let title, message, type;
            
            if (offer.status === 'en_attente') {
                title = 'Nouvelle offre reçue';
                message = `Nouvelle offre de ${offer.transporteurId.fullName} pour ${offer.demandeId.codeColis}`;
                type = 'offer';
            } else if (offer.status === 'accepté_par_client') {
                title = 'Offre acceptée';
                message = `Vous avez accepté l'offre pour ${offer.demandeId.codeColis}`;
                type = 'success';
            } else if (offer.status === 'refusé_par_client') {
                title = 'Offre refusée';
                message = `Vous avez refusé l'offre pour ${offer.demandeId.codeColis}`;
                type = 'warning';
            } else if (offer.status === 'en_cours') {
                title = 'Transport en cours';
                message = `Le colis ${offer.demandeId.codeColis} est en cours de livraison`;
                type = 'info';
            } else {
                title = 'Colis livré';
                message = `Le colis ${offer.demandeId.codeColis} a été livré`;
                type = 'success';
            }
            
            return {
                id: offer._id,
                type,
                title,
                message,
                date: offer.dateEnvoi,
                read: false
            };
        });
        
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Erreur notifications:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
})

// ==================== CRÉATION D'UNE DEMANDE DE TRANSPORT ====================
router.post('/grandTransport/request', authMiddleware, async (req, res) => {
    try {
        const {
            nom, email, telephone, ville, commune, adress,
            villeDepart, villeArrivee, poidsVolume, typeMarchandise,
            typeCamion, description
        } = req.body;
        
        // Générer un code unique
        const codeColis = `AFRIXA-${Date.now().toString().slice(-6)}`;
        
        const newRequest = new GrandTransport({
            userId: req.user.id,
            codeColis,
            nom, email, telephone, ville, commune, adress,
            villeDepart, villeArrivee, poidsVolume, typeMarchandise,
            typeCamion, description,
            status: 'en_attente',
            date: new Date()
        });
        
        // Gérer l'upload de photo si présent
        if (req.files && req.files.photo) {
            const photo = req.files.photo;
            const photoPath = `/uploads/${Date.now()}-${photo.name}`;
            await photo.mv(`./public${photoPath}`);
            newRequest.photoColis = photoPath;
        }
        
        await newRequest.save();
        
        res.json({ 
            success: true, 
            message: 'Demande créée avec succès',
            request: newRequest 
        });
    } catch (error) {
        console.error('Erreur création demande:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
})

// ==================== ÉVALUER UNE DEMANDE ====================
router.post('/request/:id/rate', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;

 
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                success: false, 
                message: 'La note doit être entre 1 et 5 étoiles' 
            });
        }

  
        const request = await GrandTransport.findOne({ 
            _id: id, 
            userId: req.user.id 
        });

        if (!request) {
            return res.status(404).json({ 
                success: false, 
                message: 'Demande non trouvée' 
            });
        }

  
        if (request.status !== 'livré') {
            return res.status(400).json({ 
                success: false, 
                message: 'Vous ne pouvez noter que les demandes livrées' 
            });
        }


        if (request.rating) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cette demande a déjà été notée' 
            });
        }

        
        request.rating = rating;
        request.ratedAt = new Date();
        await request.save();

        res.json({ 
            success: true, 
            message: 'Merci pour votre évaluation!',
            request 
        });

    } catch (error) {
        console.error('Erreur évaluation:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur' 
        });
    }
});

module.exports = router;