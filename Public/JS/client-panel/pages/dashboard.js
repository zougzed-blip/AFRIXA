async function loadDashboardData() {
    try {
        const response = await apiFetch('/api/client/dashboard');
        
        if (!response || !response.ok) {
            throw new Error('Impossible de charger les données du tableau de bord');
        }
        
        const dashboardData = await response.json();
        updateDashboard(dashboardData);
        
    } catch (error) {
        
        showPopup('Erreur de chargement du tableau de bord', 'error');
    }
}

function updateDashboard(data) {
    const lastRequestCard = document.getElementById('last-request-card');
    const noRequestsMessage = document.getElementById('no-requests-message');
    
    if (!lastRequestCard || !noRequestsMessage) {
        
        return;
    }
    
    if (data.lastRequest && typeof data.lastRequest === 'object') {
        lastRequestCard.style.display = 'block';
        noRequestsMessage.style.display = 'none';
        
        updateLastRequestElements(data.lastRequest);
    } else {
        lastRequestCard.style.display = 'none';
        noRequestsMessage.style.display = 'block';
    }
}

function updateLastRequestElements(request) {
    const lastRequestTypeElement = document.getElementById('last-request-type');
    if (lastRequestTypeElement) {
        lastRequestTypeElement.textContent = 'Agence';
    }
   
    const statusElement = document.getElementById('last-request-status');
    if (statusElement) {
        const statusClass = getStatusClass(request.status);
        const statusText = getStatusText(request.status);
        statusElement.className = 'activity-badge ' + statusClass;
        statusElement.textContent = statusText;
    }
    
    const routeElement = document.getElementById('last-request-route');
    if (routeElement) {
        routeElement.textContent = `Destination: ${escapeHtml(request.destination || '')}`;
    }
    
    const poidsElement = document.getElementById('last-request-poids');
    if (poidsElement) {
        let poidsValue = '';
        if (request.poidsVolumeAjuste) {
            poidsValue = `${escapeHtml(request.poidsVolumeAjuste)} (réel)`;
        } else {
            poidsValue = escapeHtml(request.poidOuTaille || '');
        }
        poidsElement.textContent = `Poids: ${poidsValue}`;
    }
 
    const dateElement = document.getElementById('last-request-date');
    if (dateElement) {
        dateElement.textContent = `Date: ${formatDate(request.date)}`;
    }
    
    const codeElement = document.getElementById('last-request-code');
    if (codeElement) {
        codeElement.textContent = `Code: ${escapeHtml(request.codeColis || 'En attente')}`;
    }
}

function getStatusClass(status) {
    const statusClasses = {
        'pending': 'status-pending',
        'accepted': 'status-accepted',
        'in_progress': 'status-in-progress',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
    };
    return statusClasses[status] || 'status-default';
}

function getStatusText(status) {
    const statusTexts = {
        'pending': 'En attente',
        'accepted': 'Accepté',
        'in_progress': 'En cours',
        'completed': 'Terminé',
        'cancelled': 'Annulé'
    };
    return statusTexts[status] || status || 'Inconnu';
}

function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return escapeHtml(dateString);
    }
}

function escapeHtml(text) {
    if (typeof text !== 'string') {
        return String(text);
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}