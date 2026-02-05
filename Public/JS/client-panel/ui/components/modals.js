function setupModals() {
    const modal = document.getElementById('requestModal');
    const closeModal = document.querySelector('.close-modal');
    const closeBtn = document.querySelector('.close-btn');

    if (closeModal) closeModal.addEventListener('click', () => modal && (modal.style.display = 'none'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal && (modal.style.display = 'none'));
    if (modal) window.addEventListener('click', (e) => e.target === modal && (modal.style.display = 'none'));
}

function attachViewButtonsEvents() {
    document.querySelectorAll('.view-request-btn').forEach(button => {
        button.addEventListener('click', function () {
            const requestId = this.getAttribute('data-id');
            const requestType = this.getAttribute('data-type') || 'agence';
            showRequestDetails(requestId, requestType);
        });
    });
}

async function showRequestDetails(requestId, requestType = 'agence') {
    try {
        let endpoint = '';

        if (requestType === 'agence') {
            endpoint = `/api/client/agence-request/${requestId}`;
        }

        const response = await apiFetch(endpoint);
        if (!response || !response.ok) throw new Error('Erreur de chargement des détails');
        const data = await response.json();

        if (requestType === 'agence') {
            displayAgenceRequestModal(data.demande || data.request);
        }

    } catch (error) {
        
        showPopup('Erreur de chargement des détails', 'error');
    }
}

function displayAgenceRequestModal(request) {
    const modal = document.getElementById('requestModal');
    const modalContent = document.getElementById('modalContent');
    const modalRequestCode = document.getElementById('modalRequestCode');

    if (!modal || !modalContent) return;

    modalRequestCode.textContent = `Code: ${escapeHtml(request.codeColis || 'En attente')}`;

    const prixParKgUSD = request.prix || 0;
    const devise = escapeHtml(request.devise || 'USD');

    let poidsKg = 1;
    if (request.poidsVolumeAjuste) {
        const match = request.poidsVolumeAjuste.match(/(\d+\.?\d*)/);
        poidsKg = match ? parseFloat(match[1]) : 1;
    } else if (request.poidOuTaille) {
        const match = request.poidOuTaille.match(/(\d+\.?\d*)/);
        poidsKg = match ? parseFloat(match[1]) : 1;
    }

    const prixTotalUSD = prixParKgUSD * poidsKg;

    const poidsDisplay = request.poidsVolumeAjuste ?
        `${escapeHtml(request.poidsVolumeAjuste)} (réel)` :
        escapeHtml(request.poidOuTaille || 'Non spécifié');

    modalContent.innerHTML = sanitizeHtml(`
        <div class="profile-header">
            <div class="profile-info">
                <h3>Détails de la demande Agence</h3>
                <p class="profile-role">${escapeHtml(request.codeColis || 'En attente')}</p>
            </div>
        </div>
        
        <div class="profile-sections">
            <div class="profile-section">
                <h4>Informations Générales</h4>
                <div class="profile-details-grid">
                    <div class="detail-item">
                        <label>Code de suivi:</label>
                        <span>${escapeHtml(request.codeColis || 'En attente')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Date de création:</label>
                        <span>${escapeHtml(formatDate(request.date))}</span>
                    </div>
                    <div class="detail-item">
                        <label>Statut:</label>
                        <span class="status-badge ${escapeHtml(getStatusClass(request.status))}">${escapeHtml(getStatusText(request.status))}</span>
                    </div>
                    <div class="detail-item">
                        <label>Délai:</label>
                        <span>${escapeHtml(request.delai || 'Non spécifié')}</span>
                    </div>
                </div>
            </div>

            <div class="profile-section">
                <h4> Tarification</h4>           
                    <div class="devise-selector">
                        <label for="modal-devise">
                            <i class="fas fa-exchange-alt"></i> Convertir en:
                        </label>
                        <select id="modal-devise" class="devise-select">
                            <option value="USD" ${devise === 'USD' ? 'selected' : ''}>$ Dollar (USD)</option>
                            <option value="CDF" ${devise === 'CDF' ? 'selected' : ''}>FC Franc Congolais</option>
                            <option value="ZAR" ${devise === 'ZAR' ? 'selected' : ''}>R Rand Sud-Africain</option>
                        </select>
                    </div>
                    
                    <div class="prix-converti">
                        <span class="prix-label">Prix total converti:</span>
                        <span class="prix-value" id="modal-prix-converti">${escapeHtml(formaterPrixAvecDevise(calculerPrixConverti(prixTotalUSD, devise), devise))}</span>
                    </div>
                    
                    ${request.prixAjuste && request.prixAjuste !== request.prix ? `
                    <div class="prix-ajuste-info">
                        <i class="fas fa-info-circle"></i>
                        <span>Prix final après pesée réelle: <strong id="modal-prix-ajuste">${escapeHtml(formaterPrixAvecDevise(calculerPrixConverti(request.prixAjuste, devise), devise))}</strong></span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="profile-section">
                <h4> Informations Client</h4>
                <div class="profile-details-grid">
                    <div class="detail-item">
                        <label>Nom complet:</label>
                        <span>${escapeHtml(request.fullName || 'Non spécifié')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email:</label>
                        <span>${escapeHtml(request.email || 'Non spécifié')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Téléphone:</label>
                        <span>${escapeHtml(request.telephone || 'Non spécifié')}</span>
                    </div>
                </div>
            </div>

            <div class="profile-section">
                <h4>Détails Agence</h4>
                <div class="profile-details-grid">
                    <div class="detail-item">
                        <label>Destination:</label>
                        <span>${escapeHtml(request.destination || 'Non spécifié')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Type de colis:</label>
                        <span>${escapeHtml(request.typeColis || 'Non spécifié')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Poids:</label>
                        <span>${poidsDisplay}</span>
                    </div>
                </div>
            </div>

            <div class="profile-section">
                <h4> Description</h4>
                <div class="description-box">
                    <p>${escapeHtml(request.description || 'Aucune description fournie')}</p>
                </div>
            </div>

            ${request.photoduColis ? `
            <div class="profile-section">
                <h4> Photo du Colis</h4>
                <div class="photo-container">
                    <img src="${sanitizeUrl(request.photoduColis)}" alt="Photo du colis" class="modal-image">
                </div>
            </div>
            ` : ''}
        </div>
    `);

    modal.style.display = 'flex';

    const deviseSelect = document.getElementById('modal-devise');
    if (deviseSelect) {
        deviseSelect.addEventListener('change', function () {
            const nouvelleDevise = this.value;
            const prixTotalConverti = calculerPrixConverti(prixTotalUSD, nouvelleDevise);
            document.getElementById('modal-prix-converti').textContent = escapeHtml(formaterPrixAvecDevise(prixTotalConverti, nouvelleDevise));

            if (request.prixAjuste && request.prixAjuste !== request.prix) {
                const prixAjusteConverti = calculerPrixConverti(request.prixAjuste, nouvelleDevise);
                const ajusteElement = document.getElementById('modal-prix-ajuste');
                if (ajusteElement) {
                    ajusteElement.textContent = escapeHtml(formaterPrixAvecDevise(prixAjusteConverti, nouvelleDevise));
                }
            }
        });
    }
}