import * as API from '../api/admin.api.js';

let currentCompanies = [];

// ==================== MESSAGE BOX FUNCTIONS ====================
function showConfirm(message, onConfirm, onCancel = null) {
    const alertBox = document.getElementById('customAlert');
    const overlay = document.getElementById('customAlertOverlay');
    const messageEl = document.getElementById('customAlertMessage');
    const titleEl = document.getElementById('customAlertTitle');
    const confirmBtn = document.getElementById('customAlertConfirm');
    const cancelBtn = document.getElementById('customAlertCancel');
    
    if (!alertBox || !messageEl) {
        console.error('Modal elements not found');
        return;
    }
    
    let type = 'info';
    if (message.toLowerCase().includes('erreur')) type = 'error';
    if (message.toLowerCase().includes('succès') || message.toLowerCase().includes('accepté')) type = 'success';
    if (message.toLowerCase().includes('attention') || message.toLowerCase().includes('avertissement')) type = 'warning';
    
    messageEl.textContent = message;
    titleEl.textContent = getAlertTitle(type);
    
    const header = document.getElementById('customAlertHeader');
    if (header) {
        header.className = `custom-alert-header ${type}`;
        const icon = header.querySelector('i');
        if (icon) icon.className = `fas ${getAlertIcon(type)}`;
    }
    
    alertBox.classList.add('active');
    overlay.classList.add('active');
    
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
        background: #fff;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        display: flex;
        align-items: center;
        gap: 12px;
        animation: popupSlideIn 0.3s ease;
        max-width: 400px;
        width: 100%;
        border: 1px solid #eee;
    `;
    
    const messageSpan = document.createElement('span');
    messageSpan.style.cssText = 'flex: 1; color: #333;';
    messageSpan.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-close';
    closeButton.setAttribute('data-action', 'close-popup');
    closeButton.style.cssText = `
        background: none;
        border: none;
        font-size: 1.3rem;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeButton.textContent = '×';
    
    const icon = document.createElement('i');
    icon.className = `fas ${getPopupIcon(type)}`;
    icon.style.fontSize = '1.3rem';
    icon.style.color = getIconColor(type);
    
    popup.appendChild(icon);
    popup.appendChild(messageSpan);
    popup.appendChild(closeButton);
    
    container.appendChild(popup);
    
    closeButton.addEventListener('click', () => {
        if (popup.parentElement) {
            popup.style.animation = 'popupSlideOut 0.3s ease';
            setTimeout(() => popup.remove(), 300);
        }
    });
    
    setTimeout(() => {
        if (popup.parentElement) {
            popup.style.animation = 'popupSlideOut 0.3s ease';
            setTimeout(() => popup.remove(), 300);
        }
    }, 5000);
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

function getIconColor(type) {
    switch(type) {
        case 'success': return '#4CAF50';
        case 'error': return '#f44336';
        case 'warning': return '#ff9800';
        case 'info': return '#333';
        default: return '#2E7D32';
    }
}

// ==================== UTILITY FUNCTIONS ====================
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
        'admin': 'Administrateur'
    };
    return roles[role] || role;
}

function getCompanyName(company) {
    if (company.role === 'client' && company.client && company.client.fullName) 
        return company.client.fullName;
    if (company.role === 'agence' && company.agence && company.agence.agenceName) 
        return company.agence.agenceName;
    return company.email || 'Nom non disponible';
}

function getCompanyAddress(company) {
    if (company.role === 'client' && company.client && company.client.adresse) 
        return company.client.adresse;
    if (company.role === 'agence' && company.agence && company.agence.adresse) 
        return company.agence.adresse;
    return 'Adresse non disponible';
}

function getCompanyLogo(company) {
    const defaultLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTIiIGZpbGw9IiNFMEUwRTAiLz4KPHBhdGggZD0iTTQwIDI1QzQwIDI4LjMxMzcgMzcuMzEzNyAzMSAzNCAzMUMyNiAyNyAzNCAzMSAyMiAyN0MyMiAyMy42ODYzIDE5LjMxMzcgMjEgMTYgMjFDMTIuNjg2MyAyMSAxMCAyMy42ODYzIDEwIDI3QzEwIDMwLjMxMzcgMTIuNjg2MyAzMyAxNiAzM0MyNCAzNyAxNiAzMyAyOCAzN0MyOCA0MC4zMTM3IDMwLjY4NjMgNDMgMzQgNDNDMzcuMzEzNyA0MyA0MCA0MC4zMTM3IDQwIDM3QzQwIDMzLjY4NjMgMzcuMzEzNyAzMSAzNCAzMUMzMC42ODYzIDMxIDI4IDMzLjY4NjMgMjggMzdDMjggMzAuNjg2MyAzMC42ODYzIDI3IDM0IDI3QzM3LjMxMzcgMjcgNDAgMjMuNjg2MyA0MCAyMFoiIGZpbGw9IiNDQ0NDQ0MiLz4KPC9zdmc+Cg==';
      
    if (company.role === 'agence' && company.agence && company.agence.logo) {
        return company.agence.logo;
    }
      
    return defaultLogo;
}

function getUserPhone(company) {
    if (company.role === 'client' && company.client && company.client.telephone) 
        return company.client.telephone;
    if (company.role === 'agence' && company.agence && company.agence.telephone) 
        return company.agence.telephone
    return 'Non renseigné'
}

// ==================== MAIN FUNCTIONS ====================
export async function loadValidationPage() {

    try {
        const companies = await API.loadCompaniesDataAPI();
        currentCompanies = companies || [];
       
        displayCompanies(currentCompanies);
        updateFilterCount();
        setupFilters();

    } catch (error) {
        const container = document.getElementById('companies-list');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erreur de chargement des sociétés</p>
                    <button onclick="loadValidationPage()" class="btn-retry">Réessayer</button>
                </div>
            `;
        }
    }
}

function displayCompanies(companies) {
    const container = document.getElementById('companies-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (!companies || companies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Aucune société en attente de validation</p>
            </div>
        `;
        return;
    }

    companies.forEach(company => {
        if (!company || !company._id) return;

        const companyName = escapeHtml(getCompanyName(company));
        const phone = escapeHtml(getUserPhone(company));
        const address = escapeHtml(getCompanyAddress(company));
        const roleLabel = escapeHtml(getRoleLabel(company.role));
        const formattedDate = safeDate(company.createdAt);
        const logoUrl = getCompanyLogo(company);

        const companyCard = document.createElement('div');
        companyCard.className = 'company-card';
        companyCard.setAttribute('data-type', company.role);
        companyCard.setAttribute('data-company-id', escapeHtml(company._id));
        companyCard.setAttribute('data-company-name', companyName);
        
        companyCard.innerHTML = `
            <div class="company-info">
                <img src="${logoUrl}" class="company-logo" alt="${companyName}">
                <div class="company-details">
                    <h4>${companyName}</h4>
                    <p>${phone} • ${address}</p>
                    <span class="company-type">${roleLabel}</span>
                    <div class="company-meta">
                        <small>Inscrit le: ${formattedDate}</small>
                    </div>
                </div>
            </div>
            <div class="company-actions">
                <button class="btn btn-accept accept-company-btn" 
                        data-company-id="${escapeHtml(company._id)}"
                        data-company-name="${companyName}"
                        title="Accepter">
                    <i class="fas fa-check"></i> Accepter
                </button>
                <button class="btn btn-refuse refuse-company-btn" 
                        data-company-id="${escapeHtml(company._id)}"
                        data-company-name="${companyName}"
                        title="Refuser">
                    <i class="fas fa-times"></i> Refuser
                </button>
            </div>
        `;
        
        container.appendChild(companyCard);
    });
}

function updateFilterCount() {
    const filterCount = document.getElementById('filter-count');
    if (filterCount) {
        filterCount.textContent = currentCompanies.length;
    }
}

function setupFilters() {
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
        typeFilter.onchange = filterCompanies;
    }
}

function filterCompanies() {
    const filter = document.getElementById('type-filter')?.value || 'all';
    const cards = document.querySelectorAll('.company-card');
    
    cards.forEach(card => {
        const type = card.getAttribute('data-type');
        card.style.display = (filter === 'all' || type === filter) ? 'flex' : 'none';
    });
}

export async function executeValidateCompany(companyId, accept, companyName) {
    try {
        if (!accept) {
            showMessage("La fonctionnalité de refus sera bientôt disponible.", 'info');
            return;
        }

        const response = await API.validateCompanyAPI(companyId, accept);
        
        if (response) {
            await loadValidationPage();
            const message = `Société ${accept ? 'acceptée' : 'refusée'} avec succès !`;
            showMessage(message, 'success');
        }
    } catch (error) {
        showMessage('Erreur lors de la validation', 'error');
    }
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('click', function(e) {

    if (e.target.closest('.accept-company-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.accept-company-btn');
        const companyId = btn.dataset.companyId;
        const companyName = btn.dataset.companyName;
        
        showConfirm(`Êtes-vous sûr de vouloir accepter "${companyName}" ?`, () => {
            executeValidateCompany(companyId, true, companyName);
        });
    }
    
    if (e.target.closest('.refuse-company-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.refuse-company-btn');
        const companyId = btn.dataset.companyId;
        const companyName = btn.dataset.companyName;
        
        showConfirm(`Êtes-vous sûr de vouloir refuser "${companyName}" ?`, () => {
            executeValidateCompany(companyId, false, companyName);
        });
    }
});

// ==================== EXPOSE FUNCTIONS ====================
window.executeValidateCompany = executeValidateCompany;
window.filterCompanies = filterCompanies;
window.loadValidationPage = loadValidationPage;