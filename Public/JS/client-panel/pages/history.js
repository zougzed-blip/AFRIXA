async function loadClientHistory() {
    try {
        const response = await apiFetch('/api/client/all-history');
        if (response && response.ok) {
            const data = await response.json();
            const completedRequests = data.requests.filter(r =>
                r.status === 'refusé' ||
                r.status === 'livré' ||
                r.status === 'annulé' ||
                r.status === 'refusé_par_client'
            );
            displayHistory(completedRequests);
        } else {
            throw new Error('Erreur de chargement de l\'historique');
        }
    } catch (error) {
        
        showPopup('Erreur de chargement de l\'historique', 'error');
    }
}

function displayHistory(requests) {
    const container = document.getElementById('history-list');
    if (!container) return;

    if (!requests || requests.length === 0) {
        container.innerHTML = sanitizeHtml(`
            <div class="empty-state">
                <i class="fas fa-history fa-3x"></i>
                <h3>Aucun historique trouvé</h3>
                <p>Votre historique de demandes apparaîtra ici</p>
            </div>
        `);
        return;
    }

    container.innerHTML = requests.map(request => {
        const ratingStars = request.rating ? generateRatingStars(request.rating) : '';

        let icon = 'fa-warehouse';
        let typeLabel = 'Agence';

        let routeInfo = '';
        if (request.type === 'agence') {
            routeInfo = `Destination: ${escapeHtml(request.destination || 'Non spécifié')}`;
        }

        let poidsInfo = '';
        if (request.type === 'agence') {
            if (request.poidsVolumeAjuste) {
                poidsInfo = `${escapeHtml(request.poidsVolumeAjuste)} (réel)`;
            } else {
                poidsInfo = escapeHtml(request.poidOuTaille || 'Non spécifié');
            }
        }

        const requestId = escapeHtml(request._id || '');
        const requestType = escapeHtml(request.type || 'agence');

        return sanitizeHtml(`
            <div class="history-item">
                <div class="history-header">
                    <div class="history-info">
                        <h3>                          
                            ${escapeHtml(typeLabel)}
                            <span class="history-code">${escapeHtml(request.codeColis || 'N/A')}</span>
                        </h3>
                    </div>
                    <div class="history-date">${escapeHtml(formatDate(request.date))}</div>
                </div>
                <div class="history-details">
                    <div class="detail">
                        <span class="detail-label">Destination</span>
                        <span class="detail-value">${routeInfo}</span>
                    </div>
                    <div class="detail">
                        <span class="detail-label">Type de colis</span>
                        <span class="detail-value">${escapeHtml(request.typeColis || 'Non spécifié')}</span>
                    </div>
                    <div class="detail">
                        <span class="detail-label">Statut final</span>
                        <span class="detail-value ${escapeHtml(getStatusClass(request.status))}">${escapeHtml(getStatusText(request.status))}</span>
                    </div>
                </div>
                <div class="history-footer">
                    ${request.status === 'livré' ? (
                request.rating ? `
                        <div class="rating">
                            ${ratingStars}
                            <span>${escapeHtml(request.rating)}/5</span>
                        </div>
                        ` : `
                        <div class="rating-system" data-request-id="${requestId}" data-type="${requestType}">
                            <span class="rating-label">Évaluez cette livraison:</span>
                            <div class="stars-container">
                                <i class="fas fa-star star" data-rating="1"></i>
                                <i class="fas fa-star star" data-rating="2"></i>
                                <i class="fas fa-star star" data-rating="3"></i>
                                <i class="fas fa-star star" data-rating="4"></i>
                                <i class="fas fa-star star" data-rating="5"></i>
                            </div>
                        </div>`
            ) : `<div class="status-message">${escapeHtml(request.status === 'refusé' ? 'Demande refusée' : 'Demande annulée')}</div>`}
                    <button class="btn btn-outline btn-sm view-request-btn" data-id="${requestId}" data-type="${requestType}">
                        <i class="fas fa-eye"></i> Voir Détails
                    </button>
                </div>
            </div>
        `);
    }).join('');

    attachViewButtonsEvents();
    if (requests.some(r => r.status === 'livré' && !r.rating)) setupHistoryRating();
}

function generateRatingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? 
            '<i class="fas fa-star"></i>' :
            '<i class="fas fa-star fa-star-empty"></i>';
    }
    return stars;
}

function setupHistoryRating() {
    document.querySelectorAll('.rating-system').forEach(system => {
        const stars = system.querySelectorAll('.star');
        const requestId = system.getAttribute('data-request-id');
        const requestType = system.getAttribute('data-type');
        let selectedRating = 0;

        stars.forEach(star => {
            star.addEventListener('click', async function () {
                selectedRating = parseInt(this.getAttribute('data-rating'));
                stars.forEach((s, index) => {
                    if (index < selectedRating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });

                stars.forEach(s => s.style.pointerEvents = 'none');

                try {
                    await submitRating(requestId, selectedRating, requestType);
                } catch (error) {
                    showPopup(error.message, 'error');
                    stars.forEach(s => s.style.pointerEvents = 'auto');
                }
            });

            star.addEventListener('mouseover', function () {
                const rating = parseInt(this.getAttribute('data-rating'));
                stars.forEach((s, index) => {
                    if (index < rating) s.style.color = 'var(--dore)';
                });
            });

            star.addEventListener('mouseout', function () {
                stars.forEach((s, index) => {
                    if (!s.classList.contains('active')) {
                        s.style.color = index < selectedRating ? 'var(--dore)' : 'var(--gris-moyen)';
                    }
                });
            });
        });
    });
}

async function submitRating(requestId, rating, requestType = 'agence') {
    let endpoint = '';
    if (requestType === 'agence') {
        endpoint = `/api/client/agence-request/${requestId}/rate`;
    }

    const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
    });

    if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'évaluation');
    }

    const data = await response.json();

    if (data.success) {
        showPopup('Merci pour votre évaluation!', 'success');
        loadClientHistory();
    } else {
        throw new Error(data.message || 'Erreur inconnue');
    }
}