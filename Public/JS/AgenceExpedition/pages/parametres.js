async function updateProfile(event) {
    if (event) event.preventDefault();
    
    try {
        const agenceName = escapeHtml(document.getElementById('agenceName').value.trim());
        const responsable = escapeHtml(document.getElementById('responsable')?.value.trim() || '');
        const telephone = escapeHtml(document.getElementById('telephone').value.trim());
        const adresse = escapeHtml(document.getElementById('adresse')?.value.trim() || '');
        const pays = escapeHtml(document.getElementById('pays').value);

        if (!agenceName || !telephone || !pays) {
            showMessage('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        const profileData = {
            agenceName,
            responsable,
            telephone,
            adresse,
            pays,
            numeroAgrement: escapeHtml(document.getElementById('numeroAgrement')?.value || ''),
            destinations: currentUser.agence?.destinations || [],
            tarifs: currentTarifs,
            locations: currentUser.agence?.locations || [],
            services: currentUser.agence?.services || [],
            typesColis: currentUser.agence?.typesColis || [],
            horaires: escapeHtml(currentUser.agence?.horaires || '')
        };
        
        const response = await apiFetch('/api/agence/update-profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });
        
        if (!response || !response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur lors de la mise à jour');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            currentUser = result.data;
            currentTarifs = result.data.agence.tarifs || [];
            updateUserInfo();
            updateLogoEverywhere();
        }
        
        showMessage('Profil mis à jour avec succès', 'success');
        
    } catch (error) {
        showMessage(error.message || 'Erreur lors de la mise à jour du profil', 'error');
    }
}

async function uploadProfilePicture(file) {
    if (!file) return;
    
    try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await fetch('/api/agence/upload-avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors du téléchargement');
        }
        
        const result = await response.json();
        
        if (result.photoUrl) {
            if (currentUser && currentUser.agence) {
                currentUser.agence.logo = sanitizeUrl(result.photoUrl);
            }
            currentUser.profilePhoto = sanitizeUrl(result.photoUrl);
            
            updateLogoEverywhere();
        }
        
        showMessage('Photo de profil mise à jour', 'success');
        
    } catch (error) {
        showMessage('Erreur lors du téléchargement de la photo', 'error');
    }
}

window.updateProfile = updateProfile;
window.uploadProfilePicture = uploadProfilePicture;