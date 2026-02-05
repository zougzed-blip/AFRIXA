async function loadUserProfile() {
    try {
        const response = await apiFetch('/api/client/profile');
        if (response && response.ok) {
            const userData = await response.json();
            updateUserInterface(userData);
        } else {
            throw new Error('Erreur de chargement du profil');
        }
    } catch (error) {
        console.error('Erreur profil:', error);
        throw error;
    }
}

function updateUserInterface(userData) {
    const userNameElement = document.getElementById('header-name');
    const userAvatarElement = document.getElementById('header-avatar');

    if (userNameElement && userData.client?.fullName) {
        userNameElement.textContent = escapeHtml(userData.client.fullName);
    }
    
    if (userAvatarElement) {
        const photoUrl = sanitizeUrl(userData.client?.photo || 'https://via.placeholder.com/40x40?text=U');
        userAvatarElement.src = photoUrl;
        userAvatarElement.alt = escapeHtml(userData.client?.fullName || 'Utilisateur');
    }

    const welcomeElement = document.getElementById('welcome-message');
    if (welcomeElement && userData.client?.fullName) {
        const hour = new Date().getHours();
        let greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
        welcomeElement.textContent = escapeHtml(`${greeting}, ${userData.client.fullName}`);
    }
}

function setupEventListeners() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);

        const cancelBtn = profileForm.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                showConfirmPopup('Annuler les modifications ?').then(result => {
                    if (result) {
                        loadProfileData();
                        showPopup('Modifications annulées', 'info');
                    }
                });
            });
        }
    }

    const editAvatarBtn = document.querySelector('.edit-avatar');
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', function () {
            const avatarInput = document.getElementById('avatarFileInput');
            if (avatarInput) {
                avatarInput.click();
            }
        });
    }

    const avatarInput = document.getElementById('avatarFileInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    showPopup('Veuillez sélectionner une image valide', 'error');
                    return;
                }

                if (file.size > 3 * 1024 * 1024) {
                    showPopup('L\'image ne doit pas dépasser 3MB', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById('profile-avatar').src = sanitizeUrl(e.target.result);
                };
                reader.readAsDataURL(file);

                showPopup('Image sélectionnée. Cliquez sur "Sauvegarder" pour confirmer.', 'success');
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) changePasswordBtn.addEventListener('click', () => {
        showPopup('Fonctionnalité bientôt disponible', 'info');
    });
}