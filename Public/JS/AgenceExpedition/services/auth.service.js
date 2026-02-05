window.checkAuth = async function() {
    try {
        const response = await window.apiFetch('/api/agence/profile');
        
        if (!response) {
            window.location.href = '/login';
            return;
        }
        
        if (response.status === 401 || response.status === 403) {
            window.location.href = '/login';
            return;
        }
        
        await window.loadUserProfile();
        
    } catch (error) {
        console.error('Erreur de vérification auth:', error);
        window.location.href = '/login';
    }
};

window.loadUserProfile = async function() {
    try {
        const response = await window.apiFetch('/api/agence/profile');
        if (response && response.ok) {
            const result = await response.json();
            window.currentUser = result.success ? result.data : result;
            window.updateUserInfo();
            window.updateLogoEverywhere();
        }
    } catch (error) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('Erreur lors du chargement du profil', 'error');
        } else {
           
        }
    }
};

window.updateUserInfo = function() {
    if (!window.currentUser) return;
    
    const agenceName = window.escapeHtml(window.currentUser.agence?.agenceName || window.currentUser.fullName || 'Agence');
    
    const agenceNameElements = document.querySelectorAll('#agence-name, #agence-name-display');
    agenceNameElements.forEach(el => {
        if (el) el.textContent = agenceName;
    });
    
    const agenceEmailDisplay = document.getElementById('agence-email-display');
    if (agenceEmailDisplay) {
        agenceEmailDisplay.textContent = window.escapeHtml(window.currentUser.email || '');
    }
    
    const verificationBadge = document.getElementById('verification-badge');
    if (verificationBadge) {
        if (window.currentUser.isVerified) {
            verificationBadge.innerHTML = '<i class="fas fa-check-circle"></i> <span>Compte vérifié</span>';
            verificationBadge.style.color = 'var(--success)';
        } else {
            verificationBadge.innerHTML = '<i class="fas fa-clock"></i> <span>En attente de vérification</span>';
            verificationBadge.style.color = 'var(--warning)';
        }
    }
};

window.updateLogoEverywhere = function() {
    if (!window.currentUser || !window.currentUser.agence) return;
    
    const logoUrl = window.sanitizeUrl(window.currentUser.agence.logo?.url || window.currentUser.agence.logo || window.currentUser.profilePhoto);
    
    if (logoUrl) {
        const headerAvatar = document.getElementById('user-avatar');
        if (headerAvatar) {
            headerAvatar.src = logoUrl;
            headerAvatar.style.display = 'block';
        }
        
        const profilePicture = document.getElementById('profile-picture');
        if (profilePicture) {
            profilePicture.src = logoUrl;
            profilePicture.style.display = 'block';
        }
        
        const avatarInitials = document.getElementById('avatar-initials');
        if (avatarInitials) {
            avatarInitials.style.display = 'none';
        }
    } else {
        const avatarInitials = document.getElementById('avatar-initials');
        if (avatarInitials) {
            const firstLetter = window.escapeHtml((window.currentUser.agence?.agenceName || window.currentUser.fullName || 'A')[0].toUpperCase());
            avatarInitials.textContent = firstLetter;
            avatarInitials.style.display = 'flex';
        }
    }
};

window.logout = async function() {
    try {
        await window.apiFetch('/api/auth/logout', {
            method: 'POST'
        });
    } catch (error) {
      
    }

    window.location.href = '/login';
};