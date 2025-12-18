const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authenticationMiddlware');
const { roleMiddleware } = require('../Middleware/RoleMiddlware');
const User = require('../Models/User');

// Récupérer le profil utilisateur
router.get('/user/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id || req.user.id)
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .populate('grandTransporteur', 'entrepriseName telephone adresse')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                fullName: user.fullName || user.grandTransporteur?.entrepriseName,
                email: user.email,
                role: user.role,
                profilePhoto: user.grandTransporteur?.logo || user.client?.photo || user.agence?.logo || user.petitTransporteur?.photo,
                grandTransporteur: user.grandTransporteur
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Mettre à jour le profil grand transporteur
router.put('/user/profile/grand-transporteur', 
    authMiddleware, 
    roleMiddleware('grand_transporteur'), 
    async (req, res) => {
    try {
        const {
            entrepriseName,
            responsable,
            telephone,
            adresse,
            typeCamion,
            destinations,
            prixParKilo,
            capacite,
            provinces
        } = req.body;

        const user = await User.findById(req.user._id || req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.grandTransporteur = {
            ...user.grandTransporteur,
            entrepriseName: entrepriseName || user.grandTransporteur.entrepriseName,
            responsable: responsable || user.grandTransporteur.responsable,
            telephone: telephone || user.grandTransporteur.telephone,
            adresse: adresse || user.grandTransporteur.adresse,
            typeCamion: typeCamion || user.grandTransporteur.typeCamion,
            destinations: destinations || user.grandTransporteur.destinations,
            prixParKilo: prixParKilo || user.grandTransporteur.prixParKilo,
            capacite: capacite || user.grandTransporteur.capacite,
            provinces: provinces || user.grandTransporteur.provinces,
            updatedAt: new Date()
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profil mis à jour avec succès',
            data: {
                grandTransporteur: user.grandTransporteur
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Ajouter un trajet
router.post('/user/profile/trajet', 
    authMiddleware, 
    roleMiddleware('grand_transporteur'), 
    async (req, res) => {
    try {
        const { destination, prix, delai, unite = "colis" } = req.body;

        const user = await User.findById(req.user._id || req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newTrajet = {
            destination,
            prix: Number(prix),
            delai: Number(delai),
            unite
        };

        user.grandTransporteur.tarifs = user.grandTransporteur.tarifs || [];
        user.grandTransporteur.tarifs.push(newTrajet);

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Trajet ajouté avec succès',
            data: {
                trajet: newTrajet
            }
        });

    } catch (error) {
        console.error('Add trajet error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// SUPPRIMER UN TRAJET - AJOUTÉ
router.delete('/user/profile/trajet/:index', 
    authMiddleware, 
    roleMiddleware('grand_transporteur'), 
    async (req, res) => {
    try {
        const { index } = req.params;
        const userId = req.user._id || req.user.id;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur non trouvé"
            });
        }

        // Vérifier si l'utilisateur a un profil grand transporteur
        if (!user.grandTransporteur) {
            return res.status(400).json({
                success: false,
                message: "Profil transporteur non configuré"
            });
        }

        // Vérifier si les tarifs existent
        if (!user.grandTransporteur.tarifs || !Array.isArray(user.grandTransporteur.tarifs)) {
            return res.status(400).json({
                success: false,
                message: "Aucun trajet configuré"
            });
        }

        // Convertir l'index en nombre
        const trajetIndex = parseInt(index);
        
        // Vérifier si l'index est valide
        if (isNaN(trajetIndex) || trajetIndex < 0 || trajetIndex >= user.grandTransporteur.tarifs.length) {
            return res.status(400).json({
                success: false,
                message: "Index de trajet invalide"
            });
        }

        // Récupérer le trajet avant suppression pour le message
        const trajetSupprime = user.grandTransporteur.tarifs[trajetIndex];

        // Supprimer le trajet
        user.grandTransporteur.tarifs.splice(trajetIndex, 1);

        // Marquer le champ comme modifié
        user.markModified('grandTransporteur.tarifs');
        await user.save();

        res.status(200).json({
            success: true,
            message: "Trajet supprimé avec succès",
            data: {
                trajetSupprime: {
                    destination: trajetSupprime.destination,
                    prix: trajetSupprime.prix,
                    delai: trajetSupprime.delai
                }
            }
        });

    } catch (error) {
        console.error('Delete trajet error:', error);
        res.status(500).json({
            success: false,
            message: "Erreur serveur lors de la suppression du trajet"
        });
    }
});

module.exports = router;