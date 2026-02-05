// ==================== FORMATAGE ========================================
export function getStatusClass(status) {
    if (status === 'accepté' || status === 'livré') return 'active';
    if (status === 'refusé') return 'blocked';
    return 'pending';
}

export function getStatusText(status) {
    const texts = {
        'en_attente': 'En attente',
        'accepté': 'Accepté',
        'refusé': 'Refusé',
        'en_cours': 'En cours',
        'livré': 'Livré'
    };
    return texts[status] || status;
}

export function getAgenceStatusText(status) {
    const texts = {
        'en_attente': 'En attente',
        'acceptee': 'Accepté',
        'accepté': 'Accepté',
        'livree': 'Livré',
        'livré': 'Livré',
        'annulee': 'Annulé',
        'annulé': 'Annulé'
    };
    return texts[status] || status;
}

export function getAgenceStatusValue(statusText) {
    const texts = {
        'en attente': 'en_attente',
        'accepté': 'acceptee',
        'livré': 'livree',
        'annulé': 'annulee'
    };
    return texts[statusText.toLowerCase()] || statusText;
}

// ==================== LABELS ET TEXTE ==================================
export function getVehicleLabel(vehicle) {
    const vehicles = {
        'moto': 'Moto',
        'voiture': 'Voiture', 
        'velo': 'Vélo',
        'scooter': 'Scooter',
        'utilitaire': 'Véhicule utilitaire'
    };
    return vehicles[vehicle] || vehicle;
}

export function getColisLabel(type) {
    const types = {
        'standard': 'Standard',
        'fragile': 'Fragile',
        'documents': 'Documents',
        'urgent': 'Urgent',
        'alimentaire': 'Alimentaire',
        'encombrant': 'Encombrant'
    };
    return types[type] || type;
}

export function getDelaiUnite(delai) {
    if (!delai || delai === 0 || delai === '0') return 'N/A';
    if (delai == 1) return 'heure';
    if (delai < 24) return 'heures';
    return 'jours';
}

export function getRoleLabel(role) {
    const roles = {
        'client': 'Client',
        'agence': 'Agence',
        'admin': 'Administrateur'
    };
    return roles[role] || role;
}

// ==================== INFORMATIONS ENTREPRISE ==========================
export function getCompanyName(company) {
    if (company.role === 'client' && company.client && company.client.fullName) 
        return company.client.fullName;
    if (company.role === 'agence' && company.agence && company.agence.agenceName) 
        return company.agence.agenceName;
    return company.email || 'Nom non disponible';
}

export function getCompanyAddress(company) {
    if (company.role === 'client' && company.client && company.client.adresse) 
        return company.client.adresse;
    if (company.role === 'agence' && company.agence && company.agence.adresse) 
        return company.agence.adresse;
    return 'Adresse non disponible';
}

export function getCompanyLogo(company) {
    if (company.role === 'agence' && company.agence && company.agence.logo) 
        return company.agence.logo;
    if (company.role === 'client' && company.client && company.client.photo) 
        return company.client.photo;
    return '/images/default-company.png';
}

// ==================== INFORMATIONS UTILISATEUR =========================
export function getUserName(user) {
    return getCompanyName(user);
}

export function getUserPhone(user) {
    if (user.role === 'client' && user.client && user.client.telephone) 
        return user.client.telephone;
    if (user.role === 'agence' && user.agence && user.agence.telephone) 
        return user.agence.telephone;
    return 'Non renseigné';
}

export function getUserAvatar(user) {
    const avatarUrl = getCompanyLogo(user);
    if (avatarUrl && avatarUrl.includes('cloudinary')) {
        return avatarUrl.replace('/upload/', '/upload/w_60,h_60,c_fill/');
    }
    return avatarUrl || '/images/default-avatar.png';
}

// ==================== FORMATAGE DE DONNÉES =============================
export function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ')
               .map(n => n[0])
               .join('')
               .toUpperCase()
               .substring(0, 2);
}

export function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return 'Date invalide';
    }
}

export function getMonthNumber(month) {
    const months = {
        'janv.': '01',
        'févr.': '02',
        'mars': '03',
        'avr.': '04',
        'mai': '05',
        'juin': '06',
        'juil.': '07',
        'août': '08',
        'sept.': '09',
        'oct.': '10',
        'nov.': '11',
        'déc.': '12'
    };
    return months[month] || '01';
}

export function getStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star star-filled"></i>';
        } else if (i === fullStars + 1 && halfStar) {
            stars += '<i class="fas fa-star-half-alt star-filled"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return stars;
}

// ==================== GÉNÉRATION PROFIL ================================
export function generateProfileDetailsHTML(user) {
    let html = '';
    
    if (user.role === 'client' && user.client) {
        const clientData = user.client;
        html += `<div class="profile-section">
            <h4><i class="fas fa-info-circle"></i> Informations Client</h4>
            <div class="profile-details-grid">
                <div class="detail-item">
                    <label>Nom complet:</label>
                    <span>${escapeHtml(clientData.fullName || 'Non renseigné')}</span>
                </div>
                <div class="detail-item">
                    <label>Téléphone:</label>
                    <span>${escapeHtml(clientData.telephone || 'Non renseigné')}</span>
                </div>
                <div class="detail-item">
                    <label>Adresse:</label>
                    <span>${escapeHtml(clientData.adresse || 'Non renseigné')}</span>
                </div>
            </div>
        </div>`;
    }
   
    else if (user.role === 'agence' && user.agence) {
        const agenceData = user.agence;

        html += `<div class="profile-section">
            <h4><i class="fas fa-info-circle"></i> Informations Agence</h4>
            <div class="profile-details-grid">
                <div class="detail-item">
                    <label>Nom agence:</label>
                    <span>${escapeHtml(agenceData.agenceName || 'Non renseigné')}</span>
                </div>
                <div class="detail-item">
                    <label>Responsable:</label>
                    <span>${escapeHtml(agenceData.responsable || 'Non renseigné')}</span>
                </div>
                <div class="detail-item">
                    <label>Destinations:</label>
                    <span>${escapeHtml(agenceData.destinations?.map(d => d.toUpperCase()).join(', ') || 'Non renseigné')}</span>
                </div>
            </div>
        </div>`;

        if (agenceData.typesColis && agenceData.typesColis.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-box"></i> Types de Colis</h4>
                <div class="tags-grid">
                    ${agenceData.typesColis.map(type => `<span class="tag">${escapeHtml(getColisLabel(type))}</span>`).join(' ')}
                </div>
            </div>`;
        }

        if (agenceData.locations && agenceData.locations.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-map-marker-alt"></i> Locations</h4>
                <div class="locations-grid">
                    ${agenceData.locations.map(loc => `
                        <div class="location-item">
                            <strong>Pays:</strong> ${escapeHtml(loc.pays || 'N/A')}<br>
                            <strong>Ville:</strong> ${escapeHtml(loc.ville || 'N/A')}<br>
                            <strong>Adresse:</strong> ${escapeHtml(loc.adresse || 'N/A')}<br>
                            <strong>Téléphone:</strong> ${escapeHtml(loc.telephone || 'N/A')}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        if (agenceData.tarifs && agenceData.tarifs.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-money-bill"></i> Tarifs</h4>
                <div class="tarifs-grid">
                    ${agenceData.tarifs.map(tarif => `
                        <div class="tarif-item">
                            <strong>${escapeHtml(tarif.destination || 'N/A')}</strong> - 
                            <span>${escapeHtml(tarif.prix || 0)} USD</span> - 
                            <span>${escapeHtml(tarif.delai || 0)} jours</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        if (agenceData.services && agenceData.services.length > 0) {
            html += `<div class="profile-section">
                <h4><i class="fas fa-concierge-bell"></i> Services</h4>
                <div class="tags-grid">
                    ${agenceData.services.map(service => `<span class="tag">${escapeHtml(service)}</span>`).join(' ')}
                </div>
            </div>`;
        }
    }
    
    if (html === '') {
        html = '<p class="no-data">Aucune information supplémentaire disponible</p>';
    }
    
    return html;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}