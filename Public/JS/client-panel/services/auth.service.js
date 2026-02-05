function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sanitizeUrl(url) {
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
}

function sanitizeHtml(dirty) {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'button'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'id', 'title', 'src', 'alt', 'width', 'height', 'data-*'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    });
}

function handleLogout(e) {
    e.preventDefault();
    showConfirmPopup('Êtes-vous sûr de vouloir vous déconnecter ?').then(result => {
        if (result) {
 
            document.cookie.split(';').forEach(cookie => {
                const cookieName = cookie.split('=')[0].trim();
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            });
            
            window.location.href = '/login';
        }
    });
}