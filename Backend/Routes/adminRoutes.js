const express = require('express');
const router = express.Router();
const User = require('../Models/User')
const {sendEmail} = require('../Helper/EmailServices');
const GrandTransport = require('../Models/requestGrandTransport');
const authMiddleware = require('../Middleware/authenticationMiddlware');
const adminMiddleware = require('../Middleware/administrationMiddleware');
const {demandeAccepteeTemplate,
    demandeEnAttenteTemplate} = require('../Emails/adminTemplates');
const { paiementAccepteTemplate, paiementRefuseTemplate } = require('../Emails/paymentTemplates')
const paymentProof = require('../Models/paymentModel');
const GrandTransportOffer = require('../Models/grandTransOfferModel');

router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const clients = await User.countDocuments({ role: 'client' });
    const agences = await User.countDocuments({ role: 'agence', isVerified: true });
    const petitTransporteurs = await User.countDocuments({ role: 'petit_transporteur', isVerified: true });
    const grandTransporteurs = await User.countDocuments({ role: 'grand_transporteur', isVerified: true });
    const pendingValidation = await User.countDocuments({ 
      role: { $in: ['agence', 'petit_transporteur', 'grand_transporteur'] }, 
      isVerified: false 
    });

    // Nouveaux utilisateurs (dernières 24h)
    const newClients = await User.countDocuments({ 
      role: 'client',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    
    const completedTransports = await GrandTransport.countDocuments({ status: 'livré' });
    const averageRating = await GrandTransport.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    res.json({
      totalUsers,
      clients,
      agences,
      petitTransporteurs,
      grandTransporteurs,
      pendingValidation,
      newClients,
      activeUsers,
      completedTransports: completedTransports,
      averageRating: averageRating.length > 0 ? averageRating[0].avgRating.toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
// ==================== NOTIFICATIONS ADMIN ====================
router.get('/notifications', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const notifications = [];
    
    // Nouvelles inscriptions (dernières 24h)
    const newUsers = await User.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).limit(5);
    
    newUsers.forEach(user => {
      notifications.push({
        type: 'info',
        title: 'Nouvelle inscription',
        message: `${getUserDisplayName(user)} s'est inscrit comme ${getRoleLabel(user.role)}`,
        createdAt: user.createdAt,
        read: false
      });
    });
    
    // Demandes en attente de validation
    const pendingUsers = await User.find({
      role: { $in: ['agence', 'petit_transporteur', 'grand_transporteur'] },
      isVerified: false
    }).limit(5);
    
    pendingUsers.forEach(user => {
      notifications.push({
        type: 'warning',
        title: 'Validation en attente',
        message: `${getUserDisplayName(user)} attend la validation de son compte`,
        createdAt: user.createdAt,
        read: false
      });
    });
    
    // Nouvelles preuves de paiement
    const recentProofs = await paymentProof.find()
      .sort({ createdAt: -1 })
      .limit(3);
    
    recentProofs.forEach(proof => {
      notifications.push({
        type: 'success',
        title: 'Nouvelle preuve de paiement',
        message: `Preuve reçue pour le colis ${proof.codeColis}`,
        createdAt: proof.createdAt,
        read: false
      });
    });
    
    // Trier par date
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(notifications.slice(0, 10));
  } catch (error) {
    console.error('Erreur notifications:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
// ==================== COMPTEUR NOTIFICATIONS ====================
router.get('/notifications/count', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let count = 0;
    
    // Nouvelles inscriptions (dernières 24h)
    const newUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    count += newUsers;
    
    // Demandes en attente de validation
    const pendingUsers = await User.countDocuments({
      role: { $in: ['agence', 'petit_transporteur', 'grand_transporteur'] },
      isVerified: false
    });
    count += pendingUsers;
    
    // Nouvelles preuves de paiement (dernières 24h)
    const recentProofs = await paymentProof.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    count += recentProofs;
    
    // Nouvelles demandes de transport (dernières 24h)
    const recentRequests = await GrandTransport.countDocuments({
      date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    count += recentRequests;
    
    res.json({ count });
  } catch (error) {
    console.error('Erreur compteur notifications:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== PROFIL ADMIN ====================
router.get('/profile', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin non trouvé' });
    }
    
    // Extraire le nom en fonction du rôle
    let name = 'Administrateur';
    let photo = null;
    
    if (admin.role === 'admin') {
      name = admin.email.split('@')[0]; // Utilise la première partie de l'email
    }
    
    res.json({
      name,
      email: admin.email,
      role: admin.role,
      photo
    });
  } catch (error) {
    console.error('Erreur profil admin:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
// ==================== DEMANDES RÉCENTES ====================
router.get('/grand-transport/recent-requests', authMiddleware, adminMiddleware, async(req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const requests = await GrandTransport.find()
      .sort({ date: -1 })
      .limit(limit)
      .select('codeColis nom email villeDepart villeArrivee status date');
    
    res.status(200).json(requests);
  } catch(error) {
    console.error('Erreur demandes récentes:', error);
    res.status(500).json({message: 'Erreur serveur', error: error.message});
  }
});

// Ajoute ces fonctions utilitaires à la fin du fichier
function getRoleLabel(role) {
  const roles = {
    'client': 'Client',
    'agence': 'Agence',
    'petit_transporteur': 'Petit Transporteur',
    'grand_transporteur': 'Grand Transporteur'
  };
  return roles[role] || role;
}

// ==================== ACTIVITÉS RÉCENTES ====================
router.get('/activities', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('email role createdAt client agence petitTransporteur grandTransporteur');

    const activities = recentUsers.map(user => ({
      user, 
      createdAt: user.createdAt
    }));

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== SOCIÉTÉS EN ATTENTE ====================
router.get('/companies/pending', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pendingCompanies = await User.find({
      role: { $in: ['agence', 'petit_transporteur', 'grand_transporteur'] },
      isVerified: false
    }).select('email role isVerified client petitTransporteur grandTransporteur agence');

    res.json(pendingCompanies);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== TOUS LES UTILISATEURS ====================
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find()
      .select('email role isVerified client petitTransporteur grandTransporteur agence createdAt');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== PROFIL UTILISATEUR ====================
router.get('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== VALIDATION SOCIÉTÉ ====================
router.post('/companies/:id/validate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { accept } = req.body; // true = accepter, false = en attente
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    let subject = '';
    let html = '';

    if (accept) {
      user.isVerified = true;
      subject = 'Votre demande a été acceptée ✅';
      html = demandeAccepteeTemplate(user.nom || user.email);
    } else {
      user.isVerified = false;
      subject = 'Votre demande est en attente ⏳';
      html = demandeEnAttenteTemplate(user.nom || user.email);
    }

    await user.save();
    await sendEmail({ to: user.email, subject, html });

    res.json({
      message: `Statut mis à jour (${accept ? 'accepté' : 'en attente'}) et email envoyé à ${user.email}`,
      isVerified: user.isVerified
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== CHANGER STATUT UTILISATEUR ====================
router.post('/users/:id/toggle-status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    user.isVerified = !user.isVerified;

    let subject = '';
    let html = '';

    if (user.isVerified) {
      subject = 'Votre compte est maintenant activé ✅';
      html = demandeAccepteeTemplate(user.nom || user.email);
    } else {
      subject = 'Votre compte est maintenant en attente ⏳';
      html = demandeEnAttenteTemplate(user.nom || user.email);
    }

    await user.save();
    await sendEmail({ to: user.email, subject, html });

    res.json({ 
      message: `Utilisateur ${user.isVerified ? 'activé' : 'en attente'} et email envoyé`,
      isVerified: user.isVerified 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== VERIFIER UTILISATEUR ====================
router.put("/verify-user/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.status(200).json({
      message: "Utilisateur vérifié avec succès",
      user
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ==================== TOUTES LES DEMANDES GRAND TRANSPORT ====================
router.get('/grand-transport/all-requests', authMiddleware, adminMiddleware, async(req,res) => {
  try {
    const requests = await GrandTransport.find().sort({ date: -1, createdAt: -1 })
    res.status(200).json(requests);
    console.log('Requêtes récupérées avec succès:', requests.length);
  } catch(error) {
    console.log('Erreur lors de la récupération des demandes', error);
    res.status(500).json({message : 'Erreur serveur', error: error.message});
  }
});

// ==================== DÉTAILS D'UNE DEMANDE SPÉCIFIQUE ====================
router.get('/grand-transport/request/:id', authMiddleware, adminMiddleware, async(req,res) => {
  try {
    console.log('=== DÉTAILS DEMANDE ===');
    console.log('ID demandé:', req.params.id);
    
    const request = await GrandTransport.findById(req.params.id);
    
    if (!request) {
      console.log('Demande non trouvée pour ID:', req.params.id);
      return res.status(404).json({ message: 'Demande non trouvée' });
    }
    
    console.log('Demande trouvée:', request.codeColis);
    res.status(200).json(request);
  } catch(error) {
    console.error('Erreur lors de la récupération des détails de la demande:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== CHANGER STATUT PAIEMENT AVEC EMAIL ====================
router.put('/grand-transport/request/:id/payment-status', authMiddleware, adminMiddleware, async(req,res) => {
  try {
    const { paymentStatus } = req.body;
    
    // Vérifier que c'est un statut valide
    if (paymentStatus !== 'payé' && paymentStatus !== 'non_payé') {
      return res.status(400).json({message: 'Statut invalide. Options: payé, non_payé'});
    }

    // Trouver la demande
    const request = await GrandTransport.findById(req.params.id);
    if (!request) {
      return res.status(404).json({message: 'Demande non trouvée'});
    }

    // Mettre à jour le statut
    request.paymentStatus = paymentStatus;
    await request.save();

    // Préparer l'email
    let subject, html;
    
    if (paymentStatus === 'payé') {
      subject = `✅ Paiement confirmé - ${request.codeColis}`;
      html = paiementAccepteTemplate(request.nom || 'Client', request.codeColis || 'N/A');
    } else {
      subject = `⚠️ Paiement non validé - ${request.codeColis}`;
      html = paiementRefuseTemplate(request.nom || 'Client', request.codeColis || 'N/A');
    }

    // Envoyer l'email
    await sendEmail({ 
      to: request.email, 
      subject, 
      html 
    });

    console.log(`Email envoyé à ${request.email} pour le statut: ${paymentStatus}`);

    res.status(200).json({
      message: `Statut mis à jour et email envoyé à ${request.email}`,
      request
    });
    
  } catch(error) {
    console.error('Erreur lors de la mise à jour du statut de paiement :', error);
    res.status(500).json({message : 'Erreur serveur', error: error.message});
  }
});
router.get('/grand-transport/new-requests-count', authMiddleware, adminMiddleware, async(req, res) => {
  try {
    const { lastViewed } = req.query;
    let newCount = 0;
    
    if (lastViewed) {
      newCount = await GrandTransport.countDocuments({
        date: { $gt: new Date(lastViewed) }
      });
    } else {
      newCount = await GrandTransport.countDocuments({
        date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      });
    }
    
    res.status(200).json({ newCount });
  } catch(error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
// ==================== ROUTE DE TEST (temporaire - sans auth) ====================
router.get('/test-demand/:id', async (req, res) => {
  try {
    console.log('=== TEST ROUTE DEMANDE ===');
    console.log('ID test:', req.params.id);
    
    const request = await GrandTransport.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Demande non trouvée en test' });
    }
    
    console.log('Test réussi, demande trouvée:', request.codeColis);
    res.status(200).json(request);
  } catch(error) {
    console.error('Erreur test route:', error);
    res.status(500).json({ message: 'Erreur serveur test', error: error.message });
  }
});

//=====================Preuve de paiements========================

router.get('/payment-proofs', authMiddleware, adminMiddleware,  async (req, res) => {
       try {
        const proofs = await paymentProof.find().sort({ createdAt: -1 })
        res.status(200).json(proofs)
       }catch(error){
        console.log('Erreur preuves des paiment', error);
        res.status(500).json({message : 'Erreur serveur', error: error.message});
       }
})

router.get('/payment-proofs/new-count', authMiddleware, adminMiddleware, async (req, res) => {
  try {

    const { lastViewed } = req.query; 
    let newCount = 0;
    if (lastViewed) {
      newCount = await paymentProof.countDocuments({
        createdAt: { $gt: new Date(lastViewed) }
      });
    } else {
      newCount = await paymentProof.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
    }
    
    res.status(200).json({ 
      newCount
    });
  } catch (error) {
    console.error('Erreur comptage preuves:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
})


router.get('/payment-proofs/:id/view', authMiddleware, async (req, res) => {
    try {
        const proof = await paymentProof.findById(req.params.id);
        if (!proof) {
            return res.status(404).json({ message: 'Preuve non trouvée' });
        }

        const response = await axios({
            method: 'GET',
            url: proof.proofUrl,
            responseType: 'stream'
        });


        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="preuve-${proof.codeColis}.pdf"`);

        response.data.pipe(res);
    } catch (error) {
        console.error('Erreur chargement PDF:', error);
        res.status(500).json({ message: 'Erreur chargement PDF' });
    }
});
// ==================== TOUTES LES PROPOSITIONS GRAND TRANSPORT ====================
router.get('/grand-transport/all-offers', authMiddleware, adminMiddleware, async(req, res) => {
  try {
    const offers = await GrandTransportOffer.find()
      .populate({
        path: 'demandeId',
        select: 'codeColis nom email villeDepart villeArrivee'
      })
      .populate({
        path: 'transporteurId',
        select: 'email role',
        populate: {
          path: 'grandTransporteur',
          select: 'entrepriseName telephone'
        }
      })
      .sort({ dateEnvoi: -1 });

    res.status(200).json(offers);
  } catch(error) {
    console.error('Erreur lors de la récupération des propositions:', error);
    res.status(500).json({message: 'Erreur serveur', error: error.message});
  }
});

// ==================== DÉTAILS D'UNE PROPOSITION ====================
router.get('/grand-transport/offer/:id', authMiddleware, adminMiddleware, async(req, res) => {
  try {
    const offer = await GrandTransportOffer.findById(req.params.id)
      .populate({
        path: 'demandeId',
        select: 'codeColis nom email telephone'
      })
      .populate({
        path: 'transporteurId',
        select: 'email role',
        populate: {
          path: 'grandTransporteur',
          select: 'entrepriseName telephone adresse'
        }
      });

    if (!offer) {
      return res.status(404).json({ message: 'Proposition non trouvée' });
    }

    res.status(200).json(offer);
  } catch(error) {
    console.error('Erreur lors de la récupération des détails de la proposition:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== TOUTES LES ÉVALUATIONS ====================
router.get('/grand-transport/all-ratings', authMiddleware, adminMiddleware, async(req, res) => {
  try {
    // Trouver toutes les demandes avec une évaluation
    const ratedRequests = await GrandTransport.find({ 
      rating: { $exists: true, $ne: null } 
    })
    .select('codeColis nom email rating transporteurId createdAt')
    .populate({
      path: 'transporteurId',
      select: 'email',
      populate: {
        path: 'grandTransporteur',
        select: 'entrepriseName'
      }
    })
    .sort({ createdAt: -1 });

    // Formater les données pour l'admin
    const ratings = ratedRequests.map(request => ({
      codeColis: request.codeColis,
      nomClient: request.nom,
      emailClient: request.email,
      transporteurName: request.transporteurId?.grandTransporteur?.entrepriseName || 
                       request.transporteurId?.email || 'Inconnu',
      rating: request.rating,
      comment: request.description, // Vous pouvez créer un champ séparé pour les commentaires d'évaluation si nécessaire
      createdAt: request.createdAt
    }));

    res.status(200).json(ratings);
  } catch(error) {
    console.error('Erreur lors de la récupération des évaluations:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== MARQUER UNE NOTIFICATION COMME LUE ====================
router.post('/notifications/:id/read', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Pour l'instant, on retourne juste success car tu n'as pas de collection Notification
    // Tu devras créer un modèle Notification si tu veux persister les notifications
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== MARQUER TOUTES LES NOTIFICATIONS COMME LUES ====================
router.post('/notifications/mark-all-read', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Pour l'instant, on retourne juste success
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    console.error('Erreur marquage notifications:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== RÉCUPÉRER LES ENTREPRISES (sans clients ni admins) ====================
router.get('/companies/for-proof', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const companies = await User.find({
      role: { $in: ['agence', 'grand_transporteur', 'petit_transporteur'] },
      isVerified: true // Seulement les entreprises vérifiées
    }).select('email role agence grandTransporteur petitTransporteur');
    
    res.json(companies);
  } catch (error) {
    console.error('Erreur récupération entreprises:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== ENVOYER UNE PREUVE À UNE ENTREPRISE ====================
const multer = require('multer');
const cloudinary = require('cloudinary').v2;


const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Dans administrationRoutes.js
router.post('/send-proof', authMiddleware, adminMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const { codeColis, montant, devise, destinataireId } = req.body;
    
    if (!codeColis || !montant || !devise || !destinataireId) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Photo de preuve requise' });
    }
    
    const destinataire = await User.findById(destinataireId);
    if (!destinataire) {
      return res.status(404).json({ message: 'Destinataire non trouvé' });
    }
    
    if (!['agence', 'grand_transporteur', 'petit_transporteur'].includes(destinataire.role)) {
      return res.status(400).json({ message: 'Le destinataire doit être une entreprise' });
    }
    
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'payment_proofs' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });
    
    const uploadResult = await uploadPromise;
    
    const newProof = new paymentProof({
      user: destinataireId,
      codeColis: codeColis,
      clientName: getCompanyName(destinataire),
      montant: parseFloat(montant),
      devise: devise, 
      proofUrl: uploadResult.secure_url,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    });
    
    await newProof.save();
    
    const currencySymbol = devise === 'ZAR' ? 'R' : devise === 'FC' ? 'FC' : '$';
    const subject = `📄 Nouvelle preuve de paiement - ${codeColis}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a5f3f;">Nouvelle preuve de paiement</h2>
        <p>Bonjour,</p>
        <p>Vous avez reçu une nouvelle preuve de paiement pour le colis <strong>${codeColis}</strong>.</p>
        <p><strong>Montant :</strong> ${currencySymbol}${montant}</p>
        <p>Connectez-vous à votre espace pour consulter la preuve.</p>
        <br>
        <p>Cordialement,<br>L'équipe AFRIXA LOGISTICS</p>
      </div>
    `;
    
    await sendEmail({ 
      to: destinataire.email, 
      subject, 
      html 
    });
    
    res.json({ 
      message: 'Preuve envoyée avec succès',
      proof: newProof 
    });
    
  } catch (error) {
    console.error('Erreur envoi preuve:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
})


function getCompanyName(user) {
  if (user.role === 'agence' && user.agence) return user.agence.agenceName;
  if (user.role === 'petit_transporteur' && user.petitTransporteur) return user.petitTransporteur.fullName;
  if (user.role === 'grand_transporteur' && user.grandTransporteur) return user.grandTransporteur.entrepriseName;
  return user.email;
}
// ==================== FONCTIONS UTILITAIRES ====================
function getUserDisplayName(user) {
  if (user.role === 'client' && user.client) return user.client.fullName;
  if (user.role === 'agence' && user.agence) return user.agence.agenceName;
  if (user.role === 'petit_transporteur' && user.petitTransporteur) return user.petitTransporteur.fullName;
  if (user.role === 'grand_transporteur' && user.grandTransporteur) return user.grandTransporteur.entrepriseName;
  return user.email;
}

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`
  if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
  if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
  return 'À l\'instant';
}

module.exports = router