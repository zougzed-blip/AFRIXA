async function loadProfileData() {
    try {
        const response = await apiFetch('/api/client/profile');
        if (response && response.ok) {
            const userData = await response.json();
            updateProfileForm(userData);
        } else {
            throw new Error('Erreur de chargement du profil');
        }
    } catch (error) {
        
        showPopup('Erreur de chargement du profil', 'error');
    }
}

function updateProfileForm(userData) {
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileSince = document.getElementById('profile-since');

    if (profileAvatar) {
        const photoUrl = sanitizeUrl(userData.client?.photo || 'https://via.placeholder.com/120x120?text=U');
        profileAvatar.src = photoUrl;
        profileAvatar.alt = escapeHtml(userData.client?.fullName || 'Utilisateur');
    }

    if (profileName && userData.client?.fullName) {
        profileName.textContent = escapeHtml(userData.client.fullName);
    }

    if (profileSince && userData.createdAt) {
        const sinceDate = new Date(userData.createdAt);
        profileSince.textContent = escapeHtml(`Client depuis ${sinceDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`);
    }

    const fields = {
        'profile-fullName': userData.client?.fullName,
        'profile-email': userData.email,
        'profile-phone': userData.client?.telephone,
        'profile-address': userData.client?.adresse
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && value !== undefined) element.value = escapeHtml(value || '');
    });
}