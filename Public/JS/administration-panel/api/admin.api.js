import { showMessage } from '../ui/event-handlers.js';

let currentCompanies, currentUsers, currentProofs, currentPropositions;
let currentRatings, currentDemandes, currentDemandesAgence, currentHistoriqueAgence;

export function setGlobalVariables(vars) {
    ({ 
        currentCompanies, currentUsers, currentProofs, currentPropositions,
        currentRatings, currentDemandes, currentDemandesAgence, currentHistoriqueAgence 
    } = vars);
}

// ==================== COOKIE UTILITIES ========================================
export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

export function setCookie(name, value, days = 1) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}

export function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ==================== CSRF TOKEN MANAGEMENT ===================================
let csrfToken = null;

export async function fetchCSRFToken() {
    try {
        const response = await fetch('/api/csrf-token', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            csrfToken = data.csrfToken;
            return csrfToken;
        }
        return null;
    } catch (error) {
        return null;
    }
}

// ==================== API FETCH WITH CSRF =====================================
export async function apiFetch(url, options = {}) {
    if (!csrfToken) {
        csrfToken = await fetchCSRFToken();
    }
    
    const headers = {
        'Accept': 'application/json',
        ...options.headers  
    };
    
    if (options.method && options.method !== 'GET') {
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        
        if (csrfToken && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE' || options.method === 'PATCH')) {
            headers['X-CSRF-Token'] = csrfToken;
        }
    }
    
    const config = {
        ...options,
        headers,
        credentials: 'include'
    };
    
    try {
        const response = await fetch(url, config);
        if (response.status === 401) {
            return null;
        }
        if (response.status === 429) {
            showMessage('Trop de requêtes, veuillez patienter', 'warning');
            return null;
        }
        
        if (response.status === 403) {
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    
                    if (data.message && data.message.includes('CSRF')) {
                        csrfToken = await fetchCSRFToken();
                        showMessage('Session actualisée, veuillez réessayer', 'info');
                    }
                }
            } catch (e) {
            }
            
            return null;
        }
        
        if (!response.ok) {
            return null;
        }
        
        return response;
        
    } catch (error) {
        showMessage('Erreur de connexion au serveur', 'error');
        return null;
    }
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function loadAllRatingsAPI() {
    try {
        const response = await apiFetch('/api/admin/agence/all-ratings'); 
        if (!response) {
            return [];
        }
        
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (error) {
        return [];
    }
}
// ==================== ADMIN PROFILE ===========================================
export async function loadAdminProfileAPI() {
    try {
        const response = await apiFetch('/api/admin/profile');
        if (!response) {
            return null;
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}

// ==================== COMPANIES ===============================================
export async function loadCompaniesDataAPI() {
    try {
        const response = await apiFetch('/api/admin/companies/pending');
        if (!response) {
            return [];
        }
        
        const data = await response.json();
        currentCompanies = data;
        return data;
    } catch (error) {
        return [];
    }
}

export async function validateCompanyAPI(companyId, accept) {
    const response = await apiFetch(`/api/admin/companies/${companyId}/validate`, {
        method: 'POST',
        body: JSON.stringify({ accept })
    });
    
    if (response && response.ok) {
        return await response.json();
    }
    return null;
}

// ==================== USERS ===================================================
export async function loadUsersDataAPI() {
    try {
        const response = await apiFetch('/api/admin/users');
        if (!response) {
            return [];
        }
        
        const data = await response.json();
        currentUsers = data;
        return data;
    } catch (error) {
        return [];
    }
}

export async function toggleUserStatusAPI(userId, suspend) {
    const response = await apiFetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        body: JSON.stringify({ suspend })
    });
    
    if (response && response.ok) {
        return await response.json();
    }
    return null;
}

// ==================== PAYMENT PROOFS ==========================================
export async function loadProofsDataAPI() {
    try {
        const response = await apiFetch('/api/admin/payment-proofs');
        if (!response) {
            return [];
        }
        
        const data = await response.json();
        currentProofs = data;
        return data;
    } catch (error) {
        return [];
    }
}

export async function updateProofStatusAPI(proofId, newStatus) {
    const response = await apiFetch(`/api/admin/payment-proofs/${proofId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
    });
    
    if (response && response.ok) {
        return await response.json();
    }
    return null;
}

// ==================== AGENCE DEMANDES =========================================
export async function loadDemandesAgenceDataAPI() {
    try {
        const response = await apiFetch('/api/admin/agence/demandes');
        if (!response) {
            return [];
        }
        
        const result = await response.json();
        const data = result.success ? result.data : result;
        currentDemandesAgence = data;
        return data;
    } catch (error) {
        return [];
    }
}

export async function updateDemandeAgenceStatusAPI(demandeId, newStatus) {
    const response = await apiFetch(`/api/admin/agence/demandes/${demandeId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
    });
    
    if (response && response.ok) {
        return await response.json();
    }
    return null;
}

export async function adjustDemandeAgenceWeightAPI(demandeId, newWeight) {
    const response = await apiFetch(`/api/admin/agence/demandes/${demandeId}/adjust-weight`, {
        method: 'PUT',
        body: JSON.stringify({ poidsReel: parseFloat(newWeight) })
    });
    
    if (response && response.ok) {
        return await response.json();
    }
    return null;
}

export async function getDemandeAgenceDetailsAPI(demandeId) {
    try {
        const response = await apiFetch(`/api/admin/agence/demandes/${demandeId}`);
        
        if (!response) {
            return null;
        }
        if (!response.ok) {
            return null;
        }
        
        return await response.json();
    } catch (error) {
        return null;
    }
}

// ==================== DASHBOARD ===============================================
export async function loadDashboardDataAPI() {
    try {
        const response = await apiFetch('/api/admin/dashboard');
        if (!response) {
            return null;
        }
        return await response.json();
    } catch (error) {
        return null;
    }
}

export async function loadAgenceDashboardDataAPI() {
    try {
        const response = await apiFetch('/api/admin/agence/dashboard');
        if (!response) {
            return null;
        }
        return await response.json();
    } catch (error) {
        return null;
    }
}

// ==================== NOTIFICATIONS ===========================================
export async function loadAdminNotificationsAPI() {
    try {
        const response = await apiFetch('/api/admin/notifications');
        if (!response) {
            return [];
        }
        return await response.json();
    } catch (error) {
        return [];
    }
}

export async function markNotificationAsReadAPI(notificationId) {
    const response = await apiFetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'POST'
    });
    
    if (response && response.ok) {
        return await response.json();
    }
    return null;
}

export async function markAllNotificationsAsReadAPI() {
    const response = await apiFetch('/api/admin/notifications/mark-all-read', {
        method: 'POST'
    });
    
    if (response && response.ok) {
        return await response.json();
    }
    return null;
}

// ==================== USER PROFILE ============================================
export async function getUserProfileAPI(userId) {
    try {
        const response = await apiFetch(`/api/admin/users/${userId}`);
        if (!response) {
            return null;
        }
        return await response.json();
    } catch (error) {
        return null;
    }
}

// ==================== PROOF MANAGEMENT ========================================
export async function loadCompaniesForProofAPI() {
    try {
        const response = await apiFetch('/api/admin/companies/for-proof');
        if (!response) {
            return [];
        }
        return await response.json();
    } catch (error) {
        return [];
    }
}

export async function sendProofAPI(formData) {
    const response = await fetch('/api/admin/send-proof', {
        method: 'POST',
        headers: {
            'X-CSRF-Token': csrfToken || ''
        },
        credentials: 'include',
        body: formData
    });
    
    return response;
}

// ==================== GETTERS =================================================
export function getCurrentCompanies() { return currentCompanies; }
export function getCurrentUsers() { return currentUsers; }
export function getCurrentProofs() { return currentProofs; }
export function getCurrentPropositions() { return currentPropositions; }
export function getCurrentRatings() { return currentRatings; }
export function getCurrentDemandes() { return currentDemandes; }
export function getCurrentDemandesAgence() { return currentDemandesAgence; }
export function getCurrentHistoriqueAgence() { return currentHistoriqueAgence; }

// ==================== SETTERS =================================================
export function setCurrentCompanies(data) { currentCompanies = data; }
export function setCurrentUsers(data) { currentUsers = data; }
export function setCurrentProofs(data) { currentProofs = data; }
export function setCurrentPropositions(data) { currentPropositions = data; }
export function setCurrentRatings(data) { currentRatings = data; }
export function setCurrentDemandes(data) { currentDemandes = data; }
export function setCurrentDemandesAgence(data) { currentDemandesAgence = data; }
export function setCurrentHistoriqueAgence(data) { currentHistoriqueAgence = data; }

// ==================== INITIALIZE CSRF TOKEN ===================================
export async function initializeApp() {
    csrfToken = await fetchCSRFToken();
    return csrfToken !== null;
}