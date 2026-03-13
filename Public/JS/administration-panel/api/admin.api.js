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
            window.location.href = '/login';
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

// ==================== RATINGS AVEC PAGINATION =========================================
export async function loadAllRatingsAPI(page = 1, limit = 30) {
    try {
        const response = await apiFetch(`/api/admin/agence/all-ratings?page=${page}&limit=${limit}`);
        if (!response) {
            return { ratings: [], total: 0, hasMore: false };
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
            if (data.data.ratings) {
                currentRatings = data.data.ratings;
                return data.data;
            }
            currentRatings = data.data;
            return { ratings: data.data, total: data.data.length, hasMore: false };
        }
        
        currentRatings = data.data || [];
        return { ratings: data.data || [], total: (data.data || []).length, hasMore: false };
        
    } catch (error) {
        return { ratings: [], total: 0, hasMore: false };
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
export async function loadUsersDataAPI(page = 1, limit = 30) {
    try {
        const response = await apiFetch(`/api/admin/users?page=${page}&limit=${limit}`);
        if (!response) {
            return { users: [], total: 0, hasMore: false };
        }
        
        const data = await response.json();
        
        if (data.users) {
            currentUsers = data.users; 
            return data; 
        }
        
        currentUsers = data;
        return { users: data, total: data.length, hasMore: false };
        
    } catch (error) {
        return { users: [], total: 0, hasMore: false };
    }
}

export async function loadMoreUsersAPI(page) {
    return await loadUsersDataAPI(page, 3);
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
export async function loadProofsDataAPI(page = 1, limit = 30) {
    try {
        const response = await apiFetch(`/api/admin/payment-proofs?page=${page}&limit=${limit}`);
        if (!response) {
            return { proofs: [], total: 0, hasMore: false };
        }
        
        const data = await response.json();
        
        if (data.proofs) {
            currentProofs = data.proofs;
            return data;
        }
        
        currentProofs = data;
        return { proofs: data, total: data.length, hasMore: false };
    } catch (error) {
        return { proofs: [], total: 0, hasMore: false };
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
export async function loadDemandesAgenceDataAPI(page = 1, limit = 30) {
    try {
        const response = await apiFetch(`/api/admin/agence/demandes?page=${page}&limit=${limit}`);
        if (!response) {
            return { demandes: [], total: 0, hasMore: false };
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
         
            if (result.data.demandes) {
                currentDemandesAgence = result.data.demandes;
                return result.data;
            }
           
            currentDemandesAgence = result.data;
            return { demandes: result.data, total: result.data.length, hasMore: false };
        }
        
        const data = result.data || result;
        currentDemandesAgence = data;
        return { demandes: data, total: data.length, hasMore: false };
        
    } catch (error) {
        return { demandes: [], total: 0, hasMore: false };
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

// ==================== EXCHANGE RATES ==========================================
export async function loadExchangeRatesAPI() {
    try {
        const response = await apiFetch('/api/admin/exchange-rates');
        if (!response) {
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}

export async function saveExchangeRateAPI(currency, rate) {
    const response = await apiFetch('/api/admin/exchange-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency, rate: parseFloat(rate) })
    });
    
    if (response && response.ok) {
        return await response.json();
    }
    return null;
}


// ==================== EXPORT PAR DATE ========================================
export async function exportDataByDateAPI(date) {
    try {
        const response = await apiFetch(`/api/admin/export/${date}`);
        
        if (!response) {
            showMessage('Erreur lors de l\'export', 'error');
            return null;
        }
        
        if (!response.ok) {
            showMessage('Erreur lors de l\'export', 'error');
            return null;
        }
        
        
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${date}.csv`;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        a.remove();
        
        showMessage('Export réussi!', 'success');
        return true;
        
    } catch (error) {
        console.error('Erreur export:', error);
        showMessage('Erreur lors de l\'export', 'error');
        return null;
    }
}

// ==================== CHART ÉVOLUTION ========================================
export async function getChartEvolutionAPI(jours = 30) {
    try {
        const response = await apiFetch(`/api/admin/chart-evolution?jours=${jours}`);
        
        if (!response) {
            showMessage('Erreur lors du chargement du graphique', 'error');
            return null;
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Erreur chart evolution:', error);
        showMessage('Erreur lors du chargement du graphique', 'error');
        return null;
    }
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