// ===== PAGE PREUVE DE PAIEMENT =====

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
        const fileInput = document.getElementById('proofFile');
        const submitBtn = document.getElementById('submitProofBtn');
        const termsAgreement = document.getElementById('termsAgreement');

        if (!clientName.trim()) return showPopup('Veuillez entrer votre nom', 'error');
        if (!codeColis.trim()) return showPopup('Veuillez entrer le code du colis', 'error');
        if (!montant.trim()) return showPopup('Veuillez entrer le montant', 'error');
        if (!devise) return showPopup('Veuillez sélectionner une devise', 'error');
        if (!paymentMethod) return showPopup('Veuillez sélectionner une méthode de paiement', 'error');
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