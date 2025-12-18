const RequestTransport = require('../Models/requestGrandTransport');
const GrandTransportOffer = require('../Models/grandTransOfferModel');
const mongoose = require('mongoose');


exports.listRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, newSince } = req.query
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (newSince) {
      filter.date = { $gte: new Date(newSince) };
    }

    if (search) {
      const q = new RegExp(search, 'i');
      filter.$or = [
        { nom: q },
        { villeDepart: q },
        { villeArrivee: q },
        { codeColis: q }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
   
    const total = await RequestTransport.countDocuments(filter);
    
    const requests = await RequestTransport.find(filter)
      .sort({ date: -1, createdAt: -1 }) 
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({ 
      success: true, 
      data: requests, 
      meta: { 
        total, 
        page: Number(page), 
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      } 
    });
  } catch (err) {
    console.error('Error listRequests:', err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur" 
    });
  }
};
exports.getCounts = async (req, res) => {
  try {
    const counts = {
      en_attente: await RequestTransport.countDocuments({ status: "en_attente" }),
      accepte: await RequestTransport.countDocuments({ status: "accepté" }),
      refuse: await RequestTransport.countDocuments({ status: "refusé" }),
      en_cours: await RequestTransport.countDocuments({ status: "en_cours" }),
      livre: await RequestTransport.countDocuments({ status: "livré" })
    };
    
    counts.total = Object.values(counts).reduce((a, b) => a + b, 0);
    
    res.json({ 
      success: true, 
      data: counts 
    });
  } catch (err) {
    console.error('Error getCounts:', err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur" 
    });
  }
};


exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID invalide' 
      });
    }
    
    const request = await RequestTransport.findById(id);
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Demande non trouvée' 
      });
    }
    
    res.json({ 
      success: true, 
      data: request 
    });
  } catch (err) {
    console.error('Error getRequestById:', err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur" 
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const transporteurId = req.user.id;
    
    const demandesEnAttente = await RequestTransport.countDocuments({
      status: 'en_attente'
    });
    
    const newDemands = await RequestTransport.countDocuments({
      status: 'en_attente'
    });
    
    const mesPropositions = await GrandTransportOffer.countDocuments({
      transporteurId
    });
    
    const propositionsAcceptees = await GrandTransportOffer.countDocuments({
      transporteurId,
      status: 'accepté_par_client'
    });

    const pendingProposals = await GrandTransportOffer.countDocuments({
      transporteurId,
      status: 'en_attente'
    });
        
    const confirmedCount = await GrandTransportOffer.countDocuments({
      transporteurId,
      status: { $in: ['accepté_par_client', 'en_cours', 'livré'] }
    });
    
    const propositionsRefusees = await GrandTransportOffer.countDocuments({
      transporteurId,
      status: 'refusé_par_client'
    });
    
    // ✅ Récupérer les propositions avec dateEnvoi
    const recentPropositions = await GrandTransportOffer.find({
      transporteurId
    })
    .populate('demandeId', 'codeColis nom')
    .sort({ dateEnvoi: -1 }) // ✅ Utilise dateEnvoi au lieu de createdAt
    .limit(10)
    .lean();
    
    // ✅ Récupérer les nouvelles demandes
    const recentDemandes = await RequestTransport.find({
      status: 'en_attente'
    })
    .sort({ date: -1 })
    .limit(10)
    .lean();
    
    // ✅ Formater les propositions avec dateEnvoi
    const propositionActivities = recentPropositions.map(activity => ({
      type: activity.status === 'accepté_par_client' ? 'accept' : 
            activity.status === 'refusé_par_client' ? 'refuse' : 'proposition',
      message: activity.status === 'accepté_par_client' ? 
               `Proposition acceptée pour ${activity.demandeId?.codeColis || 'N/A'}` :
               activity.status === 'refusé_par_client' ?
               `Proposition refusée pour ${activity.demandeId?.codeColis || 'N/A'}` :
               `Proposition envoyée pour ${activity.demandeId?.codeColis || 'N/A'}`,
      date: activity.dateEnvoi || new Date(), // ✅ Utilise dateEnvoi
      demandeCode: activity.demandeId?.codeColis
    }));
    
    // ✅ Formater les nouvelles demandes
    const demandeActivities = recentDemandes.map(demande => ({
      type: 'new',
      message: `Nouvelle demande disponible - ${demande.codeColis}`,
      date: demande.date || new Date(),
      demandeCode: demande.codeColis
    }));
    
    // ✅ COMBINER et TRIER par date
    const allActivities = [...propositionActivities, ...demandeActivities]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
    
    res.json({
      success: true,
      data: {
        totalDemandes: demandesEnAttente,
        demandesEnAttente,
        mesPropositions,
        propositionsAcceptees,
        propositionsRefusees,
        recentActivities: allActivities,
        badgeCounts: {
          newDemands,
          pendingProposals,
          confirmedCount
        }
      }
    });
    
  } catch (error) {
    console.error('Error getDashboardStats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
}