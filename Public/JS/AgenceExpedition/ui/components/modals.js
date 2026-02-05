function openAdjustModal(demandeId, codeColis, currentPrice, currentWeight) {
    document.getElementById('demande-id').value = demandeId;
    document.getElementById('modal-adjust-code').textContent = `Code: ${escapeHtml(codeColis)}`;
    document.getElementById('current-price').textContent = `${parseFloat(currentPrice).toLocaleString()} $`;
    
    document.getElementById('adjust-price').value = currentPrice;
    document.getElementById('adjust-weight').value = '';
    
    const currentWeightDiv = document.querySelector('.current-weight-display');
    if (currentWeightDiv) {
        currentWeightDiv.innerHTML = `<strong>Poids déclaré:</strong> ${escapeHtml(currentWeight)}`;
    }
    
    document.getElementById('adjust-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

async function adjustDemandePrice(event) {
    event.preventDefault();
    
    const demandeId = document.getElementById('demande-id').value; 
    const poidsReel = document.getElementById('adjust-weight').value;
    
  
    if (!demandeId) {
        showMessage('Erreur: ID de demande manquant', 'error');
        return;
    }
    
    if (!poidsReel || poidsReel <= 0) {
        showMessage('Veuillez entrer un poids valide', 'error');
        return;
    }
    
    try {
        const updateData = {
            poidsReel: poidsReel.toString()
        };
        
        const response = await apiFetch(`/api/agence/demandes/${demandeId}/adjust-prix`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        if (!response || !response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur lors de l\'ajustement');
        }
        
        const result = await response.json();
        
        closeModal();
        showMessage('Poids ajusté avec succès', 'success');
        
        setTimeout(() => {
            loadDemandes();
            loadHistorique();
            loadBadgeCounts();
        }, 1000);
        
    } catch (error) {
        showMessage(error.message || 'Erreur lors de l\'ajustement du poids', 'error');
    }
}

function openStatusModal(demandeId, codeColis, currentStatus) {
    document.getElementById('demande-id').value = demandeId;
    document.getElementById('modal-demande-code').textContent = `Code: ${escapeHtml(codeColis)}`;
    document.getElementById('current-status-badge').textContent = escapeHtml(getStatusText(currentStatus));
    document.getElementById('current-status-badge').className = `status-badge status-${escapeHtml(currentStatus)}`;
    
    const statusSelect = document.getElementById('new-status');
    statusSelect.innerHTML = `
        <option value="">Sélectionner un statut</option>
        <option value="accepté">Accepter</option>
        <option value="annulé">Annuler</option>
        <option value="livré">Livré</option>
    `;
    
    document.getElementById('status-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

async function updateDemandeStatus(event) {
    event.preventDefault();
    
    const demandeId = document.getElementById('demande-id').value;
    const newStatus = document.getElementById('new-status').value;
    
    if (!newStatus) {
        showMessage('Veuillez sélectionner un statut', 'error');
        return;
    }
    
    if (newStatus !== 'accepté' && newStatus !== 'annulé' && newStatus !== 'livré') {
        showMessage('Statut invalide. Choisissez "Accepter", "Annuler" ou "Livré"', 'error');
        return;
    }
    
    try {
        const updateData = {
            status: newStatus,
        };
        
        const response = await apiFetch(`/api/agence/demandes/${demandeId}/complete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!response || !response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur lors de la mise à jour');
        }
        
        const result = await response.json();
        
        closeModal();
        showMessage(`Statut mis à jour: ${escapeHtml(getStatusText(newStatus))}`, 'success');
        
        setTimeout(() => {
            loadDemandes();
            loadHistorique();
            loadBadgeCounts();
        }, 1000);
        
    } catch (error) {
        showMessage(error.message || 'Erreur lors de la mise à jour', 'error');
    }
}

// ===== MODAL UTILITAIRES =====  
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

window.openAdjustModal = openAdjustModal;
window.adjustDemandePrice = adjustDemandePrice;
window.openStatusModal = openStatusModal;
window.updateDemandeStatus = updateDemandeStatus;
window.closeModal = closeModal;