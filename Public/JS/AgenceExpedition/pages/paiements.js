async function loadPaiements() {
    try {
        const response = await apiFetch('/api/agence/paiements');
        if (!response || !response.ok) {
            showMessage('Erreur lors du chargement des paiements', 'error');
            return;
        }
        
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
            currentPaiements = result.data;
        } else if (Array.isArray(result)) {
            currentPaiements = result;
        } else {
            currentPaiements = [];
        }
        
        filterPaiements();
        
    } catch (error) {
        showMessage('Erreur lors du chargement des paiements', 'error');
        currentPaiements = [];
        displayPaiements([]);
    }
}

function filterPaiements() {
    const startDate = document.getElementById('paiements-date-start')?.value;
    const endDate = document.getElementById('paiements-date-end')?.value;
    const searchTerm = document.getElementById('search-paiements')?.value?.toLowerCase() || '';
    
    let filtered = [...currentPaiements];
    
    if (searchTerm) {
        filtered = filtered.filter(paiement => {
            return (paiement.codeColis || '').toLowerCase().includes(searchTerm) ||
                   (paiement.clientName || paiement.nom || paiement.fullName || '').toLowerCase().includes(searchTerm) ||
                   (paiement.montant || '').toString().includes(searchTerm);
        });
    }
    
    if (startDate) {
        filtered = filtered.filter(p => {
            const paiementDate = new Date(p.uploadedAt || p.createdAt);
            return paiementDate >= new Date(startDate);
        });
    }
    
    if (endDate) {
        filtered = filtered.filter(p => {
            const paiementDate = new Date(p.uploadedAt || p.createdAt);
            const endDateObj = new Date(endDate + 'T23:59:59');
            return paiementDate <= endDateObj;
        });
    }
    
    displayPaiements(filtered);
}

async function viewPaiementDetails(paiementId) {
    
    try {
        const response = await apiFetch(`/api/agence/paiements/${paiementId}`);
        if (!response || !response.ok) {
            showMessage('Erreur lors du chargement des détails', 'error');
            return;
        }
        
        const result = await response.json();
        const paiement = result.success ? result.data : result;
        
        if (!paiement) {
            showMessage('Paiement non trouvé', 'error');
            return;
        }
        
        const modalContent = document.getElementById('modal-paiement-details-content');
        if (modalContent) {
            const date = new Date(paiement.uploadedAt || paiement.createdAt);
            const formattedDate = date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const statut = paiement.statut || paiement.status || 'en_attente';
            let statusClass = 'status-en_attente';
            let statusText = 'En attente';
            
            if (statut === 'accepté' || statut === 'accepte' || statut === 'payé' || statut === 'paye') {
                statusClass = 'status-livré';
                statusText = 'Accepté';
            } else if (statut === 'refusé' || statut === 'refuse' || statut === 'annulé' || statut === 'annule') {
                statusClass = 'status-annulé';
                statusText = 'Refusé';
            }
            
            const clientName = escapeHtml(paiement.clientName || paiement.nom || paiement.fullName || 'N/A');
            const codeColis = escapeHtml(paiement.codeColis || 'N/A');
            const montant = escapeHtml((paiement.montant || 0).toLocaleString());
            const devise = escapeHtml(paiement.devise || 'USD');
            const proofUrl = sanitizeUrl(paiement.proofUrl || '');
            
            modalContent.innerHTML = sanitizeHtml(`
                <div class="paiement-details">
                    <div class="detail-section">
                        <h3><i class="fas fa-user"></i> Informations client</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Nom:</label>
                                <span>${clientName}</span>
                            </div>
                            <div class="detail-item">
                                <label>Code Colis:</label>
                                <span><strong>${codeColis}</strong></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3><i class="fas fa-credit-card"></i> Détails du paiement</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Montant:</label>
                                <span><strong>${montant} ${devise}</strong></span>
                            </div>
                            <div class="detail-item">
                                <label>Date:</label>
                                <span>${escapeHtml(formattedDate)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Statut:</label>
                                <span class="status-badge ${statusClass}">${escapeHtml(statusText)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${paiement.proofUrl ? `
                    <div class="detail-section">
                        <h3><i class="fas fa-receipt"></i> Preuve de paiement</h3>
                        <div class="proof-container">
                            <img src="${proofUrl}" alt="Preuve de paiement" class="proof-image">
                            <p class="proof-hint">Cliquez sur l'image pour l'agrandir</p>
                            <a href="${proofUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
                                <i class="fas fa-external-link-alt"></i> Ouvrir dans un nouvel onglet
                            </a>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `);
        }
        
        document.getElementById('paiement-details-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        showMessage('Erreur lors du chargement des détails', 'error');
    }
}

async function updatePaiementStatus(paiementId, newStatus) {
    try {
        const response = await apiFetch(`/api/agence/paiements/${paiementId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: newStatus })
        });
        
        if (!response || !response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur lors de la mise à jour');
        }
        
        const result = await response.json();
        
        closeModal();
        showMessage(`Paiement ${newStatus === 'accepté' ? 'accepté' : 'refusé'} avec succès`, 'success');
        
        setTimeout(() => {
            loadPaiements();
            loadHistorique();
            loadBadgeCounts();
        }, 1000);
        
    } catch (error) {
        showMessage(error.message || 'Erreur lors de la mise à jour', 'error');
    }
}

window.loadPaiements = loadPaiements;
window.filterPaiements = filterPaiements;
window.viewPaiementDetails = viewPaiementDetails;
window.updatePaiementStatus = updatePaiementStatus;