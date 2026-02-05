let csrfToken = null;

async function getCSRFToken() {
    if (!csrfToken) {
        try {
            const response = await fetch('/api/csrf-token', {
                credentials: 'include'
            });
            const data = await response.json();
            csrfToken = data.csrfToken;
        } catch (error) {
            console.error('Failed to get CSRF token:', error);
        }
    }
    return csrfToken;
}

window.apiFetch = async function(url, options = {}) {
    const headers = {
        'Accept': 'application/json',
        ...(options.headers || {})
    };
    
    const method = options.method?.toUpperCase() || 'GET';
    
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
     
        const token = await getCSRFToken();
        if (token) {
            headers['X-CSRF-Token'] = token;
        }
    }
    
    const config = {
        credentials: 'include',
        ...options,
        headers 
    };
    
    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            window.location.href = '/login';
            return null;
        }
        
        if (response.status === 403) {
            csrfToken = null;  
        }
        
        return response;
    } catch (error) {
        return null;
    }
};