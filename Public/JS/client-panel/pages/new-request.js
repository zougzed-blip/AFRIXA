async function handleAgenceSubmit(e) {
    e.preventDefault();

    

    const requiredFields = [
        'as-nom', 'as-email', 'as-telephone',
        'as-typeColis', 'as-poids', 'as-destination', 'as-devise'
    ];

    let isValid = true;
    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element || !element.value.trim()) {
            isValid = false;
            element.style.borderColor = 'var(--danger)';
            
        } else {
            element.style.borderColor = '';
        }
    });

    if (!isValid) {
        showPopup('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    const formData = {
        fullName: escapeHtml(document.getElementById('as-nom').value),
        email: escapeHtml(document.getElementById('as-email').value),
        telephone: escapeHtml(document.getElementById('as-telephone').value),
        typeColis: escapeHtml(document.getElementById('as-typeColis').value),
        poidOuTaille: escapeHtml(document.getElementById('as-poids').value + " kg"),
        destination: escapeHtml(document.getElementById('as-destination').value),
        devise: escapeHtml(document.getElementById('as-devise').value),
        description: escapeHtml(document.getElementById('as-description').value || '')
    };

    

    const submitBtn = e.target.querySelector('.submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

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
                showPopup('Session expirée. Veuillez vous reconnecter.', 'error');
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

        const prixParKg = data.demande?.prix || data.prix || 0
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
            destination: formData.destination
        });

        addNotificationToPanel(`Demande d'agence créée pour ${formData.destination}. Code: ${data.demande?.codeColis || 'En attente'}`, 'agence');

        e.target.reset();

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

const TAUX_CONVERSION = {
    USD: 1,
    CDF: 2500,
    ZAR: 17
};

const SYMBOLES_DEVISES = {
    USD: '$',
    CDF: 'FC',
    ZAR: 'R'
};

function calculerPrixConverti(prixUSD, devise) {
    const taux = TAUX_CONVERSION[devise] || 1;
    return (prixUSD * taux).toFixed(2);
}

function formaterPrixAvecDevise(prix, devise) {
    const symbole = SYMBOLES_DEVISES[devise] || devise;
    return `${parseFloat(prix).toLocaleString()} ${symbole}`;
}

function showAgenceConfirmationModal(demande) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';

        const prixFormate = formaterPrixAvecDevise(demande.prix, demande.devise);
        const prixParKgFormate = formaterPrixAvecDevise(calculerPrixConverti(demande.prixParKg, demande.devise), demande.devise);

        modal.innerHTML = sanitizeHtml(`
            <div class="modal-content">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--vert-fonce); margin-bottom: 0.5rem;">Demande d'Agence Confirmée !</h3>
                </div>
                <div class="confirmation-details">
                    <p><strong>Code du colis :</strong> ${escapeHtml(demande.codeColis || 'En attente')}</p>
                    <p><strong>Destination :</strong> ${escapeHtml(demande.destination)}</p>
                    <p><strong>Délai de livraison :</strong> ${escapeHtml(demande.delai)}</p>
                </div>
                <div style="background: linear-gradient(135deg, #00513b 0%, #006644 100%); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <span style="opacity: 0.9;">Prix par kg :</span>
                        <span style="font-size: 1.1rem; font-weight: 600;">${escapeHtml(prixParKgFormate)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <span style="opacity: 0.9;">Poids déclaré :</span>
                        <span style="font-size: 1.1rem; font-weight: 600;">${escapeHtml(demande.poids)} kg</span>
                    </div>
                    <div style="height: 1px; background: rgba(255,255,255,0.2); margin: 1rem 0;"></div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 1.1rem; font-weight: 600;">Prix total estimé :</span>
                        <span style="font-size: 1.8rem; font-weight: 700;">${escapeHtml(prixFormate)}</span>
                    </div>
                </div>
                <div style="background: var(--dore-clair); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <p style="margin: 0; color: var(--gris-fonce); font-size: 0.9rem; line-height: 1.5;">
                        <i class="fas fa-info-circle"></i> <strong>Important :</strong> Le prix final sera ajusté selon le poids réel après réception et pesée du colis à l'agence.
                    </p>
                </div>
                <div style="text-align: center;">
                    <button id="confirmAgenceOkBtn" class="btn btn-primary">
                        <i class="fas fa-check"></i> OK
                    </button>
                </div>
            </div>
        `);

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
    } else {
        let formId;
        if (type === 'agence') {
            formId = 'agence-form';
        }

        const altForm = document.getElementById(formId);
        if (altForm) {
            altForm.classList.add('active');
        }
    }
}

function setupRequestForms() {
    const agenceForm = document.getElementById('agence-seule-form');
    if (agenceForm) {
        
        agenceForm.addEventListener('submit', handleAgenceSubmit);
    } else {
        
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
            showConfirmPopup('Êtes-vous sûr de vouloir annuler ? Toutes les données saisies seront perdues.').then(result => {
                if (result) {
                    const activeForm = document.querySelector('.request-form.active');
                    if (activeForm) activeForm.reset();
                    showPopup('Formulaire réinitialisé', 'info');
                }
            });
        });
    }
}