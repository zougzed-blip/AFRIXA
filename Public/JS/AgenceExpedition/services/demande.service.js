// ==================== VARIABLES PAGINATION ====================
let demandesPage = 1;
let demandesLoading = false;
let demandesHasMore = true;
let allDemandes = [];
let isLoading = false;

// ==================== FONCTION PRINCIPALE ====================
async function fetchDemandes() {
    if (isLoading) return;
    
    isLoading = true;
    
    try {
        const response = await apiFetch(`/api/agence/demandes?page=${demandesPage}&limit=30`);
        if (!response || !response.ok) {
            showMessage('Erreur lors du chargement des demandes', 'error');
            isLoading = false;
            return;
        }
        
        const result = await response.json();
        
        let newDemandes = [];
        
        if (result.success && result.data) {
            if (result.data.demandes) {
                newDemandes = result.data.demandes;
                demandesHasMore = result.data.hasMore;
            } else if (Array.isArray(result.data)) {
                newDemandes = result.data;
                demandesHasMore = false;
            }
        } else if (Array.isArray(result)) {
            newDemandes = result;
            demandesHasMore = false;
        }
        
        if (demandesPage === 1) {
            allDemandes = newDemandes;
        } else {
            allDemandes = [...allDemandes, ...newDemandes];
        }
        
        currentDemandes = allDemandes;
        filterDemandes();
        
    } catch (error) {
        showMessage('Erreur lors du chargement des demandes', 'error');
        currentDemandes = [];
        displayDemandes([]);
    } finally {
        isLoading = false;
    }
}

function filterDemandes() {
    const startDate = document.getElementById('demandes-date-start')?.value;
    const endDate = document.getElementById('demandes-date-end')?.value;
    const searchTerm = document.getElementById('search-demandes')?.value?.toLowerCase() || '';
    const activeFilter = document.querySelector('#demandes .filter-btn.active');
    
    let filtered = [...allDemandes];
    
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

// ==================== INFINITE SCROLL ====================
function handleScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const scrollPosition = scrollY + windowHeight;
    const distanceFromBottom = documentHeight - scrollPosition;
    
    if (distanceFromBottom < 200 && !demandesLoading && demandesHasMore && !isLoading) {
        loadMoreDemandes();
    }
}

async function loadMoreDemandes() {
    if (demandesLoading || !demandesHasMore || isLoading) return;
    
    demandesLoading = true;
    demandesPage++;
    await fetchDemandes();
    demandesLoading = false;
}

// ==================== INITIALISATION (UNE SEULE FOIS) ====================
window.loadDemandes = function() {
    if (isLoading) return;
    
    demandesPage = 1;
    demandesHasMore = true;
    allDemandes = [];
    window.removeEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll);
    fetchDemandes();
};

window.filterDemandes = filterDemandes;
window.filterDemandesByStatus = filterDemandesByStatus;
window.loadMoreDemandes = loadMoreDemandes;