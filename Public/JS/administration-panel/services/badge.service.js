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
        await sleep(500);
   
        const usersResponse = await API.apiFetch('/api/admin/users');
        if (usersResponse) {
            const users = await usersResponse.json();
            const unverifiedUsers = users.filter(u => 
                !u.isVerified && 
                ['agence', 'petit_transporteur', 'grand_transporteur', 'client'].includes(u.role)
            );
            badgeCounts.users = unverifiedUsers.length;
            updateBadge('users-badge', badgeCounts.users);
        }

        await sleep(500);
      
        const lastProofsViewed = localStorage.getItem('lastProofsViewed');
        let proofsUrl = '/api/admin/payment-proofs/new-count';
        if (lastProofsViewed) {
            proofsUrl += `?lastViewed=${lastProofsViewed}`;
        }
        
        const proofsResponse = await API.apiFetch(proofsUrl);
        if (proofsResponse) {
            const data = await proofsResponse.json();
            badgeCounts.proofs = data.newCount || 0;
            updateBadge('new-proofs-count', badgeCounts.proofs);
        }

        await sleep(500);
     
        const lastDemandesAgenceViewed = localStorage.getItem('lastDemandesAgenceViewed');
        try {
            const demandesAgenceResponse = await API.apiFetch('/api/admin/agence/demandes');
            if (demandesAgenceResponse) {
                const result = await demandesAgenceResponse.json();
                const demandes = result.success ? result.data : result;
                
                if (lastDemandesAgenceViewed) {
                    const lastViewedDate = new Date(lastDemandesAgenceViewed);
                    const newDemandes = demandes.filter(d => {
                        const demandeDate = d.date || d.createdAt || d.Date;
                        const date = new Date(demandeDate);
                        return date > lastViewedDate && d.status === 'en_attente';
                    });
                    badgeCounts.demandesAgence = newDemandes.length;
                } else {
                    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    const newDemandes = demandes.filter(d => {
                        const demandeDate = d.date || d.createdAt || d.Date;
                        const date = new Date(demandeDate);
                        return date > yesterday && d.status === 'en_attente';
                    });
                    badgeCounts.demandesAgence = newDemandes.length;
                }
                updateBadge('demandes-agence-badge', badgeCounts.demandesAgence);
            }
        } catch (error) {
        }

        await sleep(500);
      
        const lastRatingsViewed = localStorage.getItem('lastRatingsViewed');
        const ratingsResponse = await API.apiFetch('/api/admin/agence/all-ratings');
        if (ratingsResponse) {
            const result = await ratingsResponse.json();
            const ratings = result.success ? result.data : result;
            
            if (lastRatingsViewed) {
                const lastViewedDate = new Date(lastRatingsViewed);
                const newRatings = ratings.filter(r => {
                    const ratingDate = r.Date || r.date || r.createdAt;
                    const date = new Date(ratingDate);
                    return date > lastViewedDate;
                });
                badgeCounts.ratings = newRatings.length;
            } else {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const newRatings = ratings.filter(r => {
                    const ratingDate = r.Date || r.date || r.createdAt;
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

export function getBadgeCounts() {
    return badgeCounts;
}

export function resetBadge(badgeType) {
    switch(badgeType) {
        case 'proofs':
            badgeCounts.proofs = 0;
            updateBadge('new-proofs-count', 0);
            break;
        case 'demandesAgence':
            badgeCounts.demandesAgence = 0;
            updateBadge('demandes-agence-badge', 0);
            break;
        case 'ratings':
            badgeCounts.ratings = 0;
            updateBadge('ratings-badge', 0);
            break;
    }
}