// ==================== VARIABLES GLOBALES ====================
let currentCompanies = [];
let currentUsers = [];
let currentProofs = [];
let currentPropositions = [];
let currentRatings = [];
let currentDemandes = [];
let newProofsCount = 0;
let selectedCompanyForProof = null;

let badgeCounts = {
    users: 0,
    proofs: 0,
    demandes: 0,
    propositions: 0,
    ratings: 0
};

// ==================== MESSAGE BOX PERSONNALISÉES ====================

// Fonction pour afficher une confirmation personnalisée
function showConfirm(message, onConfirm, onCancel = null) {
    const alertBox = document.getElementById('customAlert');
    const overlay = document.getElementById('customAlertOverlay');
    const messageEl = document.getElementById('customAlertMessage');
    const titleEl = document.getElementById('customAlertTitle');
    const confirmBtn = document.getElementById('customAlertConfirm');
    const cancelBtn = document.getElementById('customAlertCancel');
    
    // Déterminer le type de message
    let type = 'info';
    if (message.toLowerCase().includes('erreur')) type = 'error';
    if (message.toLowerCase().includes('succès') || message.toLowerCase().includes('accepté')) type = 'success';
    if (message.toLowerCase().includes('attention') || message.toLowerCase().includes('avertissement')) type = 'warning';
    
    // Mettre à jour l'interface
    messageEl.textContent = message;
    titleEl.textContent = getAlertTitle(type);
    
    const header = document.getElementById('customAlertHeader');
    header.className = `custom-alert-header ${type}`;
    header.querySelector('i').className = `fas ${getAlertIcon(type)}`;
    
    // Afficher
    alertBox.classList.add('active');
    overlay.classList.add('active');
    
    // Gérer les événements
    const handleConfirm = () => {
        cleanup();
        if (onConfirm) onConfirm();
    };
    
    const handleCancel = () => {
        cleanup();
        if (onCancel) onCancel();
    };
    
    const handleKeydown = (e) => {
        if (e.key === 'Escape') handleCancel();
        if (e.key === 'Enter') handleConfirm();
    };
    
    const cleanup = () => {
        alertBox.classList.remove('active');
        overlay.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        document.removeEventListener('keydown', handleKeydown);
        overlay.removeEventListener('click', handleCancel);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    document.addEventListener('keydown', handleKeydown);
    overlay.addEventListener('click', handleCancel);
}

// Fonction pour afficher un message simple
function showMessageBox(message, type = 'info') {
    const messageBox = document.getElementById('customMessage');
    const overlay = document.getElementById('customMessageOverlay');
    const messageEl = document.getElementById('customMessageText');
    const titleEl = document.getElementById('customMessageTitle');
    const okBtn = document.getElementById('customMessageOk');
    
    messageEl.textContent = message;
    titleEl.textContent = getAlertTitle(type);
    
    const header = document.getElementById('customMessageHeader');
    header.className = `custom-alert-header ${type}`;
    header.querySelector('i').className = `fas ${getAlertIcon(type)}`;
    
    
    messageBox.classList.add('active');
    overlay.classList.add('active');
   
    const handleClose = () => {
        messageBox.classList.remove('active');
        overlay.classList.remove('active');
        okBtn.removeEventListener('click', handleClose);
        document.removeEventListener('keydown', handleKeydown);
        overlay.removeEventListener('click', handleClose);
    };
    
    const handleKeydown = (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') handleClose();
    };
    
    okBtn.addEventListener('click', handleClose);
    document.addEventListener('keydown', handleKeydown);
    overlay.addEventListener('click', handleClose);
}

function getAlertTitle(type) {
    switch(type) {
        case 'success': return 'Succès';
        case 'error': return 'Erreur';
        case 'warning': return 'Attention';
        default: return 'Information';
    }
}

function getAlertIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// ==================== INITIALISATION ====================
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
        window.location.href = "/login";
        return;
    }
    
    initializeAdminPanel();
});

async function initializeAdminPanel() {
    try {
        await loadAdminProfile();
        setupNavigation();
        setupEventListeners();
        setupMobileMenu();
        setupModals();
        setupBadgesInterval();
        
        loadActiveSection();
    
        await updateAllBadges();
        
        await loadAdminNotifications();
        
    } catch (error) {
        console.error('Erreur initialisation:', error);
        showMessage('Erreur de chargement des données', 'error');
    }
}

async function loadAdminProfile() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch('/api/admin/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const adminData = await response.json();
            updateAdminInterface(adminData);
        }
    } catch (error) {
        console.error('Erreur profil admin:', error);
    }
}

function updateAdminInterface(adminData) {

    const adminNameHeader = document.getElementById('admin-name-header');
    const adminRoleHeader = document.getElementById('admin-role-header');
    const adminPhotoHeader = document.getElementById('admin-photo-header');
    const adminInitialsHeader = document.getElementById('admin-initials-header');
    
    if (adminNameHeader) {
        adminNameHeader.textContent = adminData.name || 'Administrateur';
    }
    if (adminRoleHeader) {
        adminRoleHeader.textContent = 'Super Admin';
    }
    
    if (adminData.photo && adminPhotoHeader) {
        adminPhotoHeader.src = adminData.photo;
        adminPhotoHeader.style.display = 'block';
        if (adminInitialsHeader) adminInitialsHeader.style.display = 'none';
    } else if (adminInitialsHeader) {
        const initials = getInitials(adminData.name || 'Admin');
        adminInitialsHeader.textContent = initials;
        adminInitialsHeader.style.display = 'flex';
        if (adminPhotoHeader) adminPhotoHeader.style.display = 'none';
    }
    
    // Sidebar
    const adminNameSidebar = document.getElementById('admin-name-sidebar');
    const adminRoleSidebar = document.getElementById('admin-role-sidebar');
    const adminPhotoSidebar = document.getElementById('admin-photo-sidebar');
    const adminInitialsSidebar = document.getElementById('admin-initials-sidebar');
    
    if (adminNameSidebar) {
        adminNameSidebar.textContent = adminData.name || 'Administrateur';
    }
    if (adminRoleSidebar) {
        adminRoleSidebar.textContent = 'Super Admin';
    }
   
    if (adminData.photo && adminPhotoSidebar) {
        adminPhotoSidebar.src = adminData.photo;
        adminPhotoSidebar.style.display = 'block';
        if (adminInitialsSidebar) adminInitialsSidebar.style.display = 'none';
    } else if (adminInitialsSidebar) {
        const initials = getInitials(adminData.name || 'Admin');
        adminInitialsSidebar.textContent = initials;
        adminInitialsSidebar.style.display = 'flex';
        if (adminPhotoSidebar) adminPhotoSidebar.style.display = 'none';
    }
}

function setupBadgesInterval() {
    setInterval(updateAllBadges, 30000);
    setInterval(checkNewProofs, 30000);
}

function loadActiveSection() {
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) return;
    
    switch (activeSection.id) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'validation':
            loadCompaniesData();
            break;
        case 'utilisateurs':
            loadUsersData();
            break;
        case 'paiements':
            loadProofsData();
            break;
        case 'demandes':
            loadDemandesData();
            break;
        case 'propositions':
            loadPropositionsData();
            break;
        case 'ratings':
            loadRatingsData();
            break;
    }
}

// ==================== SYSTÈME DE MESSAGES POPUP ====================
function showMessage(message, type = 'info') {
    let container = document.getElementById('popup-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'popup-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    const popup = document.createElement('div');
    popup.className = `popup-message ${type}`;
    popup.style.cssText = `
        background: var(--blanc);
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 12px;
        border-left: 5px solid ${getPopupColor(type)};
        animation: popupSlideIn 0.3s ease;
        max-width: 400px;
        width: 100%;
    `;
    
    popup.innerHTML = `
        <i class="fas ${getPopupIcon(type)}" style="font-size: 1.3rem; color: ${getPopupColor(type)};"></i>
        <span style="flex: 1; color: var(--gris-fonce);">${message}</span>
        <button class="popup-close" onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            font-size: 1.3rem;
            cursor: pointer;
            color: var(--gris-moyen);
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">×</button>
    `;
    
    container.appendChild(popup);
    
    setTimeout(() => {
        if (popup.parentElement) {
            popup.style.animation = 'popupSlideOut 0.3s ease';
            setTimeout(() => popup.remove(), 300);
        }
    }, 5000);
}

function getPopupColor(type) {
    switch(type) {
        case 'success': return 'var(--success)';
        case 'error': return 'var(--danger)';
        case 'warning': return 'var(--warning)';
        case 'info': return 'var(--dore)';
        default: return 'var(--vert-fonce)';
    }
}

function getPopupIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-info-circle';
    }
}

// ==================== GESTION DES BADGES ====================
async function updateAllBadges() {
    try {
        // 1. UTILISATEURS NON VÉRIFIÉS
        const usersResponse = await apiFetch('/api/admin/users');
        if (usersResponse) {
            const users = await usersResponse.json();
            const unverifiedUsers = users.filter(u => 
                !u.isVerified && 
                ['agence', 'petit_transporteur', 'grand_transporteur'].includes(u.role)
            );
            badgeCounts.users = unverifiedUsers.length;
            updateBadge('users-badge', badgeCounts.users);
        }

        // 2. PREUVES DE PAIEMENT
        const lastProofsViewed = localStorage.getItem('lastProofsViewed');
        if (lastProofsViewed) {
            const proofsResponse = await apiFetch(`/api/admin/payment-proofs/new-count?lastViewed=${lastProofsViewed}`);
            if (proofsResponse) {
                const data = await proofsResponse.json();
                badgeCounts.proofs = data.newCount || 0;
                updateBadge('new-proofs-count', badgeCounts.proofs);
            }
        } else {
            const proofsResponse = await apiFetch('/api/admin/payment-proofs/new-count');
            if (proofsResponse) {
                const data = await proofsResponse.json();
                badgeCounts.proofs = data.newCount || 0;
                updateBadge('new-proofs-count', badgeCounts.proofs);
            }
        }

        // 3. DEMANDES DE TRANSPORT
        const lastDemandesViewed = localStorage.getItem('lastDemandesViewed');
        if (lastDemandesViewed) {
            const demandesResponse = await apiFetch(`/api/admin/grand-transport/new-requests-count?lastViewed=${lastDemandesViewed}`);
            if (demandesResponse) {
                const data = await demandesResponse.json();
                badgeCounts.demandes = data.newCount || 0;
                updateBadge('demandes-badge', badgeCounts.demandes);
            }
        } else {
            const demandesResponse = await apiFetch('/api/admin/grand-transport/new-requests-count');
            if (demandesResponse) {
                const data = await demandesResponse.json();
                badgeCounts.demandes = data.newCount || 0;
                updateBadge('demandes-badge', badgeCounts.demandes);
            }
        }

        // 4. PROPOSITIONS
        const lastPropsViewed = localStorage.getItem('lastPropsViewed');
        const propsResponse = await apiFetch('/api/admin/grand-transport/all-offers');
        if (propsResponse) {
            const props = await propsResponse.json();
            
            if (lastPropsViewed) {
                const lastViewedDate = new Date(lastPropsViewed);
                const newProps = props.filter(p => new Date(p.dateEnvoi) > lastViewedDate);
                badgeCounts.propositions = newProps.length;
            } else {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const newProps = props.filter(p => new Date(p.dateEnvoi) > yesterday);
                badgeCounts.propositions = newProps.length;
            }
            updateBadge('propositions-badge', badgeCounts.propositions);
        }

        // 5. ÉVALUATIONS
        const lastRatingsViewed = localStorage.getItem('lastRatingsViewed');
        const ratingsResponse = await apiFetch('/api/admin/grand-transport/all-ratings');
        if (ratingsResponse) {
            const ratings = await ratingsResponse.json();
            
            if (lastRatingsViewed) {
                const lastViewedDate = new Date(lastRatingsViewed);
                const newRatings = ratings.filter(r => new Date(r.date) > lastViewedDate);
                badgeCounts.ratings = newRatings.length;
            } else {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const newRatings = ratings.filter(r => new Date(r.date) > yesterday);
                badgeCounts.ratings = newRatings.length;
            }
            updateBadge('ratings-badge', badgeCounts.ratings);
        }

    } catch (error) {
        console.error('Erreur mise à jour badges:', error);
    }
}

function updateBadge(badgeId, count) {
    const badge = document.getElementById(badgeId);
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

async function checkNewProofs() {
    try {
        const lastViewedTime = localStorage.getItem('lastProofsViewed');
        let url = '/api/admin/payment-proofs/new-count';
        
        if (lastViewedTime) {
            url += `?lastViewed=${lastViewedTime}`;
        }
        
        const response = await apiFetch(url);
        if (!response) return;
        
        const data = await response.json();
        let newCount = data.newCount || 0;
        
        newProofsCount = newCount;
        updateBadge('new-proofs-count', newProofsCount);
        
    } catch (error) {
        console.error('Erreur vérification nouvelles preuves:', error);
    }
}

// ==================== API FETCH ====================
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
        
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        console.error('API Fetch Error:', error);
        showMessage('Erreur de connexion au serveur', 'error');
        return null;
    }
}

// ==================== NAVIGATION ====================
function setupNavigation() {
    document.querySelectorAll('.nav-item a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const sectionId = this.getAttribute('href').substring(1);
                showSection(sectionId);
                
                // Reset des badges quand on visite une section
                handleSectionVisit(sectionId);
                
                // Fermer sidebar sur mobile
                if (window.innerWidth <= 1024) {
                    document.querySelector('.sidebar').classList.remove('active');
                }
            }
        });
    });
}

function showSection(sectionId) {
    // Mise à jour navigation
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    
    const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
    if (activeLink) {
        activeLink.parentElement.classList.add('active');
    }
    
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Mise à jour titre
    updatePageTitle(sectionId);
    
    // Charger les données de la section
    loadSectionData(sectionId);
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'validation':
            loadCompaniesData();
            break;
        case 'utilisateurs':
            loadUsersData();
            break;
        case 'paiements':
            loadProofsData();
            break;
        case 'demandes':
            loadDemandesData();
            break;
        case 'propositions':
            loadPropositionsData();
            break;
        case 'ratings':
            loadRatingsData();
            break;
    }
}

function handleSectionVisit(sectionId) {
    const now = new Date().toISOString();
    
    switch(sectionId) {
        case 'paiements':
            localStorage.setItem('lastProofsViewed', now);
            updateBadge('new-proofs-count', 0);
            badgeCounts.proofs = 0;
            break;
        case 'demandes':
            localStorage.setItem('lastDemandesViewed', now);
            updateBadge('demandes-badge', 0);
            badgeCounts.demandes = 0;
            break;
        case 'propositions':
            localStorage.setItem('lastPropsViewed', now);
            updateBadge('propositions-badge', 0);
            badgeCounts.propositions = 0;
            break;
        case 'ratings':
            localStorage.setItem('lastRatingsViewed', now);
            updateBadge('ratings-badge', 0);
            badgeCounts.ratings = 0;
            break;
    }
}

function updatePageTitle(sectionId) {
    const titles = {
        'dashboard': 'Tableau de Bord',
        'validation': 'Validation des Sociétés',
        'utilisateurs': 'Gestion des Utilisateurs',
        'demandes': 'Gestion des Demandes de Transport',
        'paiements': 'Preuves de Paiement',
        'propositions': 'Propositions de Transport',
        'ratings': 'Évaluations',
        'parametres': 'Paramètres'
    };
    
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionId] || 'Tableau de Bord';
    }
}

// ==================== ÉVÉNEMENTS ====================
function setupEventListeners() {
    // Filtres utilisateurs
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('user-search');
    
    if (roleFilter) roleFilter.addEventListener('change', filterUsers);
    if (searchInput) searchInput.addEventListener('input', filterUsers);
    
    // Filtres sociétés
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) typeFilter.addEventListener('change', filterCompanies);
    
    // Filtres demandes
    const searchDemandeInput = document.getElementById('search-demande');
    if (searchDemandeInput) searchDemandeInput.addEventListener('input', filterDemandes);
    
    // Filtres propositions
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) statusFilter.addEventListener('change', filterPropositions);
    
    // Filtres évaluations
    const ratingFilter = document.getElementById('rating-filter');
    const searchRatingInput = document.getElementById('search-rating');
    if (ratingFilter) ratingFilter.addEventListener('change', filterRatings);
    if (searchRatingInput) searchRatingInput.addEventListener('input', filterRatings);
    
    const dateStartDemande = document.getElementById('date-filter-start-demande');
    const dateEndDemande = document.getElementById('date-filter-end-demande');
    
    if (searchDemandeInput) searchDemandeInput.addEventListener('input', filterDemandes);
    if (dateStartDemande) dateStartDemande.addEventListener('change', filterDemandes);
    if (dateEndDemande) dateEndDemande.addEventListener('change', filterDemandes);
    
    const dateStartProps = document.getElementById('date-filter-start-props');
    const dateEndProps = document.getElementById('date-filter-end-props');
    
    if (statusFilter) statusFilter.addEventListener('change', filterPropositions);
    if (dateStartProps) dateStartProps.addEventListener('change', filterPropositions);
    if (dateEndProps) dateEndProps.addEventListener('change', filterPropositions);
    
    const dateStartRating = document.getElementById('date-filter-start-rating');
    const dateEndRating = document.getElementById('date-filter-end-rating');
    
    if (ratingFilter) ratingFilter.addEventListener('change', filterRatings);
    if (searchRatingInput) searchRatingInput.addEventListener('input', filterRatings);
    if (dateStartRating) dateStartRating.addEventListener('change', filterRatings);
    if (dateEndRating) dateEndRating.addEventListener('change', filterRatings);
    
    // Filtres preuves
    setupProofsDateFilter();
    
    // Tri des tables
    document.querySelectorAll('.th-content').forEach(th => {
        th.addEventListener('click', function() {
            const column = this.closest('th').dataset.column;
            if (column && column !== 'actions' && column !== 'status' && column !== 'phone') {
                sortTable(column);
            }
        });
    });
    
    // Bouton sidebar mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Notification bell
    const notificationBell = document.getElementById('notificationBell');
    if (notificationBell) {
        notificationBell.addEventListener('click', showAllNotificationsModal);
    }
    
    // Mark all as read
    const markAllRead = document.getElementById('mark-all-read');
    if (markAllRead) {
        markAllRead.addEventListener('click', markAllNotificationsAsRead);
    }
    
    // Formulaire d'envoi de preuve
    setupProofSendForm();
}

function setupProofSendForm() {
    const fileInput = document.getElementById('proof-photo');
    const fileName = document.getElementById('file-name');
    const sendProofBtn = document.getElementById('send-proof-btn');
    
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                fileName.textContent = this.files[0].name;
                fileName.innerHTML = `<i class="fas fa-file-image"></i> ${this.files[0].name}`;
            } else {
                fileName.textContent = 'Aucun fichier sélectionné';
            }
        });
    }
    
    if (sendProofBtn) {
        sendProofBtn.addEventListener('click', handleProofSend);
    }
}

async function handleProofSend() {
    const code = document.getElementById('proof-code').value.trim();
    const amount = document.getElementById('proof-amount').value.trim();
    const fileInput = document.getElementById('proof-photo');
    
    // Validation
    if (!code) {
        showMessageBox('Veuillez entrer le code colis', 'warning');
        return;
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        showMessageBox('Veuillez entrer un montant valide', 'warning');
        return;
    }
    
    if (!fileInput.files || fileInput.files.length === 0) {
        showMessageBox('Veuillez sélectionner une photo de preuve', 'warning');
        return;
    }
    
    // Cacher le formulaire et charger les entreprises
    document.getElementById('send-proof-form').style.display = 'none';
    document.getElementById('companies-send-list').style.display = 'block';
    
    // Charger les entreprises (SEULEMENT les entreprises, pas les clients ou admins)
    await loadCompaniesForProof();
}

async function loadCompaniesForProof() {
    try {
        const response = await apiFetch('/api/admin/companies/for-proof');
        if (!response) return;
        
        const companies = await response.json();
        const companiesGrid = document.getElementById('companies-grid');
        
        if (!companies || companies.length === 0) {
            companiesGrid.innerHTML = '<p class="empty-state">Aucune entreprise disponible</p>';
            return;
        }
        
        companiesGrid.innerHTML = companies.map(company => {
            const logo = getCompanyLogo(company);
            const name = getCompanyName(company);
            const role = getRoleLabel(company.role);
            
            return `
                <div class="company-send-card" data-id="${company._id}" onclick="selectCompanyForProof('${company._id}', this)">
                    <img src="${logo}" alt="${name}" class="company-send-logo" onerror="this.src='/images/default-company.png'">
                    <div class="company-send-info">
                        <div class="company-send-name">${name}</div>
                        <span class="company-send-role">${role}</span>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erreur chargement entreprises:', error);
        showMessageBox('Erreur lors du chargement des entreprises', 'error');
    }
}

function selectCompanyForProof(companyId, element) {
    document.querySelectorAll('.company-send-card').forEach(card => {
        card.classList.remove('selected');
    });
 
    element.classList.add('selected');
    selectedCompanyForProof = companyId;

    showConfirm(`Êtes-vous sûr de vouloir envoyer la preuve à cette entreprise ?`, () => {
        sendProofToCompany();
    });
}

async function sendProofToCompany() {
    if (!selectedCompanyForProof) {
        showMessageBox('Veuillez sélectionner une entreprise', 'warning');
        return;
    }
    
    const code = document.getElementById('proof-code').value.trim();
    const amount = document.getElementById('proof-amount').value.trim();
    const devise = document.getElementById('proof-currency').value;
    const fileInput = document.getElementById('proof-photo');
    
    try {
        showMessage('Envoi en cours...', 'info');
 
        const formData = new FormData();
        formData.append('codeColis', code);
        formData.append('montant', amount);
        formData.append('devise', devise)
        formData.append('destinataireId', selectedCompanyForProof);
        formData.append('photo', fileInput.files[0]);
        
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/send-proof', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            // Réinitialiser le formulaire
            document.getElementById('send-proof-form').style.display = 'block';
            document.getElementById('companies-send-list').style.display = 'none';
            document.getElementById('proof-code').value = '';
            document.getElementById('proof-amount').value = '';
            document.getElementById('proof-photo').value = '';
            document.getElementById('file-name').textContent = 'Aucun fichier sélectionné';
            selectedCompanyForProof = null;
            
            // Recharger les preuves
            loadProofsData();
            
            showMessage('Preuve envoyée avec succès !', 'success');
        } else {
            throw new Error('Erreur lors de l\'envoi');
        }
        
    } catch (error) {
        console.error('Erreur envoi preuve:', error);
        showMessageBox('Erreur lors de l\'envoi de la preuve', 'error');
    }
}

function setupMobileMenu() {
    const menuToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

function setupModals() {
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const profileModal = document.getElementById('profile-modal');
    const notificationsModal = document.getElementById('notifications-modal');
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    if (profileModal) {
        profileModal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    if (notificationsModal) {
        notificationsModal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// ==================== DASHBOARD ====================
async function loadDashboardData() {
    try {
        const response = await apiFetch('/api/admin/dashboard');
        if (!response) return;
        
        const data = await response.json();
        
        // Mise à jour des statistiques principales
        updateStatistic('total-users', data.totalUsers);
        updateStatistic('total-clients', data.clients);
        updateStatistic('total-agences', data.agences);
        updateStatistic('total-grand-transporteurs', data.grandTransporteurs);
        updateStatistic('total-petit-transporteurs', data.petitTransporteurs);
        updateStatistic('pending-validation', data.pendingValidation);
        updateStatistic('pending-count', data.pendingValidation);
        
        // Sous-statistiques
        updateStatistic('new-clients', data.newClients || 0);
        updateStatistic('active-users', data.activeUsers || 0);
        updateStatistic('verified-agences', data.agences);
        updateStatistic('active-transporteurs', data.grandTransporteurs);
        updateStatistic('active-petit-transporteurs', data.petitTransporteurs);
        updateStatistic('urgent-pending', data.pendingValidation > 5 ? data.pendingValidation : 0);
        
        // Stats rapides
        updateStatistic('completed-transports-quick', data.completedTransports || 0);
        updateStatistic('avg-rating', data.averageRating || '0.0');
        updateStatistic('response-time', '2h');
        updateStatistic('satisfaction-rate', data.averageRating ? Math.round((data.averageRating / 5) * 100) + '%' : '0%');
        
        // Activités récentes
        const activitiesResponse = await apiFetch('/api/admin/activities');
        if (activitiesResponse) {
            const activities = await activitiesResponse.json();
            displayRecentActivities(activities);
        }
        
        // Demandes récentes
        await loadRecentDemandes();
        
        // Notifications
        await loadAdminNotifications();
        
    } catch (error) {
        console.error('Erreur dashboard:', error);
        showEmptyState('recent-activities', 'Erreur de chargement');
    }
}

function updateStatistic(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value || 0;
    }
}

async function loadRecentDemandes() {
    try {
        const response = await apiFetch('/api/admin/grand-transport/recent-requests?limit=5');
        if (!response) return;
        
        const demandes = await response.json();
        displayRecentDemandes(demandes);
    } catch (error) {
        console.error('Erreur demandes récentes:', error);
    }
}

function displayRecentDemandes(demandes) {
    const container = document.getElementById('recent-requests');
    if (!container) return;
    
    if (!demandes || demandes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Aucune demande récente</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = demandes.map(demande => `
        <div class="request-item">
            <div class="request-header">
                <div class="request-code">${demande.codeColis || 'N/A'}</div>
                <div class="request-date">${formatDate(demande.date)}</div>
            </div>
            <div class="request-content">
                <div class="request-route">
                    <i class="fas fa-route"></i>
                    ${demande.villeDepart || 'N/A'} → ${demande.villeArrivee || 'N/A'}
                </div>
                <div class="request-client">
                    <i class="fas fa-user"></i>
                    ${demande.nom || 'N/A'} • ${demande.email || 'N/A'}
                </div>
            </div>
            <div class="request-footer">
                <span class="status-badge status-${getStatusClass(demande.status)}">
                    ${getStatusText(demande.status)}
                </span>
                <button class="btn-view-small" onclick="viewDemandeDetails('${demande._id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function loadAdminNotifications() {
    try {
        const response = await apiFetch('/api/admin/notifications');
        if (!response) return;
        
        const notifications = await response.json();
        displayNotifications(notifications);
        
        // Mettre à jour le compteur de notifications
        const unreadCount = notifications.filter(n => !n.read).length;
        updateNotificationCount(unreadCount);
        
    } catch (error) {
        console.error('Erreur notifications:', error);
    }
}

function displayNotifications(notifications) {
    const container = document.getElementById('notifications-list');
    const emptyContainer = document.querySelector('.empty-notifications');
    
    if (!container) return;
    
    if (!notifications || notifications.length === 0) {
        container.style.display = 'none';
        if (emptyContainer) emptyContainer.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    if (emptyContainer) emptyContainer.style.display = 'none';
    
    // Afficher seulement les 5 dernières notifications
    const recentNotifications = notifications.slice(0, 5);
    
    container.innerHTML = recentNotifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'} ${notif.type || 'info'}" onclick="markNotificationAsRead('${notif._id}')">
            <div class="notification-icon">
                <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notif.title || 'Notification'}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${formatNotificationTime(notif.createdAt)}</div>
            </div>
        </div>
    `).join('');
}

function updateNotificationCount(count) {
    const notificationCount = document.getElementById('notificationCount');
    if (notificationCount) {
        notificationCount.textContent = count;
        notificationCount.style.display = count > 0 ? 'flex' : 'none';
    }
}

async function showAllNotificationsModal() {
    try {
        const response = await apiFetch('/api/admin/notifications');
        if (!response) return;
        
        const notifications = await response.json();
        const modalContent = document.getElementById('all-notifications');
        
        if (!modalContent) return;
        
        if (!notifications || notifications.length === 0) {
            modalContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>Aucune notification</p>
                </div>
            `;
        } else {
            modalContent.innerHTML = notifications.map(notif => `
                <div class="notification-item ${notif.read ? '' : 'unread'} ${notif.type || 'info'}" onclick="markNotificationAsRead('${notif._id}')">
                    <div class="notification-icon">
                        <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notif.title || 'Notification'}</div>
                        <div class="notification-message">${notif.message}</div>
                        <div class="notification-time">${formatDate(notif.createdAt)}</div>
                    </div>
                </div>
            `).join('');
        }
        
        document.getElementById('notifications-modal').style.display = 'flex';
        
    } catch (error) {
        console.error('Erreur notifications:', error);
        showMessageBox('Erreur lors du chargement des notifications', 'error');
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        await apiFetch(`/api/admin/notifications/${notificationId}/read`, {
            method: 'POST'
        })        
        // Recharger les notifications
        await loadAdminNotifications();
        
    } catch (error) {
        console.error('Erreur marquer notification comme lue:', error);
    }
}

async function markAllNotificationsAsRead() {
    try {
        await apiFetch('/api/admin/notifications/mark-all-read', {
            method: 'POST'
        });
     
        await loadAdminNotifications()       
        showMessage('Toutes les notifications marquées comme lues', 'success');
        
    } catch (error) {
        console.error('Erreur marquer toutes les notifications:', error);
        showMessageBox('Erreur lors du marquage des notifications', 'error');
    }
}

function displayRecentActivities(activities) {
    const container = document.getElementById('recent-activities');
    if (!container) return;

    if (!activities || activities.length === 0) {
        showEmptyState('recent-activities', 'Aucune activité récente');
        return;
    }

    container.innerHTML = activities.map(act => {
        const user = act.user;
        const name = getUserName(user);
        const role = getRoleLabel(user.role);
        const phone = getUserPhone(user);
        const date = formatDate(act.createdAt);

        return `
        <div class="activity-item">
            <div class="activity-avatar">${getInitials(name)}</div>
            <div class="activity-info">
                <p><strong>${name}</strong></p>
                <p>${role}</p>
                <span class="activity-time">${date}</span>
                <span>${phone}</span>
            </div>
        </div>
        `;
    }).join('');
}

// ==================== VALIDATION SOCIÉTÉS ====================
async function loadCompaniesData() {
    try {
        showMessage('Chargement des sociétés...', 'info');
        const response = await apiFetch('/api/admin/companies/pending');
        if (!response) return;
        
        currentCompanies = await response.json();
        displayCompanies();
        updateFilterCount();
        showMessage(`${currentCompanies.length} sociétés chargées`, 'success');
    } catch (error) {
        console.error('Erreur companies:', error);
        showEmptyState('companies-list', 'Erreur de chargement des sociétés');
        showMessageBox('Erreur lors du chargement des sociétés', 'error');
    }
}

function displayCompanies() {
    const container = document.getElementById('companies-list');
    if (!container) return;
    
    if (currentCompanies.length === 0) {
        showEmptyState('companies-list', 'Aucune société en attente de validation');
        return;
    }

    container.innerHTML = currentCompanies.map(company => {
        return `
        <div class="company-card" data-type="${company.role}">
            <div class="company-info">
                <img src="${getCompanyLogo(company)}" 
                     class="company-logo" 
                     alt="Logo ${getCompanyName(company)}"
                     onerror="this.src='/images/default-company.png'">
                <div class="company-details">
                    <h4>${getCompanyName(company)}</h4>
                    <p>${getUserPhone(company)} • ${getCompanyAddress(company)}</p>
                    <span class="company-type">${getRoleLabel(company.role)}</span>
                    <div class="company-meta">
                        <small>Inscrit le: ${formatDate(company.createdAt)}</small>
                    </div>
                </div>
            </div>
            <div class="company-actions">
                <button class="btn btn-view" onclick="viewProfile('${company._id}')">
                    <i class="fas fa-eye"></i> Voir Profil
                </button>
                <button class="btn btn-accept" onclick="validateCompany('${company._id}', true, '${getCompanyName(company)}')">
                    <i class="fas fa-check"></i> Accepter
                </button>
                <button class="btn btn-refuse" onclick="validateCompany('${company._id}', false, '${getCompanyName(company)}')">
                    <i class="fas fa-times"></i> Refuser
                </button>
            </div>
        </div>
    `}).join('');
}

async function validateCompany(companyId, accept, companyName) {
    const action = accept ? 'accepter' : 'refuser';
    
    showConfirm(`Êtes-vous sûr de vouloir ${action} la société "${companyName}" ?`, () => {
        executeValidateCompany(companyId, accept, companyName);
    });
}

async function executeValidateCompany(companyId, accept, companyName) {
    try {
        if (!accept) {
            showMessageBox("La fonctionnalité de refus sera bientôt disponible.", 'info');
            return;
        }

        const response = await apiFetch(`/api/admin/companies/${companyId}/validate`, {
            method: 'POST',
            body: JSON.stringify({ accept })
        });
        
        if (response) {
            loadCompaniesData();
            loadDashboardData();
            showMessage(`Société ${accept ? 'acceptée' : 'refusée'} avec succès !`, 'success');
        }
    } catch (error) {
        console.error('Erreur validation:', error);
        showMessageBox('Erreur lors de la validation', 'error');
    }
}

function updateFilterCount() {
    const filterCount = document.getElementById('filter-count');
    if (filterCount) {
        filterCount.textContent = currentCompanies.length;
    }
}

function filterCompanies() {
    const filter = document.getElementById('type-filter').value;
    document.querySelectorAll('.company-card').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.type === filter) ? 'flex' : 'none';
    });
}

// ==================== GESTION UTILISATEURS ====================
async function loadUsersData() {
    try {
        showMessage('Chargement des utilisateurs...', 'info');
        const response = await apiFetch('/api/admin/users');
        if (!response) return;
        
        currentUsers = await response.json();
        displayUsers();
        updateUsersCount();
        showMessage(`${currentUsers.length} utilisateurs chargés`, 'success');
    } catch (error) {
        console.error('Erreur users:', error);
        showEmptyState('users-table-body', 'Erreur de chargement des utilisateurs');
        showMessageBox('Erreur lors du chargement des utilisateurs', 'error');
    }
}

function displayUsers() {
    const container = document.getElementById('users-table-body');
    if (!container) return;
    
    if (currentUsers.length === 0) {
        showEmptyState('users-table-body', 'Aucun utilisateur trouvé');
        return;
    }

    container.innerHTML = currentUsers.map(user => `
        <tr>
            <td>
                <div class="user-info-cell">
                    <img src="${getUserAvatar(user)}" class="user-avatar" alt="${getUserName(user)}">
                    <span>${getUserName(user)}</span>
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="company-type">${getRoleLabel(user.role)}</span></td>
            <td>
                <span class="status-badge status-${user.isVerified ? 'active' : 'pending'}">
                    ${user.isVerified ? 'Actif' : 'En attente'}
                </span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="user-actions">
                    <button class="btn-action btn-view" onclick="viewProfile('${user._id}')" title="Voir profil">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-${user.isSuspended ? 'unlock' : 'block'}" 
                            onclick="toggleUserStatus('${user._id}', ${!user.isSuspended}, '${getUserName(user)}')"
                            title="${user.isSuspended ? 'Activer' : 'Suspendre'}">
                        <i class="fas ${user.isSuspended ? 'fa-unlock' : 'fa-lock'}"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateUsersCount() {
    const usersCount = document.getElementById('users-count');
    if (usersCount) {
        usersCount.textContent = currentUsers.length;
    }
}

async function toggleUserStatus(userId, suspend, userName) {
    const action = suspend ? 'suspendre' : 'activer';
    const user = currentUsers.find(u => u._id === userId);
    const userNameDisplay = user ? getUserName(user) : 'cet utilisateur';
    
    showConfirm(`Êtes-vous sûr de vouloir ${action} l'utilisateur "${userNameDisplay}" ?`, () => {
        executeToggleUserStatus(userId, suspend, userNameDisplay);
    });
}

async function executeToggleUserStatus(userId, suspend, userNameDisplay) {
    try {
        showMessage(`Action en cours...`, 'info');
        
        const response = await apiFetch(`/api/admin/users/${userId}/toggle-status`, {
            method: 'POST',
            body: JSON.stringify({ suspend })
        });
        
        if (response) {
            loadUsersData();
            showMessage(`Utilisateur ${suspend ? 'suspendu' : 'activé'} avec succès !`, 'success');
        }
    } catch (error) {
        console.error('Erreur statut:', error);
        showMessageBox('Erreur lors du changement de statut', 'error');
    }
}

function filterUsers() {
    const filter = document.getElementById('role-filter').value;
    const searchTerm = document.getElementById('user-search').value.toLowerCase();

    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const roleText = row.querySelector('.company-type').textContent.toLowerCase();
        const nameText = row.querySelector('td span') ? row.querySelector('td span').textContent.toLowerCase() : '';
        const emailText = row.cells[1].textContent.toLowerCase();

        const matchesRole = filter === 'all' || roleText.replace(' ', '_') === filter;
        const matchesSearch = searchTerm === '' || 
                            nameText.includes(searchTerm) || 
                            emailText.includes(searchTerm);

        row.style.display = matchesRole && matchesSearch ? '' : 'none';
    });
}

function sortTable(column) {
    const tbody = document.getElementById('users-table-body');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const isAscending = !tbody.dataset.sortAsc || tbody.dataset.sortAsc === 'false';
    
    rows.sort((a, b) => {
        let aValue, bValue;
        
        switch(column) {
            case 'name':
                aValue = a.cells[0].querySelector('span').textContent;
                bValue = b.cells[0].querySelector('span').textContent;
                break;
            case 'email':
                aValue = a.cells[1].textContent;
                bValue = b.cells[1].textContent;
                break;
            case 'role':
                aValue = a.cells[2].querySelector('.company-type').textContent;
                bValue = b.cells[2].querySelector('.company-type').textContent;
                break;
            case 'date':
                aValue = new Date(a.cells[4].textContent);
                bValue = new Date(b.cells[4].textContent);
                break;
            default:
                return 0;
        }
        
        if (aValue < bValue) return isAscending ? -1 : 1;
        if (aValue > bValue) return isAscending ? 1 : -1;
        return 0;
    });
    
    rows.forEach(row => tbody.appendChild(row)); 
    tbody.dataset.sortAsc = isAscending;
    updateSortIcons(column, isAscending);
}

function updateSortIcons(activeColumn, isAscending) {
    document.querySelectorAll('.th-content i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    const activeTh = document.querySelector(`th[data-column="${activeColumn}"] .th-content i`);
    if (activeTh) {
        activeTh.className = isAscending ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
}

// ==================== PREUVES DE PAIEMENT ====================
async function loadProofsData() {
    try {
        showMessage('Chargement des preuves de paiement...', 'info');
        const response = await apiFetch('/api/admin/payment-proofs');
        if (!response) return;
        
        currentProofs = await response.json();
        displayProofs();
        updateProofsCount();
        showMessage(`${currentProofs.length} preuves chargées`, 'success');
        
        // Reset badge si des nouvelles preuves étaient affichées
        if (newProofsCount > 0) {
            localStorage.setItem('lastProofsViewed', new Date().toISOString());
            newProofsCount = 0;
            updateBadge('new-proofs-count', 0);
        }
    } catch (error) {
        console.error('Erreur preuves:', error);
        showEmptyState('proofs-table-body', 'Erreur de chargement des preuves');
        showMessageBox('Erreur lors du chargement des preuves', 'error');
    }
}

function displayProofs() {
    const container = document.getElementById('proofs-table-body');
    if (!container) return;
    
    if (currentProofs.length === 0) {
        showEmptyState('proofs-table-body', 'Aucune preuve de paiement trouvée');
        return;
    }

    container.innerHTML = currentProofs.map(proof => `
        <tr>
            <td>
                <strong>${proof.clientName || 'N/A'}</strong>
                ${proof.user && proof.user.email ? `<br><small>${proof.user.email}</small>` : ''}
            </td>
            <td>
                <strong style="color: var(--vert-fonce);">${proof.codeColis || 'N/A'}</strong>
            </td>
            <td>${formatDate(proof.uploadedAt)}</td>
            <td>
                <button class="btn-action btn-view" onclick="viewProof('${proof._id}', '${proof.proofUrl}')" title="Voir la preuve">
                    <i class="fas fa-eye"></i> Voir
                </button>
            </td>
        </tr>
    `).join('');
}

function updateProofsCount() {
    const totalProofs = document.getElementById('total-proofs');
    if (totalProofs) {
        totalProofs.textContent = currentProofs.length;
    }
}

function viewProof(proofId, proofUrl) {
    window.open(proofUrl, '_blank');
}

function setupProofsDateFilter() {
    const filterBtn = document.getElementById('filter-proofs-btn');
    
    if (filterBtn) {
        filterBtn.addEventListener('click', filterProofsByDate);
    }
}

function filterProofsByDate() {
    const startDate = document.getElementById('date-filter-start').value;
    const endDate = document.getElementById('date-filter-end').value;
    
    if (!startDate && !endDate) {
        showMessageBox('Veuillez sélectionner au moins une date', 'warning');
        return;
    }
    
    const rows = document.querySelectorAll('#proofs-table-body tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const dateCell = row.cells[2];
        if (!dateCell) {
            row.style.display = 'none';
            return;
        }
        
        const dateText = dateCell.textContent.trim();
        const [day, month, year] = dateText.split('/');
        const rowDate = `${year}-${month}-${day}`;
        
        let shouldShow = true;
        
        if (startDate && rowDate < startDate) {
            shouldShow = false;
        }
        
        if (endDate && rowDate > endDate) {
            shouldShow = false;
        }
        
        row.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
    });
    
    showMessage(`${visibleCount} preuve(s) trouvée(s)`, 'success');
}

// ==================== DEMANDES TRANSPORT ====================
async function loadDemandesData() {
    try {
        showMessage('Chargement des demandes...', 'info');
        const response = await apiFetch('/api/admin/grand-transport/all-requests?sort=date_desc');
        if (!response) return;
        
        currentDemandes = await response.json();
        displayDemandes();
        updateDemandesCount();
        showMessage(`${currentDemandes.length} demandes chargées`, 'success');
    } catch (error) {
        console.error('Erreur demandes:', error);
        showEmptyState('demandes-table-body', 'Erreur de chargement des demandes');
        showMessageBox('Erreur lors du chargement des demandes', 'error');
    }
}

function displayDemandes() {
    const container = document.getElementById('demandes-table-body');
    if (!container) return;
    
    if (currentDemandes.length === 0) {
        showEmptyState('demandes-table-body', 'Aucune demande trouvée');
        return;
    }

    container.innerHTML = currentDemandes.map(demande => `
        <tr>
            <td>
                <strong style="color: var(--vert-fonce);">${demande.codeColis || 'N/A'}</strong>
            </td>
            <td>
                <div class="user-info-cell">
                    <div>
                        <strong>${demande.nom || 'N/A'}</strong><br>
                        <small>${demande.email || 'N/A'}</small>
                    </div>
                </div>
            </td>
            <td>
                ${demande.villeDepart || 'N/A'} 
                <i class="fas fa-arrow-right" style="color: var(--dore); margin: 0 5px;"></i> 
                ${demande.villeArrivee || 'N/A'}
            </td>
            <td>${formatDate(demande.date)}</td>
            <td>
                <div class="user-actions">
                    <button class="btn-action btn-view" onclick="viewDemandeDetails('${demande._id}')" title="Voir détails">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-accept" onclick="changePaymentStatus('${demande._id}', 'payé')" title="Marquer comme payé">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-action btn-refuse" onclick="changePaymentStatus('${demande._id}', 'non_payé')" title="Marquer comme non payé">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateDemandesCount() {
    const totalDemandes = document.getElementById('total-demandes');
    if (totalDemandes) {
        totalDemandes.textContent = currentDemandes.length;
    }
}

function filterDemandes() {
    const searchTerm = document.getElementById('search-demande').value.toLowerCase().trim();
    const startDate = document.getElementById('date-filter-start-demande').value;
    const endDate = document.getElementById('date-filter-end-demande').value;
    
    const rows = document.querySelectorAll('#demandes-table-body tr');
    
    rows.forEach(row => {
        const codeColisCell = row.cells[0].textContent.toLowerCase();
        const dateCell = row.cells[3].textContent.trim();
        const [day, month, year] = dateCell.split('/');
        const rowDate = `${year}-${month}-${day}`;
        
        let matchesSearch = searchTerm === '' || codeColisCell.includes(searchTerm);
        let matchesDate = true;
        
        if (startDate && rowDate < startDate) matchesDate = false;
        if (endDate && rowDate > endDate) matchesDate = false;
        
        row.style.display = matchesSearch && matchesDate ? '' : 'none';
    });
}

async function changePaymentStatus(demandeId, paymentStatus) {
    const demande = currentDemandes.find(d => d._id === demandeId);
    if (!demande) return;
    
    const action = paymentStatus === 'payé' ? 'Marquer comme payé' : 'Marquer comme non payé';
    
    showConfirm(`Êtes-vous sûr de vouloir ${action.toLowerCase()} la demande ${demande.codeColis} ?`, () => {
        executeChangePaymentStatus(demandeId, paymentStatus);
    });
}

async function executeChangePaymentStatus(demandeId, paymentStatus) {
    try {
        const response = await apiFetch(`/api/admin/grand-transport/request/${demandeId}/payment-status`, {
            method: 'PUT',
            body: JSON.stringify({ paymentStatus })
        });
        
        if (response) {
            loadDemandesData();
            showMessage(`Paiement ${paymentStatus === 'payé' ? 'confirmé' : 'annulé'} !`, 'success');
        }
    } catch (error) {
        console.error('Erreur changement statut paiement:', error);
        showMessageBox('Erreur lors du changement', 'error');
    }
}

// ==================== PROPOSITIONS TRANSPORT ====================
async function loadPropositionsData() {
    try {
        showMessage('Chargement des propositions...', 'info');
        const response = await apiFetch('/api/admin/grand-transport/all-offers');
        if (!response) return;
        
        currentPropositions = await response.json();
        displayPropositions();
        updatePropositionsCount();
        showMessage(`${currentPropositions.length} propositions chargées`, 'success');
    } catch (error) {
        console.error('Erreur propositions:', error);
        showEmptyState('propositions-table-body', 'Erreur de chargement des propositions');
        showMessageBox('Erreur lors du chargement des propositions', 'error');
    }
}

function displayPropositions() {
    const container = document.getElementById('propositions-table-body');
    if (!container) return;
    
    if (currentPropositions.length === 0) {
        showEmptyState('propositions-table-body', 'Aucune proposition trouvée');
        return;
    }

    container.innerHTML = currentPropositions.map(proposition => {
        const statusClass = getOfferStatusClass(proposition.status);
        const statusText = getOfferStatusText(proposition.status);
        
        return `
        <tr>
            <td>
                <strong style="color: var(--vert-fonce);">${proposition.demandeId?.codeColis || 'N/A'}</strong>
            </td>
            <td>
                <div class="user-info-cell">
                    <div>
                        <strong>${proposition.demandeId?.nom || 'N/A'}</strong><br>
                        <small>${proposition.demandeId?.email || 'N/A'}</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="user-info-cell">
                    <div>
                        <strong>${proposition.transporteurId?.grandTransporteur?.entrepriseName || 
                                  proposition.transporteurId?.email || 'N/A'}</strong>
                    </div>
                </div>
            </td>
            <td>
                <strong style="color: var(--dore);">${proposition.montantPropose || 0} FC</strong>
            </td>
            <td>${proposition.delaiPropose || 'N/A'}</td>
            <td>${formatDate(proposition.dateEnvoi)}</td>
            <td>
                <span class="status-badge status-${statusClass}">
                    ${statusText}
                </span>
            </td>
            <td>
                <div class="user-actions">
                    <button class="btn-action btn-view" onclick="viewOfferDetails('${proposition._id}')" title="Voir détails">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function updatePropositionsCount() {
    const totalPropositions = document.getElementById('total-propositions');
    if (totalPropositions) {
        totalPropositions.textContent = currentPropositions.length;
    }
}

function filterPropositions() {
    const statusFilter = document.getElementById('status-filter').value;
    const startDate = document.getElementById('date-filter-start-props').value;
    const endDate = document.getElementById('date-filter-end-props').value;
    
    const rows = document.querySelectorAll('#propositions-table-body tr');
    
    rows.forEach(row => {
        if (statusFilter === 'all') {
            row.style.display = '';
        } else {
            const statusBadge = row.querySelector('.status-badge');
            if (!statusBadge) {
                row.style.display = 'none';
                return;
            }
            
            const statusText = statusBadge.textContent.trim().toLowerCase();
            let shouldShow = false;

            switch(statusFilter) {
                case 'en_attente':
                    shouldShow = statusText === 'en attente';
                    break;
                case 'accepté_par_client':
                    shouldShow = statusText === 'accepté';
                    break;
                case 'refusé_par_client':
                    shouldShow = statusText === 'refusé';
                    break;
                case 'en_cours':
                    shouldShow = statusText === 'en cours';
                    break;
                case 'livré':
                    shouldShow = statusText === 'livré';
                    break;
            }
            
            row.style.display = shouldShow ? '' : 'none';
        }
        
        // Filtre par date
        const dateCell = row.cells[5];
        if (dateCell && (startDate || endDate)) {
            const dateText = dateCell.textContent.trim();
            const [day, month, year] = dateText.split('/');
            const rowDate = `${year}-${month}-${day}`;
            
            if (startDate && rowDate < startDate) row.style.display = 'none';
            if (endDate && rowDate > endDate) row.style.display = 'none';
        }
    });
}

// ==================== ÉVALUATIONS ====================
async function loadRatingsData() {
    try {
        showMessage('Chargement des évaluations...', 'info');
        const response = await apiFetch('/api/admin/grand-transport/all-ratings');
        if (!response) return;
        
        currentRatings = await response.json();
        displayRatings();
        updateRatingsCount();
        showMessage(`${currentRatings.length} évaluations chargées`, 'success');
    } catch (error) {
        console.error('Erreur évaluations:', error);
        showEmptyState('ratings-table-body', 'Erreur de chargement des évaluations');
        showMessageBox('Erreur lors du chargement des évaluations', 'error');
    }
}

function displayRatings() {
    const container = document.getElementById('ratings-table-body');
    if (!container) return;
    
    if (currentRatings.length === 0) {
        showEmptyState('ratings-table-body', 'Aucune évaluation trouvée');
        return;
    }

    container.innerHTML = currentRatings.map(rating => {
        const stars = getStarRating(rating.rating);
        
        return `
        <tr>
            <td>
                <strong style="color: var(--vert-fonce);">${rating.codeColis || 'N/A'}</strong>
            </td>
            <td>
                <div class="user-info-cell">
                    <div>
                        <strong>${rating.nomClient || 'N/A'}</strong><br>
                        <small>${rating.emailClient || 'N/A'}</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="user-info-cell">
                    <div>
                        <strong>${rating.transporteurName || 'N/A'}</strong>
                    </div>
                </div>
            </td>
            <td>
                <div class="rating-stars">
                    ${stars}
                    <span class="rating-value">(${rating.rating}/5)</span>
                </div>
            </td>
            <td>${formatDate(rating.createdAt)}</td>
        </tr>
        `;
    }).join('');
}

function updateRatingsCount() {
    const totalRatings = document.getElementById('total-ratings');
    if (totalRatings) {
        totalRatings.textContent = currentRatings.length;
    }
}

function filterRatings() {
    const filter = document.getElementById('rating-filter').value;
    const searchTerm = document.getElementById('search-rating').value.toLowerCase().trim();
    const startDate = document.getElementById('date-filter-start-rating').value;
    const endDate = document.getElementById('date-filter-end-rating').value;
    
    const rows = document.querySelectorAll('#ratings-table-body tr');
    
    rows.forEach(row => {
        const codeColis = row.cells[0].textContent.toLowerCase();
        const ratingValue = row.querySelector('.rating-value').textContent;
        const dateCell = row.cells[4].textContent.trim();
        const [day, month, year] = dateCell.split('/');
        const rowDate = `${year}-${month}-${day}`;
        
        const matchesSearch = searchTerm === '' || codeColis.includes(searchTerm);
        const matchesFilter = filter === 'all' || ratingValue.includes(`(${filter}/5)`);
        let matchesDate = true;
        
        if (startDate && rowDate < startDate) matchesDate = false;
        if (endDate && rowDate > endDate) matchesDate = false;
        
        row.style.display = matchesSearch && matchesFilter && matchesDate ? '' : 'none';
    });
}

function getStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star star-filled"></i>';
        } else if (i === fullStars + 1 && halfStar) {
            stars += '<i class="fas fa-star-half-alt star-filled"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return stars;
}

// ==================== VUE DÉTAILLÉE PROFIL ====================
async function viewProfile(userId) {
    try {
        showMessage('Chargement du profil...', 'info');
        const response = await apiFetch(`/api/admin/users/${userId}`);
        if (!response) return;
        
        const user = await response.json();
        displayProfileModal(user);
    } catch (error) {
        console.error('Erreur profil:', error);
        showMessageBox('Erreur lors du chargement du profil', 'error');
    }
}

function displayProfileModal(user) {
    const modalContent = document.getElementById('modal-profile-content');
    if (!modalContent) return;
    
    modalContent.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">
                <img src="${getUserAvatar(user)}" alt="${getUserName(user)}" onerror="this.src='/images/default-avatar.png'">
            </div>
            <div class="profile-info">
                <h3>${getUserName(user)}</h3>
                <p class="profile-role">${getRoleLabel(user.role)}</p>
                <div class="profile-contacts">
                    <span><i class="fas fa-envelope"></i> ${user.email}</span>
                    <span><i class="fas fa-phone"></i> ${getUserPhone(user)}</span>
                    <span><i class="fas fa-calendar"></i> Inscrit le: ${formatDate(user.createdAt)}</span>
                    <span class="status-badge status-${user.isVerified ? 'active' : 'pending'}">
                        ${user.isVerified ? 'Compte vérifié' : 'En attente de vérification'}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="profile-sections">
            ${generateProfileDetails(user)}
        </div>
    `;
    
    document.getElementById('profile-modal').style.display = 'flex';
}

async function viewDemandeDetails(demandeId) {
    try {
        const response = await apiFetch(`/api/admin/grand-transport/request/${demandeId}`);
        if (!response) return;
        
        const demande = await response.json();
        const modalContent = document.getElementById('modal-profile-content');
        
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <div class="profile-header">
                <div class="profile-info">
                    <h3>Détails de la demande</h3>
                    <p class="profile-role">${demande.codeColis || 'N/A'}</p>
                </div>
            </div>
            
            <div class="profile-sections">
                <div class="profile-section">
                    <h4><i class="fas fa-info-circle"></i> Informations client</h4>
                    <div class="profile-details-grid">
                        <div class="detail-item">
                            <label>Nom:</label>
                            <span>${demande.nom || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${demande.email || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Téléphone:</label>
                            <span>${demande.telephone || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Localisation:</label>
                            <span>${demande.ville || 'N/A'}, ${demande.commune || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h4><i class="fas fa-route"></i> Trajet</h4>
                    <div class="profile-details-grid">
                        <div class="detail-item">
                            <label>Départ:</label>
                            <span>${demande.villeDepart || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Arrivée:</label>
                            <span>${demande.villeArrivee || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h4><i class="fas fa-box"></i> Marchandise</h4>
                    <div class="profile-details-grid">
                        <div class="detail-item">
                            <label>Type:</label>
                            <span>${demande.typeMarchandise || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Poids/Volume:</label>
                            <span>${demande.poidsVolume || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Type camion:</label>
                            <span>${demande.typeCamion || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h4><i class="fas fa-money-bill"></i> Statut</h4>
                    <div class="profile-details-grid">
                        <div class="detail-item">
                            <label>Statut demande:</label>
                            <span class="status-badge status-${getStatusClass(demande.status)}">
                                ${getStatusText(demande.status)}
                            </span>
                        </div>
                        <div class="detail-item">
                            <label>Paiement:</label>
                            <span class="status-badge status-${demande.paymentStatus === 'payé' ? 'active' : 'pending'}">
                                ${demande.paymentStatus === 'payé' ? 'Payé' : 'Non payé'}
                            </span>
                        </div>
                        <div class="detail-item">
                            <label>Date:</label>
                            <span>${formatDate(demande.date)}</span>
                        </div>
                    </div>
                </div>
                
                ${demande.description ? `
                <div class="profile-section">
                    <h4><i class="fas fa-file-alt"></i> Description</h4>
                    <div style="background: var(--blanc); padding: 1rem; border-radius: 8px;">
                        <p>${demande.description}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('profile-modal').style.display = 'flex';
        
    } catch (error) {
        console.error('Erreur détails demande:', error);
        showMessageBox('Erreur lors du chargement des détails', 'error');  
    }
}

async function viewOfferDetails(offerId) {
    try {
        const response = await apiFetch(`/api/admin/grand-transport/offer/${offerId}`);
        if (!response) return;
        
        const offer = await response.json();
        const modalContent = document.getElementById('modal-profile-content');
        
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <div class="profile-header">
                <div class="profile-info">
                    <h3>Détails de la proposition</h3>
                    <p class="profile-role">${offer.demandeId?.codeColis || 'N/A'}</p>
                </div>
            </div>
            
            <div class="profile-sections">
                <div class="profile-section">
                    <h4><i class="fas fa-info-circle"></i> Informations proposition</h4>
                    <div class="profile-details-grid">
                        <div class="detail-item">
                            <label>Montant proposé:</label>
                            <span style="color: var(--dore); font-weight: bold;">
                                ${offer.montantPropose || 0} USD
                            </span>
                        </div>
                        <div class="detail-item">
                            <label>Délai proposé:</label>
                            <span>${offer.delaiPropose || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Disponibilité:</label>
                            <span>${offer.jourDisponible || 'N/A'} à ${offer.heureDisponible || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Statut:</label>
                            <span class="status-badge status-${getOfferStatusClass(offer.status)}">
                                ${getOfferStatusText(offer.status)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h4><i class="fas fa-truck"></i> Informations camion</h4>
                    <div class="profile-details-grid">
                        <div class="detail-item">
                            <label>Couleur camion:</label>
                            <span>${offer.couleurCamion || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Plaque d'immatriculation:</label>
                            <span>${offer.plaqueImmatriculation || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h4><i class="fas fa-user"></i> Informations transporteur</h4>
                    <div class="profile-details-grid">
                        <div class="detail-item">
                            <label>Nom entreprise:</label>
                            <span>${offer.transporteurId?.grandTransporteur?.entrepriseName || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${offer.transporteurId?.email || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Téléphone:</label>
                            <span>${offer.transporteurId?.grandTransporteur?.telephone || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                ${offer.description ? `
                <div class="profile-section">
                    <h4><i class="fas fa-file-alt"></i> Description</h4>
                    <div style="background: var(--blanc); padding: 1rem; border-radius: 8px;">
                        <p>${offer.description}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('profile-modal').style.display = 'flex';
        
    } catch (error) {
        console.error('Erreur détails proposition:', error);
        showMessageBox('Erreur lors du chargement des détails', 'error');
    }
}

// ==================== FONCTIONS UTILITAIRES ====================
function generateProfileDetails(user) {
    let html = '';
    
    // CLIENT
    if (user.role === 'client' && user.client) {
        const clientData = user.client;
        html += `<div class="profile-section">
            <h4><i class="fas fa-info-circle"></i> Informations Client</h4>
            <div class="profile-details-grid">
                <div class="detail-item">
                    <label>Nom complet:</label>
                    <span>${clientData.fullName || 'Non renseigné'}</span>
                </div>
                <div class="detail-item">
                    <label>Téléphone:</label>
                    <span>${clientData.telephone || 'Non renseigné'}</span>
                </div>
                <div class="detail-item">
                    <label>Adresse:</label>
                    <span>${clientData.adresse || 'Non renseigné'}</span>
                </div>
            </div>
        </div>`;
    }
    
    // AGENCE
    else if (user.role === 'agence' && user.agence) {
        const agenceData = user.agence;

        html += `<div class="profile-section">
            <h4><i class="fas fa-info-circle"></i> Informations Agence</h4>
            <div class="profile-details-grid">
                <div class="detail-item">
                    <label>Nom agence:</label>
                    <span>${agenceData.agenceName || 'Non renseigné'}</span>
                </div>
                <div class="detail-item">
                    <label>Responsable:</label>
                    <span>${agenceData.responsable || 'Non renseigné'}</span>
                </div>
                <div class="detail-item">
                    <label>Destinations:</label>
                    <span>${agenceData.destinations?.map(d => d.toUpperCase()).join(', ') || 'Non renseigné'}</span>
                </div>
            </div>
        </div>`;

        if (agenceData.typesColis && agenceData.typesColis.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-box"></i> Types de Colis</h4>
                <div class="tags-grid">
                    ${agenceData.typesColis.map(type => `<span class="tag">${getColisLabel(type)}</span>`).join(' ')}
                </div>
            </div>`;
        }

        if (agenceData.locations && agenceData.locations.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-map-marker-alt"></i> Locations</h4>
                <div class="locations-grid">
                    ${agenceData.locations.map(loc => `
                        <div class="location-item">
                            <strong>Pays:</strong> ${loc.pays || 'N/A'}<br>
                            <strong>Ville:</strong> ${loc.ville || 'N/A'}<br>
                            <strong>Adresse:</strong> ${loc.adresse || 'N/A'}<br>
                            <strong>Téléphone:</strong> ${loc.telephone || 'N/A'}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        if (agenceData.tarifs && agenceData.tarifs.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-money-bill"></i> Tarifs</h4>
                <div class="tarifs-grid">
                    ${agenceData.tarifs.map(tarif => `
                        <div class="tarif-item">
                            <strong>${tarif.destination || 'N/A'}</strong> - 
                            <span>${tarif.prix || 0} USD</span> - 
                            <span>${tarif.delai || 0} jours</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        if (agenceData.services && agenceData.services.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-concierge-bell"></i> Services</h4>
                <div class="tags-grid">
                    ${agenceData.services.map(service => `<span class="tag">${service}</span>`).join(' ')}
                </div>
            </div>`;
        }
    }
    
    // PETIT TRANSPORTEUR
    else if (user.role === 'petit_transporteur' && user.petitTransporteur) {
        const transporteurData = user.petitTransporteur;

        html += `<div class="profile-section">
            <h4><i class="fas fa-info-circle"></i> Informations Petit Transporteur</h4>
            <div class="profile-details-grid">
                <div class="detail-item">
                    <label>Nom complet:</label>
                    <span>${transporteurData.fullName || 'Non renseigné'}</span>
                </div>
                <div class="detail-item">
                    <label>Téléphone:</label>
                    <span>${transporteurData.telephone || 'Non renseigné'}</span>
                </div>
                <div class="detail-item">
                    <label>Adresse:</label>
                    <span>${transporteurData.adresse || 'Non renseigné'}</span>
                </div>
            </div>
        </div>`;

        if (transporteurData.vehicleType && transporteurData.vehicleType.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-truck"></i> Types de Véhicules</h4>
                <div class="tags-grid">
                    ${transporteurData.vehicleType.map(type => `<span class="tag tag-vehicle">${getVehicleLabel(type)}</span>`).join(' ')}
                </div>
            </div>`;
        }

        if (transporteurData.typesColis && transporteurData.typesColis.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-box"></i> Types de Colis Acceptés</h4>
                <div class="tags-grid">
                    ${transporteurData.typesColis.map(type => `<span class="tag tag-colis">${getColisLabel(type)}</span>`).join(' ')}
                </div>
            </div>`;
        }

        if (transporteurData.destinations && transporteurData.destinations.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-map-marker-alt"></i> Zones de Service</h4>
                <div class="destinations-grid">
                    ${transporteurData.destinations.map((dest, index) => {
                        const tarif = transporteurData.tarifs[index] || transporteurData.tarifs[0];
                        return `
                            <div class="destination-item">
                                <i class="fas fa-location-dot"></i>
                                ${dest} - <span class="delai-cell">${tarif.delai || 0} ${getDelaiUnite(tarif.delai)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>`;
        }

        if (transporteurData.tarifs && transporteurData.tarifs.length > 0) {
            const tarif = transporteurData.tarifs[0];
            html += `<div class="profile-section">
                <h4><i class="fas fa-money-bill-wave"></i> Prix</h4>
                <div class="profile-details-grid">
                    <div class="detail-item">
                        <label>Prix par colis:</label>
                        <span class="price-value">${tarif.prix || 0} USD</span>
                    </div>
                </div>
            </div>`;
        }
    }
    
    // GRAND TRANSPORTEUR
    else if (user.role === 'grand_transporteur' && user.grandTransporteur) {
        const transporteurData = user.grandTransporteur;

        html += `<div class="profile-section">
            <h4><i class="fas fa-info-circle"></i> Informations Grand Transporteur</h4>
            <div class="profile-details-grid">
                <div class="detail-item">
                    <label>Nom entreprise:</label>
                    <span>${transporteurData.entrepriseName || 'Non renseigné'}</span>
                </div>
                <div class="detail-item">
                    <label>Téléphone:</label>
                    <span>${transporteurData.telephone || 'Non renseigné'}</span>
                </div>
                <div class="detail-item">
                    <label>Adresse:</label>
                    <span>${transporteurData.adresse || 'Non renseigné'}</span>
                </div>
            </div>
        </div>`;

        if (transporteurData.typeCamion && transporteurData.typeCamion.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-truck"></i> Types de Camions</h4>
                <div class="tags-grid">
                    ${transporteurData.typeCamion.map(type => `<span class="tag">${type}</span>`).join(' ')}
                </div>
            </div>`;
        }

        if (transporteurData.provinces && transporteurData.provinces.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-map"></i> Provinces</h4>
                <div class="tags-grid">
                    ${transporteurData.provinces.map(province => `<span class="tag">${province}</span>`).join(' ')}
                </div>
            </div>`;
        }

        if (transporteurData.tarifs && transporteurData.tarifs.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-map-marker-alt"></i> Destinations et Délais</h4>
                <div class="destinations-grid">
                    ${transporteurData.tarifs.map(tarif => `
                        <div class="destination-item">
                            <strong>${tarif.destination || 'N/A'}</strong> - 
                            <span class="delai-cell">${tarif.delai || 0} jours</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        if (transporteurData.tarifs && transporteurData.tarifs.length > 0) {
            const tarif = transporteurData.tarifs[0];
            html += `<div class="profile-section">
                <h4><i class="fas fa-money-bill-wave"></i> Prix</h4>
                <div class="profile-details-grid">
                    <div class="detail-item">
                        <label>Prix par colis:</label>
                        <span class="price-value">${tarif.prix || 0} USD</span>
                    </div>
                </div>
            </div>`;
        }
    }
    
    if (html === '') {
        html = '<p class="no-data">Aucune information supplémentaire disponible</p>';
    }
    
    return html;
}

function showEmptyState(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// ==================== FONCTIONS DE FORMATAGE ====================
function getStatusClass(status) {
    if (status === 'accepté' || status === 'livré') return 'active';
    if (status === 'refusé') return 'blocked';
    return 'pending';
}

function getStatusText(status) {
    const texts = {
        'en_attente': 'En attente',
        'accepté': 'Accepté',
        'refusé': 'Refusé',
        'en_cours': 'En cours',
        'livré': 'Livré'
    };
    return texts[status] || status;
}

function getOfferStatusClass(status) {
    if (status === 'accepté_par_client' || status === 'livré') return 'active';
    if (status === 'refusé_par_client' || status === 'refusé') return 'blocked';
    return 'pending';
}

function getOfferStatusText(status) {
    const texts = {
        'en_attente': 'En attente',
        'accepté_par_client': 'Accepté',
        'refusé_par_client': 'Refusé',
        'en_cours': 'En cours',
        'livré': 'Livré'
    };
    return texts[status] || status;
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle',
        'offer': 'handshake',
        'payment': 'credit-card',
        'transport': 'truck'
    };
    return icons[type] || 'bell';
}

function formatNotificationTime(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours} h`;
        if (days === 1) return 'Hier';
        if (days < 7) return `Il y a ${days} jours`;
        
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch (error) {
        return '';
    }
}

function getVehicleLabel(vehicle) {
    const vehicles = {
        'moto': 'Moto',
        'voiture': 'Voiture', 
        'velo': 'Vélo',
        'scooter': 'Scooter',
        'utilitaire': 'Véhicule utilitaire'
    };
    return vehicles[vehicle] || vehicle;
}

function getColisLabel(type) {
    const types = {
        'standard': 'Standard',
        'fragile': 'Fragile',
        'documents': 'Documents',
        'urgent': 'Urgent',
        'alimentaire': 'Alimentaire',
        'encombrant': 'Encombrant'
    };
    return types[type] || type;
}

function getDelaiUnite(delai) {
    if (!delai || delai === 0 || delai === '0') return 'N/A';
    if (delai == 1) return 'heure';
    if (delai < 24) return 'heures';
    return 'jours';
}

function getRoleLabel(role) {
    const roles = {
        'client': 'Client',
        'agence': 'Agence', 
        'petit_transporteur': 'Petit Transporteur',
        'grand_transporteur': 'Grand Transporteur',
        'admin': 'Administrateur'
    };
    return roles[role] || role;
}

function getCompanyName(company) {
    if (company.role === 'client' && company.client && company.client.fullName) 
        return company.client.fullName;
    if (company.role === 'agence' && company.agence && company.agence.agenceName) 
        return company.agence.agenceName;
    if (company.role === 'petit_transporteur' && company.petitTransporteur && company.petitTransporteur.fullName) 
        return company.petitTransporteur.fullName;
    if (company.role === 'grand_transporteur' && company.grandTransporteur && company.grandTransporteur.entrepriseName) 
        return company.grandTransporteur.entrepriseName;
    return company.email || 'Nom non disponible';
}

function getCompanyAddress(company) {
    if (company.role === 'client' && company.client && company.client.adresse) 
        return company.client.adresse;
    if (company.role === 'agence' && company.agence && company.agence.adresse) 
        return company.agence.adresse;
    if (company.role === 'petit_transporteur' && company.petitTransporteur && company.petitTransporteur.adresse) 
        return company.petitTransporteur.adresse;
    if (company.role === 'grand_transporteur' && company.grandTransporteur && company.grandTransporteur.adresse) 
        return company.grandTransporteur.adresse;
    return 'Adresse non disponible';
}

function getCompanyLogo(company) {
    if (company.role === 'petit_transporteur' && company.petitTransporteur && company.petitTransporteur.photo) 
        return company.petitTransporteur.photo;
    if (company.role === 'agence' && company.agence && company.agence.logo) 
        return company.agence.logo;
    if (company.role === 'grand_transporteur' && company.grandTransporteur && company.grandTransporteur.logo) 
        return company.grandTransporteur.logo;
    if (company.role === 'client' && company.client && company.client.photo) 
        return company.client.photo;
    return '/images/default-company.png';
}

function getUserName(user) {
    return getCompanyName(user);
}

function getUserPhone(user) {
    if (user.role === 'client' && user.client && user.client.telephone) 
        return user.client.telephone;
    if (user.role === 'agence' && user.agence && user.agence.telephone) 
        return user.agence.telephone;
    if (user.role === 'petit_transporteur' && user.petitTransporteur && user.petitTransporteur.telephone) 
        return user.petitTransporteur.telephone;
    if (user.role === 'grand_transporteur' && user.grandTransporteur && user.grandTransporteur.telephone) 
        return user.grandTransporteur.telephone;
    return 'Non renseigné';
}

function getUserAvatar(user) {
    if (user.role === 'petit_transporteur' && user.petitTransporteur && user.petitTransporteur.photo) {
        const avatarUrl = user.petitTransporteur.photo;
        if (avatarUrl && avatarUrl.includes('cloudinary')) {
            return avatarUrl.replace('/upload/', '/upload/w_60,h_60,c_fill/');
        }
        return avatarUrl;
    }
    
    const avatarUrl = getCompanyLogo(user);
    if (avatarUrl && avatarUrl.includes('cloudinary')) {
        return avatarUrl.replace('/upload/', '/upload/w_60,h_60,c_fill/');
    }
    return avatarUrl || '/images/default-avatar.png';
}

function getInitials(name) {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
}

function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return 'Date invalide';
    }
}

// ==================== LOGOUT ====================
function logout(event) {
    event.preventDefault();
    showConfirm('Êtes-vous sûr de vouloir vous déconnecter ?', () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    });
}

// ==================== GESTION REDIMENSIONNEMENT ====================
window.addEventListener('resize', function() {
    if (window.innerWidth > 1024) {
        document.querySelector('.sidebar').classList.remove('active');
    }
});