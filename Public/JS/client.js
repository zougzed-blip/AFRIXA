document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
        window.location.href = "/login";
        return;
    }
    
    setCurrentDate();
    initializeClientPanel();
});

function setCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('fr-FR', options);
    }
}

async function initializeClientPanel() {
    try {
        await loadUserProfile();
        setupNavigation();
        setupEventListeners();
        setupMobileMenu();
        setupQuickActions();
        setupModals();
        setupPaymentProofModal();
        await loadUserNotifications();
      
        await loadClientRequests();
        await loadAllOffers();
        
        const openProofModalBtn = document.getElementById('openProofModalBtn');
        if (openProofModalBtn) {
            openProofModalBtn.addEventListener('click', () => {
                const modal = document.getElementById('paymentProofModal');
                if (modal) modal.style.display = 'flex';
            });
        }
        
        loadActiveSection();
    } catch (error) {
        console.error('Erreur initialisation:', error);
        showPopup('Erreur de chargement des données', 'error');
    }
}

function loadActiveSection() {
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) return;
    
    switch (activeSection.id) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'requests':
            loadClientRequests();
            break;
        case 'offers':
            loadAllOffers();
            break;
        case 'history':
            loadClientHistory();
            break;
        case 'profile':
            loadProfileData();
            break;
        case 'new-request':
            setupRequestForms();
            break;
    }
}

function showPopup(message, type = 'info') {
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
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .btn-confirm-no:hover { background: var(--gris-moyen); }
                .btn-confirm-yes:hover { background: #003824; transform: translateY(-1px); }
            `;
            document.head.appendChild(style);
        }
        
        const noBtn = overlay.querySelector('.btn-confirm-no');
        const yesBtn = overlay.querySelector('.btn-confirm-yes');
        
        const closePopup = (result) => {
            overlay.style.animation = 'confirmPopupOut 0.3s ease';
            setTimeout(() => {
                if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
                document.body.style.overflow = 'auto';
            }, 300);
            resolve(result);
        };
        
        noBtn.addEventListener('click', () => closePopup(false));
        yesBtn.addEventListener('click', () => closePopup(true));
        overlay.addEventListener('click', (e) => e.target === overlay && closePopup(false));
    });
}

async function loadUserNotifications() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch('/api/client/notifications', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.notifications) displayNotifications(data.notifications);
        }
    } catch (error) {
        console.log("Erreur chargement notifications:", error);
    }
}

function displayNotifications(notifications) {
    const notificationArea = document.getElementById('notifications-list');
    if (!notificationArea) return;
    
    if (!notifications || notifications.length === 0) {
        notificationArea.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash fa-2x"></i>
                <p>Aucune notification pour le moment</p>
            </div>
        `;
        return;
    }
    
    const sortedNotifications = [...notifications].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    notificationArea.innerHTML = sortedNotifications.map(notif => `
        <div class="notification-item">
            <div class="notification-icon">
                <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notif.title || 'Notification'}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${formatNotificationTime(notif.date)}</div>
            </div>
        </div>
    `).join('');
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

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.classList.contains('logout')) return;
            
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
            
            const pageId = this.getAttribute('data-page');
            const targetSection = document.getElementById(pageId);
            if (targetSection) {
                targetSection.classList.add('active');
                
                switch(pageId) {
                    case 'dashboard': loadDashboardData(); break;
                    case 'requests': loadClientRequests(); break;
                    case 'offers': loadAllOffers(); break;
                    case 'history': loadClientHistory(); break;
                    case 'profile': loadProfileData(); break;
                    case 'new-request': setupRequestForms(); break;
                }
            }
            
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('active')) sidebar.classList.remove('active');
        });
    });
}

function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }
}

function setupQuickActions() {
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            if (pageId) {
                const targetNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
                if (targetNav) targetNav.click();
            }
        });
    });
}

async function loadUserProfile() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch('/api/client/profile', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const userData = await response.json();
            updateUserInterface(userData);
        } else {
            throw new Error('Erreur de chargement du profil');
        }
    } catch (error) {
        console.error('Erreur profil:', error);
        throw error;
    }
}

function updateUserInterface(userData) {
    const userNameElement = document.getElementById('header-name');
    const userAvatarElement = document.getElementById('header-avatar');
    
    if (userNameElement && userData.client?.fullName) userNameElement.textContent = userData.client.fullName;
    if (userAvatarElement) {
        userAvatarElement.src = userData.client?.photo || 'https://via.placeholder.com/40x40?text=U';
        userAvatarElement.alt = userData.client?.fullName || 'Utilisateur';
    }

    const welcomeElement = document.getElementById('welcome-message');
    if (welcomeElement && userData.client?.fullName) {
        const hour = new Date().getHours();
        let greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
        welcomeElement.textContent = `${greeting}, ${userData.client.fullName}`;
    }
}

async function loadDashboardData() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch('/api/client/dashboard', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const dashboardData = await response.json();
            updateDashboard(dashboardData);
        } else {
            throw new Error('Erreur de chargement du dashboard');
        }
    } catch (error) {
        console.error('Erreur dashboard:', error);
        showPopup('Erreur de chargement du dashboard', 'error');
    }
}

function updateDashboard(data) {
    const lastRequestCard = document.getElementById('last-request-card');
    const noRequestsMessage = document.getElementById('no-requests-message');
    
    if (data.lastRequest) {
        lastRequestCard.style.display = 'block';
        if (noRequestsMessage) noRequestsMessage.style.display = 'none';
        
        document.getElementById('last-request-type').textContent = data.lastRequest.typeCamion || 'Grand Transport';
        
        const statusElement = document.getElementById('last-request-status');
        statusElement.className = 'activity-badge ' + getStatusClass(data.lastRequest.status);
        statusElement.textContent = getStatusText(data.lastRequest.status);
        
        document.getElementById('last-request-route').textContent = `${data.lastRequest.villeDepart || ''} → ${data.lastRequest.villeArrivee || ''}`;
        document.getElementById('last-request-date').textContent = `Date: ${formatDate(data.lastRequest.date)}`;
        document.getElementById('last-request-code').textContent = `Code: ${data.lastRequest.codeColis || 'En attente'}`;
    } else {
        if (lastRequestCard) lastRequestCard.style.display = 'none';
        if (noRequestsMessage) noRequestsMessage.style.display = 'block';
    }
}

async function loadClientRequests() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch('/api/client/requests', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            const pendingRequests = data.requests.filter(r => r.status === 'en_attente' || r.status === 'en_cours');
            displayRequests(pendingRequests);
            
            const activeRequests = pendingRequests.filter(r => r.status === 'en_attente' || r.status === 'en_cours').length;
            updateRequestsBadge(activeRequests);
        } else {
            throw new Error('Erreur de chargement des demandes');
        }
    } catch (error) {
        console.error('Erreur demandes:', error);
        showPopup('Erreur de chargement des demandes', 'error');
    }
}

function displayRequests(requests) {
    const container = document.getElementById('requests-list');
    if (!container) return;
    
    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox fa-3x"></i>
                <h3>Aucune demande trouvée</h3>
                <p>Commencez par créer votre première demande de transport</p>
                <button class="btn btn-primary" data-page="new-request">
                    <i class="fas fa-plus"></i> Créer une Demande
                </button>
            </div>
        `;
        
        const createBtn = container.querySelector('button[data-page="new-request"]');
        if (createBtn) {
            createBtn.addEventListener('click', function() {
                const nav = document.querySelector('.nav-item[data-page="new-request"]');
                if (nav) nav.click();
            });
        }
        return;
    }
    
    const total = requests.length;
    const active = requests.filter(r => r.status === 'en_cours').length;
    const pending = requests.filter(r => r.status === 'en_attente').length;
    
    document.getElementById('total-requests-count').textContent = total;
    document.getElementById('active-requests-count').textContent = active;
    document.getElementById('pending-requests-count').textContent = pending;
    
    container.innerHTML = requests.map(request => `
        <div class="request-item">
            <div class="request-header">
                <div class="request-info">
                    <h3>
                        <i class="fas fa-truck"></i>
                        Grand Transport
                        <span class="request-code">${request.codeColis || 'En attente'}</span>
                    </h3>
                </div>
                <div class="request-date">${formatDate(request.date)}</div>
            </div>
            <div class="request-details">
                <div class="detail">
                    <span class="detail-label">Itinéraire</span>
                    <span class="detail-value">${request.villeDepart} → ${request.villeArrivee}</span>
                </div>
                <div class="detail">
                    <span class="detail-label">Type de camion</span>
                    <span class="detail-value">${request.typeCamion}</span>
                </div>
                <div class="detail">
                    <span class="detail-label">Marchandise</span>
                    <span class="detail-value">${request.typeMarchandise}</span>
                </div>
                <div class="detail">
                    <span class="detail-label">Poids/Volume</span>
                    <span class="detail-value">${request.poidsVolume}</span>
                </div>
            </div>
            <div class="request-footer">
                <div class="status-badge ${getStatusClass(request.status)}">
                    <i class="fas fa-${getStatusIcon(request.status)}"></i>
                    ${getStatusText(request.status)}
                </div>
                <button class="btn btn-outline btn-sm view-request-btn" data-id="${request._id}">
                    <i class="fas fa-eye"></i> Voir Détails
                </button>
            </div>
        </div>
    `).join('');
    
    attachViewButtonsEvents();
    setupRequestsSearch();
}

function getStatusIcon(status) {
    const icons = {
        'en_attente': 'clock',
        'accepté': 'check-circle',
        'refusé': 'times-circle',
        'en_cours': 'truck-moving',
        'livré': 'check-double'
    };
    return icons[status] || 'clock';
}

function updateRequestsBadge(count) {
    const badge = document.getElementById('requests-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function setupRequestsSearch() {
    const searchInput = document.getElementById('searchRequests');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const requestItems = document.querySelectorAll('.request-item');
        
        requestItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    });
}

async function loadAllOffers() {
    const token = localStorage.getItem("token");
    const container = document.getElementById('offersContainer');
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Chargement des offres...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/client/grandTransport/all-offers', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Erreur de chargement des offres');
        
        const data = await response.json();
        
        if (data.success && data.offers && data.offers.length > 0) {
            displayAllOffers(data.offers);
            setupOfferFilters(data.offers);
            const pendingOffers = data.offers.filter(o => o.status === 'en_attente').length;
            updateOffersBadge(pendingOffers);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox fa-3x"></i>
                    <h3>Aucune offre reçue</h3>
                    <p>Vous recevrez des offres ici dès que des transporteurs répondront à vos demandes</p>
                    <button class="btn btn-primary" data-page="requests">
                        <i class="fas fa-eye"></i> Voir mes demandes
                    </button>
                </div>
            `;
            updateOffersBadge(0);
        }
    } catch (error) {
        console.error('Erreur chargement offres:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle fa-3x"></i>
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger les offres. Veuillez réessayer.</p>
                <button class="btn btn-primary" onclick="loadAllOffers()">
                    <i class="fas fa-redo"></i> Réessayer
                </button>
            </div>
        `;
    }
}

function displayAllOffers(offers) {
    const container = document.getElementById('offersContainer');
    if (!container) return;
    
    container.innerHTML = offers.map(offer => {
        const demande = offer.demandeId || {};
        const transporter = offer.transporteurId || {};
        const entrepriseName = transporter.grandTransporteur?.entrepriseName;
        const logo = transporter.grandTransporteur?.logo;
        const fullName = transporter.fullName || entrepriseName || 'Transporteur';
        
        return `
            <div class="offer-item" data-status="${offer.status}" data-code="${demande.codeColis || ''}">
                <div class="offer-header">
                    <div class="offer-info">
                        <h3>
                            <i class="fas fa-handshake"></i>
                            Offre pour le colis
                            <span class="request-code">${demande.codeColis || 'Code non disponible'}</span>
                        </h3>
                    </div>
                </div>
                
                <div class="transporter-info">
                    <div class="transporter-avatar">
                       ${logo ? `<img src="${logo}" alt="${entrepriseName}">` : `<i class="fas fa-user-truck"></i>`}
                   </div>
                   <div class="transporter-details">
                       <h4>${entrepriseName || fullName}</h4>
                       <p>${transporter.email || ''}</p>
                       <p>${transporter.phone || ''}</p>
                   </div>
                </div>
                
                <div class="offer-details">
                    <div class="offer-detail-row">
                        <span class="offer-label">Montant proposé:</span>
                        <span class="offer-value">${formatCurrency(offer.montantPropose)}</span>
                    </div>
                    <div class="offer-detail-row">
                        <span class="offer-label">Délai proposé:</span>
                        <span class="offer-value">${offer.delaiPropose}</span>
                    </div>
                    <div class="offer-detail-row">
                        <span class="offer-label">Disponibilité:</span>
                        <span class="offer-value">${offer.jourDisponible} à ${offer.heureDisponible}</span>
                    </div>
                    <div class="offer-detail-row">
                        <span class="offer-label">Camion:</span>
                        <span class="offer-value">${offer.couleurCamion} - ${offer.plaqueImmatriculation}</span>
                    </div>
                </div>
                
                ${offer.description ? `
                <div class="offer-description">
                    <p><strong>Message du transporteur:</strong></p>
                    <p>${offer.description}</p>
                </div>
                ` : ''}
                
                ${offer.status === 'en_attente' ? `
                <div class="offer-actions">
                    <button class="btn btn-success btn-accept" data-offer-id="${offer._id}">
                        <i class="fas fa-check"></i> Accepter l'offre
                    </button>
                    <button class="btn btn-danger btn-reject" data-offer-id="${offer._id}">
                        <i class="fas fa-times"></i> Refuser l'offre
                    </button>
                </div>
                ` : `
                <div class="offer-actions">
                    <button class="btn btn-primary view-details-btn" data-request-id="${demande._id}">
                        <i class="fas fa-eye"></i> Voir la demande
                    </button>
                </div>
                `}
                
                <div class="offer-footer">
                    <small>Offre reçue le ${formatDate(offer.dateEnvoi)}</small>
                </div>
            </div>
        `;
    }).join('');
    
    attachOfferPageActions();
}

function setupOfferFilters(allOffers) {
    let currentOffers = [...allOffers];
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (filter === 'all') {
                displayAllOffers(allOffers);
                currentOffers = [...allOffers];
            } else {
                const filtered = allOffers.filter(offer => offer.status === filter);
                displayAllOffers(filtered);
                currentOffers = filtered;
            }
            
            const searchInput = document.getElementById('offerSearch');
            if (searchInput) searchInput.value = '';
        });
    });
    
    const searchInput = document.getElementById('offerSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            if (!searchTerm) {
                const activeFilter = document.querySelector('.filter-btn.active');
                if (activeFilter) activeFilter.click();
                return;
            }
            
            const filtered = currentOffers.filter(offer => {
                const demande = offer.demandeId || {};
                const transporter = offer.transporteurId || {};
                const code = demande.codeColis ? demande.codeColis.toLowerCase() : '';
                const villeDepart = demande.villeDepart ? demande.villeDepart.toLowerCase() : '';
                const villeArrivee = demande.villeArrivee ? demande.villeArrivee.toLowerCase() : '';
                const transporteur = transporter.fullName ? transporter.fullName.toLowerCase() : '';
                
                return code.includes(searchTerm) || villeDepart.includes(searchTerm) || 
                       villeArrivee.includes(searchTerm) || transporteur.includes(searchTerm);
            });
            
            displayAllOffers(filtered);
        });
    }
    
    const clearSearch = document.getElementById('clearSearch');
    if (clearSearch) clearSearch.addEventListener('click', function() {
        searchInput.value = '';
        const activeFilter = document.querySelector('.filter-btn.active');
        if (activeFilter) activeFilter.click();
    });
}

function attachOfferPageActions() {
    document.querySelectorAll('.btn-accept').forEach(button => {
        button.addEventListener('click', async function() {
            const offerId = this.getAttribute('data-offer-id');
            const originalHTML = this.innerHTML;
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            try {
                const confirmed = await showConfirmPopup('Êtes-vous sûr de vouloir accepter cette offre ? Cette action est irréversible.');
                if (!confirmed) {
                    this.disabled = false;
                    this.innerHTML = originalHTML;
                    return;
                }
                await acceptOffer(offerId);
                loadAllOffers();
            } catch (error) {
                this.disabled = false;
                this.innerHTML = originalHTML;
                showPopup(error.message, 'error');
            }
        });
    });
    
    document.querySelectorAll('.btn-reject').forEach(button => {
        button.addEventListener('click', async function() {
            const offerId = this.getAttribute('data-offer-id');
            const originalHTML = this.innerHTML;
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            try {
                const confirmed = await showConfirmPopup('Êtes-vous sûr de vouloir refuser cette offre ? Cette action est irréversible.');
                if (!confirmed) {
                    this.disabled = false;
                    this.innerHTML = originalHTML;
                    return;
                }
                await rejectOffer(offerId);
                loadAllOffers();
            } catch (error) {
                this.disabled = false;
                this.innerHTML = originalHTML;
                showPopup(error.message, 'error');
            }
        });
    });
    
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', function() {
            const requestId = this.getAttribute('data-request-id');
            showRequestDetails(requestId);
        });
    });
}

async function acceptOffer(offerId) {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/client/grandTransport/offers/${offerId}/accept`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'acceptation');
    }
    
    const data = await response.json();
    
    if (data.success) {
        showPopup('Offre acceptée avec succès! Le transporteur a été notifié.', 'success');
        const demande = data.offer.demandeId;
        if (demande) {
            addNotificationToPanel(`Vous avez accepté une offre pour le colis ${demande.codeColis || ''}`, 'success');
        }
        return data;
    } else {
        throw new Error(data.message || 'Erreur inconnue');
    }
}

async function rejectOffer(offerId) {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/client/grandTransport/offers/${offerId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du refus');
    }
    
    const data = await response.json();
    
    if (data.success) {
        showPopup('Offre refusée avec succès!', 'success');
        const demande = data.offer.demandeId;
        if (demande) addNotificationToPanel(`Vous avez refusé une offre pour le colis ${demande.codeColis || ''}`, 'warning');
        return data;
    } else {
        throw new Error(data.message || 'Erreur inconnue');
    }
}

function addNotificationToPanel(message, type = 'info') {
    const notificationArea = document.getElementById('notifications-list');
    if (!notificationArea) return;
    
    const notificationItem = document.createElement('div');
    notificationItem.className = `notification-item`;
    notificationItem.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${type === 'success' ? 'Offre acceptée' : 'Offre refusée'}</div>
            <div class="notification-message">${message}</div>
            <div class="notification-time">À l'instant</div>
        </div>
    `;
    notificationArea.insertBefore(notificationItem, notificationArea.firstChild);
}

function updateOffersBadge(count) {
    const badge = document.getElementById('offers-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

async function loadClientHistory() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch('/api/client/history', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            const completedRequests = data.requests.filter(r => r.status === 'refusé' || r.status === 'livré' || r.status === 'annulé');
            displayHistory(completedRequests);
        } else {
            throw new Error('Erreur de chargement de l\'historique');
        }
    } catch (error) {
        console.error('Erreur historique:', error);
        showPopup('Erreur de chargement de l\'historique', 'error');
    }
}

function displayHistory(requests) {
    const container = document.getElementById('history-list');
    if (!container) return;
    
    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history fa-3x"></i>
                <h3>Aucun historique trouvé</h3>
                <p>Votre historique de demandes apparaîtra ici</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(request => {
        const ratingStars = request.rating ? generateRatingStars(request.rating) : '';
        
        return `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-info">
                        <h3>
                            <i class="fas fa-truck"></i>
                            Grand Transport
                            <span class="history-code">${request.codeColis || 'N/A'}</span>
                        </h3>
                    </div>
                    <div class="history-date">${formatDate(request.date)}</div>
                </div>
                <div class="history-details">
                    <div class="detail">
                        <span class="detail-label">Itinéraire</span>
                        <span class="detail-value">${request.villeDepart} → ${request.villeArrivee}</span>
                    </div>
                    <div class="detail">
                        <span class="detail-label">Type de camion</span>
                        <span class="detail-value">${request.typeCamion}</span>
                    </div>
                    <div class="detail">
                        <span class="detail-label">Marchandise</span>
                        <span class="detail-value">${request.typeMarchandise}</span>
                    </div>
                    <div class="detail">
                        <span class="detail-label">Statut final</span>
                        <span class="detail-value ${getStatusClass(request.status)}">${getStatusText(request.status)}</span>
                    </div>
                </div>
                <div class="history-footer">
                    ${request.status === 'livré' ? (
                        request.rating ? `
                        <div class="rating">
                            ${generateRatingStars(request.rating)}
                            <span>${request.rating}/5</span>
                        </div>
                        ` : `
                        <div class="rating-system" data-request-id="${request._id}">
                            <span class="rating-label">Évaluez cette livraison:</span>
                            <div class="stars-container">
                                <i class="fas fa-star star" data-rating="1"></i>
                                <i class="fas fa-star star" data-rating="2"></i>
                                <i class="fas fa-star star" data-rating="3"></i>
                                <i class="fas fa-star star" data-rating="4"></i>
                                <i class="fas fa-star star" data-rating="5"></i>
                            </div>
                        </div>`
                    ) : `<div class="status-message">${request.status === 'refusé' ? 'Demande refusée' : 'Demande annulée'}</div>`}
                    <button class="btn btn-outline btn-sm view-request-btn" data-id="${request._id}">
                        <i class="fas fa-eye"></i> Voir Détails
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    attachViewButtonsEvents();
    if (requests.some(r => r.status === 'livré' && !r.rating)) setupHistoryRating();
}

function generateRatingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? '<i class="fas fa-star" style="color: var(--dore);"></i>' : 
                              '<i class="fas fa-star" style="color: var(--gris-moyen);"></i>';
    }
    return stars;
}

function setupHistoryRating() {
    document.querySelectorAll('.rating-system').forEach(system => {
        const stars = system.querySelectorAll('.star');
        const requestId = system.getAttribute('data-request-id');
        let selectedRating = 0;
        
        stars.forEach(star => {
            star.addEventListener('click', async function() {
                selectedRating = parseInt(this.getAttribute('data-rating'));
                stars.forEach((s, index) => {
                    if (index < selectedRating) {
                        s.classList.add('active');
                        s.style.color = 'var(--dore)';
                    } else {
                        s.classList.remove('active');
                        s.style.color = 'var(--gris-moyen)';
                    }
                });
                
                stars.forEach(s => s.style.pointerEvents = 'none');
                
                try {
                    await submitRating(requestId, selectedRating);
                } catch (error) {
                    showPopup(error.message, 'error');
                    stars.forEach(s => s.style.pointerEvents = 'auto');
                }
            });
            
            star.addEventListener('mouseover', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                stars.forEach((s, index) => {
                    if (index < rating) s.style.color = 'var(--dore)';
                });
            });
            
            star.addEventListener('mouseout', function() {
                stars.forEach((s, index) => {
                    if (!s.classList.contains('active')) {
                        s.style.color = index < selectedRating ? 'var(--dore)' : 'var(--gris-moyen)';
                    }
                });
            });
        });
    });
}

async function submitRating(requestId, rating) {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/client/request/${requestId}/rate`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'évaluation');
    }
    
    const data = await response.json();
    
    if (data.success) {
        showPopup('Merci pour votre évaluation!', 'success');
        loadClientHistory();
    } else {
        throw new Error(data.message || 'Erreur inconnue');
    }
}

async function loadProfileData() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch('/api/client/profile', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const userData = await response.json();
            updateProfileForm(userData);
        } else {
            throw new Error('Erreur de chargement du profil');
        }
    } catch (error) {
        console.error('Erreur profil:', error);
        showPopup('Erreur de chargement du profil', 'error');
    }
}

function updateProfileForm(userData) {
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileSince = document.getElementById('profile-since');
    
    if (profileAvatar) {
        profileAvatar.src = userData.client?.photo || 'https://via.placeholder.com/120x120?text=U';
        profileAvatar.alt = userData.client?.fullName || 'Utilisateur';
    }
    
    if (profileName && userData.client?.fullName) profileName.textContent = userData.client.fullName;
    
    if (profileSince && userData.createdAt) {
        const sinceDate = new Date(userData.createdAt);
        profileSince.textContent = `Client depuis ${sinceDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    }

    const fields = {
        'profile-fullName': userData.client?.fullName,
        'profile-email': userData.email,
        'profile-phone': userData.client?.telephone,
        'profile-address': userData.client?.adresse
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && value !== undefined) element.value = value;
    });
}

function setupRequestForms() {
    const requestForm = document.getElementById('grand-transport-form');
    if (requestForm) requestForm.addEventListener('submit', handleRequestSubmit);
    
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const removeImage = document.getElementById('removeImage');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleImageUpload);
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--dore)';
            uploadArea.style.background = 'var(--dore-clair)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleImageUpload({ target: fileInput });
            }
        });
    }
    
    if (removeImage) removeImage.addEventListener('click', removeUploadedImage);
    
    const cancelBtn = document.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            const confirmed = showConfirmPopup('Êtes-vous sûr de vouloir annuler ? Toutes les données saisies seront perdues.');
            confirmed.then(result => {
                if (result) {
                    document.getElementById('grand-transport-form').reset();
                    removeUploadedImage();
                    showPopup('Formulaire réinitialisé', 'info');
                }
            });
        });
    }
}

async function handleRequestSubmit(e) {
    e.preventDefault();
    
    const requiredFields = [
        'nom', 'email', 'telephone', 'ville', 'commune', 'adress',
        'villeDepart', 'villeArrivee', 'poidsVolume', 'typeMarchandise',
        'typeCamion', 'description'
    ];
    
    let isValid = true;
    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element || !element.value.trim()) {
            isValid = false;
            element.style.borderColor = 'var(--danger)';
        } else {
            element.style.borderColor = '';
        }
    });
    
    if (!isValid) {
        showPopup('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    
    const formData = new FormData();
    const fileInput = document.getElementById('fileInput');
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) formData.append(field, element.value);
    });
    
    if (fileInput && fileInput.files[0]) formData.append('photo', fileInput.files[0]);
    
    try {
        showPopup('Envoi de la demande en cours...', 'info');
        
        const token = localStorage.getItem("token");
        const response = await fetch('/api/client/grandTransport/request', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erreur ${response.status}`);
        }
        
        const responseData = await response.json();
        showPopup(`Demande créée avec succès! Code: ${responseData.request.codeColis}`, 'success');
        document.getElementById('grand-transport-form').reset();
        removeUploadedImage();
        await loadUserProfile();
        
        setTimeout(() => {
            const requestsNav = document.querySelector('.nav-item[data-page="requests"]');
            if (requestsNav) requestsNav.click();
        }, 3000);
        
    } catch (error) {
        console.error('Erreur soumission:', error);
        showPopup(error.message || 'Erreur lors de la création de la demande', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

function handleImageUpload(e) {
    const fileInput = e.target;
    if (!fileInput.files || !fileInput.files[0]) return;
    
    const file = fileInput.files[0];
    const uploadArea = document.getElementById('uploadArea');
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showPopup('Le fichier est trop volumineux (max 5MB)', 'error');
        fileInput.value = '';
        return;
    }
    
    if (!file.type.match('image.*')) {
        showPopup('Seules les images sont acceptées (JPG, PNG)', 'error');
        fileInput.value = '';
        return;
    }
    
    try {
        const imageURL = URL.createObjectURL(file);
        if (previewImage) {
            previewImage.src = imageURL;
            previewImage.onload = () => URL.revokeObjectURL(imageURL);
        }
        
        if (previewContainer) previewContainer.style.display = 'block';
        if (uploadArea) uploadArea.style.display = 'none';
        showPopup('Image chargée avec succès!', 'success');
        
    } catch (error) {
        console.error('Erreur chargement image:', error);
        showPopup('Erreur lors du chargement de l\'image', 'error');
        fileInput.value = '';
    }
}

function removeUploadedImage() {
    const previewContainer = document.getElementById('previewContainer');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (previewContainer) previewContainer.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'block';
    if (fileInput) fileInput.value = '';
}

function setupModals() {
    const modal = document.getElementById('requestModal');
    const closeModal = document.querySelector('.close-modal');
    const closeBtn = document.querySelector('.close-btn');
    
    if (closeModal) closeModal.addEventListener('click', () => modal && (modal.style.display = 'none'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal && (modal.style.display = 'none'));
    if (modal) window.addEventListener('click', (e) => e.target === modal && (modal.style.display = 'none'));
}

function attachViewButtonsEvents() {
    document.querySelectorAll('.view-request-btn').forEach(button => {
        button.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            showRequestDetails(requestId);
        });
    });
}

async function showRequestDetails(requestId) {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/client/grandTransport/request/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Erreur de chargement des détails');
        const data = await response.json();
        displayRequestModal(data.request);
        
    } catch (error) {
        console.error('Erreur détails:', error);
        showPopup('Erreur de chargement des détails', 'error');
    }
}

function displayRequestModal(request) {
    const modal = document.getElementById('requestModal');
    const modalContent = document.getElementById('modalContent');
    const modalRequestCode = document.getElementById('modalRequestCode');
    
    if (!modal || !modalContent) return;
    
    modalRequestCode.textContent = `Code: ${request.codeColis || 'En attente'}`;
    
    modalContent.innerHTML = `
        <div class="modal-details">
            <div class="detail-section">
                <h3><i class="fas fa-info-circle"></i> Informations Générales</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Code de suivi:</span>
                        <span class="detail-value">${request.codeColis || 'En attente'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Date de création:</span>
                        <span class="detail-value">${formatDate(request.date)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Statut:</span>
                        <span class="detail-value ${getStatusClass(request.status)}">${getStatusText(request.status)}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3><i class="fas fa-user"></i> Informations Personnelles</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Nom complet:</span>
                        <span class="detail-value">${request.nom || 'Non spécifié'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${request.email || 'Non spécifié'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Téléphone:</span>
                        <span class="detail-value">${request.telephone || 'Non spécifié'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Adresse:</span>
                        <span class="detail-value">${request.adress || 'Non spécifié'}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3><i class="fas fa-truck"></i> Détails du Transport</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Ville de départ:</span>
                        <span class="detail-value">${request.villeDepart || 'Non spécifié'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Ville d'arrivée:</span>
                        <span class="detail-value">${request.villeArrivee || 'Non spécifié'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Poids/Volume:</span>
                        <span class="detail-value">${request.poidsVolume || 'Non spécifié'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Type de camion:</span>
                        <span class="detail-value">${request.typeCamion || 'Non spécifié'}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3><i class="fas fa-file-alt"></i> Description</h3>
                <div class="description-content">
                    <p>${request.description || 'Aucune description fournie'}</p>
                </div>
            </div>

            ${request.photoColis ? `
            <div class="detail-section">
                <h3><i class="fas fa-camera"></i> Photo du Colis</h3>
                <div class="image-preview">
                    <img src="${request.photoColis}" alt="Photo du colis" class="modal-image">
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
}

function setupPaymentProofModal() {
    const modal = document.getElementById('paymentProofModal');
    const openBtn = document.getElementById('openProofModal');
    const closeBtns = document.querySelectorAll('#paymentProofModal .close-modal, .close-proof-modal');
    const uploadArea = document.getElementById('proofUploadArea');
    const fileInput = document.getElementById('proofFile');
    const removeBtn = document.getElementById('removeProofFile');
    const form = document.getElementById('paymentProofForm');
    const findRequestBtn = document.getElementById('findRequestBtn');
    const viewProofFile = document.getElementById('viewProofFile');
    
    if (openBtn) openBtn.addEventListener('click', () => modal && (modal.style.display = 'flex'));
    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        modal && (modal.style.display = 'none');
        resetPaymentProofForm();
    }));
    
    if (modal) window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetPaymentProofForm();
        }
    });
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleProofFileSelect);
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--dore)';
            uploadArea.style.background = 'var(--dore-clair)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleProofFileSelect({ target: fileInput });
            }
        });
    }
    
    if (removeBtn) removeBtn.addEventListener('click', removeProofFile);
    
    if (viewProofFile) viewProofFile.addEventListener('click', () => {
        const fileInput = document.getElementById('proofFile');
        if (fileInput.files[0]) window.open(URL.createObjectURL(fileInput.files[0]), '_blank');
    });
    
    if (findRequestBtn) {
        findRequestBtn.addEventListener('click', async function() {
            const codeColis = document.getElementById('codeColis').value.trim();
            if (!codeColis) {
                showPopup('Veuillez entrer un code colis', 'error');
                return;
            }
            
            this.disabled = true;
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`/api/client/request-by-code/${codeColis}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                
                if (!response.ok) throw new Error('Demande non trouvée');
                const data = await response.json();
                
                if (data.success) showPopup('Demande trouvée avec succès!', 'success');
                else throw new Error(data.message || 'Demande non trouvée');
            } catch (error) {
                showPopup(error.message, 'error');
            } finally {
                this.disabled = false;
                this.innerHTML = originalHTML;
            }
        });
    }
    
    if (form) form.addEventListener('submit', handlePaymentProofSubmit);
    
    const paymentDate = document.getElementById('paymentDate');
    if (paymentDate) {
        const today = new Date().toISOString().split('T')[0];
        paymentDate.value = today;
        paymentDate.max = today;
    }
}

function handleProofFileSelect(e) {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const previewContainer = document.getElementById('proofPreviewContainer');
        const uploadArea = document.getElementById('proofUploadArea');
        const fileIcon = document.getElementById('proofFileIcon');
        const fileName = document.getElementById('proofFileName');
        const fileSize = document.getElementById('proofFileSize');
        const fileType = document.getElementById('proofFileType');
        
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            showPopup('Le fichier est trop volumineux (max 10MB)', 'error');
            e.target.value = '';
            return;
        }
        
        if (file.type === 'application/pdf') {
            fileIcon.className = 'fas fa-file-pdf';
            fileIcon.style.color = '#dc3545';
            fileType.textContent = 'PDF Document';
        } else if (file.type.includes('image/')) {
            fileIcon.className = 'fas fa-file-image';
            fileIcon.style.color = '#28a745';
            fileType.textContent = 'Image';
        } else {
            fileIcon.className = 'fas fa-file';
            fileIcon.style.color = '#6c757d';
            fileType.textContent = 'Document';
        }
        
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        
        if (previewContainer) previewContainer.style.display = 'block';
        if (uploadArea) uploadArea.style.display = 'none';
        updatePaymentProofStep(2);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function removeProofFile() {
    const previewContainer = document.getElementById('proofPreviewContainer');
    const uploadArea = document.getElementById('proofUploadArea');
    const fileInput = document.getElementById('proofFile');
    
    if (previewContainer) previewContainer.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'block';
    if (fileInput) fileInput.value = '';
    updatePaymentProofStep(1);
}

function updatePaymentProofStep(step) {
    const steps = document.querySelectorAll('.modal-steps .step');
    steps.forEach((s, index) => {
        s.classList.toggle('active', index < step);
    });
}

function resetPaymentProofForm() {
    const form = document.getElementById('paymentProofForm');
    if (form) form.reset();
    removeProofFile();
    updatePaymentProofStep(1);
    
    const paymentDate = document.getElementById('paymentDate');
    if (paymentDate) {
        const today = new Date().toISOString().split('T')[0];
        paymentDate.value = today;
    }
}

async function handlePaymentProofSubmit(e) {
    e.preventDefault();
    
    try {
        const clientName = document.getElementById('clientName').value;
        const codeColis = document.getElementById('codeColis').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const paymentDate = document.getElementById('paymentDate').value;
        const fileInput = document.getElementById('proofFile');
        const submitBtn = document.getElementById('submitProofBtn');
        const termsAgreement = document.getElementById('termsAgreement');
        const originalBtnText = submitBtn.innerHTML;
        
        if (!clientName.trim()) return showPopup('Veuillez entrer votre nom', 'error');
        if (!codeColis.trim()) return showPopup('Veuillez entrer le code du colis', 'error');
        if (!paymentMethod) return showPopup('Veuillez sélectionner une méthode de paiement', 'error');
        if (!paymentDate) return showPopup('Veuillez sélectionner la date du paiement', 'error');
        if (!fileInput.files[0]) return showPopup('Veuillez sélectionner un fichier de preuve', 'error');
        if (!termsAgreement.checked) return showPopup('Veuillez accepter les conditions', 'error');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        
        const formData = new FormData();
        formData.append('clientName', clientName);
        formData.append('codeColis', codeColis);
        formData.append('paymentMethod', paymentMethod);
        formData.append('paymentDate', paymentDate);
        formData.append('proofFile', fileInput.files[0]);
        
        const notes = document.getElementById('paymentNotes').value;
        if (notes.trim()) formData.append('notes', notes);
        
        const token = localStorage.getItem("token");
        const response = await fetch('/api/upload-payment-proof', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de l\'envoi');
        }
        
        const result = await response.json();
        
        if (result.success) {
            showPopup('Preuve de paiement envoyée avec succès!', 'success');
            updatePaymentProofStep(3);
            addNotificationToPanel(`Preuve de paiement reçue pour le colis ${codeColis}. Nous vous enverrons un email après vérification.`, 'success');
            
            setTimeout(() => {
                document.getElementById('paymentProofModal').style.display = 'none';
                resetPaymentProofForm();
            }, 3000);
        } else {
            throw new Error(result.message || 'Erreur inconnue');
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        showPopup('Erreur: ' + error.message, 'error');
        const submitBtn = document.getElementById('submitProofBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer la Preuve';
        }
    }
}

function setupEventListeners() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
        
        const cancelBtn = profileForm.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                const confirmed = showConfirmPopup('Annuler les modifications ?');
                confirmed.then(result => {
                    if (result) {
                        loadProfileData();
                        showPopup('Modifications annulées', 'info');
                    }
                });
            });
        }
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) changePasswordBtn.addEventListener('click', () => {
        showPopup('Fonctionnalité bientôt disponible', 'info');
    });
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.save-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        showPopup('Mise à jour du profil en cours...', 'info');
        const token = localStorage.getItem("token");
        const avatarInput = document.getElementById('avatarFileInput');
        
        const formData = new FormData();
        formData.append('email', document.getElementById('profile-email').value);
        formData.append('fullName', document.getElementById('profile-fullName').value);
        formData.append('telephone', document.getElementById('profile-phone').value);
        formData.append('adresse', document.getElementById('profile-address').value);
        if (avatarInput.files[0]) formData.append('avatar', avatarInput.files[0]);
        
        const response = await fetch('/api/client/profile', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de la mise à jour');
        }
        
        const result = await response.json();
        if (result.photoUrl) {
            document.getElementById('profile-avatar').src = result.photoUrl;
            document.getElementById('header-avatar').src = result.photoUrl;
        }
        
        showPopup('Profil mis à jour avec succès!', 'success');
        await loadUserProfile();
        
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        showPopup(error.message || 'Erreur lors de la mise à jour du profil', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

function handleLogout(e) {
    e.preventDefault();
    showConfirmPopup('Êtes-vous sûr de vouloir vous déconnecter ?').then(result => {
        if (result) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    });
}

function getStatusClass(status) {
    const statusMap = {
        'en_attente': 'status-pending',
        'accepté': 'status-accepted', 
        'refusé': 'status-refused',
        'en_cours': 'status-in-progress',
        'livré': 'status-delivered',
        'annulé': 'status-refused'
    };
    return statusMap[status] || 'status-pending';
}

function getStatusText(status) {
    const statusMap = {
        'en_attente': 'En attente',
        'accepté': 'Accepté',
        'refusé': 'Refusé',
        'en_cours': 'En cours',
        'livré': 'Livré',
        'annulé': 'Annulé'
    };
    return statusMap[status] || 'En attente';
}

function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Date invalide';
    }
}

function formatCurrency(amount) {
    if (!amount) return '0 FC';
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'CDF'
    }).format(amount).replace('CDF', 'FC');
}