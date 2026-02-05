import * as API from '../api/admin.api.js';

let currentUsers = [];

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function safeDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('fr-FR');
    } catch {
        return 'N/A';
    }
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

function getUserName(user) {
    if (user.role === 'client' && user.client && user.client.fullName) 
        return user.client.fullName;
    if (user.role === 'agence' && user.agence && user.agence.agenceName) 
        return user.agence.agenceName
    return user.email || 'Nom non disponible';
}

// FONCTION CORRIGÉE POUR RÉCUPÉRER TOUTES LES PHOTOS
function getUserAvatar(user) {
    const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMzAiIGZpbGw9IiNDQ0NDQ0MiLz4KPHBhdGggZD0iTTMwIDM1QzM0LjE0MjEgMzUgMzcuNSAzMS42NDIxIDM3LjUgMjcuNUMzNy41IDIzLjM1NzkgMzQuMTQyMSAyMCAzMCAyMEMyNS44NTc5IDIwIDIyLjUgMjMuMzU3OSAyMi41IDI3LjVDMjIuNSAzMS42NDIxIDI1Ljg1NzkgMzUgMzAgMzVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMzAgNDBDMzcuNzM2IDQwIDQ0IDMzLjczNiA0NCAyNkM0NCAxOC4yNjQgMzcuNzM2IDEyIDMwIDEyQzIyLjI2NCAxMiAxNiAxOC4yNjQgMTYgMjZDMTYgMzMuNzM2IDIyLjI2NCA0MCAzMCA0MFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=';
    
    if (user.agence && user.agence.logo) {
        return user.agence.logo;
    }
    
    if (user.grandTransporteur && user.grandTransporteur.logo) {
        return user.grandTransporteur.logo;
    }
    
    if (user.petitTransporteur && user.petitTransporteur.photo) {
        const avatarUrl = user.petitTransporteur.photo;
        if (avatarUrl && avatarUrl.includes('cloudinary')) {
            return avatarUrl.replace('/upload/', '/upload/w_60,h_60,c_fill/');
        }
        return avatarUrl;
    }
    
    if (user.client && user.client.photo) {
        return user.client.photo;
    }
    
    return defaultAvatar;
}

function getUserPhone(user) {
    if (user.role === 'client' && user.client && user.client.telephone) 
        return user.client.telephone;
    if (user.role === 'agence' && user.agence && user.agence.telephone) 
        return user.agence.telephone;
    return 'Non renseigné';
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

// ==================== MODAL PROFIL ====================
function showProfileModal(user) {
    const modal = document.getElementById('profile-modal');
    const modalContent = document.getElementById('modal-profile-content');
    
    if (!modal || !modalContent) {
        console.error('Modal non trouvé');
        return;
    }
    
    const userName = getUserName(user);
    const userEmail = escapeHtml(user.email);
    const roleLabel = getRoleLabel(user.role);
    const phone = getUserPhone(user);
    const avatarSrc = getUserAvatar(user);
    const formattedDate = safeDate(user.createdAt);
    const statusText = user.isVerified ? 'Compte vérifié' : 'En attente de vérification';
    const statusClass = user.isVerified ? 'active' : 'pending';
    
    modalContent.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">
                <img src="${avatarSrc}" alt="${userName}">
            </div>
            <div class="profile-info">
                <h3>${userName}</h3>
                <p class="profile-role">${roleLabel}</p>
                <div class="profile-contacts">
                    <span><i class="fas fa-envelope"></i> ${userEmail}</span>
                    <span><i class="fas fa-phone"></i> ${phone}</span>
                    <span><i class="fas fa-calendar"></i> Inscrit le: ${formattedDate}</span>
                    <span class="status-badge status-${statusClass}">${statusText}</span>
                </div>
            </div>
        </div>
        <div class="profile-sections">
            ${generateProfileDetails(user)}
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function generateProfileDetails(user) {
    let html = '';
    
    if (user.role === 'client' && user.client) {
        const clientData = user.client;
        html += `<div class="profile-section">
            <h4><i class="fas fa-info-circle"></i> Informations Client</h4>
            <div class="profile-details-grid">
                <div class="detail-item">
                    <label>Nom complet:</label>
                    <span>${escapeHtml(clientData.fullName || 'Non renseigné')}</span>
                </div>
                <div class="detail-item">
                    <label>Téléphone:</label>
                    <span>${escapeHtml(clientData.telephone || 'Non renseigné')}</span>
                </div>
                <div class="detail-item">
                    <label>Adresse:</label>
                    <span>${escapeHtml(clientData.adresse || 'Non renseigné')}</span>
                </div>
            </div>
        </div>`;
    }
   
    else if (user.role === 'agence' && user.agence) {
        const agenceData = user.agence;

        html += `<div class="profile-section">
            <h4><i class="fas fa-info-circle"></i> Informations Agence</h4>
            <div class="profile-details-grid">
                <div class="detail-item">
                    <label>Nom agence:</label>
                    <span>${escapeHtml(agenceData.agenceName || 'Non renseigné')}</span>
                </div>
                <div class="detail-item">
                    <label>Responsable:</label>
                    <span>${escapeHtml(agenceData.responsable || 'Non renseigné')}</span>
                </div>
                <div class="detail-item">
                    <label>Destinations:</label>
                    <span>${escapeHtml(agenceData.destinations?.map(d => d.toUpperCase()).join(', ') || 'Non renseigné')}</span>
                </div>
            </div>
        </div>`;

        if (agenceData.typesColis && agenceData.typesColis.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-box"></i> Types de Colis</h4>
                <div class="tags-grid">
                    ${agenceData.typesColis.map(type => `<span class="tag">${escapeHtml(getColisLabel(type))}</span>`).join(' ')}
                </div>
            </div>`;
        }

        if (agenceData.locations && agenceData.locations.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-map-marker-alt"></i> Locations</h4>
                <div class="locations-grid">
                    ${agenceData.locations.map(loc => `
                        <div class="location-item">
                            <strong>Pays:</strong> ${escapeHtml(loc.pays || 'N/A')}<br>
                            <strong>Ville:</strong> ${escapeHtml(loc.ville || 'N/A')}<br>
                            <strong>Adresse:</strong> ${escapeHtml(loc.adresse || 'N/A')}<br>
                            <strong>Téléphone:</strong> ${escapeHtml(loc.telephone || 'N/A')}
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
                            <strong>${escapeHtml(tarif.destination || 'N/A')}</strong> - 
                            <span>${escapeHtml(tarif.prix || 0)} USD</span> - 
                            <span>${escapeHtml(tarif.delai || 0)} jours</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        if (agenceData.services && agenceData.services.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-concierge-bell"></i> Services</h4>
                <div class="tags-grid">
                    ${agenceData.services.map(service => `<span class="tag">${escapeHtml(service)}</span>`).join(' ')}
                </div>
            </div>`;
        }
    }
    
    if (html === '') {
        html = '<p class="no-data">Aucune information supplémentaire disponible</p>';
    }
    
    return html;
}

function closeModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ==================== FONCTIONS PRINCIPALES ====================
export async function loadUsersPage() {
  
    try {
        const users = await API.loadUsersDataAPI();
        currentUsers = users || [];
        
        displayUsers(currentUsers);
        updateUsersCount();
        setupFilters();

    } catch (error) {
        const container = document.getElementById('users-table-body');
        if (container) {
            container.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Erreur de chargement des utilisateurs</p>
                            <button onclick="loadUsersPage()" class="btn-retry">Réessayer</button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function displayUsers(users) {
    const container = document.getElementById('users-table-body');
    if (!container) return;
    
    container.innerHTML = '';

    if (!users || users.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Aucun utilisateur trouvé</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    users.forEach(user => {
        if (!user || !user._id) return;

        const userName = escapeHtml(getUserName(user));
        const userEmail = escapeHtml(user.email || 'N/A');
        const roleLabel = escapeHtml(getRoleLabel(user.role));
        const statusText = user.isVerified ? 'Actif' : 'En attente';
        const statusClass = user.isVerified ? 'active' : 'pending';
        const formattedDate = safeDate(user.createdAt);
        const avatarSrc = getUserAvatar(user);
        const phone = escapeHtml(getUserPhone(user));

        const row = document.createElement('tr');
        row.setAttribute('data-role', user.role);
        row.setAttribute('data-email', userEmail.toLowerCase());
        row.setAttribute('data-name', userName.toLowerCase());
        
        row.innerHTML = `
            <td>
                <div class="user-info-cell">
                    <img src="${avatarSrc}" class="user-avatar" alt="${userName}">
                    <span>${userName}<br><small>${phone}</small></span>
                </div>
            </td>
            <td>${userEmail}</td>
            <td><span class="company-type">${roleLabel}</span></td>
            <td><span class="status-badge status-${statusClass}">${statusText}</span></td>
            <td>${formattedDate}</td>
            <td>
                <div class="user-actions">
                    <button class="btn-action btn-view" 
                            data-action="view-user-profile" 
                            data-user-id="${escapeHtml(user._id)}"
                            title="Voir profil">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-${user.isSuspended ? 'unlock' : 'block'}" 
                            data-action="toggle-user-status" 
                            data-user-id="${escapeHtml(user._id)}"
                            data-user-name="${escapeHtml(userName)}"
                            data-suspend="${!user.isSuspended}"
                            title="${user.isSuspended ? 'Activer' : 'Suspendre'}">
                        <i class="fas ${user.isSuspended ? 'fa-unlock' : 'fa-lock'}"></i>
                    </button>
                </div>
            </td>
        `;
        
        container.appendChild(row);
    });
}

function updateUsersCount() {
    const usersCount = document.getElementById('users-count');
    if (usersCount) {
        usersCount.textContent = currentUsers.length;
    }
}

function setupFilters() {
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('user-search');
    
    if (roleFilter) {
        roleFilter.onchange = filterUsers;
    }
    
    if (searchInput) {
        searchInput.oninput = filterUsers;
    }
}

function filterUsers() {
    const filter = document.getElementById('role-filter')?.value || 'all';
    const searchTerm = document.getElementById('user-search')?.value.toLowerCase().trim() || '';
    
    const rows = document.querySelectorAll('#users-table-body tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        if (row.querySelector('.empty-state') || row.querySelector('.error-state')) {
            row.style.display = 'none';
            return;
        }
        
        const role = row.getAttribute('data-role');
        const email = row.getAttribute('data-email');
        const name = row.getAttribute('data-name');
        
        const matchesRole = filter === 'all' || role === filter;
        const matchesSearch = searchTerm === '' || 
                            email.includes(searchTerm) || 
                            name.includes(searchTerm);

        row.style.display = matchesRole && matchesSearch ? '' : 'none';
        if (matchesRole && matchesSearch) visibleCount++;
    });
    
    const usersCount = document.getElementById('users-count');
    if (usersCount) {
        usersCount.textContent = visibleCount;
    }
}

export async function executeToggleUserStatus(userId, suspend, userNameDisplay) {
    try {
        const response = await API.toggleUserStatusAPI(userId, suspend);
        
        if (response) {
            await loadUsersPage();
            const message = `Utilisateur ${suspend ? 'suspendu' : 'activé'} avec succès !`;
            const event = new CustomEvent('showMessage', { detail: { text: message, type: 'success' } });
            document.dispatchEvent(event);
        }
    } catch (error) {
        const event = new CustomEvent('showMessage', { 
            detail: { text: 'Erreur lors du changement de statut', type: 'error' } 
        });
        document.dispatchEvent(event);
    }
}

async function viewProfile(userId) {
    try {
        const user = await API.getUserProfileAPI(userId);
        showProfileModal(user);
        
    } catch (error) {
        const event = new CustomEvent('showMessage', { 
            detail: { text: 'Erreur chargement profil', type: 'error' } 
        });
        document.dispatchEvent(event);
    }
}

document.addEventListener('click', function(e) {
    if (e.target.closest('[data-action="view-user-profile"]')) {
        e.preventDefault();
        const btn = e.target.closest('[data-action="view-user-profile"]');
        const userId = btn.dataset.userId;
        viewProfile(userId);
    }
    
    if (e.target.closest('.close-modal')) {
        closeModal();
    }
    
    if (e.target.closest('#profile-modal') && e.target.id === 'profile-modal') {
        closeModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

window.executeToggleUserStatus = executeToggleUserStatus;
window.filterUsers = filterUsers;
window.loadUsersPage = loadUsersPage;
window.closeModal = closeModal;