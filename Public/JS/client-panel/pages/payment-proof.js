// ==================== CHARGER LES AGENCES ====================
async function loadAgencesForProof() {
    try {
        const response = await apiFetch('/api/client/agences');
        
        if (!response || !response.ok) {
            throw new Error('Erreur chargement agences');
        }
        
        const data = await response.json();
        return data.success ? data.data : [];
        
    } catch (error) {
        console.error('Erreur chargement agences:', error);
        showPopup('Erreur chargement des agences', 'error');
        return [];
    }
}

// ==================== AFFICHER MODAL AGENCES ====================
async function showAgencesProofModal() {
    try {
        const agences = await loadAgencesForProof();
        
        if (!agences || agences.length === 0) {
            showPopup('Aucune agence disponible', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'agencesProofModal';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; width: 90%; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #004732; font-size: 1.2rem; font-weight: 500;">
                        <i class="fas fa-building" style="margin-right: 8px;"></i> Choisir une agence
                    </h3>
                    <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; line-height: 1;">&times;</button>
                </div>
                
                <div style="padding: 1rem; max-height: 400px; overflow-y: auto;">
                    ${agences.map(agence => {
                        // Gestion du logo
                        const logoHtml = agence.logo 
                            ? `<img src="${escapeHtml(agence.logo)}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">`
                            : `<div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-building" style="color: #004732;"></i>
                               </div>`;
                        
                        // Gestion de la ville
                        const villeTexte = agence.ville && agence.ville !== 'Adresse non spécifiée' 
                            ? agence.ville 
                            : 'Adresse non spécifiée';
                        
                        return `
                            <div onclick="selectAgenceForProof('${escapeHtml(agence.id)}', '${escapeHtml(agence.nom)}', '${escapeHtml(villeTexte)}')" 
                                 style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 1rem; margin-bottom: 0.75rem; cursor: pointer; background: white; transition: all 0.2s;"
                                 onmouseover="this.style.borderColor='#004732'; this.style.backgroundColor='#f9f9f9'"
                                 onmouseout="this.style.borderColor='#e0e0e0'; this.style.backgroundColor='white'">
                                
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    ${logoHtml}
                                    
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; color: #004732; font-size: 1rem; margin-bottom: 4px;">
                                            ${escapeHtml(agence.nom)}
                                        </div>
                                        <div style="font-size: 0.85rem; color: #666;">
                                            <i class="fas fa-map-marker-alt" style="color: #C59B33; width: 14px; margin-right: 4px;"></i>
                                            ${escapeHtml(villeTexte)}
                                        </div>
                                    </div>
                                    
                                    <div style="color: #004732;">
                                        <i class="fas fa-chevron-right"></i>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div style="padding: 1rem 1.5rem; border-top: 1px solid #e0e0e0; text-align: right;">
                    <button onclick="document.getElementById('agencesProofModal').remove()" style="padding: 0.5rem 1.5rem; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">Fermer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Erreur modal agences:', error);
        showPopup('Erreur chargement des agences', 'error');
    }
}
// ==================== SÉLECTIONNER UNE AGENCE ====================
window.selectAgenceForProof = function(agenceId, agenceNom, agenceVille) {
    let agenceInput = document.getElementById('selected-agence-proof-id');
    let agenceDisplay = document.getElementById('selected-agence-proof-display');
    
    if (!agenceInput) {
        agenceInput = document.createElement('input');
        agenceInput.type = 'hidden';
        agenceInput.id = 'selected-agence-proof-id';
        agenceInput.name = 'agenceId';
        document.getElementById('paymentProofForm').appendChild(agenceInput);
    }
    
    if (!agenceDisplay) {
        const formCard = document.querySelector('#paymentProofForm .form-card:first-child');
        if (formCard) {
            const displayDiv = document.createElement('div');
            displayDiv.className = 'form-group';
            displayDiv.id = 'selected-agence-proof-display';
            displayDiv.innerHTML = `
                <label>Agence destinataire</label>
                <div style="background: #f9f9f9; padding: 0.75rem; border-radius: 4px; border: 1px solid #004732; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-building" style="color: #004732;"></i>
                    <span style="font-weight: 500;" id="agence-selected-name">${escapeHtml(agenceNom)}</span>
                    <span style="color: #666; font-size: 0.9rem; margin-left: auto;" id="agence-selected-ville">${escapeHtml(agenceVille || '')}</span>
                </div>
                <button type="button" onclick="changeAgenceForProof()" style="margin-top: 8px; padding: 4px 12px; background: none; border: 1px solid #004732; border-radius: 4px; color: #004732; cursor: pointer; font-size: 0.85rem;">
                    <i class="fas fa-sync-alt"></i> Changer d'agence
                </button>
            `;
            formCard.appendChild(displayDiv);
        }
    } else {
        document.getElementById('agence-selected-name').textContent = escapeHtml(agenceNom);
        document.getElementById('agence-selected-ville').textContent = escapeHtml(agenceVille || '');
    }
    
    agenceInput.value = agenceId;
    document.getElementById('agencesProofModal')?.remove();
    showPopup(`Agence sélectionnée: ${agenceNom}`, 'success');
}

// ==================== CHANGER D'AGENCE ====================
window.changeAgenceForProof = function() {
    const displayDiv = document.getElementById('selected-agence-proof-display');
    if (displayDiv) displayDiv.remove();
    
    const agenceInput = document.getElementById('selected-agence-proof-id');
    if (agenceInput) agenceInput.remove();
    
    showAgencesProofModal();
}

function setupPaymentProofModal() {
    const modal = document.getElementById('paymentProofModal');
    const openBtn = document.getElementById('openProofModal');
    const closeBtns = document.querySelectorAll('#paymentProofModal .close-modal, .close-proof-modal');
    const uploadArea = document.getElementById('proofUploadArea');
    const fileInput = document.getElementById('proofFile');
    const removeBtn = document.getElementById('removeProofFile');
    const form = document.getElementById('paymentProofForm');
    const findRequestBtn = document.getElementById('findRequestBtn');
    const viewProofFile = document.getElementById('viewProofFile');

    if (openBtn) openBtn.addEventListener('click', () => modal && (modal.style.display = 'flex'));
    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        modal && (modal.style.display = 'none');
        resetPaymentProofForm();
    }));

    if (modal) window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetPaymentProofForm();
        }
    });

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleProofFileSelect);

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleProofFileSelect({ target: fileInput });
            }
        });
    }

    if (removeBtn) removeBtn.addEventListener('click', removeProofFile);

    if (viewProofFile) viewProofFile.addEventListener('click', () => {
        const fileInput = document.getElementById('proofFile');
        if (fileInput.files[0]) {
            const url = sanitizeUrl(URL.createObjectURL(fileInput.files[0]));
            window.open(url, '_blank');
        }
    });

    if (findRequestBtn) {
        findRequestBtn.addEventListener('click', async function () {
            const codeColis = document.getElementById('codeColis').value.trim();
            if (!codeColis) {
                showPopup('Veuillez entrer un code colis', 'error');
                return;
            }

            this.disabled = true;
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            try {
                const response = await fetchRequestByCode(escapeHtml(codeColis));
                if (!response || !response.ok) throw new Error('Demande non trouvée');
                const data = await response.json();

                if (data.success) showPopup('Demande trouvée avec succès!', 'success');
                else throw new Error(data.message || 'Demande non trouvée');
            } catch (error) {
                showPopup(error.message, 'error');
            } finally {
                this.disabled = false;
                this.innerHTML = originalHTML;
            }
        });
    }

    if (form) form.addEventListener('submit', handlePaymentProofSubmit);

    const paymentDate = document.getElementById('paymentDate');
    if (paymentDate) {
        const today = new Date().toISOString().split('T')[0];
        paymentDate.value = today;
        paymentDate.max = today;
    }

    const agenceButtonContainer = document.querySelector('#paymentProofForm .form-grid');
    if (agenceButtonContainer) {
        const agenceButtonHTML = `
            <div class="form-group" style="grid-column: span 2;">
                <label>Agence destinataire *</label>
                <button type="button" onclick="showAgencesProofModal()" style="width: 100%; padding: 0.75rem; border: 1px dashed #004732; background: #f9f9f9; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fas fa-building" style="color: #004732;"></i>
                    <span style="color: #004732;">Choisir une agence</span>
                </button>
            </div>
        `;
        agenceButtonContainer.insertAdjacentHTML('beforeend', agenceButtonHTML);
    }
}

function handleProofFileSelect(e) {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const previewContainer = document.getElementById('proofPreviewContainer');
        const uploadArea = document.getElementById('proofUploadArea');
        const fileIcon = document.getElementById('proofFileIcon');
        const fileName = document.getElementById('proofFileName');
        const fileSize = document.getElementById('proofFileSize');
        const fileType = document.getElementById('proofFileType');

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            showPopup('Le fichier est trop volumineux (max 10MB)', 'error');
            e.target.value = '';
            return;
        }

        if (file.type === 'application/pdf') {
            fileIcon.className = 'fas fa-file-pdf';
            fileIcon.style.color = '#dc3545';
            fileType.textContent = 'PDF Document';
        } else if (file.type.includes('image/')) {
            fileIcon.className = 'fas fa-file-image';
            fileIcon.style.color = '#28a745';
            fileType.textContent = 'Image';
        } else {
            fileIcon.className = 'fas fa-file';
            fileIcon.style.color = '#6c757d';
            fileType.textContent = 'Document';
        }

        fileName.textContent = escapeHtml(file.name);
        fileSize.textContent = formatFileSize(file.size);

        if (previewContainer) previewContainer.style.display = 'block';
        if (uploadArea) uploadArea.style.display = 'none';
        updatePaymentProofStep(2);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function removeProofFile() {
    const previewContainer = document.getElementById('proofPreviewContainer');
    const uploadArea = document.getElementById('proofUploadArea');
    const fileInput = document.getElementById('proofFile');

    if (previewContainer) previewContainer.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'block';
    if (fileInput) fileInput.value = '';
    updatePaymentProofStep(1);
}

function updatePaymentProofStep(step) {
    const steps = document.querySelectorAll('.modal-steps .step');
    steps.forEach((s, index) => {
        s.classList.toggle('active', index < step);
    });
}

function resetPaymentProofForm() {
    document.getElementById('clientName').value = '';
    document.getElementById('codeColis').value = '';
    document.getElementById('montant').value = '';
    document.getElementById('devise').value = 'FC';
    document.getElementById('paymentMethod').value = 'mpsa';
    document.getElementById('proofFile').value = '';
    document.getElementById('termsAgreement').checked = false;
  
    // ===== AJOUT: Supprimer l'agence sélectionnée =====
    const agenceDisplay = document.getElementById('selected-agence-proof-display');
    if (agenceDisplay) agenceDisplay.remove();
    
    const agenceInput = document.getElementById('selected-agence-proof-id');
    if (agenceInput) agenceInput.remove();
    
    const previewContainer = document.getElementById('proofPreviewContainer');
    if (previewContainer) previewContainer.style.display = 'none';
    
    const submitBtn = document.getElementById('submitProofBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer la Preuve';
    }
}

async function handlePaymentProofSubmit(e) {
    e.preventDefault();

    try {
        const clientName = escapeHtml(document.getElementById('clientName').value);
        const codeColis = escapeHtml(document.getElementById('codeColis').value);
        const montant = escapeHtml(document.getElementById('montant').value);
        const devise = escapeHtml(document.getElementById('devise').value);
        const paymentMethod = escapeHtml(document.getElementById('paymentMethod').value);
        // ===== AJOUT: Récupérer l'agence sélectionnée =====
        const agenceId = document.getElementById('selected-agence-proof-id')?.value;
        const fileInput = document.getElementById('proofFile');
        const submitBtn = document.getElementById('submitProofBtn');
        const termsAgreement = document.getElementById('termsAgreement');

        if (!clientName.trim()) return showPopup('Veuillez entrer votre nom', 'error');
        if (!codeColis.trim()) return showPopup('Veuillez entrer le code du colis', 'error');
        if (!montant.trim()) return showPopup('Veuillez entrer le montant', 'error');
        if (!devise) return showPopup('Veuillez sélectionner une devise', 'error');
        if (!paymentMethod) return showPopup('Veuillez sélectionner une méthode de paiement', 'error');
        // ===== AJOUT: Vérifier l'agence =====
        if (!agenceId) {
            await showAgencesProofModal();
            return;
        }
        if (!fileInput.files[0]) return showPopup('Veuillez sélectionner un fichier de preuve', 'error');
        if (!termsAgreement.checked) return showPopup('Veuillez accepter les conditions', 'error');

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

        const formData = new FormData();
        formData.append('clientName', clientName);
        formData.append('codeColis', codeColis);
        formData.append('montant', montant);
        formData.append('devise', devise);
        formData.append('paymentMethod', paymentMethod);
        formData.append('agenceId', agenceId);
        formData.append('proofFile', fileInput.files[0]);

        const response = await apiFetch('/api/client/upload-payment-proof', {
            method: 'POST',
            body: formData
        });

        if (!response) {
            throw new Error('Erreur de connexion');
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Erreur lors de l\'envoi');
        }

        if (result.success) {
            showPopup('Preuve de paiement envoyée avec succès!', 'success');
            updatePaymentProofStep(3);
            addNotificationToPanel(`Preuve de paiement reçue pour le colis ${codeColis}. Nous vous enverrons un email après vérification.`, 'success');

            setTimeout(() => {
                document.getElementById('paymentProofModal').style.display = 'none';
                resetPaymentProofForm();
            }, 3000);
        } else {
            throw new Error(result.message || 'Erreur inconnue');
        }

    } catch (error) {
        
        showPopup('Erreur: ' + error.message, 'error');
        
        const submitBtn = document.getElementById('submitProofBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer la Preuve';
        }
    }
}

async function fetchRequestByCode(codeColis) {
    return await apiFetch(`/api/client/request-by-code/${escapeHtml(codeColis)}`);
}