async function loadClientRequests() {
    try {
        const response = await apiFetch('/api/client/all-requests');
        if (response && response.ok) {
            const data = await response.json();
            const pendingRequests = data.requests.filter(r =>
                r.status === 'en_attente' ||
                r.status === 'en_cours' ||
                r.status === 'accepté' ||
                r.status === 'accepté_par_client'
            );
            displayRequests(pendingRequests);

            const activeRequests = pendingRequests.filter(r =>
                r.status === 'en_attente' ||
                r.status === 'en_cours' ||
                r.status === 'accepté' ||
                r.status === 'accepté_par_client'
            ).length;
            updateRequestsBadge(activeRequests);
        } else {
            throw new Error('Erreur de chargement des demandes');
        }
    } catch (error) {
        console.error('Erreur demandes:', error);
        showPopup('Erreur de chargement des demandes', 'error');
    }
}

function displayRequests(requests) {
    const container = document.getElementById('requests-list');
    if (!container) return;

    if (!requests || requests.length === 0) {
        container.innerHTML = sanitizeHtml(`
            <div class="empty-state">
                <i class="fas fa-inbox fa-3x"></i>
                <h3>Aucune demande trouvée</h3>
                <p>Commencez par créer votre première demande de transport</p>
                <button class="btn btn-primary" data-page="new-request">
                    <i class="fas fa-plus"></i> Créer une Demande
                </button>
            </div>
        `);

        const createBtn = container.querySelector('button[data-page="new-request"]');
        if (createBtn) {
            createBtn.addEventListener('click', function () {
                const nav = document.querySelector(`.nav-item[data-page="new-request"]`);
                if (nav) nav.click();
            });
        }
        return;
    }

    const total = requests.length;
    const active = requests.filter(r => r.status === 'en_cours' || r.status === 'accepté' || r.status === 'accepté_par_client').length;
    const pending = requests.filter(r => r.status === 'en_attente').length;

    document.getElementById('total-requests-count').textContent = escapeHtml(total.toString());
    document.getElementById('active-requests-count').textContent = escapeHtml(active.toString());
    document.getElementById('pending-requests-count').textContent = escapeHtml(pending.toString());

    container.innerHTML = requests.map(request => {
        const icon = 'fa-warehouse';
        const typeLabel = 'Agence';

        const routeInfo = `Destination: ${escapeHtml(request.destination || 'Non spécifié')}`;

        let poidsInfo = '';
        if (request.poidsVolumeAjuste) {
            poidsInfo = `${escapeHtml(request.poidsVolumeAjuste)} (réel)`;
        } else {
            poidsInfo = escapeHtml(request.poidOuTaille || 'Non spécifié');
        }

        const requestId = escapeHtml(request._id || '');
        const requestType = 'agence';

        return sanitizeHtml(`
            <div class="request-item">
                <div class="request-header">
                    <div class="request-info">
                        <h3>
                            ${escapeHtml(typeLabel)}
                            <span class="request-code">${escapeHtml(request.codeColis || 'En attente')}</span>
                        </h3>
                    </div>
                    <div class="request-date">${escapeHtml(formatDate(request.date))}</div>
                </div>
                <div class="request-details">
                    <div class="detail">
                        <span class="detail-label">Destination</span>
                        <span class="detail-value">${routeInfo}</span>
                    </div>
                    <div class="detail">
                        <span class="detail-label">Type de colis</span>
                        <span class="detail-value">${escapeHtml(request.typeColis || 'Non spécifié')}</span>
                    </div>
                </div>
                <div class="request-footer">
                    <div class="status-badge ${escapeHtml(getStatusClass(request.status))}">
                        <i class="fas fa-${escapeHtml(getStatusIcon(request.status))}"></i>
                        ${escapeHtml(getStatusText(request.status))}
                    </div>
                    <button class="btn btn-outline btn-sm view-request-btn" data-id="${requestId}" data-type="${requestType}">
                        <i class="fas fa-eye"></i> Voir Détails
                    </button>
                </div>
            </div>
        `);
    }).join('');

    attachViewButtonsEvents();
    setupRequestsSearch();
}

function updateRequestsBadge(count) {
    const badge = document.getElementById('requests-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = escapeHtml(count.toString());
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function setupRequestsSearch() {
    const searchInput = document.getElementById('searchRequests');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase().trim();
        const requestItems = document.querySelectorAll('.request-item');

        requestItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    });
}