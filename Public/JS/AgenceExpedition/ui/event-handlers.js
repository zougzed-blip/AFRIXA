function setupEventDelegation() {
    document.addEventListener('click', function(event) {
        if (event.target.closest('.btn-view') && event.target.closest('tr')) {
            const row = event.target.closest('tr');
            const demandeId = row.dataset.demandeId;
            if (demandeId) {
                event.preventDefault();
                viewDemandeDetails(demandeId);
            }
        }
        
        if (event.target.closest('.btn-status') && event.target.closest('tr')) {
            const row = event.target.closest('tr');
            const demandeId = row.dataset.demandeId;
            const codeColis = row.dataset.codeColis;
            const status = row.dataset.status;
            if (demandeId && codeColis && status) {
                event.preventDefault();
                openStatusModal(demandeId, codeColis, status);
            }
        }
        
        if (event.target.closest('.btn-adjust') && event.target.closest('tr')) {
            const row = event.target.closest('tr');
            const demandeId = row.dataset.demandeId;
            const codeColis = row.dataset.codeColis;
            const prix = row.dataset.prix;
            const poids = row.dataset.poids;
            if (demandeId && codeColis) {
                event.preventDefault();
                openAdjustModal(demandeId, codeColis, prix || 0, poids || 'N/A');
            }
        }
        
        if (event.target.closest('.btn-edit')) {
            const button = event.target.closest('.btn-edit');
            const row = button.closest('tr');
            const index = row.dataset.index;
            if (index !== undefined) {
                event.preventDefault();
                editTarif(parseInt(index));
            }
        }
        
        if (event.target.closest('.btn-delete')) {
            const button = event.target.closest('.btn-delete');
            const row = button.closest('tr');
            const index = row.dataset.index;
            if (index !== undefined) {
                event.preventDefault();
                confirmDeleteTarif(parseInt(index));
            }
        }
        
        if (event.target.closest('.btn-view') && event.target.closest('tr[data-paiement-id]')) {
            const row = event.target.closest('tr');
            const paiementId = row.dataset.paiementId;
            if (paiementId) {
                event.preventDefault();
                viewPaiementDetails(paiementId);
            }
        }
    });
    
    document.addEventListener('click', function(event) {
        if (event.target.closest('[data-action="accept-paiement"]')) {
            const button = event.target.closest('[data-action="accept-paiement"]');
            const paiementId = button.dataset.paiementId;
            if (paiementId) {
                event.preventDefault();
                updatePaiementStatus(paiementId, 'accepté');
            }
        }
        
        if (event.target.closest('[data-action="refuse-paiement"]')) {
            const button = event.target.closest('[data-action="refuse-paiement"]');
            const paiementId = button.dataset.paiementId;
            if (paiementId) {
                event.preventDefault();
                updatePaiementStatus(paiementId, 'refusé');
            }
        }
    });
}

function setupEventListeners() {
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
    
    const uploadAvatar = document.getElementById('upload-avatar');
    if (uploadAvatar) {
        uploadAvatar.addEventListener('change', function(e) {
            uploadProfilePicture(e.target.files[0]);
        });
    }
    
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProfile();
        });
    }
    
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteTarifConfirmed);
    }
    
    const saveDestinationBtn = document.getElementById('save-destination-btn');
    if (saveDestinationBtn) {
        saveDestinationBtn.addEventListener('click', saveTarif);
    }
    
    const cancelDestinationBtn = document.getElementById('cancel-destination-btn');
    if (cancelDestinationBtn) {
        cancelDestinationBtn.addEventListener('click', cancelTarifEdit);
    }
    
    // Formulaire de statut
    const statusForm = document.getElementById('status-form');
    if (statusForm) {
        statusForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateDemandeStatus(e);
        });
    }
    
    
    const adjustForm = document.getElementById('adjust-form');
    if (adjustForm) {
        adjustForm.addEventListener('submit', function(e) {
            e.preventDefault();
            adjustDemandePrice(e);
        });
    }
}

window.setupEventDelegation = setupEventDelegation;
window.setupEventListeners = setupEventListeners;