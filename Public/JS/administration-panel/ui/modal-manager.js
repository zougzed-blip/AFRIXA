
import * as Modals from './components/modals.js';
import * as MessageBox from './components/message-box.js';

// ==================== GESTION UNIFIÉE DES MODALS ====================

export function showDemandeAgenceDetailsModal(demandeId) {
    Modals.viewDemandeAgenceDetails(demandeId);
}

export function showDemandeAgenceStatusModal(demandeId, codeColis, currentStatus) {
    Modals.openDemandeAgenceStatusModal(demandeId, codeColis, currentStatus);
}

export function showDemandeAgenceAdjustModal(demandeId, codeColis, currentWeight) {
    Modals.openDemandeAgenceAdjustModal(demandeId, codeColis, currentWeight);
}

export function closeAllModals() {
    Modals.closeModal();
}

// ==================== ATTACHER LES ÉVÉNEMENTS AUX BOUTONS ====================

export function attachModalEvents() {

    
    document.addEventListener('click', function(event) {
       
        if (event.target.closest('[data-action="view-demande-agence-details"]')) {
            const button = event.target.closest('[data-action="view-demande-agence-details"]');
            const demandeId = button.dataset.demandeId;
            
            event.preventDefault();
            event.stopPropagation();
            
            showDemandeAgenceDetailsModal(demandeId);
        }
        
        
        else if (event.target.closest('[data-action="change-demande-agence-status"]')) {
            const button = event.target.closest('[data-action="change-demande-agence-status"]');
            const demandeId = button.dataset.demandeId;
            const codeColis = button.dataset.codeColis;
            const currentStatus = button.dataset.currentStatus;
            
            event.preventDefault();
            event.stopPropagation();
            
            showDemandeAgenceStatusModal(demandeId, codeColis, currentStatus);
        }
        
        
        else if (event.target.closest('[data-action="adjust-demande-agence-weight"]')) {
            const button = event.target.closest('[data-action="adjust-demande-agence-weight"]');
            const demandeId = button.dataset.demandeId;
            const codeColis = button.dataset.codeColis;
            const currentWeight = button.dataset.currentWeight;
            
            event.preventDefault();
            event.stopPropagation();
            
            showDemandeAgenceAdjustModal(demandeId, codeColis, currentWeight);
        }
    });
}

window.showDemandeAgenceDetailsModal = showDemandeAgenceDetailsModal;
window.showDemandeAgenceStatusModal = showDemandeAgenceStatusModal;
window.showDemandeAgenceAdjustModal = showDemandeAgenceAdjustModal;
window.closeAllModals = closeAllModals;