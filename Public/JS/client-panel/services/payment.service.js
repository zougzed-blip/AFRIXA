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