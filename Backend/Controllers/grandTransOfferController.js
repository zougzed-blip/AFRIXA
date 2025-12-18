const RequestTransport = require('../Models/requestGrandTransport');
const GrandTransportOffer = require('../Models/grandTransOfferModel');
const User = require('../Models/User')

exports.sendOffer = async (req, res) => {
  try {
    const transporteurId = req.user._id;
    const { demandeId } = req.params;
    
   
    const requiredFields = ['montantPropose', 'delaiPropose', 'jourDisponible', 'heureDisponible', 'couleurCamion', 'plaqueImmatriculation'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ 
          success: false, 
          message: `Le champ ${field} est requis` 
        });
      }
    }
    
   
    const demande = await RequestTransport.findById(demandeId);
    if (!demande) {
      return res.status(404).json({ 
        success: false, 
        message: "Demande introuvable" 
      })
    }
    
    if (demande.status !== 'en_attente') {
      return res.status(400).json({ 
        success: false, 
        message: "Cette demande n'est plus disponible" 
      });
    }
   
    const existingOffer = await GrandTransportOffer.findOne({
      demandeId,
      transporteurId
    });
    
    if (existingOffer) {
      return res.status(400).json({ 
        success: false, 
        message: "Vous avez déjà envoyé une offre pour cette demande" 
      });
    }
   
    const offer = await GrandTransportOffer.create({
      transporteurId,
      demandeId,
      montantPropose: req.body.montantPropose,
      delaiPropose: req.body.delaiPropose,
      jourDisponible: req.body.jourDisponible,
      heureDisponible: req.body.heureDisponible,
      couleurCamion: req.body.couleurCamion,
      plaqueImmatriculation: req.body.plaqueImmatriculation,
      description: req.body.description,
      status: 'en_attente'
    });
    

    const populatedOffer = await GrandTransportOffer.findById(offer._id)
      .populate('demandeId', 'codeColis nom villeDepart villeArrivee')
      try {
      const transporteur = await User.findById(transporteurId);
      const transporteurName = transporteur?.grandTransporteur?.entrepriseName || transporteur?.fullName || 'Transporteur';
      
      const { sendEmail } = require('../Helper/EmailServices');
      
      await sendEmail({
        to: demande.email,
        subject: `Nouvelle proposition reçue - ${demande.codeColis} - AFRIXA`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f7fa;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #004732; margin-bottom: 10px; border-bottom: 3px solid #C59B33; padding-bottom: 10px;">
                NOUVELLE PROPOSITION REÇUE
              </h2>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 25px;">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Bonjour <strong>${demande.nom}</strong>,
              </p>
              
              <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">
                Le transporteur <span style="color: #004732; font-weight: bold;">${transporteurName}</span> 
                a fait une proposition pour votre colis <span style="color: #C59B33; font-weight: bold;">${demande.codeColis}</span>.
              </p>
              
              <div style="background: linear-gradient(135deg, #f9f5e7, #fff); padding: 20px; border-radius: 8px; border-left: 4px solid #C59B33;">
                <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Code Colis:</strong> ${demande.codeColis}</p>
                <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Montant:</strong> ${req.body.montantPropose.toLocaleString()} FC</p>
                <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Délai proposé:</strong> ${req.body.delaiPropose} jours</p>
                <p style="margin: 8px 0;"><strong style="color: #004732; min-width: 150px; display: inline-block;">Transporteur:</strong> ${transporteurName}</p>
              </div>
              
              <p style="color: #666; margin-top: 25px; text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/dashboard" 
                   style="background: #004732; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Voir la proposition
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
    } catch (emailError) {
      console.error('Erreur envoi email offre:', emailError);
    }
    
    res.json({ 
      success: true, 
      message: "Offre envoyée avec succès", 
      data: populatedOffer 
    });
    
  } catch (error) {
    console.error('Error sendOffer:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur" 
    });
  }
};

exports.getMyOffers = async (req, res) => {
  try {
    const offers = await GrandTransportOffer.find({ 
      transporteurId: req.user._id 
    })
    .populate("demandeId", "codeColis nom villeDepart villeArrivee typeMarchandise status")
    .sort({dateEnvoi: -1, createdAt: -1 })
    .lean();

    res.json({ 
      success: true, 
      data: offers 
    });
  } catch (error) {
    console.error('Error getMyOffers:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur" 
    });
  }
};

exports.getOffersForRequest = async (req, res) => {
  try {
    const { demandeId } = req.params;
    
    const offers = await GrandTransportOffer.find({ demandeId })
      .populate("transporteurId", "grandTransporteur entrepriseName telephone adresse")
      .sort({dateEnvoi: -1, createdAt: -1 })
      .lean();

    res.json({ 
      success: true, 
      data: offers 
    });
  } catch (error) {
    console.error('Error getOffersForRequest:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur" 
    });
  }
};