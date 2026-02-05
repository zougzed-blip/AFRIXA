function getSeenCount(badgeType) {
    const key = `seen_${badgeType}`;
    return parseInt(sessionStorage.getItem(key) || '0');
}

function setSeenCount(badgeType, count) {
    const key = `seen_${badgeType}`;
    sessionStorage.setItem(key, count.toString());
}

function updateBadge(badgeType, totalCount) {
    const badge = document.getElementById(`${badgeType}-count`);
    if (!badge) return;
    
    const seenCount = getSeenCount(badgeType);
    const newItemsCount = Math.max(0, totalCount - seenCount);
    
    if (newItemsCount > 0) {
        badge.textContent = newItemsCount;
        badge.classList.remove('hidden');
        
        badge.style.animation = 'none';
        setTimeout(() => {
            badge.style.animation = 'badgePulse 0.6s ease 3';
        }, 10);
    } else {
        badge.classList.add('hidden');
    }
}

function clearBadge(badgeType) {
    const badge = document.getElementById(`${badgeType}-count`);
    if (!badge) return;
    
    getCurrentTotal(badgeType).then(total => {
        setSeenCount(badgeType, total);
        badge.classList.add('hidden');
        badge.textContent = '0';
    });
}

async function getCurrentTotal(badgeType) {
    try {
        switch(badgeType) {
            case 'demandes':
                const demandesResp = await apiFetch('/api/agence/demandes');
                if (demandesResp && demandesResp.ok) {
                    const result = await demandesResp.json();
                    return result.data?.length || result.length || 0;
                }
                break;
                
            case 'paiements':
                const paiementsResp = await apiFetch('/api/agence/paiements');
                if (paiementsResp && paiementsResp.ok) {
                    const result = await paiementsResp.json();
                    return result.data?.length || result.length || 0;
                }
                break;
        }
    } catch (error) {
        
    }
    return 0;
}

async function loadBadgeCounts() {
    try {
        const demandesResp = await apiFetch('/api/agence/demandes');
        if (demandesResp && demandesResp.ok) {
            const result = await demandesResp.json();
            const total = result.data?.length || result.length || 0;
            updateBadge('demandes', total);
        }
        
        const paiementsResp = await apiFetch('/api/agence/paiements');
        if (paiementsResp && paiementsResp.ok) {
            const result = await paiementsResp.json();
            const total = result.data?.length || result.length || 0;
            updateBadge('paiements', total);
        }
        
    } catch (error) {
        
    }
}

function startBadgeAutoRefresh() {
    loadBadgeCounts();
    
    if (badgeRefreshInterval) {
        clearInterval(badgeRefreshInterval);
    }
    
    badgeRefreshInterval = setInterval(() => {
        loadBadgeCounts();
    }, 10000);
}

window.getSeenCount = getSeenCount;
window.setSeenCount = setSeenCount;
window.updateBadge = updateBadge;
window.clearBadge = clearBadge;
window.getCurrentTotal = getCurrentTotal;
window.loadBadgeCounts = loadBadgeCounts;
window.startBadgeAutoRefresh = startBadgeAutoRefresh;