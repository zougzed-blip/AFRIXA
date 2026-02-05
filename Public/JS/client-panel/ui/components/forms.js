function handleImageUpload(e) {
    const fileInput = e.target;
    if (!fileInput.files || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    const uploadArea = document.getElementById('uploadArea');
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showPopup('Le fichier est trop volumineux (max 5MB)', 'error');
        fileInput.value = '';
        return;
    }

    if (!file.type.match('image.*')) {
        showPopup('Seules les images sont acceptées (JPG, PNG)', 'error');
        fileInput.value = '';
        return;
    }

    try {
        const imageURL = sanitizeUrl(URL.createObjectURL(file));
        if (previewImage) {
            previewImage.src = imageURL;
            previewImage.onload = () => URL.revokeObjectURL(imageURL);
        }

        if (previewContainer) previewContainer.style.display = 'block';
        if (uploadArea) uploadArea.style.display = 'none';
        showPopup('Image chargée avec succès!', 'success');

    } catch (error) {
        showPopup('Erreur lors du chargement de l\'image', 'error');
        fileInput.value = '';
    }
}

function removeUploadedImage() {
    const previewContainer = document.getElementById('previewContainer');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    if (previewContainer) previewContainer.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'block';
    if (fileInput) fileInput.value = '';
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.save-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        showPopup('Mise à jour du profil en cours...', 'info');
        const avatarInput = document.getElementById('avatarFileInput');

        const formData = new FormData();
        formData.append('email', escapeHtml(document.getElementById('profile-email').value));
        formData.append('fullName', escapeHtml(document.getElementById('profile-fullName').value));
        formData.append('telephone', escapeHtml(document.getElementById('profile-phone').value));
        formData.append('adresse', escapeHtml(document.getElementById('profile-address').value));
        if (avatarInput.files[0]) formData.append('avatar', avatarInput.files[0]);

        const response = await apiFetch('/api/client/profile', {
            method: 'PUT',
            body: formData
        });

        if (!response || !response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur lors de la mise à jour');
        }

        const result = await response.json();
        if (result.photoUrl) {
            const photoUrl = sanitizeUrl(result.photoUrl);
            document.getElementById('profile-avatar').src = photoUrl;
            document.getElementById('header-avatar').src = photoUrl;
        }

        showPopup('Profil mis à jour avec succès!', 'success');
        await loadUserProfile();

    } catch (error) {
        showPopup(error.message || 'Erreur lors de la mise à jour du profil', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}