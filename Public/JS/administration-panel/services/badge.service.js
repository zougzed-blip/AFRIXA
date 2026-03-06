import * as API from '../api/admin.api.js';
import { sleep } from '../api/admin.api.js';


export let badgeCounts = {
    users: 0,
    proofs: 0,
    demandesAgence: 0,
    ratings: 0
};

export function setupBadgesInterval() {
    setInterval(() => {
        updateAllBadges();
    }, 60000);
}

export async function updateAllBadges() {
    try {
        await updateUsersBadge();
        await updateProofsBadge();
        await updateDemandesAgenceBadge();
        await updateRatingsBadge();
    } catch (error) {
        
    }
}

async function updateUsersBadge() {
    try {
        await sleep(500);
        const response = await API.apiFetch('/api/admin/users');
        
        if (response && response.ok) {
            const data = await response.json();
            
            let users = [];
            if (Array.isArray(data)) {
                users = data;
            } else if (data?.data && Array.isArray(data.data)) {
                users = data.data;
            } else if (data?.users && Array.isArray(data.users)) {
                users = data.users;
            } else if (data?.results && Array.isArray(data.results)) {
                users = data.results;
            } else {
                users = [];
            }
            
            const unverifiedUsers = users.filter(u => {
                const isVerified = u?.isVerified === true || u?.verified === true || u?.is_verified === true;
                const role = u?.role || u?.role_name || u?.type || '';
                
                return !isVerified && 
                    ['agence', 'petit_transporteur', 'grand_transporteur', 'client', 'transporteur'].includes(role);
            });
            
            badgeCounts.users = unverifiedUsers.length;
            updateBadge('users-badge', badgeCounts.users);
        }
    } catch (error) {
        
    }
}

async function updateProofsBadge() {
    try {
        await sleep(500);
        const lastProofsViewed = localStorage.getItem('lastProofsViewed');
        let proofsUrl = '/api/admin/payment-proofs/new-count';
        
        if (lastProofsViewed) {
            proofsUrl += `?lastViewed=${encodeURIComponent(lastProofsViewed)}`;
        }
        
        const response = await API.apiFetch(proofsUrl);
        
        if (response && response.ok) {
            const data = await response.json();
            
            let count = 0;
            if (typeof data === 'number') {
                count = data;
            } else if (data?.newCount !== undefined) {
                count = data.newCount;
            } else if (data?.count !== undefined) {
                count = data.count;
            } else if (data?.data?.newCount !== undefined) {
                count = data.data.newCount;
            }
            
            badgeCounts.proofs = count;
            updateBadge('new-proofs-count', badgeCounts.proofs);
        }
    } catch (error) {
       
    }
}

async function updateDemandesAgenceBadge() {
    try {
        await sleep(500);
        const lastDemandesAgenceViewed = localStorage.getItem('lastDemandesAgenceViewed');
        const response = await API.apiFetch('/api/admin/agence/demandes');
        
        if (response && response.ok) {
            const result = await response.json();
            
            let demandes = [];
            
            if (result?.success && result?.data) {
                if (Array.isArray(result.data)) {
                    demandes = result.data;
                } else if (result.data?.demandes && Array.isArray(result.data.demandes)) {
                    demandes = result.data.demandes;
                } else if (result.data?.data && Array.isArray(result.data.data)) {
                    demandes = result.data.data;
                }
            } else if (Array.isArray(result)) {
                demandes = result;
            } else if (result?.demandes && Array.isArray(result.demandes)) {
                demandes = result.demandes;
            }
            
            if (lastDemandesAgenceViewed) {
                const lastViewedDate = new Date(lastDemandesAgenceViewed);
                const newDemandes = demandes.filter(d => {
                    const demandeDate = d?.date || d?.createdAt || d?.Date || d?.created_at || d?.created;
                    if (!demandeDate) return false;
                    
                    const date = new Date(demandeDate);
                    const status = (d?.status || '').toLowerCase();
                    const isEnAttente = status === 'en_attente' || status === 'pending' || status === 'attente';
                    
                    return date > lastViewedDate && isEnAttente;
                });
                badgeCounts.demandesAgence = newDemandes.length;
            } else {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const newDemandes = demandes.filter(d => {
                    const demandeDate = d?.date || d?.createdAt || d?.Date || d?.created_at || d?.created;
                    if (!demandeDate) return false;
                    
                    const date = new Date(demandeDate);
                    const status = (d?.status || '').toLowerCase();
                    const isEnAttente = status === 'en_attente' || status === 'pending' || status === 'attente';
                    
                    return date > yesterday && isEnAttente;
                });
                badgeCounts.demandesAgence = newDemandes.length;
            }
            
            updateBadge('demandes-agence-badge', badgeCounts.demandesAgence);
        }
    } catch (error) {
      
    }
}

async function updateRatingsBadge() {
    try {
        await sleep(500);
        const lastRatingsViewed = localStorage.getItem('lastRatingsViewed');
        const response = await API.apiFetch('/api/admin/agence/all-ratings');
        
        if (response && response.ok) {
            const result = await response.json();
            
            let ratings = [];
            
            if (result?.success && result?.data) {
                if (Array.isArray(result.data)) {
                    ratings = result.data;
                } else if (result.data?.ratings && Array.isArray(result.data.ratings)) {
                    ratings = result.data.ratings;
                }
            } else if (Array.isArray(result)) {
                ratings = result;
            } else if (result?.ratings && Array.isArray(result.ratings)) {
                ratings = result.ratings;
            }
            
            if (lastRatingsViewed) {
                const lastViewedDate = new Date(lastRatingsViewed);
                const newRatings = ratings.filter(r => {
                    const ratingDate = r?.Date || r?.date || r?.createdAt || r?.created_at || r?.created;
                    if (!ratingDate) return false;
                    
                    const date = new Date(ratingDate);
                    return date > lastViewedDate;
                });
                badgeCounts.ratings = newRatings.length;
            } else {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const newRatings = ratings.filter(r => {
                    const ratingDate = r?.Date || r?.date || r?.createdAt || r?.created_at || r?.created;
                    if (!ratingDate) return false;
                    
                    const date = new Date(ratingDate);
                    return date > yesterday;
                });
                badgeCounts.ratings = newRatings.length;
            }
            
            updateBadge('ratings-badge', badgeCounts.ratings);
        }
    } catch (error) {
       
    }
}

export function updateBadge(badgeId, count) {
    const badge = document.getElementById(badgeId);
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

export function resetBadge(badgeType) {
    switch(badgeType) {
        case 'proofs':
            badgeCounts.proofs = 0;
            updateBadge('new-proofs-count', 0);
            localStorage.setItem('lastProofsViewed', new Date().toISOString());
            break;
        case 'demandesAgence':
            badgeCounts.demandesAgence = 0;
            updateBadge('demandes-agence-badge', 0);
            localStorage.setItem('lastDemandesAgenceViewed', new Date().toISOString());
            break;
        case 'ratings':
            badgeCounts.ratings = 0;
            updateBadge('ratings-badge', 0);
            localStorage.setItem('lastRatingsViewed', new Date().toISOString()); 
            break;
        case 'users':
            badgeCounts.users = 0;
            updateBadge('users-badge', 0);
            break;
    }
}

window.badgeCounts = badgeCounts;
window.updateBadge = updateBadge;
window.resetBadge = resetBadge;
window.updateAllBadges = updateAllBadges;