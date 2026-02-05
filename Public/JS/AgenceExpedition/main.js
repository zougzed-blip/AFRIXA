window.currentUser = null;
window.currentDemandes = [];
window.currentPaiements = [];
window.currentHistorique = [];
window.currentTarifs = [];

window.badgeRefreshInterval = null;
window.tarifToDeleteIndex = null;

window.escapeHtml = function(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

window.sanitizeUrl = function(url) {
    if (!url) return '';
    try {
        const parsed = new URL(url, window.location.origin);
        const allowedProtocols = ['http:', 'https:', 'data:'];
        if (!allowedProtocols.includes(parsed.protocol)) {
            return '';
        }
        return url;
    } catch {
        return '';
    }
};

window.sanitizeHtml = function(dirty) {
    if (typeof DOMPurify === 'undefined') {
        console.warn('DOMPurify not loaded, returning escaped HTML');
        return window.escapeHtml(dirty);
    }
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'id', 'title', 'colspan', 'rowspan'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    await waitForServices();
    
    if (typeof window.checkAuth === 'function') {
        await window.checkAuth();
    } else {
        window.location.href = '/login';
        return;
    }
   
    if (typeof window.initializePanel === 'function') {
        window.initializePanel();
    }
    
    if (typeof window.createMessageBox === 'function') {
        window.createMessageBox();
    }
    if (typeof window.setupEventDelegation === 'function') {
        window.setupEventDelegation();
    }
})
function waitForServices() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (typeof window.apiFetch === 'function' && 
                typeof window.checkAuth === 'function') {
                clearInterval(checkInterval);
                resolve();
            }
        }, 50);
      
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
        }, 5000);
    });
}