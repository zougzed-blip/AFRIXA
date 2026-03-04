let historiquePage = 1;
let historiqueLoading = false;
let historiqueHasMore = true;
let allHistorique = [];
let historiqueIsLoading = false;

// ==================== FONCTION PRINCIPALE RENOMMÉE ====================
async function fetchHistorique() {
    if (historiqueIsLoading) return;
    
    historiqueIsLoading = true;
    
    try {
        const [demandesResponse, paiementsResponse] = await Promise.all([
            apiFetch(`/api/agence/demandes?page=${historiquePage}&limit=30`),
            apiFetch(`/api/agence/paiements?page=${historiquePage}&limit=30`)
        ]);
        
        let newHistorique = [];

        if (demandesResponse && demandesResponse.ok) {
            const result = await demandesResponse.json();
            let demandes = [];
            
            if (result.success && result.data) {
                if (result.data.demandes) {
                    demandes = result.data.demandes;
                    historiqueHasMore = result.data.hasMore;
                } else if (Array.isArray(result.data)) {
                    demandes = result.data;
                }
            } else if (Array.isArray(result)) {
                demandes = result;
            }
            
            if (Array.isArray(demandes)) {
                demandes.forEach(demande => {
                    if (demande.status === 'accepté' || demande.status === 'annulé' || demande.status === 'livré') {
                        newHistorique.push({
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
            let paiements = [];
            
            if (result.success && result.data) {
                if (result.data.paiements) {
                    paiements = result.data.paiements;
                    historiqueHasMore = result.data.hasMore;
                } else if (Array.isArray(result.data)) {
                    paiements = result.data;
                }
            } else if (Array.isArray(result)) {
                paiements = result;
            }
            
            if (Array.isArray(paiements)) {
                paiements.forEach(paiement => {
                    const statut = paiement.statut || paiement.status;
                    
                    if (statut === 'accepté' || statut === 'refusé') {
                        newHistorique.push({
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
        
        if (historiquePage === 1) {
            allHistorique = newHistorique;
        } else {
            allHistorique = [...allHistorique, ...newHistorique];
        }
        
        allHistorique.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        currentHistorique = allHistorique;
        filterHistorique();
        
    } catch (error) {
        showMessage('Erreur lors du chargement de l\'historique', 'error');
        currentHistorique = [];
        displayHistorique([]);
    } finally {
        historiqueIsLoading = false;
    }
}

function filterHistorique() {
    const startDate = document.getElementById('historique-date-start')?.value;
    const endDate = document.getElementById('historique-date-end')?.value;
    const searchTerm = document.getElementById('search-historique')?.value?.toLowerCase() || '';
    const activeFilter = document.querySelector('#historique .filter-btn.active');
    
    let filtered = [...allHistorique];

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

// ==================== INFINITE SCROLL HISTORIQUE ====================
function handleHistoriqueScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const scrollPosition = scrollY + windowHeight;
    const distanceFromBottom = documentHeight - scrollPosition;
    
    if (distanceFromBottom < 200 && !historiqueLoading && historiqueHasMore && !historiqueIsLoading) {
        loadMoreHistorique();
    }
}

async function loadMoreHistorique() {
    if (historiqueLoading || !historiqueHasMore || historiqueIsLoading) return;
    
    historiqueLoading = true;
    historiquePage++;
    await fetchHistorique(); 
    historiqueLoading = false;
}

// ==================== INITIALISATION ====================
window.loadHistorique = function() {
    if (historiqueIsLoading) return;
    
    historiquePage = 1;
    historiqueHasMore = true;
    allHistorique = [];
    window.removeEventListener('scroll', handleHistoriqueScroll);
    window.addEventListener('scroll', handleHistoriqueScroll);
    fetchHistorique();
};

window.filterHistorique = filterHistorique;
window.filterHistoriqueByType = filterHistoriqueByType;
window.loadMoreHistorique = loadMoreHistorique;