function displayDemandes(demandes) {
    const container = document.getElementById('demandes-table-body');
    if (!container) return;
    
    if (!demandes || demandes.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Aucune demande disponible</p>
                        <p class="small">Les demandes apparaîtront ici</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = demandes.map(demande => {
        const date = new Date(demande.date || demande.createdAt);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        const demandeId = demande._id || '';
        const codeColis = escapeHtml(demande.codeColis || 'N/A');
        const fullName = escapeHtml(demande.fullName || 'N/A');
        const destination = escapeHtml(demande.destination || 'N/A');
        const typeColis = escapeHtml(demande.typeColis || 'N/A');
        const status = demande.status || 'en_attente';
        const prix = demande.prix || 0;
        const poidsDisplay = demande.poidsVolumeAjuste || demande.poidsReel || demande.poidOuTaille || 'N/A';
        
        const showAdjustButton = status === 'en_attente' || status === 'acceptee' || status === 'accepté';
        
        return `
            <tr data-demande-id="${demandeId}"
                data-code-colis="${escapeHtml(codeColis)}"
                data-status="${status}"
                data-prix="${prix}"
                data-poids="${escapeHtml(String(poidsDisplay))}">
                <td>${codeColis}</td>
                <td>${fullName}</td>
                <td>${destination}</td>
                <td>${typeColis}</td>
                <td>${escapeHtml(String(poidsDisplay))}</td>
                <td>${escapeHtml(formattedDate)}</td>
                <td>
                    <span class="status-badge status-${status}">
                        ${escapeHtml(getStatusText(status))}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" title="Voir détails">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-status" title="Changer statut">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${showAdjustButton ? `
                        <button class="btn-action btn-adjust" title="Ajuster le poids">
                            <i class="fas fa-balance-scale"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}
function displayTarifs() {
    const container = document.getElementById('destinations-table-body');
    if (!container) return;

    if (!currentTarifs || currentTarifs.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-route"></i>
                        <p>Aucun tarif configuré</p>
                        <p class="small">Ajoutez votre premier trajet en utilisant le formulaire ci-dessous</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = currentTarifs.map((tarif, index) => {
        const destination = escapeHtml(tarif.destination || 'N/A');
        const [villeDepart, villeArrivee] = destination.split(' - ').map(v => v.trim());
        
        const villeDepartSafe = escapeHtml(villeDepart || 'N/A');
        const villeArriveeSafe = escapeHtml(villeArrivee || 'N/A');
        const prixSafe = escapeHtml(tarif.prix || 0);
        const delaiSafe = escapeHtml(tarif.delai || 'N/A');
        
        return `
            <tr data-index="${index}">
                <td>${destination}</td>
                <td>${villeDepartSafe}</td>
                <td>${villeArriveeSafe}</td>
                <td>${prixSafe} USD</td>
                <td>${delaiSafe} jours</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function displayPaiements(paiements) {
    const container = document.getElementById('paiements-table-body');
    if (!container) return;
    
    if (!paiements || paiements.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-credit-card"></i>
                        <p>Aucun paiement disponible</p>
                        <p class="small">Les paiements apparaîtront ici</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = paiements.map(paiement => {
        const date = new Date(paiement.uploadedAt || paiement.createdAt);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
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
        const paiementId = escapeHtml(paiement._id || '');
        
        return `
            <tr data-paiement-id="${paiementId}">
                <td>${escapeHtml(formattedDate)}</td>
                <td>${codeColis}</td>
                <td>${clientName}</td>
                <td>${montant}</td>
                <td>${devise}</td>
                <td>
                    <span class="status-badge ${statusClass}">${escapeHtml(statusText)}</span>
                </td>
                <td>
                    <button class="btn-action btn-view" title="Voir détails">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function displayHistorique(historique) {
    const container = document.getElementById('historique-table-body');
    if (!container) return;
    
    if (!historique || historique.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>Aucun historique disponible</p>
                        <p class="small">L'historique apparaîtra ici</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = historique.map(item => {
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let typeText = item.type === 'demande' ? 'Demande' : 'Paiement';
        let typeIcon = item.type === 'demande' ? 'fa-box' : 'fa-credit-card';
        
        let statusText = 'N/A';
        let statusClass = 'status-en_attente';
        
        if (item.type === 'demande') {
            if (item.status === 'accepté') {
                statusText = 'Accepté';
                statusClass = 'status-livré';
            } else if (item.status === 'annulé') {
                statusText = 'Annulé';
                statusClass = 'status-annulé';
            } else if (item.status === 'livré') {
                statusText = 'Livré';
                statusClass = 'status-livré';
            }
        } else if (item.type === 'paiement') {
            if (item.status === 'accepté') {
                statusText = 'Accepté';
                statusClass = 'status-livré';
            } else if (item.status === 'refusé') {
                statusText = 'Refusé';
                statusClass = 'status-annulé';
            }
        }
        
        let montantDisplay = '';
        if (item.type === 'paiement') {
            montantDisplay = `${escapeHtml((item.montant || 0).toLocaleString())} ${escapeHtml(item.devise || 'USD')}`;
        } else if (item.type === 'demande') {
            montantDisplay = `${escapeHtml((item.montant || 0).toLocaleString())} FC`;
        }
        
        return `
            <tr>
                <td>
                    <div>
                        <span>${escapeHtml(typeText)}</span>
                    </div>
                </td>
                <td>${escapeHtml(item.codeColis || 'N/A')}</td>
                <td>${escapeHtml(item.nom || 'N/A')}</td>
                <td>${escapeHtml(formattedDate)}</td>
                <td>
                    ${item.type === 'paiement' ? 
                        `<span>${montantDisplay}</span>` : 
                        `<span>${montantDisplay}</span>`
                    }
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${escapeHtml(statusText)}</span>
                </td>
            </tr>
        `;
    }).join('');
}

window.displayDemandes = displayDemandes;
window.displayTarifs = displayTarifs;
window.displayPaiements = displayPaiements;
window.displayHistorique = displayHistorique;