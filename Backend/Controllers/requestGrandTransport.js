const GrandTransport = require('../Models/requestGrandTransport');
const { sendEmail } = require('../Helper/EmailServices');
const { 
    confirmationClientTemplate, 
    notificationAgenceTemplate 
} = require('../Emails/Templates');
const User = require('../Models/User');

const createRequestGrandTransport = async (req, res) => {
    try {
        if (req.user.role !== 'client') {
            return res.status(403).json({ message: 'Accès refusé. Seuls les clients peuvent faire cette demande.' });
        }

        const {
            nom,
            email,
            telephone,
            ville,
            commune,
            adress,
            villeDepart,
            villeArrivee,
            poidsVolume,
            typeMarchandise,
            description,
            typeCamion
        } = req.body;

        let photoUrl = "";
        if (req.file && req.file.cloudinaryUrl) {
            photoUrl = req.file.cloudinaryUrl;
        }

        const newRequest = new GrandTransport({ 
            userId: req.user.id,
            transportId: req.body.transportId,
            typeTransport: "grand_transporteur",
            nom,
            email,
            telephone,
            ville,
            commune,
            adress,
            villeDepart,
            villeArrivee,
            poidsVolume,
            typeMarchandise,
            typeCamion,
            description,
            photoColis: photoUrl
        });

        await newRequest.save();

        try {
            const clientHtml = confirmationClientTemplate(newRequest.nom, newRequest.codeColis);

            await sendEmail({
                to: newRequest.email,
                subject: `Confirmation de votre demande ${newRequest.codeColis} - AFRIXA`,
                html: clientHtml
            });
        } catch (error) {
            console.error("Erreur lors de l'envoi d'email au client :", error);
        }
        try {
            const agence = await User.findById(newRequest.transportId);

            if (agence && agence.email) {

                const agenceHtml = notificationAgenceTemplate(
                    agence.fullName || 'Agence',
                    newRequest.nom,
                    newRequest.telephone,
                    newRequest.codeColis,
                    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/requests/${newRequest._id}`
                );

                await sendEmail({
                    to: agence.email,
                    subject: `Nouvelle demande reçue - Code ${newRequest.codeColis}`,
                    html: agenceHtml
                });
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi d'email à l'agence :", error);
        }


        return res.status(201).json({
            message: 'Demande de grand transport créée avec succès',
            request: newRequest
        });

    } catch (error) {
        console.error('Erreur lors de la création de la demande de grand transport :', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Données manquantes ou invalides',
                errors 
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Erreur de duplication, veuillez réessayer' 
            });
        }
        
        res.status(500).json({ message: 'Erreur serveur lors de la création de la demande' });
    }
};


const getClientRequests = async (req, res) => {
    try {
        if (req.user.role !== 'client') {
            return res.status(403).json({ message: 'Accès refusé. Seuls les clients peuvent voir leurs demandes.' });
        }

        const requests = await GrandTransport.find({ userId: req.user.id }).sort({ date: -1 });

        res.status(200).json({
            message: 'Vos demandes ont été récupérées avec succès',
            requests
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des demandes du client :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des demandes' });
    }
};

const getRequestById = async (req, res) => {
    try {
        if (req.user.role !== 'client') {
            return res.status(403).json({ message: 'Accès refusé. Seuls les clients peuvent voir leurs demandes.' });
        }

        const { id } = req.params;
        const request = await GrandTransport.findById(id);

        if (!request) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }

        if (request.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Accès refusé à cette demande' });
        }

        res.status(200).json({
            message: 'Demande récupérée avec succès',
            request
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de la demande :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération de la demande' });
    }
};

module.exports = {
    createRequestGrandTransport,
    getClientRequests,
    getRequestById
};
