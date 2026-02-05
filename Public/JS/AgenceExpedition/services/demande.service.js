async function loadDemandes() {
    try {
        const response = await apiFetch('/api/agence/demandes');
        if (!response || !response.ok) {
            showMessage('Erreur lors du chargement des demandes', 'error');
            return;
        }
        
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
            currentDemandes = result.data;
        } else if (Array.isArray(result)) {
            currentDemandes = result;
        } else {
            currentDemandes = [];
        }
        
        filterDemandes();
        
    } catch (error) {
        showMessage('Erreur lors du chargement des demandes', 'error');
        currentDemandes = [];
        displayDemandes([]);
    }
}

function filterDemandes() {
    const startDate = document.getElementById('demandes-date-start')?.value;
    const endDate = document.getElementById('demandes-date-end')?.value;
    const searchTerm = document.getElementById('search-demandes')?.value?.toLowerCase() || '';
    const activeFilter = document.querySelector('#demandes .filter-btn.active');
    
    let filtered = [...currentDemandes];
    
    if (activeFilter) {
        const filterStatus = activeFilter.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (filterStatus && filterStatus !== 'all') {
            filtered = filtered.filter(d => d.status === filterStatus);
        }
    }
    
    if (searchTerm) {
        filtered = filtered.filter(demande => {
            return (demande.codeColis || '').toLowerCase().includes(searchTerm) ||
                   (demande.fullName || '').toLowerCase().includes(searchTerm) ||
                   (demande.email || '').toLowerCase().includes(searchTerm) ||
                   (demande.telephone || '').toLowerCase().includes(searchTerm) ||
                   (demande.destination || '').toLowerCase().includes(searchTerm);
        });
    }
    
    if (startDate) {
        filtered = filtered.filter(d => {
            const demandeDate = new Date(d.date || d.createdAt);
            return demandeDate >= new Date(startDate);
        });
    }
    
    if (endDate) {
        filtered = filtered.filter(d => {
            const demandeDate = new Date(d.date || d.createdAt);
            const endDateObj = new Date(endDate + 'T23:59:59');
            return demandeDate <= endDateObj;
        });
    }
    
    document.getElementById('demandes-total').textContent = filtered.length;
    
    displayDemandes(filtered);
}

function filterDemandesByStatus(status) {
    const buttons = document.querySelectorAll('#demandes .filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.filter-btn').classList.add('active');
    
    filterDemandes();
}

window.loadDemandes = loadDemandes;
window.filterDemandes = filterDemandes;
window.filterDemandesByStatus = filterDemandesByStatus;