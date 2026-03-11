// ==================== GESTION DE LA SÉLECTION D'AGENCE ====================

// Variables dynamiques pour les taux (seront chargées depuis l'API)
let TAUX_CONVERSION = {
    USD: 1,
    CDF: null,
    ZAR: null
};

const SYMBOLES_DEVISES = {
    USD: '$',
    CDF: 'FC',
    ZAR: 'R'
};

// ==================== CHARGER LES TAUX =========================
async function loadExchangeRates() {
    try {
        const response = await apiFetch('/api/client/exchange-rates');
        
        if (!response) {
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            if (data.data.FC !== null) TAUX_CONVERSION.CDF = data.data.FC;
            if (data.data.ZAR !== null) TAUX_CONVERSION.ZAR = data.data.ZAR;
        }
    } catch (error) {
        // Silence
    }
}

async function showAgencesModal(destination) {
    try {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'agencesModal';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; width: 90%; background: white; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #004732; font-size: 1.1rem; font-weight: 500;">
                        Choisissez votre agence
                    </h3>
                    <button onclick="document.getElementById('agencesModal').remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #666;">&times;</button>
                </div>
                <div style="padding: 2rem; text-align: center;">
                    <i class="fas fa-spinner fa-spin" style="color: #004732;"></i>
                    <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">Chargement...</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const response = await apiFetch(`/api/client/agences-by-destination?destination=${encodeURIComponent(destination)}`);
        
        if (!response.ok) throw new Error('Erreur de chargement');
        
        const data = await response.json();
        
        if (!data.success || data.data.length === 0) {
            modal.querySelector('.modal-content').innerHTML = `
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #004732; font-size: 1.1rem;">Agences</h3>
                    <button onclick="document.getElementById('agencesModal').remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #666;">&times;</button>
                </div>
                <div style="padding: 2rem; text-align: center;">
                    <p style="color: #666; font-size: 0.9rem;">Aucune agence disponible</p>
                    <button onclick="document.getElementById('agencesModal').remove()" style="margin-top: 1rem; padding: 0.4rem 1.2rem; background: #f0f0f0; border: none; border-radius: 3px; cursor: pointer; font-size: 0.85rem;">Fermer</button>
                </div>
            `;
            return;
        }
        
        displayAgencesInModal(modal, data.data);
        
    } catch (error) {
        const modal = document.getElementById('agencesModal');
        if (modal) {
            modal.querySelector('.modal-content').innerHTML = `
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #004732; font-size: 1.1rem;">Erreur</h3>
                    <button onclick="document.getElementById('agencesModal').remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #666;">&times;</button>
                </div>
                <div style="padding: 2rem; text-align: center;">
                    <p style="color: #dc3545; font-size: 0.9rem;">Erreur de chargement</p>
                    <button onclick="document.getElementById('agencesModal').remove()" style="margin-top: 1rem; padding: 0.4rem 1.2rem; background: #f0f0f0; border: none; border-radius: 3px; cursor: pointer; font-size: 0.85rem;">Fermer</button>
                </div>
            `;
        }
    }
}

function displayAgencesInModal(modal, agences) {
    const devise = document.getElementById('as-devise').value;
    const poids = parseFloat(document.getElementById('as-poids').value) || 1;
    
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; color: #004732; font-size: 1.1rem;">Sélectionner une agence</h3>
            <button onclick="document.getElementById('agencesModal').remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #666;">&times;</button>
        </div>
        
        <div style="padding: 1rem; max-height: 350px; overflow-y: auto;">
            ${agences.map(agence => {
                const prixTotal = agence.prix * poids;
                const prixConverti = calculerPrixConverti(prixTotal, devise);
                const prixFormate = formaterPrixAvecDevise(prixConverti, devise);
                
                return `
                    <div onclick="selectAndSubmitAgence('${escapeHtml(agence._id)}', ${agence.prix}, '${escapeHtml(agence.nom)}')" 
                         style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; background: white; display: flex; align-items: center; gap: 0.75rem; transition: all 0.2s;"
                         onmouseover="this.style.borderColor='#004732'; this.style.backgroundColor='#f9f9f9'"
                         onmouseout="this.style.borderColor='#e0e0e0'; this.style.backgroundColor='white'">
                        
                        <img src="${agence.logo || '/images/default-agence.png'}" 
                             style="width: 35px; height: 35px; border-radius: 3px; object-fit: cover; border: 1px solid #e0e0e0;">
                        
                        <div style="flex: 1;">
                            <div style="font-weight: 500; color: #004732; font-size: 0.9rem;">${escapeHtml(agence.nom)}</div>
                            <div style="font-size: 0.8rem; color: #666; display: flex; gap: 1rem; margin-top: 0.25rem;">
                                <span><i class="fas fa-map-marker-alt" style="color: #C59B33; width: 12px;"></i> ${escapeHtml(agence.ville)}</span>
                                <span><i class="fas fa-clock" style="color: #C59B33; width: 12px;"></i> ${escapeHtml(agence.delai)}</span>
                            </div>
                        </div>
                        
                        <div style="background: #004732; color: white; padding: 0.3rem 0.6rem; border-radius: 3px; font-size: 0.8rem; font-weight: 500;">
                            ${prixFormate}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        
        <div style="padding: 0.75rem 1.5rem; border-top: 1px solid #e0e0e0; text-align: right;">
            <button onclick="document.getElementById('agencesModal').remove()" style="padding: 0.4rem 1.2rem; background: #f0f0f0; border: none; border-radius: 3px; cursor: pointer; font-size: 0.85rem;">Annuler</button>
        </div>
    `;
}
async function selectAndSubmitAgence(agenceId, prixParKg, agenceNom) {
    document.getElementById('selected-agence-id').value = agenceId;
    document.getElementById('agencesModal').remove();
    
    const formData = {
        fullName: escapeHtml(document.getElementById('as-nom').value),
        receveur: escapeHtml(document.getElementById('as-receveur').value),
        email: escapeHtml(document.getElementById('as-email').value),
        telephone: escapeHtml(document.getElementById('as-telephone').value),
        typeColis: escapeHtml(document.getElementById('as-typeColis').value),
        poidOuTaille: escapeHtml(document.getElementById('as-poids').value + " kg"),
        destination: escapeHtml(document.getElementById('as-destination').value),
        devise: escapeHtml(document.getElementById('as-devise').value),
        description: escapeHtml(document.getElementById('as-description').value || ''),
        agenceId: agenceId
    };

    const submitBtn = document.querySelector('.submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

    
    try {
        const response = await apiFetch('/api/client/agence/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response || !response.ok) {
            let errorText = await response.text().catch(() => 'Erreur inconnue');
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText };
            }

            if (response && response.status === 401) {
                showPopup('Session expirée', 'error');
                localStorage.removeItem('token');
                setTimeout(() => window.location.href = '/login', 2000);
                throw new Error('Session expirée');
            }

            throw new Error(errorData.message || `Erreur ${response ? response.status : 'inconnue'}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Erreur inconnue');
        }

        const poids = parseFloat(document.getElementById('as-poids').value) || 1;
        const prixTotalUSD = prixParKg * poids;
        const devise = formData.devise;
        const prixConverti = calculerPrixConverti(prixTotalUSD, devise);

        await showAgenceConfirmationModal({
            codeColis: data.demande?.codeColis || 'En attente',
            prix: prixConverti,
            devise: devise,
            poids: poids,
            prixParKg: prixParKg,
            delai: data.demande?.delai || data.delai || 'Non spécifié',
            destination: formData.destination,
            agenceNom: agenceNom
        });

        addNotificationToPanel(`Demande créée pour ${formData.destination}`, 'agence');
        
        const form = document.getElementById('agence-seule-form');
        form.reset();
        document.getElementById('selected-agence-id').value = '';

        setTimeout(() => {
            const requestsNav = document.querySelector('.nav-item[data-page="requests"]');
            if (requestsNav) requestsNav.click();
            loadClientRequests();
        }, 2000);

    } catch (error) {
        showPopup(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}
async function handleAgenceSubmit(e) {
    e.preventDefault();

    const requiredFields = [
        'as-nom', 'as-email', 'as-telephone', 'as-receveur',
        'as-typeColis', 'as-poids', 'as-destination', 'as-devise'
    ];

    let isValid = true;
    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element || !element.value.trim()) {
            isValid = false;
            element.style.borderColor = '#dc3545';
        } else {
            element.style.borderColor = '';
        }
    });

    if (!isValid) {
        showPopup('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    const destination = document.getElementById('as-destination').value;
    await showAgencesModal(destination);
}

function calculerPrixConverti(prixUSD, devise) {
    if (devise === 'USD') return prixUSD.toFixed(2);
    
    const taux = TAUX_CONVERSION[devise === 'CDF' ? 'CDF' : devise];
    if (!taux || taux === null) {
        return prixUSD.toFixed(2);
    }
    
    return (prixUSD * taux).toFixed(2);
}

function formaterPrixAvecDevise(prix, devise) {
    const symbole = SYMBOLES_DEVISES[devise] || devise;
    return `${parseFloat(prix).toLocaleString()} ${symbole}`;
}

function showAgenceConfirmationModal(demande) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';

        const prixFormate = formaterPrixAvecDevise(demande.prix, demande.devise);

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; width: 90%; background: white; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #e0e0e0;">
                    <h3 style="margin: 0; color: #004732; font-size: 1rem; font-weight: 500;">Demande envoyée</h3>
                </div>
                <div style="padding: 1.5rem;">
                    <div style="text-align: center; margin-bottom: 1rem;">
                        <i class="fas fa-check-circle" style="color: #28a745; font-size: 2rem;"></i>
                    </div>
                    <p style="margin: 0.25rem 0; color: #333; font-size: 0.9rem;"><strong>Code:</strong> ${escapeHtml(demande.codeColis)}</p>
                    <p style="margin: 0.25rem 0; color: #333; font-size: 0.9rem;"><strong>Destination:</strong> ${escapeHtml(demande.destination)}</p>
                    <p style="margin: 0.25rem 0; color: #333; font-size: 0.9rem;"><strong>Agence:</strong> ${escapeHtml(demande.agenceNom)}</p>
                    <p style="margin: 0.25rem 0; color: #333; font-size: 0.9rem;"><strong>Total:</strong> ${escapeHtml(prixFormate)}</p>
                </div>
                <div style="padding: 1rem 1.5rem; border-top: 1px solid #e0e0e0; text-align: right;">
                    <button id="confirmAgenceOkBtn" style="padding: 0.4rem 1.2rem; background: #004732; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.85rem;">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('confirmAgenceOkBtn').addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
    });
}

function selectRequestType(type) {
    document.querySelectorAll('.type-card').forEach(card => {
        card.classList.remove('active');
    });

    const selectedCard = document.querySelector(`.type-card[data-type="${escapeHtml(type)}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }

    document.querySelectorAll('.request-form').forEach(form => {
        form.classList.remove('active');
    });

    const selectedForm = document.getElementById(`${escapeHtml(type)}-form`);
    if (selectedForm) {
        selectedForm.classList.add('active');
    }
}

function setupRequestForms() {
    const agenceForm = document.getElementById('agence-seule-form');
    if (agenceForm) {
        agenceForm.addEventListener('submit', handleAgenceSubmit);
    }

    document.querySelectorAll('.select-type-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const type = this.getAttribute('data-type');
            selectRequestType(type);
        });
    });

    const cancelBtn = document.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            showConfirmPopup('Annuler ?').then(result => {
                if (result) {
                    const activeForm = document.querySelector('.request-form.active');
                    if (activeForm) activeForm.reset();
                    document.getElementById('selected-agence-id').value = '';
                    showPopup('Formulaire réinitialisé', 'info');
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Charger les taux au démarrage
    await loadExchangeRates();
    
    const form = document.getElementById('agence-seule-form');
    if (form) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'selected-agence-id';
        hiddenInput.value = '';
        form.appendChild(hiddenInput);
    }
});