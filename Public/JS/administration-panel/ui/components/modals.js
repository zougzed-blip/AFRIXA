import * as API from '../../api/admin.api.js';
import * as MessageBox from './message-box.js';
import * as Utils from '../../utils/helpers.js';
import { updateDemandeAgenceStatus, adjustDemandeAgenceWeight } from '../event-handlers.js';

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== GESTION DES MODALS ===============================
export function setupModals() {
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const modals = document.querySelectorAll('.modal');
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
    
    setupAgenceModalForms();
}

function setupAgenceModalForms() {

    const statusForm = document.getElementById('demande-agence-status-form');
    if (statusForm) {
        const newForm = statusForm.cloneNode(true);
        statusForm.parentNode.replaceChild(newForm, statusForm);
        
        document.getElementById('demande-agence-status-form').onsubmit = function(e) {
            e.preventDefault();
            if (window.updateDemandeAgenceStatus) {
                window.updateDemandeAgenceStatus(e);
            }
        };
    }

    const adjustForm = document.getElementById('demande-agence-adjust-form');
    if (adjustForm) {
        const newAdjustForm = adjustForm.cloneNode(true);
        adjustForm.parentNode.replaceChild(newAdjustForm, adjustForm);
        
        document.getElementById('demande-agence-adjust-form').onsubmit = function(e) {
            e.preventDefault();
            if (window.adjustDemandeAgenceWeight) {
                window.adjustDemandeAgenceWeight(e);
            }
        };
    }
}

export function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// ==================== MODAL DEMANDE AGENCE =============================
export function openDemandeAgenceStatusModal(demandeId, codeColis, currentStatus) {
    const modalIdInput = document.getElementById('demande-agence-id');
    const codeSpan = document.getElementById('modal-demande-agence-status-code');
    const statusBadge = document.getElementById('current-demande-agence-status-badge');
    const statusSelect = document.getElementById('new-demande-agence-status');
    
    if (modalIdInput && codeSpan && statusBadge && statusSelect) {
        modalIdInput.value = demandeId;
        codeSpan.textContent = `Code: ${codeColis}`;
        statusBadge.textContent = Utils.getAgenceStatusText(currentStatus);
        statusBadge.className = `status-badge status-${currentStatus || 'en_attente'}`;
        
        statusSelect.value = currentStatus || 'en_attente';
        
        document.getElementById('demande-agence-status-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            const form = document.getElementById('demande-agence-status-form');
            if (form) {
                form.onsubmit = function(e) {
                    e.preventDefault();
                    if (window.updateDemandeAgenceStatus) {
                        window.updateDemandeAgenceStatus(e);
                    }
                };
            }
        }, 50);
    }
}

export function openDemandeAgenceAdjustModal(demandeId, codeColis, currentWeight) {
    const modalIdInput = document.getElementById('demande-agence-adjust-id');
    const codeSpan = document.getElementById('modal-demande-agence-adjust-code');
    const weightSpan = document.getElementById('current-demande-agence-weight');
    
    if (modalIdInput && codeSpan && weightSpan) {
        modalIdInput.value = demandeId;
        codeSpan.textContent = `Code: ${codeColis}`;
        weightSpan.textContent = currentWeight;
        
        const weightInput = document.getElementById('demande-agence-adjust-weight');
        if (weightInput) weightInput.value = '';
        
        document.getElementById('demande-agence-adjust-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            const form = document.getElementById('demande-agence-adjust-form');
            if (form) {
                form.onsubmit = function(e) {
                    e.preventDefault();
                    if (window.adjustDemandeAgenceWeight) {
                        window.adjustDemandeAgenceWeight(e);
                    }
                };
            }
        }, 50);
    }
}

export async function viewDemandeAgenceDetails(demandeId) {
    try {
        const result = await API.getDemandeAgenceDetailsAPI(demandeId);
        
        if (!result) {
            throw new Error('Aucune donnée retournée');
        }
        
        const demande = result.data || result;
        
        if (!demande || Object.keys(demande).length === 0) {
            MessageBox.showMessageBox('Demande non trouvée', 'error');
            return;
        }
        
        displayDemandeAgenceDetails(demande);
        
    } catch (error) {
        MessageBox.showMessageBox('Erreur lors du chargement des détails', 'error');
    }
}

function displayDemandeAgenceDetails(demande) {
    const codeSpan = document.getElementById('modal-demande-agence-code');
    const contentDiv = document.getElementById('modal-demande-agence-content');
    
    if (!codeSpan || !contentDiv) {
        MessageBox.showMessageBox('Erreur: Éléments du modal introuvables', 'error');
        return;
    }
    
    codeSpan.textContent = `Code: ${demande.codeColis}`;
    
    const date = new Date(demande.date || demande.createdAt);
    const formattedDate = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const prixParKg = demande.prix || 0;
    const poidsReel = demande.poidsReel || demande.poidsVolumeAjuste || demande.poidOuTaille || 0;
    const prixTotal = (prixParKg * poidsReel).toFixed(2);
    
    contentDiv.innerHTML = `
        <div class="demande-details">
            <div class="detail-section">
                <h3><i class="fas fa-user"></i> Informations client</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Nom complet:</label>
                        <span>${escapeHtml(demande.fullName || 'N/A')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email:</label>
                        <span>${escapeHtml(demande.email || 'N/A')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Téléphone:</label>
                        <span>${escapeHtml(demande.telephone || 'N/A')}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-box"></i> Détails du colis</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Type de colis:</label>
                        <span>${escapeHtml(demande.typeColis || 'N/A')}</span>
                    </div>
                    ${demande.poidsReel || demande.poidsVolumeAjuste ? `
                    <div class="detail-item">
                        <label>Poids déclaré:</label>
                        <span>${escapeHtml(demande.poidOuTaille || 'N/A')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Poids réel:</label>
                        <span>${demande.poidsReel || demande.poidsVolumeAjuste} kg</span>
                    </div>
                    ` : `
                    <div class="detail-item">
                        <label>Poids/Volume:</label>
                        <span>${escapeHtml(demande.poidOuTaille || 'N/A')}</span>
                    </div>
                    `}
                    <div class="detail-item">
                        <label>Destination:</label>
                        <span>${escapeHtml(demande.destination || 'N/A')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Prix/kg:</label>
                        <span><strong>${prixParKg.toLocaleString()} $</strong></span>
                    </div>
                    <div class="detail-item">
                        <label>Prix Total:</label>
                        <span><strong style="color: var(--dore);">${prixTotal} $</strong></span>
                    </div>
                    <div class="detail-item">
                        <label>Délai:</label>
                        <span>${escapeHtml(demande.delai || 'N/A')}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-tasks"></i> Statut</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Statut actuel:</label>
                        <span class="status-badge status-${demande.status || 'en_attente'}">
                            ${Utils.getAgenceStatusText(demande.status)}
                        </span>
                    </div>
                    <div class="detail-item">
                        <label>Date création:</label>
                        <span>${formattedDate}</span>
                    </div>
                </div>
            </div>
            
            ${demande.description ? `
            <div class="detail-section">
                <h3><i class="fas fa-file-alt"></i> Description</h3>
                <div class="description-box">
                    <p>${escapeHtml(demande.description)}</p>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('demande-agence-details-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ==================== MODAL PROFIL UTILISATEUR =========================
export async function viewProfile(userId) {
    try {
        const user = await API.getUserProfileAPI(userId);
        if (user) {
            displayProfileModal(user);
        }
    } catch (error) {
        MessageBox.showMessageBox('Erreur lors du chargement du profil', 'error');
    }
}

function displayProfileModal(user) {
    const modalContent = document.getElementById('modal-profile-content');
    if (!modalContent) return;
    
    modalContent.innerHTML = '';
    
    document.getElementById('profile-modal').style.display = 'flex';
}

// ==================== FONCTIONS DE BOUTONS ====================
export function handleStatusButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const demandeId = button.getAttribute('data-demande-id');
    const codeColis = button.getAttribute('data-code-colis');
    const currentStatus = button.getAttribute('data-current-status');
    
    openDemandeAgenceStatusModal(demandeId, codeColis, currentStatus);
}

export function handleAdjustButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const demandeId = button.getAttribute('data-demande-id');
    const codeColis = button.getAttribute('data-code-colis');
    const currentWeight = button.getAttribute('data-current-weight');
    
    openDemandeAgenceAdjustModal(demandeId, codeColis, currentWeight);
}

export function handleDetailsButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const demandeId = button.getAttribute('data-demande-id');
    
    viewDemandeAgenceDetails(demandeId);
}

// ==================== EXPOSITION GLOBALE ================================

window.openDemandeAgenceStatusModal = openDemandeAgenceStatusModal;
window.openDemandeAgenceAdjustModal = openDemandeAgenceAdjustModal;
window.viewDemandeAgenceDetails = viewDemandeAgenceDetails;
window.viewProfile = viewProfile;
window.closeModal = closeModal;

window.handleStatusButtonClick = handleStatusButtonClick;
window.handleAdjustButtonClick = handleAdjustButtonClick;
window.handleDetailsButtonClick = handleDetailsButtonClick;