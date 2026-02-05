async function loadHistorique() {
    try {
        const [demandesResponse, paiementsResponse] = await Promise.all([
            apiFetch('/api/agence/demandes'),
            apiFetch('/api/agence/paiements')
        ]);
        
        currentHistorique = [];

        if (demandesResponse && demandesResponse.ok) {
            const result = await demandesResponse.json();
            const demandes = result.success ? result.data : result;
            
            if (Array.isArray(demandes)) {
                demandes.forEach(demande => {
                    if (demande.status === 'accepté' || demande.status === 'annulé' || demande.status === 'livré') {
                        const date = new Date(demande.date || demande.createdAt);
                        const formattedDate = date.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        });
                        
                        currentHistorique.push({
                            type: 'demande',
                            date: demande.date || demande.createdAt,
                            codeColis: demande.codeColis,
                            nom: demande.fullName,
                            description: `Demande ${demande.status === 'accepté' ? 'acceptée' : demande.status === 'livré' ? 'livrée' : 'annulée'}`,
                            status: demande.status,
                            montant: demande.prix || demande.prixFinal || 0
                        });
                    }
                });
            }
        }

        if (paiementsResponse && paiementsResponse.ok) {
            const result = await paiementsResponse.json();
            const paiements = result.success ? result.data : result;
            
            if (Array.isArray(paiements)) {
                paiements.forEach(paiement => {
                    const statut = paiement.statut || paiement.status;
                    
                    if (statut === 'accepté' || statut === 'refusé') {
                        const date = new Date(paiement.uploadedAt || paiement.createdAt);
                        const formattedDate = date.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        });
                        
                        currentHistorique.push({
                            type: 'paiement',
                            date: paiement.uploadedAt || paiement.createdAt,
                            codeColis: paiement.codeColis,
                            nom: paiement.clientName || paiement.nom || paiement.fullName,
                            description: `Paiement ${statut === 'accepté' ? 'accepté' : 'refusé'}`,
                            status: statut,
                            montant: paiement.montant || 0,
                            devise: paiement.devise || 'USD'
                        });
                    }
                });
            }
        }
        
        currentHistorique.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        filterHistorique();
        
    } catch (error) {
        showMessage('Erreur lors du chargement de l\'historique', 'error');
        currentHistorique = [];
        displayHistorique([]);
    }
}

function filterHistorique() {
    const startDate = document.getElementById('historique-date-start')?.value;
    const endDate = document.getElementById('historique-date-end')?.value;
    const searchTerm = document.getElementById('search-historique')?.value?.toLowerCase() || '';
    const activeFilter = document.querySelector('#historique .filter-btn.active');
    
    let filtered = [...currentHistorique];

    if (activeFilter) {
        const filterType = activeFilter.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (filterType && filterType !== 'all') {
            filtered = filtered.filter(h => h.type === filterType);
        }
    }

    if (searchTerm) {
        filtered = filtered.filter(historique => {
            return (historique.codeColis || '').toLowerCase().includes(searchTerm) ||
                   (historique.nom || '').toLowerCase().includes(searchTerm) ||
                   (historique.description || '').toLowerCase().includes(searchTerm);
        });
    }

    if (startDate) {
        filtered = filtered.filter(h => {
            const historiqueDate = new Date(h.date);
            return historiqueDate >= new Date(startDate);
        });
    }

    if (endDate) {
        filtered = filtered.filter(h => {
            const historiqueDate = new Date(h.date);
            const endDateObj = new Date(endDate + 'T23:59:59');
            return historiqueDate <= endDateObj;
        });
    }

    displayHistorique(filtered);
}

function filterHistoriqueByType(type) {
    const buttons = document.querySelectorAll('#historique .filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.filter-btn').classList.add('active');
    
    filterHistorique();
}

window.loadHistorique = loadHistorique;
window.filterHistorique = filterHistorique;
window.filterHistoriqueByType = filterHistoriqueByType;