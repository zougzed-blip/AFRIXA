import * as API from '../api/admin.api.js';
import * as Utils from '../utils/helpers.js';
import * as MessageBox from '../ui/components/message-box.js';

export async function loadDemandesAgencePage() {
    try {
        const demandes = await API.loadDemandesAgenceDataAPI();
        
        if (!demandes) {
            showEmptyState('demandes-agence-table-body', 'Aucune donnée disponible');
            return;
        }
        
        if (!Array.isArray(demandes)) {
            const demandesArray = Array.isArray(demandes.data) ? demandes.data : 
                                 Array.isArray(demandes.demandes) ? demandes.demandes : [];
            
            if (demandesArray.length > 0) {
                displayDemandesAgence(demandesArray);
                updateDemandesAgenceCount();
            } else {
                showEmptyState('demandes-agence-table-body', 'Format de données invalide');
            }
            return;
        }
        
        if (demandes.length === 0) {
            showEmptyState('demandes-agence-table-body', 'Aucune demande d\'agence disponible');
        } else {
            displayDemandesAgence(demandes);
            updateDemandesAgenceCount();
        }
        
    } catch (error) {
        showEmptyState('demandes-agence-table-body', 'Erreur de chargement des demandes');
        MessageBox.showMessageBox('Erreur lors du chargement des demandes d\'agence', 'error');
    }
}

function displayDemandesAgence(demandes) {
    const container = document.getElementById('demandes-agence-table-body');
    if (!container) return;

    container.innerHTML = '';
    
    demandes.forEach(demande => {
        const date = new Date(demande.date || demande.createdAt);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        const poidsDisplay = demande.poidsVolumeAjuste || demande.poidsReel || demande.poidOuTaille || 'N/A';
        
        const row = document.createElement('tr');
        
        // Cellule 1: Code colis
        const td1 = document.createElement('td');
        td1.textContent = demande.codeColis || demande.code || 'N/A';
        
        // Cellule 2: Client
        const td2 = document.createElement('td');
        td2.textContent = demande.fullName || demande.nom || demande.clientName || 'N/A';
        
        // Cellule 3: Destination
        const td3 = document.createElement('td');
        td3.textContent = demande.destination || demande.villeArrivee || 'N/A';
        
        // Cellule 4: Date
        const td4 = document.createElement('td');
        td4.textContent = formattedDate;
        
        // Cellule 5: Statut
        const td5 = document.createElement('td');
        const statusSpan = document.createElement('span');
        statusSpan.className = `status-badge status-${demande.status || 'en_attente'}`;
        statusSpan.textContent = Utils.getAgenceStatusText(demande.status);
        td5.appendChild(statusSpan);
        
        // Cellule 6: Actions
        const td6 = document.createElement('td');
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'action-buttons';
        
        // Bouton Voir détails
        const viewButton = document.createElement('button');
        viewButton.className = 'btn-action btn-view';
        viewButton.setAttribute('data-action', 'view-demande-agence-details');
        viewButton.setAttribute('data-demande-id', demande._id || demande.id);
        viewButton.setAttribute('title', 'Voir détails');
        const viewIcon = document.createElement('i');
        viewIcon.className = 'fas fa-eye';
        viewButton.appendChild(viewIcon);
        
        // Bouton Changer statut
        const statusButton = document.createElement('button');
        statusButton.className = 'btn-action btn-status';
        statusButton.setAttribute('data-action', 'change-demande-agence-status');
        statusButton.setAttribute('data-demande-id', demande._id || demande.id);
        statusButton.setAttribute('data-code-colis', demande.codeColis || demande.code);
        statusButton.setAttribute('data-current-status', demande.status);
        statusButton.setAttribute('title', 'Changer statut');
        const statusIcon = document.createElement('i');
        statusIcon.className = 'fas fa-edit';
        statusButton.appendChild(statusIcon);
        
        actionsDiv.appendChild(viewButton);
        actionsDiv.appendChild(statusButton);
        
        // Bouton Ajuster poids (uniquement pour certains statuts)
        if (demande.status === 'en_attente' || demande.status === 'acceptee' || demande.status === 'accepté') {
            const adjustButton = document.createElement('button');
            adjustButton.className = 'btn-action btn-adjust';
            adjustButton.setAttribute('data-action', 'adjust-demande-agence-weight');
            adjustButton.setAttribute('data-demande-id', demande._id || demande.id);
            adjustButton.setAttribute('data-code-colis', demande.codeColis || demande.code);
            adjustButton.setAttribute('data-current-weight', poidsDisplay);
            adjustButton.setAttribute('title', 'Ajuster le poids');
            const adjustIcon = document.createElement('i');
            adjustIcon.className = 'fas fa-balance-scale';
            adjustButton.appendChild(adjustIcon);
            actionsDiv.appendChild(adjustButton);
        }
        
        td6.appendChild(actionsDiv);
        
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        row.appendChild(td4);
        row.appendChild(td5);
        row.appendChild(td6);
        
        container.appendChild(row);
    });
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
        MessageBox.showMessage('Aucune demande ne correspond aux filtres', 'info');
    }
}

function updateDemandesAgenceCount() {
    const totalDemandes = document.getElementById('total-demandes-agence');
    if (totalDemandes) {
        const count = API.getCurrentDemandesAgence()?.length || 0;
        totalDemandes.textContent = count;
    }
}

function showEmptyState(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        const icon = document.createElement('i');
        icon.className = 'fas fa-inbox';
        const p = document.createElement('p');
        p.textContent = message;
        emptyState.appendChild(icon);
        emptyState.appendChild(p);
        container.appendChild(emptyState);
    }
}


window.loadDemandesAgencePage = loadDemandesAgencePage;