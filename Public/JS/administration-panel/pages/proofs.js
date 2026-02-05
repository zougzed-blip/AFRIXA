// pages/proofs.js
import * as API from '../api/admin.api.js';

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function safeUrl(url) {
    if (!url) return '';
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) return '';
        return escapeHtml(url);
    } catch {
        return '';
    }
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

function getMethodIcon(method) {
    const icons = {
        'agencemethod': 'fa-handshake',
        'mpsa': 'fa-mobile-alt',
        'orange': 'fa-mobile-alt',
        'bank': 'fa-university'
    };
    return icons[method] || 'fa-credit-card';
}

function getMethodLabel(method) {
    const labels = {
        'agencemethod': 'Face to face',
        'mpsa': 'MPESA',
        'orange': 'Orange Money',
        'bank': 'Banque'
    };
    return labels[method] || method || 'N/A';
}

let currentProofs = [];

export async function loadProofsPage() {
   

    try {
        const proofs = await API.loadProofsDataAPI();
        currentProofs = proofs || [];
        
        const container = document.getElementById('proofs-table-body');
        
        if (!container) return;
        
        displayProofs(currentProofs);

        const counter = document.getElementById('total-proofs');
        if (counter) {
            counter.textContent = currentProofs.length;
        }

        localStorage.setItem('lastProofsViewed', new Date().toISOString());

        setupFilters();

    } catch (error) {
        const container = document.getElementById('proofs-table-body');
        if (container) {
            container.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Erreur de chargement des preuves</p>
                            <button onclick="loadProofsPage()" class="btn-retry">Réessayer</button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function displayProofs(proofs) {
    const container = document.getElementById('proofs-table-body');
    if (!container) return;
    
    container.innerHTML = '';

    if (!proofs || proofs.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Aucune preuve de paiement trouvée</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    proofs.forEach(proof => {
        if (!proof || !proof._id) return;

        const clientName = escapeHtml(proof.clientName || 'N/A');
        const clientEmail = proof.user?.email ? escapeHtml(proof.user.email) : null;
        const codeColis = escapeHtml(proof.codeColis || 'N/A');
        const montant = proof.montant ? Number(proof.montant).toLocaleString('fr-FR') : '0';
        const devise = escapeHtml(proof.devise || 'FC');
        const method = getMethodLabel(proof.method);
        const methodIcon = getMethodIcon(proof.method);
        const proofId = escapeHtml(proof._id);
        const proofUrl = safeUrl(proof.proofUrl);
        const formattedDate = safeDate(proof.uploadedAt);
        
        let statusText = 'En attente';
        let statusClass = 'en_attente';
        
        if (proof.status === 'accepté') {
            statusText = 'Accepté';
            statusClass = 'accepté';
        } else if (proof.status === 'refusé') {
            statusText = 'Refusé';
            statusClass = 'refusé';
        }

        const row = document.createElement('tr');
        row.setAttribute('data-date', proof.uploadedAt);
        row.innerHTML = `
            <td>
                <div class="client-info">
                    <strong>${clientName}</strong>
                    ${clientEmail ? `<br><small>${clientEmail}</small>` : ''}
                </div>
            </td>
            <td><strong style="color: var(--vert-fonce);">${codeColis}</strong></td>
            <td><span class="montant-cell">${montant} ${devise}</span></td>
            <td><span class="devise-badge">${devise}</span></td>
            <td>
                <div class="method-cell">
                    <i class="fas ${methodIcon}"></i>
                    <span>${escapeHtml(method)}</span>
                </div>
            </td>
            <td><span class="status-badge status-${statusClass}">${statusText}</span></td>
            <td>${formattedDate}</td>
            <td>
                <div class="proof-actions">
                    <button class="btn-action btn-view" 
                            data-action="view-proof" 
                            data-proof-id="${proofId}"
                            data-proof-url="${proofUrl}"
                            title="Voir la preuve">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${proof.status === 'en_attente' ? `
                        <button class="btn-action btn-accept" 
                                data-action="accept-proof" 
                                data-proof-id="${proofId}"
                                title="Accepter">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action btn-refuse" 
                                data-action="refuse-proof" 
                                data-proof-id="${proofId}"
                                title="Refuser">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    ${proof.status && proof.status !== 'en_attente' ? `
                        <button class="btn-action btn-reset" 
                                data-action="reset-proof" 
                                data-proof-id="${proofId}"
                                title="Remettre en attente">
                            <i class="fas fa-redo"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        container.appendChild(row);
    });
}

function setupFilters() {
    const filterBtn = document.getElementById('filter-proofs-btn');
    if (filterBtn) {
        filterBtn.onclick = filterProofsByDate;
    }
}

function filterProofsByDate() {
    const startDate = document.getElementById('date-filter-start')?.value;
    const endDate = document.getElementById('date-filter-end')?.value;

    if (!startDate && !endDate) {
        displayProofs(currentProofs);
        return;
    }

    const filtered = currentProofs.filter(proof => {
        if (!proof.uploadedAt) return false;
        
        const proofDate = new Date(proof.uploadedAt);
        if (isNaN(proofDate.getTime())) return false;

        const proofTime = proofDate.getTime();
        const startTime = startDate ? new Date(startDate).getTime() : null;
        const endTime = endDate ? new Date(endDate).getTime() + 86400000 : null;

        let match = true;
        if (startTime && proofTime < startTime) match = false;
        if (endTime && proofTime > endTime) match = false;
        
        return match;
    });

    displayProofs(filtered);
    
    const counter = document.getElementById('total-proofs');
    if (counter) {
        counter.textContent = filtered.length;
    }
}

window.filterProofsByDate = filterProofsByDate;
window.loadProofsPage = loadProofsPage;