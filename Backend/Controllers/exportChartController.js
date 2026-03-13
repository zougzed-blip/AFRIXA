const PaymentProof = require('../Models/paymentModel');       
const DemandeAgenceV2 = require('../Models/agenceModel');     

exports.exportByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'La date est requise mon bro!'
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dateFilter = {
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    const payments = await PaymentProof.find(dateFilter)
      .populate('user', 'fullName email telephone')
      .sort({ createdAt: -1 })
      .lean()

    const demandes = await DemandeAgenceV2.find(dateFilter)
      .populate('user', 'fullName email telephone')
      .populate('agence', 'email agence.agenceName fullName telephone')
      .sort({ createdAt: -1 })
      .lean();

    const dateFormatted = new Date(date).toLocaleDateString('fr-FR')
      .replace(/\//g, '-');
    
    const filename = `export_${dateFormatted}.csv`;
    
    let csvContent = '';

    // ===== SECTION PAIEMENTS =====
    csvContent += '=== PAIEMENTS ===\n';
    csvContent += [
      'Heure',
      'Code Colis',
      'Client Name',
      'Montant',
      'Devise',
      'Méthode',
      'Status',
      'Uploaded At'
    ].join(',') + '\n';

    payments.forEach(p => {
      const ligne = [
        new Date(p.createdAt).toLocaleTimeString('fr-FR'),
        p.codeColis || 'N/A',
        p.clientName || 'N/A',
        p.montant || 0,
        p.devise || 'USD',
        p.method || 'N/A',
        p.status || 'N/A',
        p.uploadedAt ? new Date(p.uploadedAt).toLocaleString('fr-FR') : 'N/A'
      ];
      
      csvContent += ligne.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(',') + '\n';
    });

    csvContent += '\n';

    // ===== SECTION DEMANDES =====
    csvContent += '=== DEMANDES ===\n';
    csvContent += [
      'Code Colis',
      'Client',
      'Destination',
      'Prix',
      'Statut',
      'Date'
    ].join(',') + '\n';

    demandes.forEach(d => {
    
      const prix = d.prix || d.prixAjuste || '0';
      
      const ligne = [
        d.codeColis || 'N/A',
        d.fullName || 'N/A',
        d.destination || 'N/A',
        prix,
        d.status || 'en_attente',
        d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : 'N/A'
      ];
      
      csvContent += ligne.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(',') + '\n';
    });

    // ===== ENVOYER LE FICHIER =====
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf-8'));
    
    res.status(200).send(csvContent);

  } catch (error) {
    console.error('ERREUR EXPORT:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export',
      error: error.message
    });
  }
};


exports.getChartEvolution = async (req, res) => {
  try {
    const { jours = 30 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(jours));

    const dates = [];
    const labels = [];
    for (let i = 0; i < jours; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
      labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
    }

    // DEMANDES
    const demandesAgg = await DemandeAgenceV2.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, nombre: { $sum: 1 } } }
    ]);

    // PAIEMENTS - DONNÉES BRUTES avec devise
    const paiementsAgg = await PaymentProof.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'accepté' } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          montantTotal: { $sum: "$montant" },
          paiements: { $push: { montant: "$montant", devise: "$devise" } }
        } 
      }
    ]);

    const demandesMap = new Map(demandesAgg.map(item => [item._id, item.nombre]));
    const paiementsMap = new Map(paiementsAgg.map(item => [item._id, item.paiements]));

    const demandesData = [];
    const paiementsData = [];

    dates.forEach(date => {
      demandesData.push(demandesMap.get(date) || 0);
      paiementsData.push(paiementsMap.get(date) || []);
    });

    res.json({
      success: true,
      data: {
        labels,
        demandes: demandesData,
        paiements: paiementsData, 
        stats: {
          totalDemandes: demandesData.reduce((a, b) => a + b, 0)
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};