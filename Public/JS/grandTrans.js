
const API_BASE = '/api';
let currentUser = null;
let currentDemandes = [];
let currentPropositions = [];
let currentConfirmes = [];
let currentHistory = [];


let badgeRefreshInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializePanel();
});

async function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    await loadUserProfile();
}

async function loadUserProfile() {
    try {
        const response = await apiFetch('/api/user/profile');
        if (response && response.ok) {
            const result = await response.json();
            console.log('👤 User data reçu:', result);
            
            currentUser = result.success ? result.data : result;
            updateUserInfo();
        }
    } catch (error) {
        console.error('Erreur chargement profil:', error);
    }
}

function updateUserInfo() {
    if (!currentUser) {
        console.warn(' currentUser est null');
        return;
    }
    
    console.log(' Mise à jour UI avec:', currentUser);
    
    const userName = document.getElementById('transporteur-name');
    const userFullname = document.getElementById('user-fullname');
    const adminName = document.querySelector('.admin-name');
    const avatarInitials = document.getElementById('avatar-initials');
    const userAvatar = document.getElementById('user-avatar');
    const profilePicture = document.getElementById('profile-picture');
    const profileAvatarPreview = document.getElementById('profile-avatar-preview');
    
    let displayName = '';
    let profilePhoto = currentUser.profilePhoto;
    let initials = 'T';
    
    if (currentUser.role === 'grand_transporteur' && 
        currentUser.grandTransporteur?.entrepriseName) {
        displayName = currentUser.grandTransporteur.entrepriseName;
        initials = getInitials(displayName);
    } else if (currentUser.fullName) {
        displayName = currentUser.fullName;
        initials = getInitials(displayName);
    }
    
    console.log('✅ Nom à afficher:', displayName);
    console.log('📸 Photo de profil:', profilePhoto);
    
    if (userName) userName.textContent = displayName || 'Transporteur';
    if (userFullname) userFullname.textContent = displayName || 'Transporteur';
    if (adminName) adminName.textContent = displayName || 'Transporteur';
    
    // Gérer l'avatar et la photo de profil
    if (avatarInitials) {
        if (profilePhoto) {
            // Afficher la photo si disponible
            if (userAvatar) {
                userAvatar.src = profilePhoto;
                userAvatar.style.display = 'block';
            }
            if (profilePicture) {
                profilePicture.src = profilePhoto;
                profilePicture.style.display = 'block';
            }
            avatarInitials.style.display = 'none';
        } else {
            // Afficher les initiales si pas de photo
            if (userAvatar) userAvatar.style.display = 'none';
            if (profilePicture) profilePicture.style.display = 'none';
            avatarInitials.textContent = initials;
            avatarInitials.style.display = 'flex';
        }
    }
    
    // Mettre à jour le preview de l'avatar dans les paramètres
    if (profileAvatarPreview && profilePhoto) {
        profileAvatarPreview.innerHTML = `<img id="profile-picture" src="${profilePhoto}" alt="Photo de profil">`;
    }
}

function initializePanel() {
    setupNavigation();
    setupEventListeners();
    loadDashboardData();
    startBadgeAutoRefresh();
    loadPayments().then(() => {
        if (currentPayments.length > 0) {
            displayLastEarnings();
        }
    });
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

// ==================== SYSTÈME DE BADGES ====================

function getSeenCount(badgeType) {
    const key = `seen_${badgeType}`;
    return parseInt(localStorage.getItem(key) || '0');
}

function setSeenCount(badgeType, count) {
    const key = `seen_${badgeType}`;
    localStorage.setItem(key, count.toString());
}

function updateBadge(badgeType, totalCount) {
    const badge = document.getElementById(`${badgeType}-count`);
    if (!badge) return;
    
    const seenCount = getSeenCount(badgeType);
    const newItemsCount = Math.max(0, totalCount - seenCount);
    
    console.log(`🔔 Badge ${badgeType}:`, {
        total: totalCount,
        seen: seenCount,
        new: newItemsCount
    });
    
    if (newItemsCount > 0) {
        badge.textContent = newItemsCount;
        badge.classList.remove('hidden');
        
        badge.style.animation = 'none';
        setTimeout(() => {
            badge.style.animation = 'badgePulse 0.6s ease 3';
        }, 10);
    } else {
        badge.classList.add('hidden');
    }
}

function clearBadge(badgeType) {
    console.log(`👆 Click sur badge: ${badgeType}`);
    
    const badge = document.getElementById(`${badgeType}-count`);
    if (!badge) return;
    
    getCurrentTotal(badgeType).then(total => {
        setSeenCount(badgeType, total);
        badge.classList.add('hidden');
        badge.textContent = '0';
        
        console.log(`✅ Badge ${badgeType} cleared. Total vu: ${total}`);
    });
}

async function getCurrentTotal(badgeType) {
    try {
        switch(badgeType) {
            case 'new-demands':
                const demandesResp = await apiFetch('/api/grandTransportfetch/requests?status=en_attente&limit=1000');
                if (demandesResp && demandesResp.ok) {
                    const result = await demandesResp.json();
                    return result.data?.length || 0;
                }
                break;
                
            case 'pending-proposals':
                const propsResp = await apiFetch('/api/transporteur/offers/my');
                if (propsResp && propsResp.ok) {
                    const result = await propsResp.json();
                    const data = result.success ? result.data : result;
                    return data.filter(p => p.status === 'en_attente').length;
                }
                break;
                
            case 'confirmed':
                const confResp = await apiFetch('/api/transporteur/offers/my');
                if (confResp && confResp.ok) {
                    const result = await confResp.json();
                    const data = result.success ? result.data : result;
                    return data.filter(p => 
                        p.status === 'accepté_par_client' || 
                        p.status === 'en_cours' || 
                        p.status === 'livré'
                    ).length;
                }
                break;
        }
    } catch (error) {
        console.error('Erreur getCurrentTotal:', error);
    }
    return 0;
}

async function loadBadgeCounts() {
    try {
        console.log('🔄 Chargement badges...');
        
        const demandesResp = await apiFetch('/api/grandTransportfetch/requests?status=en_attente&limit=1000');
        if (demandesResp && demandesResp.ok) {
            const result = await demandesResp.json();
            const total = result.data?.length || 0;
            updateBadge('new-demands', total);
        }
        
        const propsResp = await apiFetch('/api/transporteur/offers/my');
        if (propsResp && propsResp.ok) {
            const result = await propsResp.json();
            const data = result.success ? result.data : result;
            const pending = data.filter(p => p.status === 'en_attente').length;
            updateBadge('pending-proposals', pending);
        }
 
        const confResp = await apiFetch('/api/transporteur/offers/my');
        if (confResp && confResp.ok) {
            const result = await confResp.json();
            const data = result.success ? result.data : result;
            const confirmed = data.filter(p => 
                p.status === 'accepté_par_client' || 
                p.status === 'en_cours' || 
                p.status === 'livré'
            ).length;
            updateBadge('confirmed', confirmed);
        }
        
        console.log('✅ Badges mis à jour');
        
    } catch (error) {
        console.error('Erreur loadBadgeCounts:', error);
    }
}

function startBadgeAutoRefresh() {
    loadBadgeCounts();
    
    if (badgeRefreshInterval) {
        clearInterval(badgeRefreshInterval);
    }
    
    badgeRefreshInterval = setInterval(() => {
        loadBadgeCounts();
    }, 10000);
    
    console.log('🔄 Auto-refresh badges activé (10s)');
}

function stopBadgeAutoRefresh() {
    if (badgeRefreshInterval) {
        clearInterval(badgeRefreshInterval);
        badgeRefreshInterval = null;
        console.log('⏸️ Auto-refresh badges arrêté');
    }
}

// ==================== NAVIGATION ====================
function setupNavigation() {
    document.querySelectorAll('.nav-item a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') && this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const sectionId = this.getAttribute('href').substring(1);
                showSection(sectionId);
                
                // Fermer sidebar sur mobile
                if (window.innerWidth <= 1024) {
                    document.querySelector('.sidebar').classList.remove('active');
                }
            }
        });
    });
}

function setupEventListeners() {
    // Filtres et recherches
    const searchDemand = document.getElementById('search-demand');
    const statusFilter = document.getElementById('status-filter');
    const propositionStatus = document.getElementById('proposition-status');
    const historyType = document.getElementById('history-type');
    const confirmeStatusFilter = document.getElementById('confirme-status-filter');
    
    const searchPropositions = document.getElementById('search-propositions');
    const searchConfirmes = document.getElementById('search-confirmes');
    const searchHistory = document.getElementById('search-history');
    
    if (searchDemand) searchDemand.addEventListener('input', () => searchSection('demandes'));
    if (statusFilter) statusFilter.addEventListener('change', filterDemandes);
    if (searchPropositions) searchPropositions.addEventListener('input', () => searchSection('propositions'));
    if (propositionStatus) propositionStatus.addEventListener('change', filterPropositions);
    if (searchConfirmes) searchConfirmes.addEventListener('input', () => searchSection('confirmes'));
    if (confirmeStatusFilter) confirmeStatusFilter.addEventListener('change', filterConfirmes);
    if (searchHistory) searchHistory.addEventListener('input', () => searchSection('historique'));
    if (historyType) historyType.addEventListener('change', filterHistory);
    
    // Gestion des photos de profil
    const uploadAvatar = document.getElementById('upload-avatar');
    if (uploadAvatar) {
        uploadAvatar.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                showPopup('Veuillez sélectionner une image', 'error');
                return;
            }
            
            if (file.size > 2 * 1024 * 1024) { // 2MB
                showPopup('L\'image doit faire moins de 2MB', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.getElementById('profile-picture');
                if (img) {
                    img.src = event.target.result;
                }
                
                // Ici, vous devriez uploader l'image vers le backend
                // Pour l'instant, on la stocke localement
                localStorage.setItem('temp_avatar', event.target.result);
                showPopup('Photo mise à jour avec succès', 'success');
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

// ==================== RECHERCHE ET FILTRES ====================
function searchSection(sectionId) {
    const searchTerm = document.getElementById(`search-${sectionId}`)?.value?.toLowerCase() || '';
    
    switch(sectionId) {
        case 'demandes':
            filterDemandes();
            break;
        case 'propositions':
            filterPropositionsSearch(searchTerm);
            break;
        case 'confirmes':
            filterConfirmesSearch(searchTerm);
            break;
        case 'historique':
            filterHistorySearch(searchTerm);
            break;
    }
}

function filterPropositionsSearch(searchTerm) {
    if (!searchTerm) {
        displayPropositions(currentPropositions);
        return;
    }
    
    const filtered = currentPropositions.filter(prop => {
        const codeColis = prop.demandeId?.codeColis || '';
        const montant = prop.montantPropose?.toString() || '';
        const delai = prop.delaiPropose?.toString() || '';
        const camion = prop.couleurCamion || '';
        const plaque = prop.plaqueImmatriculation || '';
        const description = prop.description || '';
        
        return codeColis.toLowerCase().includes(searchTerm) ||
               montant.includes(searchTerm) ||
               delai.includes(searchTerm) ||
               camion.toLowerCase().includes(searchTerm) ||
               plaque.toLowerCase().includes(searchTerm) ||
               description.toLowerCase().includes(searchTerm);
    });
    
    displayPropositions(filtered);
}

function filterConfirmesSearch(searchTerm) {
    if (!searchTerm) {
        displayConfirmes(currentConfirmes);
        return;
    }
    
    const filtered = currentConfirmes.filter(conf => {
        const codeColis = conf.demandeId?.codeColis || '';
        const client = conf.demandeId?.nom || '';
        const depart = conf.demandeId?.villeDepart || '';
        const arrivee = conf.demandeId?.villeArrivee || '';
        const montant = conf.montantPropose?.toString() || '';
        
        return codeColis.toLowerCase().includes(searchTerm) ||
               client.toLowerCase().includes(searchTerm) ||
               depart.toLowerCase().includes(searchTerm) ||
               arrivee.toLowerCase().includes(searchTerm) ||
               montant.includes(searchTerm);
    });
    
    displayConfirmes(filtered);
}

function filterHistorySearch(searchTerm) {
    console.log('🔍 Recherche historique:', searchTerm);
    
    if (!searchTerm) {
        filterHistory();
        return;
    }
    
    const filtered = currentHistory.filter(item => {
        const codeColis = item.demandeId?.codeColis || '';
        const client = item.demandeId?.nom || '';
        const depart = item.demandeId?.villeDepart || '';
        const arrivee = item.demandeId?.villeArrivee || '';
        const montant = item.montantPropose?.toString() || '';
        
        let dateStr = '';
        try {
            const dateValue = item.date || item.dateEnvoi || item.createdAt || item.created_at;
            if (dateValue) {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    dateStr = date.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    }).toLowerCase();
                }
            }
        } catch (e) {
            console.warn('⚠️ Date invalide pour recherche');
        }
        
        return codeColis.toLowerCase().includes(searchTerm) ||
               client.toLowerCase().includes(searchTerm) ||
               depart.toLowerCase().includes(searchTerm) ||
               arrivee.toLowerCase().includes(searchTerm) ||
               montant.includes(searchTerm) ||
               dateStr.includes(searchTerm);
    });
    
    console.log('✅ Résultats recherche historique:', filtered.length);
    displayHistory(filtered);
}

function showSection(sectionId) {
    // Mettre à jour la navigation active
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
    if (activeLink) activeLink.parentElement.classList.add('active');
    
    // Afficher la section active
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    const activeSection = document.getElementById(sectionId);
    if (activeSection) activeSection.classList.add('active');
    
    updatePageTitle(sectionId);

    // Mettre à jour les badges quand on visite une section
    switch(sectionId) {
        case 'demandes':
            getCurrentTotal('new-demands').then(total => {
                setSeenCount('new-demands', total);
                updateBadge('new-demands', total);
            });
            break;
            
        case 'propositions':
            getCurrentTotal('pending-proposals').then(total => {
                setSeenCount('pending-proposals', total);
                updateBadge('pending-proposals', total);
            });
            break;
            
        case 'confirmes':
            getCurrentTotal('confirmed').then(total => {
                setSeenCount('confirmed', total);
                updateBadge('confirmed', total);
            });
            break;
    }
    
    // Charger données selon section
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'demandes':
            loadDemandes();
            break;
        case 'propositions':
            loadPropositions();
            break;
        case 'confirmes':
            loadConfirmes();
            break;
        case 'historique':
            loadHistory();
            break;case 'paiements':
            loadPayments(); 
            break;

        case 'parametres':
            loadProfileData();
            break;
    }
}

function updatePageTitle(sectionId) {
    const titles = {
        'dashboard': 'Dashboard',
        'demandes': 'Demandes',
        'propositions': 'Mes Propositions',
        'confirmes': 'Livraisons Confirmées',
        'historique': 'Historique',
        'parametres': 'Paramètres'
    };
    
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = titles[sectionId] || 'Dashboard';
}

// ==================== DASHBOARD ====================
async function loadDashboardData() {
    try {
        const statsResponse = await apiFetch('/api/grandTransportfetch/dashboard-stats');
        if (statsResponse && statsResponse.ok) {
            const result = await statsResponse.json();
            console.log('📊 Dashboard data:', result);
            
            const data = result.success ? result.data : result;
            
            updateDashboardStats(data);
            
            if (data.recentActivities) {
                displayRecentActivities(data.recentActivities);
            }
            
            if (data.demandesEnAttente !== undefined) {
                updateBadge('new-demands', data.demandesEnAttente);
            }
        }
        if (currentPayments.length > 0) {
            displayLastEarnings();
        }
    } catch (error) {
        console.error('Erreur dashboard:', error);
        showPopup('Erreur lors du chargement du dashboard', 'error');
    }
}

function updateDashboardStats(data) {
    if (!data) return;
    
    console.log('📈 Mise à jour stats:', data);
    
    const elements = {
        'total-demandes': data.totalDemandes || 0,
        'total-en-attente': data.demandesEnAttente || 0,
        'total-acceptees': data.propositionsAcceptees || 0,
        'total-refusees': data.propositionsRefusees || 0
    };
    
    for (const [elementId, value] of Object.entries(elements)) {
        const element = document.getElementById(elementId);
        if (element) element.textContent = value;
    }
}

function displayRecentActivities(activities) {
    const container = document.getElementById('recent-activities');
    if (!container) return;
    
    if (!activities || activities.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Aucune activité récente</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-info">
                <p><strong>${activity.message}</strong></p>
            </div>
        </div>
    `).join('');
}

// ==================== DEMANDES ====================
async function loadDemandes() {
    try {
        const response = await apiFetch('/api/grandTransportfetch/requests');
        if (!response || !response.ok) {
            showPopup('Erreur lors du chargement des demandes', 'error');
            return;
        }
        
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
            currentDemandes = result.data;
        } else if (Array.isArray(result)) {
            currentDemandes = result;
        } else {
            console.error('Format de réponse invalide:', result);
            currentDemandes = [];
        }
        
        displayDemandes(currentDemandes.filter(d => d.status === 'en_attente'));
        updateDemandesCount();

        const newDemands = currentDemandes.filter(d => d.status === 'en_attente').length;
        updateBadge('new-demands', newDemands);

        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.value = 'en_attente';
        }
        
    } catch (error) {
        console.error('Erreur chargement demandes:', error);
        showPopup('Erreur lors du chargement des demandes', 'error');
        currentDemandes = [];
        displayDemandes([]);
    }
}

function displayDemandes(demandes) {
    const container = document.getElementById('requests-list');
    if (!container) return;
    
    if (!demandes || demandes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Aucune demande disponible</p>
                <p class="small">Les demandes acceptées ou refusées ne sont pas affichées ici</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = demandes.map(demande => {
        const date = new Date(demande.date);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="request-card" data-id="${demande._id}" data-status="${demande.status}">
                <div class="request-header">
                    <h4>${demande.codeColis}</h4>
                    <span class="request-date">${formattedDate}</span>
                    ${demande.status === 'en_attente' ? '<span class="urgent-badge">NOUVELLE</span>' : ''}
                    <span class="payment-badge ${demande.paymentStatus === 'payé' ? 'paid' : 'unpaid'}">
                        ${demande.paymentStatus === 'payé' ? 'PAYÉ' : 'NON PAYÉ'}
                    </span>
                </div>
                <div class="request-body">
                    <div class="client-info">
                        <div class="client-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <h5>${demande.nom}</h5>
                            <small>${demande.email} • ${demande.telephone}</small>
                            <small>${demande.ville}, ${demande.commune}</small>
                        </div>
                    </div>
                    <div class="request-details">
                        <div class="detail-item">
                            <i class="fas fa-route"></i>
                            <div>
                                <strong>Trajet</strong>
                                <span>${demande.villeDepart} → ${demande.villeArrivee}</span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-weight"></i>
                            <div>
                                <strong>Poids/Volume</strong>
                                <span>${demande.poidsVolume}</span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-box"></i>
                            <div>
                                <strong>Marchandise</strong>
                                <span>${demande.typeMarchandise}</span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-truck"></i>
                            <div>
                                <strong>Camion</strong>
                                <span>${demande.typeCamion}</span>
                            </div>
                        </div>
                    </div>
                    ${demande.description ? `
                    <div class="request-message">
                        <p><i class="fas fa-comment"></i> "${demande.description}"</p>
                    </div>
                    ` : ''}
                    ${demande.photoColis ? `
                    <div class="request-photo">
                        <small><i class="fas fa-image"></i> Photo disponible</small>
                    </div>
                    ` : ''}
                </div>
                <div class="request-actions">
                    <button class="btn btn-view" onclick="viewDemandeDetails('${demande._id}')">
                        <i class="fas fa-eye"></i> Voir détails
                    </button>
                    ${demande.status === 'en_attente' ? `
                    <button class="btn btn-primary" onclick="openAnalysisModal('${demande._id}', '${demande.codeColis}')">
                        <i class="fas fa-search-dollar"></i> Analyser et proposer
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function updateDemandesCount() {
    const countElement = document.getElementById('demandes-count');
    if (countElement) countElement.textContent = currentDemandes.filter(d => d.status === 'en_attente').length;
}

function filterDemandes() {
    const searchTerm = document.getElementById('search-demand')?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById('status-filter')?.value || 'en_attente';
    
    let filtered = currentDemandes;
    
    // Filtre par statut
    if (statusFilter !== 'all') {
        filtered = filtered.filter(d => d.status === statusFilter);
    }
    
    // Filtre par recherche
    if (searchTerm) {
        filtered = filtered.filter(demande => {
            return demande.codeColis.toLowerCase().includes(searchTerm) ||
                   demande.nom.toLowerCase().includes(searchTerm) ||
                   demande.villeDepart.toLowerCase().includes(searchTerm) ||
                   demande.villeArrivee.toLowerCase().includes(searchTerm);
        });
    }
    
    displayDemandes(filtered);
}
// ==================== PAIEMENTS ====================
let currentPayments = [];

async function loadPayments() {
    try {
        // Utilise ta route admin qui existe déjà
        const response = await apiFetch('/api/admin/payment-proofs');
        if (!response || !response.ok) {
            showPopup('Erreur lors du chargement des paiements', 'error');
            return;
        }
        
        const result = await response.json();
        console.log('💰 Paiements reçus:', result);
        
        // Filtrer SEULEMENT les paiements pour CET utilisateur
        currentPayments = result.filter(payment => {
            return payment.user && payment.user.toString() === currentUser._id;
        });
        
        displayPayments(currentPayments);
        
    } catch (error) {
        console.error('Erreur chargement paiements:', error);
        showPopup('Erreur lors du chargement des paiements', 'error');
        currentPayments = [];
        displayPayments([]);
    }
}

function displayPayments(payments) {
    const container = document.getElementById('payments-table-body');
    if (!container) return;
    
    if (!payments || payments.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem;">
                    <div class="empty-state">
                        <i class="fas fa-money-bill-wave"></i>
                        <p>Aucun paiement reçu</p>
                        <p class="small">Les preuves de paiement envoyées par l'admin apparaîtront ici</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Trier du plus récent au plus ancien
    const sortedPayments = [...payments].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.uploadedAt);
        const dateB = new Date(b.createdAt || b.uploadedAt);
        return dateB - dateA; // Plus récent d'abord
    });
    
    container.innerHTML = sortedPayments.map(payment => {
        const date = new Date(payment.createdAt || payment.uploadedAt);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td><strong>${payment.codeColis}</strong></td>
                <td>${payment.clientName}</td>
                <td><span class="price">${payment.montant?.toLocaleString() || 0} ${payment.devise || 'USD'}</span></td>
                <td>${payment.devise || 'USD'}</td>
                <td>
                    ${payment.proofUrl ? 
                        `<button class="btn-action btn-view" onclick="window.open('${payment.proofUrl}', '_blank')" title="Voir la preuve">
                            <i class="fas fa-eye"></i> Voir
                        </button>` : 
                        'Pas de preuve'}
                </td>
            </tr>
        `;
    }).join('');
}

// ==================== DERNIERS GAINS ====================
function displayLastEarnings() {
    const container = document.getElementById('earnings-summary');
    if (!container) return;
    
    if (!currentPayments || currentPayments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-money-bill-wave"></i>
                <p>Aucun paiement reçu</p>
            </div>
        `;
        return;
    }
    
    // Prendre les 5 derniers paiements
    const last5Payments = [...currentPayments]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    container.innerHTML = `
        <div class="earnings-list">
            ${last5Payments.map(payment => {
                const date = new Date(payment.createdAt || payment.uploadedAt);
                const formattedDate = date.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short'
                });
                
                return `
                    <div class="earning-item">
                        <div class="earning-info">
                            <h4>${payment.codeColis}</h4>
                            <p>${formattedDate}</p>
                        </div>
                        <div class="earning-amount">
                            <strong>${payment.montant?.toLocaleString() || 0} ${payment.devise || 'USD'}</strong>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="earnings-total" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gris-border);">
            <p><strong>Total reçu:</strong> ${currentPayments.reduce((sum, p) => sum + (p.montant || 0), 0).toLocaleString()} USD</p>
        </div>
    `;
}
// ==================== PROPOSITIONS ====================
async function loadPropositions() {
    try {
        const response = await apiFetch('/api/transporteur/offers/my');
        if (!response || !response.ok) {
            showPopup('Erreur lors du chargement des propositions', 'error');
            return;
        }
        
        const result = await response.json();
        console.log('📨 Propositions reçues:', result);
        
        if (result.success && Array.isArray(result.data)) {
            currentPropositions = result.data;
        } else if (Array.isArray(result)) {
            currentPropositions = result;
        } else {
            currentPropositions = [];
        }
        
        displayPropositions(currentPropositions);
        updatePropositionsCount();
        
    } catch (error) {
        console.error('Erreur chargement propositions:', error);
        showPopup('Erreur lors du chargement des propositions', 'error');
        currentPropositions = [];
        displayPropositions([]);
    }
}

function displayPropositions(propositions) {
    const container = document.getElementById('propositions-container');
    if (!container) return;
    
    if (!propositions || propositions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-paper-plane"></i>
                <p>Aucune proposition envoyée</p>
                <p class="small">Envoyez des propositions depuis la section "Demandes"</p>
            </div>
        `;
        return;
    }
    
    const sortedPropositions = [...propositions].sort((a, b) => {
        const dateA = new Date(a.dateEnvoi || a.createdAt);
        const dateB = new Date(b.dateEnvoi || b.createdAt);
        return dateB - dateA;
    });
    
    container.innerHTML = sortedPropositions.map(prop => {
        const date = new Date(prop.dateEnvoi || prop.createdAt);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        let statusClass = 'pending';
        let statusText = 'En attente';
        
        if (prop.status === 'accepté_par_client') {
            statusClass = 'accepted';
            statusText = 'Accepté';
        } else if (prop.status === 'refusé_par_client') {
            statusClass = 'refused';
            statusText = 'Refusé';
        } else if (prop.status === 'en_cours') {
            statusClass = 'in-progress';
            statusText = 'En cours';
        } else if (prop.status === 'livré') {
            statusClass = 'delivered';
            statusText = 'Livré';
        }
        
        return `
            <div class="proposition-card">
                <div class="proposition-header">
                    <div>
                        <h4>${prop.demandeId?.codeColis || 'N/A'}</h4>
                        <span class="proposition-date">Envoyé le: ${formattedDate}</span>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="proposition-body">
                    <div class="proposition-details">
                        <div class="detail-item">
                            <strong>Montant:</strong>
                            <span class="price">${prop.montantPropose?.toLocaleString() || 0} FC</span>
                        </div>
                        <div class="detail-item">
                            <strong>Délai:</strong>
                            <span>${prop.delaiPropose} jour(s)</span>
                        </div>
                        <div class="detail-item">
                            <strong>Disponibilité:</strong>
                            <span>${prop.jourDisponible} à ${prop.heureDisponible}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Camion:</strong>
                            <span>${prop.couleurCamion} (${prop.plaqueImmatriculation})</span>
                        </div>
                        ${prop.description ? `
                        <div class="detail-item">
                            <strong>Description:</strong>
                            <span>${prop.description}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updatePropositionsCount() {
    const countElement = document.getElementById('propositions-count');
    if (countElement) countElement.textContent = currentPropositions.length;
}

function filterPropositions() {
    const statusFilter = document.getElementById('proposition-status')?.value;
    
    if (statusFilter === 'all') {
        displayPropositions(currentPropositions);
    } else {
        const filtered = currentPropositions.filter(prop => prop.status === statusFilter);
        displayPropositions(filtered);
    }
}

// ==================== CONFIRMÉS ====================
async function loadConfirmes() {
    try {
        const response = await apiFetch('/api/transporteur/offers/my');
        if (!response || !response.ok) {
            showPopup('Erreur lors du chargement des confirmations', 'error');
            return;
        }
        
        const result = await response.json();
        console.log('✅ Confirmés reçus:', result);
        
        let allPropositions = [];
        if (result.success && Array.isArray(result.data)) {
            allPropositions = result.data;
        } else if (Array.isArray(result)) {
            allPropositions = result;
        }
        
        const acceptedPropositions = allPropositions.filter(
            prop => prop.status === 'accepté_par_client' || 
                   prop.status === 'en_cours' || 
                   prop.status === 'livré'
        );
        currentConfirmes = acceptedPropositions;
        
        displayConfirmes(currentConfirmes);

        updateBadge('confirmed', acceptedPropositions.length);
        
    } catch (error) {
        console.error('Erreur chargement confirmés:', error);
        showPopup('Erreur lors du chargement des confirmations', 'error');
        currentConfirmes = [];
        displayConfirmes([]);
    }
}

function displayConfirmes(confirmes) {
    const container = document.getElementById('confirmed-table-body');
    if (!container) return;
    
    if (!confirmes || confirmes.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <p>Aucune livraison confirmée</p>
                        <p class="small">Les propositions acceptées par les clients apparaîtront ici</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = confirmes.map(conf => {
        const date = new Date(conf.dateEnvoi || conf.createdAt);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        let statusClass = 'accepted';
        let statusText = 'Confirmé';
        
        if (conf.status === 'en_cours') {
            statusClass = 'in-progress';
            statusText = 'En cours';
        } else if (conf.status === 'livré') {
            statusClass = 'delivered';
            statusText = 'Livré';
        }
        
        return `
            <tr>
                <td>${conf.demandeId?.codeColis || 'N/A'}</td>
                <td>${conf.demandeId?.nom || 'N/A'}</td>
                <td>${conf.demandeId?.villeDepart || 'N/A'} → ${conf.demandeId?.villeArrivee || 'N/A'}</td>
                <td>${conf.montantPropose?.toLocaleString() || 0} FC</td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>${formattedDate}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-action btn-view" onclick="viewDemandeDetails('${conf.demandeId?._id || ''}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${conf.status === 'accepté_par_client' ? `
                        <button class="btn-action btn-in-progress" onclick="updateStatus('${conf._id}', 'en_cours')" title="Mettre en cours">
                            <i class="fas fa-truck-moving"></i>
                        </button>
                        ` : ''}
                        ${conf.status === 'en_cours' ? `
                        <button class="btn-action btn-delivered" onclick="updateStatus('${conf._id}', 'livré')" title="Marquer comme livré">
                            <i class="fas fa-check-double"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterConfirmes() {
    const statusFilter = document.getElementById('confirme-status-filter')?.value || 'all';
    
    if (statusFilter === 'all') {
        displayConfirmes(currentConfirmes);
    } else {
        const filtered = currentConfirmes.filter(prop => prop.status === statusFilter);
        displayConfirmes(filtered);
    }
}

async function updateStatus(offerId, newStatus) {
    const statusText = newStatus === 'en_cours' ? 'en cours' : 'livrée';
    
    const confirmed = await showConfirmPopup(`Voulez-vous vraiment marquer cette livraison comme ${statusText} ?`);
    
    if (!confirmed) {
        return;
    }
    
    console.log(' Demande de mise à jour:', { offerId, newStatus });
    
    try {
        const response = await apiFetch(`/api/transporteur/offer/${offerId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        console.log('📡 Réponse reçue, status:', response?.status);
        
        if (!response || !response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(' Erreur serveur:', errorData);
            throw new Error(errorData.message || 'Erreur lors de la mise à jour');
        }
        
        const result = await response.json();
        console.log(' Statut mis à jour avec succès:', result);
        
        showPopup(`Statut mis à jour: ${statusText}`, 'success');
        
        setTimeout(() => {
            loadConfirmes();
            loadPropositions();
            loadDashboardData();
            loadHistory();
            loadBadgeCounts();
        }, 1500);
        
    } catch (error) {
        console.error(' Erreur complète:', error);
        showPopup(error.message || 'Erreur lors de la mise à jour', 'error');
    }
}

// ==================== HISTORIQUE ====================
async function loadHistory() {
    try {
        const response = await apiFetch('/api/transporteur/history');
        if (!response || !response.ok) {
            showPopup('Erreur historique', 'error');
            return;
        }
        
        const result = await response.json();
        console.log(' Historique brut reçu:', result);
        
        currentHistory = result.success ? result.data : (Array.isArray(result) ? result : []);
        
        console.log(' Historique stocké:', currentHistory.length, 'éléments');
        displayHistory(currentHistory);
        
    } catch (error) {
        console.error(' Erreur historique:', error);
        showPopup('Erreur chargement historique', 'error');
        currentHistory = [];
        displayHistory([]);
    }
}

function displayHistory(history) {
    const container = document.getElementById('history-table-body');
    if (!container) return;
    
    if (!history || history.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem;">
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>Aucun historique disponible</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const sortedHistory = [...history].sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || a.dateEnvoi);
        const dateB = new Date(b.date || b.createdAt || b.dateEnvoi);
        return dateB - dateA
    });
    
    container.innerHTML = sortedHistory.map(item => {
        let formattedDate = 'N/A';
        try {
            const dateValue = item.date || item.createdAt || item.dateEnvoi;
            if (dateValue) {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            }
        } catch (e) {
            console.warn('⚠️ Date invalide pour:', item);
        }
        
        let typeText = '';
        let typeClass = '';
        const statusValue = item.type || item.status;
        
        switch(statusValue) {
            case 'proposition':
            case 'en_attente':
                typeText = 'Proposition';
                typeClass = 'proposition';
                break;
            case 'accepté_par_client':
                typeText = 'Accepté';
                typeClass = 'accepted';
                break;
            case 'refusé_par_client':
                typeText = 'Refusé';
                typeClass = 'refused';
                break;
            case 'livré':
                typeText = 'Livré';
                typeClass = 'delivered';
                break;
            case 'en_cours':
                typeText = 'En cours';
                typeClass = 'in-progress';
                break;
            default:
                typeText = statusValue || 'Activité';
                typeClass = 'proposition';
        }
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>
                    <span class="status-badge ${typeClass}">${typeText}</span>
                </td>
                <td>${item.demandeId?.codeColis || 'N/A'}</td>
                <td>${item.demandeId?.nom || 'N/A'}</td>
                <td>${item.demandeId?.villeDepart || 'N/A'} → ${item.demandeId?.villeArrivee || 'N/A'}</td>
                <td>${item.montantPropose ? item.montantPropose.toLocaleString() + ' FC' : 'N/A'}</td>
                <td>
                    <button class="btn-action btn-view" onclick="viewDemandeDetails('${item.demandeId?._id || ''}')">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('')
}

function filterHistory() {
    const typeFilter = document.getElementById('history-type')?.value;
    
    let filtered = [...currentHistory];
    
    if (typeFilter && typeFilter !== 'all') {
        filtered = filtered.filter(item => {
            const itemStatus = item.status || item.type;
            
            switch(typeFilter) {
                case 'proposition':
                    return itemStatus === 'en_attente' || itemStatus === 'proposition';
                case 'accepté_par_client':
                    return itemStatus === 'accepté_par_client';
                case 'refusé_par_client':
                    return itemStatus === 'refusé_par_client';
                case 'en_cours':
                    return itemStatus === 'en_cours';
                case 'livré':
                    return itemStatus === 'livré';
                default:
                    return true;
            }
        });
    }
    
    displayHistory(filtered);
}

// ==================== PARAMÈTRES ET PROFIL ====================
async function loadProfileData() {
    try {
        // Charger les données du profil
        const response = await apiFetch('/api/user/profile');
        if (response && response.ok) {
            const result = await response.json();
            currentUser = result.success ? result.data : result;
            
            // Remplir les champs du formulaire
            fillProfileForm();
            
            // Charger les trajets
            loadTrajets();
        }
    } catch (error) {
        console.error('Erreur chargement profil:', error);
        showPopup('Erreur lors du chargement du profil', 'error');
    }
}

function fillProfileForm() {
    if (!currentUser) return;
    
    const gt = currentUser.grandTransporteur;

    document.getElementById('entreprise-name').value = gt?.entrepriseName || '';
    document.getElementById('entreprise-email').value = currentUser.email || '';
    document.getElementById('entreprise-phone').value = gt?.telephone || '';
    document.getElementById('entreprise-adresse').value = gt?.adresse || '';
    document.getElementById('type-camion').value = Array.isArray(gt?.typeCamion) ? gt.typeCamion.join(', ') : gt?.typeCamion || '';
    document.getElementById('destinations').value = Array.isArray(gt?.destinations) ? gt.destinations.join(', ') : gt?.destinations || '';
    document.getElementById('provinces').value = Array.isArray(gt?.provinces) ? gt.provinces.join(', ') : gt?.provinces || '';
    
    console.log(' Profil chargé avec email:', currentUser.email);
}
async function loadTrajets() {
    const container = document.getElementById('trajets-list');
    if (!container) return;
    
    if (!currentUser.grandTransporteur?.tarifs || currentUser.grandTransporteur.tarifs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-route"></i>
                <p>Aucun trajet configuré</p>
                <p class="small">Ajoutez vos trajets disponibles</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = currentUser.grandTransporteur.tarifs.map((trajet, index) => `
        <div class="trajet-item">
            <div class="trajet-info">
                <h5>${trajet.destination}</h5>
                <div class="trajet-details">
                    <span><i class="fas fa-dollar-sign"></i> ${trajet.prix} USD</span>
                    <span><i class="fas fa-clock"></i> ${trajet.delai} jours</span>
                    <span><i class="fas fa-cube"></i> ${trajet.unite || 'colis'}</span>
                </div>
            </div>
            <button class="btn-remove-trajet" onclick="removeTrajet(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

async function updateProfile() {
    try {
        const entrepriseName = document.getElementById('entreprise-name').value;
        const telephone = document.getElementById('entreprise-phone').value;
        const adresse = document.getElementById('entreprise-adresse').value;
        const typeCamion = document.getElementById('type-camion').value.split(',').map(t => t.trim()).filter(t => t);
        const destinations = document.getElementById('destinations').value.split(',').map(d => d.trim()).filter(d => d);
        const provinces = document.getElementById('provinces').value.split(',').map(p => p.trim()).filter(p => p);
        
        const response = await apiFetch('/api/user/profile/grand-transporteur', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                entrepriseName,
                telephone,
                adresse,
                typeCamion,
                destinations,
                provinces
            })
        });
        
        if (!response || !response.ok) {
            throw new Error('Erreur lors de la mise à jour');
        }
        
        const result = await response.json();
        console.log('Profil mis à jour:', result);
   
        currentUser.grandTransporteur = {
            ...currentUser.grandTransporteur,
            entrepriseName,
            telephone,
            adresse,
            typeCamion,
            destinations,
            provinces
        };
       
        updateUserInfo();
        
        showPopup('Profil mis à jour avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        showPopup('Erreur lors de la mise à jour du profil', 'error');
    }
}
function openAddTrajetModal() {
    document.getElementById('add-trajet-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAddTrajetModal() {
    document.getElementById('add-trajet-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    
    document.getElementById('new-trajet-destination').value = '';
    document.getElementById('new-trajet-prix').value = '';
    document.getElementById('new-trajet-delai').value = '';
    document.getElementById('new-trajet-unite').value = 'colis';
}

async function addNewTrajet() {
    try {
        const destination = document.getElementById('new-trajet-destination').value;
        const prix = parseFloat(document.getElementById('new-trajet-prix').value);
        const delai = parseInt(document.getElementById('new-trajet-delai').value);
        const unite = document.getElementById('new-trajet-unite').value;
        
        if (!destination || !prix || !delai) {
            showPopup('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }
        
        const response = await apiFetch('/api/user/profile/trajet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                destination,
                prix,
                delai,
                unite
            })
        });
        
        if (!response || !response.ok) {
            throw new Error('Erreur lors de l\'ajout du trajet');
        }
        
        const result = await response.json();
        console.log('✅ Trajet ajouté:', result);
        
        
        closeAddTrajetModal();
        
      
        if (currentUser.grandTransporteur.tarifs) {
            currentUser.grandTransporteur.tarifs.push(result.data.trajet);
        } else {
            currentUser.grandTransporteur.tarifs = [result.data.trajet];
        }
        
        loadTrajets();
        
        showPopup('Trajet ajouté avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur ajout trajet:', error);
        showPopup('Erreur lors de l\'ajout du trajet', 'error');
    }
}

function removeTrajet(index) {
    if (!confirm('Voulez-vous vraiment supprimer ce trajet ?')) {
        return;
    }
    
    if (currentUser.grandTransporteur?.tarifs) {
        currentUser.grandTransporteur.tarifs.splice(index, 1);
        loadTrajets();
        showPopup('Trajet supprimé avec succès', 'success');
    }
}

// ==================== MODALS ====================
function openAnalysisModal(demandeId, codeColis) {
    document.getElementById('proposal-demand-id').value = demandeId;
    document.getElementById('modal-proposal-code').textContent = codeColis;
    
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('available-day').value = tomorrow.toISOString().split('T')[0];
    
    const now = new Date();
    now.setHours(now.getHours() + 1);
    document.getElementById('available-time').value = now.toTimeString().slice(0, 5);
    
    document.getElementById('analysis-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

async function viewDemandeDetails(demandeId) {
    try {
        const response = await apiFetch(`/api/grandTransportfetch/request/${demandeId}`);
        if (!response || !response.ok) {
            showPopup('Erreur lors du chargement des détails', 'error');
            return;
        }
        
        const result = await response.json();
        console.log('🔍 Détails reçus:', result);
        
        const demande = result.success ? result.data : result;
        
        if (!demande) {
            showPopup('Demande non trouvée', 'error');
            return;
        }
        
        const modalContent = document.getElementById('modal-details-content');
        const modalCode = document.getElementById('modal-demand-code');
        
        if (modalCode) modalCode.textContent = demande.codeColis;
        
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="demande-details">
                    <div class="details-section">
                        <h4><i class="fas fa-user"></i> Informations client</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <label>Nom:</label>
                                <span>${demande.nom}</span>
                            </div>
                            <div class="detail-item">
                                <label>Email:</label>
                                <span>${demande.email}</span>
                            </div>
                            <div class="detail-item">
                                <label>Téléphone:</label>
                                <span>${demande.telephone}</span>
                            </div>
                            <div class="detail-item">
                                <label>Adresse:</label>
                                <span>${demande.adress}, ${demande.commune}, ${demande.ville}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h4><i class="fas fa-route"></i> Trajet</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <label>Départ:</label>
                                <span>${demande.villeDepart}</span>
                            </div>
                            <div class="detail-item">
                                <label>Arrivée:</label>
                                <span>${demande.villeArrivee}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h4><i class="fas fa-box"></i> Marchandise</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <label>Type:</label>
                                <span>${demande.typeMarchandise}</span>
                            </div>
                            <div class="detail-item">
                                <label>Poids/Volume:</label>
                                <span>${demande.poidsVolume}</span>
                            </div>
                            <div class="detail-item">
                                <label>Camion requis:</label>
                                <span>${demande.typeCamion}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h4><i class="fas fa-info-circle"></i> Statut</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <label>Statut demande:</label>
                                <span class="status-badge status-${demande.status}">
                                    ${getStatusText(demande.status)}
                                </span>
                            </div>
                            <div class="detail-item">
                                <label>Paiement:</label>
                                <span class="payment-badge ${demande.paymentStatus === 'payé' ? 'paid' : 'unpaid'}">
                                    ${demande.paymentStatus === 'payé' ? 'PAYÉ' : 'NON PAYÉ'}
                                </span>
                            </div>
                            <div class="detail-item">
                                <label>Date création:</label>
                                <span>${new Date(demande.date).toLocaleDateString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${demande.description ? `
                    <div class="details-section">
                        <h4><i class="fas fa-comment"></i> Description</h4>
                        <div class="description-box">
                            <p>${demande.description}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${demande.photoColis ? `
                    <div class="details-section">
                        <h4><i class="fas fa-image"></i> Photo du colis</h4>
                        <div class="photo-container">
                            <img src="${demande.photoColis}" alt="Photo du colis" 
                                 style="max-width: 100%; border-radius: 8px;">
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        }
        
        document.getElementById('details-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Erreur détails demande:', error);
        showPopup('Erreur lors du chargement des détails', 'error');
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        if (modal.id !== 'add-trajet-modal') {
            modal.style.display = 'none';
        }
    });
    document.body.style.overflow = 'auto';
    
    
    const formElements = document.querySelectorAll('#analysis-modal input, #analysis-modal textarea, #analysis-modal select');
    formElements.forEach(element => {
        if (element.type === 'hidden') return;
        if (element.type === 'date') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            element.value = tomorrow.toISOString().split('T')[0];
        } else if (element.type === 'time') {
            const now = new Date();
            now.setHours(now.getHours() + 1);
            element.value = now.toTimeString().slice(0, 5);
        } else {
            element.value = '';
        }
    });
}

// ==================== ENVOYER PROPOSITION (CORRIGÉ) ====================
async function sendProposal() {
    const demandeId = document.getElementById('proposal-demand-id').value;
    const montantPropose = document.getElementById('proposed-amount').value;
    const delaiPropose = document.getElementById('proposed-delay').value;
    const jourDisponible = document.getElementById('available-day').value;
    const heureDisponible = document.getElementById('available-time').value;
    const couleurCamion = document.getElementById('truck-color').value;
    const plaqueImmatriculation = document.getElementById('truck-plate').value;
    const description = document.getElementById('proposal-description').value;
    
    if (!montantPropose || !delaiPropose || !jourDisponible || !heureDisponible || !couleurCamion || !plaqueImmatriculation) {
        showPopup('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    try {
        const response = await apiFetch(`/api/transporteur/offer/${demandeId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                montantPropose: parseInt(montantPropose),
                delaiPropose: parseInt(delaiPropose),
                jourDisponible,
                heureDisponible,
                couleurCamion,
                plaqueImmatriculation,
                description: description || ''
            })
        });
        
        if (!response || !response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Erreur lors de l\'envoi de la proposition');
        }
        
        const result = await response.json();
        console.log('✉️ Proposition envoyée:', result);
        
        closeModal();
        showPopup('Proposition envoyée avec succès !', 'success');
        
       
        setTimeout(() => {
            loadDashboardData();
            loadPropositions();
            loadDemandes();
            loadBadgeCounts();
        }, 1000);
        
    } catch (error) {
        console.error('Erreur envoi proposition:', error);
        showPopup(error.message || 'Erreur lors de l\'envoi de la proposition', 'error');
    }
}

// ==================== POPUPS PERSONNALISÉS ====================
function showPopup(message, type = 'info') {
   
    let container = document.getElementById('popup-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'popup-container';
        document.body.appendChild(container);
    }
    
    
    const popup = document.createElement('div');
    popup.className = `popup-message ${type}`;
    
    popup.innerHTML = `
        <i class="fas ${getPopupIcon(type)}" style="font-size: 1.2rem; color: ${getPopupIconColor(type)};"></i>
        <span class="popup-text">${message}</span>
        <button class="popup-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(popup);
    
    
    setTimeout(() => {
        if (popup.parentElement) {
            popup.style.animation = 'popupSlideOut 0.3s ease';
            setTimeout(() => popup.remove(), 300);
        }
    }, 5000);
}

function getPopupIconColor(type) {
    switch(type) {
        case 'success': return 'var(--success)';
        case 'error': return 'var(--danger)';
        case 'warning': return 'var(--warning)';
        case 'info': return 'var(--dore)';
        default: return 'var(--vert-fonce)';
    }
}

function showConfirmPopup(message) {
    return new Promise((resolve) => {
       
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        `;
       
        const confirmPopup = document.createElement('div');
        confirmPopup.style.cssText = `
            background: var(--blanc);
            border-radius: 16px;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            box-shadow: var(--shadow-lg);
            animation: confirmPopupIn 0.3s ease;
        `;
        
        confirmPopup.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <i class="fas fa-question-circle" style="font-size: 3rem; color: var(--dore); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--vert-fonce); margin-bottom: 0.5rem;">Confirmation</h3>
                <p style="color: var(--gris-texte); line-height: 1.5;">${message}</p>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="btn-confirm-no" style="
                    padding: 0.75rem 1.5rem;
                    border: 2px solid var(--gris-border);
                    background: var(--gris-clair);
                    color: var(--gris-fonce);
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Non</button>
                <button class="btn-confirm-yes" style="
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: var(--vert-fonce);
                    color: var(--blanc);
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Oui</button>
            </div>
        `;
        
        overlay.appendChild(confirmPopup);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
       
        if (!document.getElementById('confirm-animation')) {
            const style = document.createElement('style');
            style.id = 'confirm-animation';
            style.textContent = `
                @keyframes confirmPopupIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .btn-confirm-no:hover {
                    background: var(--gris-moyen);
                }
                
                .btn-confirm-yes:hover {
                    background: #003824;
                    transform: translateY(-1px);
                }
            `;
            document.head.appendChild(style);
        }
        
        const noBtn = overlay.querySelector('.btn-confirm-no');
        const yesBtn = overlay.querySelector('.btn-confirm-yes');
        
        const closePopup = (result) => {
            overlay.style.animation = 'confirmPopupOut 0.3s ease';
            setTimeout(() => {
                if (overlay.parentElement) {
                    overlay.parentElement.removeChild(overlay);
                }
                document.body.style.overflow = 'auto';
            }, 300);
            resolve(result);
        };
        
        noBtn.addEventListener('click', () => closePopup(false));
        yesBtn.addEventListener('click', () => closePopup(true));
   
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closePopup(false);
            }
        });
    });
}

// ==================== UTILITAIRES ====================
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('API Fetch Error:', error);
        return null;
    }
}

function getStatusText(status) {
    const texts = {
        'en_attente': 'En attente',
        'accepté': 'Accepté',
        'refusé': 'Refusé',
        'en_cours': 'En cours',
        'livré': 'Livré',
        'accepté_par_client': 'Accepté par client',
        'refusé_par_client': 'Refusé par client'
    };
    return texts[status] || status;
}

function getActivityIcon(type) {
    const icons = {
        'new': 'fa-plus',
        'accept': 'fa-check',
        'refuse': 'fa-times',
        'proposition': 'fa-paper-plane',
        'payment': 'fa-money-bill'
    };
    return icons[type] || 'fa-info';
}

function getInitials(name) {
    if (!name) return 'T';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

window.addEventListener('resize', function() {
    if (window.innerWidth > 1024) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('active');
    }
});

if (!document.getElementById('badge-animation')) {
    const style = document.createElement('style');
    style.id = 'badge-animation';
    style.textContent = `
        @keyframes badgePulse {
            0% { 
                transform: scale(1); 
            }
            50% { 
                transform: scale(1.4);
                box-shadow: 0 0 15px rgba(164, 62, 42, 0.6);
            }
            100% { 
                transform: scale(1); 
            }
        }
    `;
    document.head.appendChild(style);
}