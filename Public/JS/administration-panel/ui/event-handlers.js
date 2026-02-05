import * as API from '../api/admin.api.js';
import * as Pages from '../pages/index.js';
import * as Modals from './components/modals.js';
import * as MessageBox from './components/message-box.js';
import * as NotificationService from '../services/notification.service.js';
import * as Utils from '../utils/helpers.js';

// ==================== GESTIONNAIRES D'ÉVÉNEMENTS SÉCURISÉS ====================
export function setupSecureEventHandlers() {
    document.addEventListener('click', function(event) {
      
        if (event.target.closest('[data-action="accept-company"]')) {
            const button = event.target.closest('[data-action="accept-company"]');
            const companyId = button.dataset.companyId;
            const companyName = button.dataset.companyName;
            validateCompany(companyId, true, companyName);
            event.preventDefault();
        }
        
        if (event.target.closest('[data-action="refuse-company"]')) {
            const button = event.target.closest('[data-action="refuse-company"]');
            const companyId = button.dataset.companyId;
            const companyName = button.dataset.companyName;
            validateCompany(companyId, false, companyName);
            event.preventDefault();
        }
        
        if (event.target.closest('[data-action="view-company-profile"]')) {
            const button = event.target.closest('[data-action="view-company-profile"]');
            const companyId = button.dataset.companyId;
            viewProfile(companyId);
            event.preventDefault();
        }
        
        // Gestion des utilisateurs
        if (event.target.closest('[data-action="view-user-profile"]')) {
            const button = event.target.closest('[data-action="view-user-profile"]');
            const userId = button.dataset.userId;
            viewProfile(userId);
            event.preventDefault();
        }
        
        if (event.target.closest('[data-action="toggle-user-status"]')) {
            const button = event.target.closest('[data-action="toggle-user-status"]');
            const userId = button.dataset.userId;
            const userName = button.dataset.userName;
            const suspend = button.dataset.suspend === 'true';
            toggleUserStatus(userId, suspend, userName);
            event.preventDefault();
        }
        
        // Preuves de paiement
        if (event.target.closest('[data-action="view-proof"]')) {
            const button = event.target.closest('[data-action="view-proof"]');
            const proofId = button.dataset.proofId;
            const proofUrl = button.dataset.proofUrl;
            viewProof(proofId, proofUrl);
            event.preventDefault();
        }
        
        if (event.target.closest('[data-action="accept-proof"]')) {
            const button = event.target.closest('[data-action="accept-proof"]');
            const proofId = button.dataset.proofId;
            updateProofStatus(proofId, 'accepté');
            event.preventDefault();
        }
        
        if (event.target.closest('[data-action="refuse-proof"]')) {
            const button = event.target.closest('[data-action="refuse-proof"]');
            const proofId = button.dataset.proofId;
            updateProofStatus(proofId, 'refusé');
            event.preventDefault();
        }
        
        if (event.target.closest('[data-action="reset-proof"]')) {
            const button = event.target.closest('[data-action="reset-proof"]');
            const proofId = button.dataset.proofId;
            updateProofStatus(proofId, 'en_attente');
            event.preventDefault();
        }
        
        // Demandes agence
        if (event.target.closest('[data-action="view-demande-agence-details"]')) {
            const button = event.target.closest('[data-action="view-demande-agence-details"]');
            const demandeId = button.dataset.demandeId;
            event.preventDefault();
            event.stopPropagation();
            
            if (typeof Modals !== 'undefined' && Modals.viewDemandeAgenceDetails) {
                Modals.viewDemandeAgenceDetails(demandeId);
            } else {
                MessageBox.showMessageBox('Erreur: Système de modals non chargé', 'error');
            }
        }

        if (event.target.closest('[data-action="change-demande-agence-status"]')) {
            const button = event.target.closest('[data-action="change-demande-agence-status"]');
            const demandeId = button.dataset.demandeId;
            const codeColis = button.dataset.codeColis;
            const currentStatus = button.dataset.currentStatus;
            event.preventDefault();
            event.stopPropagation();
            
            if (typeof Modals !== 'undefined' && Modals.openDemandeAgenceStatusModal) {
                Modals.openDemandeAgenceStatusModal(demandeId, codeColis, currentStatus);
            } else {
                MessageBox.showMessageBox('Erreur: Système de modals non chargé', 'error');
            }
        }

        if (event.target.closest('[data-action="adjust-demande-agence-weight"]')) {
            const button = event.target.closest('[data-action="adjust-demande-agence-weight"]');
            const demandeId = button.dataset.demandeId;
            const codeColis = button.dataset.codeColis;
            const currentWeight = button.dataset.currentWeight;
            event.preventDefault();
            event.stopPropagation();
            
            if (typeof Modals !== 'undefined' && Modals.openDemandeAgenceAdjustModal) {
                Modals.openDemandeAgenceAdjustModal(demandeId, codeColis, currentWeight);
            } else {
                MessageBox.showMessageBox('Erreur: Système de modals non chargé', 'error');
            }
        }
        
        // Envoi de preuve
        if (event.target.closest('[data-action="select-company-proof"]')) {
            const card = event.target.closest('[data-action="select-company-proof"]');
            const companyId = card.dataset.companyId;
            selectCompanyForProof(companyId, card);
            event.preventDefault();
        }
        
        // Navigation
        if (event.target.closest('a[href^="#"]')) {
            event.preventDefault();
            const href = event.target.closest('a').getAttribute('href');
            const sectionId = href.substring(1);
            window.showSection(sectionId);
            
            if (window.innerWidth <= 1024) {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) sidebar.classList.remove('active');
            }
        }
        
        // Notifications
        if (event.target.closest('[data-action="mark-notification-read"]')) {
            const element = event.target.closest('[data-action="mark-notification-read"]');
            const notificationId = element.dataset.notificationId;
            NotificationService.markNotificationAsRead(notificationId);
            event.preventDefault();
        }
    });
}

// ==================== ÉVÉNEMENTS GÉNÉRAUX =================================
export function setupEventListeners() {
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('user-search');
    
    if (roleFilter) roleFilter.addEventListener('change', filterUsers);
    if (searchInput) searchInput.addEventListener('input', filterUsers);

    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) typeFilter.addEventListener('change', filterCompanies);
  
    const searchDemandeAgenceInput = document.getElementById('search-demande-agence');
    const statusFilterAgence = document.getElementById('status-filter-agence');
    const dateStartAgence = document.getElementById('date-filter-start-agence');
    const dateEndAgence = document.getElementById('date-filter-end-agence');
    const filterDemandesAgenceBtn = document.getElementById('filter-demandes-agence-btn');
    
    if (searchDemandeAgenceInput) searchDemandeAgenceInput.addEventListener('input', filterDemandesAgence);
    if (statusFilterAgence) statusFilterAgence.addEventListener('change', filterDemandesAgence);
    if (dateStartAgence) dateStartAgence.addEventListener('change', filterDemandesAgence);
    if (dateEndAgence) dateEndAgence.addEventListener('change', filterDemandesAgence);
    if (filterDemandesAgenceBtn) filterDemandesAgenceBtn.addEventListener('click', filterDemandesAgence);
  
    const searchRatingInput = document.getElementById('search-rating');
    const ratingFilter = document.getElementById('rating-filter');
    const dateStartRating = document.getElementById('date-filter-start-rating');
    const dateEndRating = document.getElementById('date-filter-end-rating');
    
    if (ratingFilter) ratingFilter.addEventListener('change', filterRatings);
    if (searchRatingInput) searchRatingInput.addEventListener('input', filterRatings);
    if (dateStartRating) dateStartRating.addEventListener('change', filterRatings);
    if (dateEndRating) dateEndRating.addEventListener('change', filterRatings);
    
    setupProofsDateFilter();
    
    document.querySelectorAll('.th-content').forEach(th => {
        th.addEventListener('click', function() {
            const column = this.closest('th').dataset.column;
            if (column && column !== 'actions' && column !== 'status' && column !== 'phone') {
                sortTable(column);
            }
        });
    });
    
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    const notificationBell = document.getElementById('notificationBell');
    if (notificationBell) {
        notificationBell.addEventListener('click', NotificationService.showAllNotificationsModal);
    }
    
    const markAllRead = document.getElementById('mark-all-read');
    if (markAllRead) {
        markAllRead.addEventListener('click', NotificationService.markAllNotificationsAsRead);
    }
 
    setupProofSendForm();
}

// ==================== FONCTIONS D'INTERACTION =============================
export async function validateCompany(companyId, accept, companyName) {
    const action = accept ? 'accepter' : 'refuser';
    
    MessageBox.showConfirm(`Êtes-vous sûr de vouloir ${action} la société "${companyName}" ?`, () => {
        executeValidateCompany(companyId, accept, companyName);
    });
}

export async function toggleUserStatus(userId, suspend, userName) {
    const action = suspend ? 'suspendre' : 'activer';
    const user = API.getCurrentUsers().find(u => u._id === userId);
    const userNameDisplay = user ? Utils.getUserName(user) : 'cet utilisateur';
    
    MessageBox.showConfirm(`Êtes-vous sûr de vouloir ${action} l'utilisateur "${userNameDisplay}" ?`, () => {
        executeToggleUserStatus(userId, suspend, userNameDisplay);
    });
}

export async function updateProofStatus(proofId, newStatus) {
    try {
        const result = await API.updateProofStatusAPI(proofId, newStatus);
        
        if (result && result.success) {
            if (window.loadProofsPage) window.loadProofsPage();
            showMessage(`Statut mis à jour: ${newStatus}`, 'success');
        }
    } catch {
        MessageBox.showMessageBox('Erreur lors de la mise à jour', 'error');
    }
}

export function viewProof(proofId, proofUrl) {
    window.open(proofUrl, '_blank');
}

// 2. Fonction pour ajuster le poids d'une demande d'agence
export async function adjustDemandeAgenceWeight(event) {
    event.preventDefault();
    
    const demandeId = document.getElementById('demande-agence-adjust-id').value;
    const newWeight = document.getElementById('demande-agence-adjust-weight').value;
    
    if (!newWeight || newWeight <= 0) {
        showMessage('Veuillez entrer un poids valide', 'error');
        return;
    }
    
    try {
        const response = await API.apiFetch(`/api/admin/agence/demandes/${demandeId}/adjust-weight`, {
            method: 'PUT',
            body: JSON.stringify({ poidsReel: parseFloat(newWeight) })
        });
    
        if (response && response.ok) {
            closeModal();
            showMessage('Poids ajusté avec succès', 'success');
            
            setTimeout(() => {
                if (window.loadDemandesAgencePage) {
                    window.loadDemandesAgencePage();
                }
            }, 1000);
        } else {
            MessageBox.showMessageBox('Erreur lors de l\'ajustement du poids', 'error');
        }
        
    } catch {
        showMessage('Erreur lors de l\'ajustement du poids', 'error');
    }
}

export function filterRatings() {
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

export async function viewProfile(userId) {
    try {
        const response = await API.apiFetch(`/api/admin/users/${userId}`);
        if (!response) return;
        
        const user = await response.json();
        displayProfileModal(user);
    } catch {
        MessageBox.showMessageBox('Erreur lors du chargement du profil', 'error');
    }
}

export async function viewDemandeAgenceDetails(demandeId) {
    try {
        const response = await API.apiFetch(`/api/admin/agence/demandes/${demandeId}`);
        if (!response || !response.ok) {
            showMessage('Erreur lors du chargement des détails', 'error');
            return;
        }
        
        const result = await response.json();
        const demande = result.success ? result.data : result;
        
        if (!demande) {
            showMessage('Demande non trouvée', 'error');
            return;
        }
        
        displayDemandeAgenceDetailsModal(demande);
        
    } catch {
        showMessage('Erreur lors du chargement des détails', 'error');
    }
}

export function filterDemandesAgence() {
    const searchTerm = document.getElementById('search-demande-agence').value.toLowerCase().trim();
    const statusFilter = document.getElementById('status-filter-agence').value;
    const startDateInput = document.getElementById('date-filter-start-agence');
    const endDateInput = document.getElementById('date-filter-end-agence');
    
    const startDate = startDateInput ? startDateInput.value : null;
    const endDate = endDateInput ? endDateInput.value : null;
    
    const rows = document.querySelectorAll('#demandes-agence-table-body tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        if (row.querySelector('.empty-state')) {
            row.style.display = 'none';
            return;
        }
        
        if (!row.cells || row.cells.length < 6) {
            return;
        }
        
        const codeCell = row.cells[0].textContent.toLowerCase();
        const clientCell = row.cells[1].textContent.toLowerCase();
        const destinationCell = row.cells[2].textContent.toLowerCase();
        const statusBadge = row.querySelector('.status-badge');
        const statusText = statusBadge ? statusBadge.textContent.toLowerCase().trim() : '';
 
        let statusValue = 'en_attente';
        if (statusText.includes('accepté') || statusText === 'accepté') {
            statusValue = 'acceptee';
        } else if (statusText.includes('livré') || statusText === 'livré') {
            statusValue = 'livree';
        } else if (statusText.includes('annulé') || statusText === 'annulé') {
            statusValue = 'annulee';
        }
        
        const dateCell = row.cells[3].textContent.trim();
        let matchesDate = true;
        
        if ((startDate || endDate) && dateCell) {
            const dateParts = dateCell.split(' ');
            if (dateParts.length >= 3) {
                const day = dateParts[0].padStart(2, '0');
                const month = Utils.getMonthNumber(dateParts[1]);
                const year = dateParts[2];
                const rowDate = `${year}-${month}-${day}`;
                
                if (startDate && rowDate < startDate) matchesDate = false;
                if (endDate && rowDate > endDate) matchesDate = false;
            }
        }
  
        const matchesSearch = searchTerm === '' || 
                          codeCell.includes(searchTerm) || 
                          clientCell.includes(searchTerm) ||
                          destinationCell.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || statusValue === statusFilter;
        
        const shouldShow = matchesSearch && matchesStatus && matchesDate;
        row.style.display = shouldShow ? '' : 'none';
        
        if (shouldShow) visibleCount++;
    });
    
    const totalElement = document.getElementById('total-demandes-agence');
    if (totalElement) {
        totalElement.textContent = visibleCount;
    }
    
    if (visibleCount === 0 && rows.length > 0) {
        showMessage('Aucune demande ne correspond aux filtres', 'info');
    }
}

// ==================== FONCTIONS DE MODAL =================================
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
    }
}

export async function updateDemandeAgenceStatus(event) {
    event.preventDefault();
    
    const demandeId = document.getElementById('demande-agence-id').value;
    const newStatus = document.getElementById('new-demande-agence-status').value;
    
    if (!newStatus) {
        showMessage('Veuillez sélectionner un statut', 'error');
        return;
    }
    
    try {
        const response = await API.apiFetch(`/api/admin/agence/demandes/${demandeId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response && response.ok) {
            const data = await response.json();
            
            closeModal();
            showMessage(`Statut mis à jour: ${Utils.getAgenceStatusText(newStatus)}`, 'success');
            
            setTimeout(() => {
                if (window.loadDemandesAgencePage) {
                    window.loadDemandesAgencePage();
                }
            }, 2000);
        } else {
            showMessage('Erreur lors de la mise à jour', 'error');
        }
        
    } catch {
        showMessage('Erreur lors de la mise à jour', 'error');
    }
}

export function openDemandeAgenceAdjustModal(demandeId, codeColis, currentWeight) {
    document.getElementById('demande-agence-adjust-id').value = demandeId;
    const modalDemandeAgenceAdjustCode = document.getElementById('modal-demande-agence-adjust-code');
    modalDemandeAgenceAdjustCode.textContent = `Code: ${codeColis}`;
    
    const currentDemandeAgenceWeight = document.getElementById('current-demande-agence-weight');
    currentDemandeAgenceWeight.textContent = currentWeight;
    
    document.getElementById('demande-agence-adjust-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ==================== FONCTIONS DE PREUVE ================================

export function selectCompanyForProof(companyId, element) {
    document.querySelectorAll('.company-send-card').forEach(card => {
        card.classList.remove('selected');
    });
 
    element.classList.add('selected');
    window.selectedCompanyForProof = companyId;

    MessageBox.showConfirm(`Êtes-vous sûr de vouloir envoyer la preuve à cette entreprise ?`, () => {
        sendProofToCompany();
    });
}

export async function sendProofToCompany() {
    if (!window.selectedCompanyForProof) {
        MessageBox.showMessageBox('Veuillez sélectionner une entreprise', 'warning');
        return;
    }
    
    const code = document.getElementById('proof-code').value.trim();
    const amount = document.getElementById('proof-amount').value.trim();
    const devise = document.getElementById('proof-currency').value;
    const method = document.getElementById('proof-form').value;
    const fileInput = document.getElementById('proof-photo');
    
    if (!code) {
        MessageBox.showMessageBox('Veuillez entrer le code colis', 'warning');
        return;
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        MessageBox.showMessageBox('Veuillez entrer un montant valide', 'warning');
        return;
    }
    
    if (!devise) {
        MessageBox.showMessageBox('Veuillez sélectionner une devise', 'warning');
        return;
    }
    
    if (!method) {
        MessageBox.showMessageBox('Veuillez sélectionner une méthode de paiement', 'warning');
        return;
    }
    
    if (!fileInput.files || fileInput.files.length === 0) {
        MessageBox.showMessageBox('Veuillez sélectionner une photo de preuve', 'warning');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('codeColis', code);
        formData.append('montant', parseFloat(amount)); 
        formData.append('devise', devise);
        formData.append('method', method);
        formData.append('destinataireId', window.selectedCompanyForProof);
        formData.append('proofImage', fileInput.files[0]);
        
        const response = await API.sendProofAPI(formData);
        
        if (!response.ok) {
            showMessage('Erreur lors de l\'envoi', 'error');
            return;
        }
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('send-proof-form').style.display = 'block';
            document.getElementById('companies-send-list').style.display = 'none';
            document.getElementById('proof-code').value = '';
            document.getElementById('proof-amount').value = '';
            document.getElementById('proof-photo').value = '';
            document.getElementById('file-name').textContent = 'Aucun fichier sélectionné';
            window.selectedCompanyForProof = null;
    
            if (window.loadProofsPage) {
                window.loadProofsPage();
            }
            
            showMessage('Preuve envoyée avec succès !', 'success');
        } else {
            showMessage('Erreur lors de l\'envoi', 'error');
        }
        
    } catch {
        MessageBox.showMessageBox('Erreur lors de l\'envoi', 'error');
    }
}

// ==================== FONCTIONS UTILITAIRES ================================

export function filterCompanies() {
    const filter = document.getElementById('type-filter').value;
    document.querySelectorAll('.company-card').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.type === filter) ? 'flex' : 'none';
    });
}

export function filterUsers() {
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

export function sortTable(column) {
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

export function setupProofsDateFilter() {
    const filterBtn = document.getElementById('filter-proofs-btn');
    
    if (filterBtn) {
        filterBtn.addEventListener('click', filterProofsByDate);
    }
}

export function filterProofsByDate() {
    const startDate = document.getElementById('date-filter-start').value;
    const endDate = document.getElementById('date-filter-end').value;
    
    if (!startDate && !endDate) {
        MessageBox.showMessageBox('Veuillez sélectionner au moins une date', 'warning');
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

export function setupMobileMenu() {
    const menuToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

export function setupModals() {
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

export function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

export function logout(event) {
    event.preventDefault();
    MessageBox.showConfirm('Êtes-vous sûr de vouloir vous déconnecter ?', () => {
        document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = '_csrf=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
    });
}

export function setupProofSendForm() {
    const fileInput = document.getElementById('proof-photo');
    const fileName = document.getElementById('file-name');
    const sendProofBtn = document.getElementById('send-proof-btn');
    
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const icon = document.createElement('i');
                icon.className = 'fas fa-file-image';
                
                const text = document.createTextNode(` ${this.files[0].name}`);
                
                fileName.innerHTML = '';
                fileName.appendChild(icon);
                fileName.appendChild(text);
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

    if (!code) {
        MessageBox.showMessageBox('Veuillez entrer le code colis', 'warning');
        return;
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        MessageBox.showMessageBox('Veuillez entrer un montant valide', 'warning');
        return;
    }
    
    if (!fileInput.files || fileInput.files.length === 0) {
        MessageBox.showMessageBox('Veuillez sélectionner une photo de preuve', 'warning');
        return;
    }
    
    document.getElementById('send-proof-form').style.display = 'none';
    document.getElementById('companies-send-list').style.display = 'block';

    await loadCompaniesForProof();
}

async function loadCompaniesForProof() {
    try {
        const response = await API.apiFetch('/api/admin/companies/for-proof');
        if (!response) return;
        
        const companies = await response.json();
        const companiesGrid = document.getElementById('companies-grid');
        
        if (!companies || companies.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'Aucune entreprise disponible';
            companiesGrid.innerHTML = '';
            companiesGrid.appendChild(emptyState);
            return;
        }
        
        companiesGrid.innerHTML = '';
        
        companies.forEach(company => {
            const logo = Utils.getCompanyLogo(company);
            const name = Utils.getCompanyName(company);
            const role = Utils.getRoleLabel(company.role);
            
            const card = document.createElement('div');
            card.className = 'company-send-card';
            card.setAttribute('data-action', 'select-company-proof');
            card.setAttribute('data-company-id', company._id);
            
            const logoImg = document.createElement('img');
            logoImg.src = logo;
            logoImg.alt = name;
            logoImg.className = 'company-send-logo';
            logoImg.onerror = function() { this.src='/images/default-company.png'; };
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'company-send-info';
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'company-send-name';
            nameDiv.textContent = name;
            
            const roleSpan = document.createElement('span');
            roleSpan.className = 'company-send-role';
            roleSpan.textContent = role;
            
            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(roleSpan);
            
            card.appendChild(logoImg);
            card.appendChild(infoDiv);
            
            companiesGrid.appendChild(card);
        });
        
    } catch {
        MessageBox.showMessageBox('Erreur lors du chargement des entreprises', 'error');
    }
}

export function showMessage(message, type = 'info') {
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
    animation: popupSlideIn 0.3s ease;
    max-width: 400px;
    width: 100%;
    border: 1px solid var(--gris-clair); 
`;
    
    const messageSpan = document.createElement('span');
    messageSpan.style.cssText = 'flex: 1; color: var(--gris-fonce);';
    messageSpan.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-close';
    closeButton.setAttribute('data-action', 'close-popup');
    closeButton.style.cssText = `
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
        case 'success': return 'var(--success)';
        case 'error': return 'var(--danger)';
        case 'warning': return 'var(--warning)';
        case 'info': return 'var(--gris-fonce)';
        default: return 'var(--vert-fonce)';
    }
}

async function executeValidateCompany(companyId, accept, companyName) {
    try {
        if (!accept) {
            MessageBox.showMessageBox("La fonctionnalité de refus sera bientôt disponible.", 'info');
            return;
        }

        const result = await API.validateCompanyAPI(companyId, accept);
        
        if (result) {
            if (window.loadValidationPage) window.loadValidationPage();
            if (window.loadDashboardPage) window.loadDashboardPage();
            showMessage(`Société ${accept ? 'acceptée' : 'refusée'} avec succès !`, 'success');
        }
    } catch {
        MessageBox.showMessageBox('Erreur lors de la validation', 'error');
    }
}

async function executeToggleUserStatus(userId, suspend, userNameDisplay) {
    try {
        const result = await API.toggleUserStatusAPI(userId, suspend);
        
        if (result) {
            if (window.loadUsersPage) window.loadUsersPage();
            showMessage(`Utilisateur ${suspend ? 'suspendu' : 'activé'} avec succès !`, 'success');
        }
    } catch {
        MessageBox.showMessageBox('Erreur lors du changement de statut', 'error');
    }
}

function getUserName(user) {
    return Utils.getUserName(user);
}

function displayProfileModal(user) {
}

function displayDemandeAgenceDetailsModal(demande) {
}

window.openDemandeAgenceStatusModal = openDemandeAgenceStatusModal;
window.updateDemandeAgenceStatus = updateDemandeAgenceStatus;
window.openDemandeAgenceAdjustModal = openDemandeAgenceAdjustModal;
window.adjustDemandeAgenceWeight = adjustDemandeAgenceWeight;
window.viewDemandeAgenceDetails = viewDemandeAgenceDetails;
window.viewProfile = viewProfile;
window.closeModal = closeModal;
window.showMessage = showMessage;

window.filterDemandesAgence = filterDemandesAgence;
window.filterCompanies = filterCompanies;
window.filterUsers = filterUsers;
window.filterRatings = filterRatings;
window.sortTable = sortTable;
window.validateCompany = validateCompany;
window.toggleUserStatus = toggleUserStatus;
window.updateProofStatus = updateProofStatus;
window.filterProofsByDate = filterProofsByDate;
window.selectCompanyForProof = selectCompanyForProof;
window.sendProofToCompany = sendProofToCompany;

window.viewProof = viewProof;
window.logout = logout;
window.setupProofSendForm = setupProofSendForm;
window.setupMobileMenu = setupMobileMenu;
window.setupModals = setupModals;