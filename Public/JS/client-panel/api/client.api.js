let csrfToken = null;
let debugMode = true;

function logDebug(...args) {
    if (debugMode) {
        
    }
}

async function fetchCSRFToken() {
    try {
        
        const response = await fetch('/api/csrf-token', {
            method: 'GET',
            credentials: 'include',
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

async function apiFetch(url, options = {}) {
    
    
    if (!csrfToken) {
        await fetchCSRFToken();
    }
    
    const headers = {
        'Accept': 'application/json',
        ...options.headers
    };
    
    const method = options.method?.toUpperCase() || 'GET';
    
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
    }
    
    const config = {
        ...options,
        headers,
        credentials: 'include',
    };
    
    try {
        const response = await fetch(url, config);
        
        
        if (response.status === 401) {
            
            window.location.href = '/login';
            return null;
        }
        
        if (response.status === 403) {
            
            const data = await response.json().catch(() => ({}));
            if (data.message?.includes('CSRF')) {
                csrfToken = null;
            }
        }
        
        return response;
        
    } catch (error) {
        
        return null;
    }
}

async function initializeApp() {
    
    
    
    await fetchCSRFToken();
    
    
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    debugMode = false;
}