import * as API from '../api/admin.api.js';

// ==================== AJOUT PAGINATION ====================
let currentPage = 1;
let isLoading = false;
let hasMore = true;
let allProofs = [];

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
    
    currentPage = 1;
    hasMore = true;
    allProofs = [];
    isLoading = false;

    try {
        const data = await API.loadProofsDataAPI(currentPage,30);
        
        if (data && data.proofs) {
            allProofs = data.proofs;
            currentProofs = allProofs;
            hasMore = data.hasMore;
        } else {
            allProofs = data || [];
            currentProofs = allProofs;
        }
        
        const container = document.getElementById('proofs-table-body');
        if (!container) {
            return;
        }
        
        displayProofs(allProofs, false); 

        const counter = document.getElementById('total-proofs');
        if (counter) counter.textContent = allProofs.length;

        setupFilters();
        
        setTimeout(() => {
            setupInfiniteScroll();
        }, 100);

    } catch (error) {
        const container = document.getElementById('proofs-table-body');
        if (container) {
            container.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Erreur de chargement</p>
                            <button onclick="loadProofsPage()" class="btn-retry">Réessayer</button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function displayProofs(proofs, append = false) {
    
    const container = document.getElementById('proofs-table-body');
    if (!container) return;
    
    if (!append) container.innerHTML = '';

    if (!proofs || proofs.length === 0) {
        if (!append) {
            container.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>Aucune preuve trouvée</p>
                        </div>
                    </td>
                </tr>
            `;
        }
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
                            title="Voir">
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
                                title="Remettre">
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
    if (filterBtn) filterBtn.onclick = filterProofsByDate;
}

function filterProofsByDate() {
    const startDate = document.getElementById('date-filter-start')?.value;
    const endDate = document.getElementById('date-filter-end')?.value;

    let proofsToShow = allProofs;
    if (startDate || endDate) {
        proofsToShow = allProofs.filter(proof => {
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
    }

    displayProofs(proofsToShow, false); 
    const counter = document.getElementById('total-proofs');
    if (counter) counter.textContent = proofsToShow.length;
}

function setupInfiniteScroll() {
    
    function checkScroll() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        const scrollPosition = scrollY + windowHeight;
        const distanceFromBottom = documentHeight - scrollPosition;
        
        if (distanceFromBottom < 200) {
            if (!isLoading && hasMore) {
                loadMoreProofs();
            }
        }
    }
    
    window.addEventListener('scroll', checkScroll);
    setTimeout(checkScroll, 500);
}

async function loadMoreProofs() {
    if (isLoading || !hasMore) {
        return;
    }
    
    isLoading = true;
    currentPage++;
    
    const data = await API.loadProofsDataAPI(currentPage, 30);
    
    if (data.proofs && data.proofs.length > 0) {
        allProofs = [...allProofs, ...data.proofs];
        currentProofs = allProofs;
        
        displayProofs(data.proofs, true); 
        
        hasMore = data.hasMore;
        
        const counter = document.getElementById('total-proofs');
        if (counter) counter.textContent = allProofs.length;
    } else {
        hasMore = false;
    }
    
    isLoading = false;
}

window.filterProofsByDate = filterProofsByDate;
window.loadProofsPage = loadProofsPage;
window.loadMoreProofs = loadMoreProofs;