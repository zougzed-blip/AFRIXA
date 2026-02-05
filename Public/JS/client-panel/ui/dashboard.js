async function loadDashboardData() {
    try {
        const response = await apiFetch('/api/client/dashboard');
        if (response && response.ok) {
            const dashboardData = await response.json();
            updateDashboard(dashboardData);
        } else {
            throw new Error('Erreur de chargement du dashboard');
        }
    } catch (error) {
        showPopup('Erreur de chargement du dashboard', 'error');
    }
}

function updateDashboard(data) {
    const lastRequestCard = document.getElementById('last-request-card');
    const noRequestsMessage = document.getElementById('no-requests-message');

    if (data.lastRequest) {
        lastRequestCard.style.display = 'block';
        if (noRequestsMessage) noRequestsMessage.style.display = 'none';

        const lastRequestTypeElement = document.getElementById('last-request-type');
        if (lastRequestTypeElement) {
            lastRequestTypeElement.textContent = 'Agence';
        }

        const statusElement = document.getElementById('last-request-status');
        if (statusElement) {
            statusElement.className = 'activity-badge ' + getStatusClass(data.lastRequest.status);
            statusElement.textContent = escapeHtml(getStatusText(data.lastRequest.status));
        }

        const routeElement = document.getElementById('last-request-route');
        if (routeElement) {
            routeElement.textContent = `Destination: ${escapeHtml(data.lastRequest.destination || '')}`;
        }

        const poidsElement = document.getElementById('last-request-poids');
        if (poidsElement) {
            const poidsInfo = data.lastRequest.poidsVolumeAjuste || data.lastRequest.poidOuTaille || '';
            poidsElement.textContent = `Poids: ${escapeHtml(poidsInfo)}`;
        }

        const dateElement = document.getElementById('last-request-date');
        if (dateElement) {
            dateElement.textContent = `Date: ${escapeHtml(formatDate(data.lastRequest.date))}`;
        }

        const codeElement = document.getElementById('last-request-code');
        if (codeElement) {
            codeElement.textContent = `Code: ${escapeHtml(data.lastRequest.codeColis || 'En attente')}`;
        }

    } else {
        if (lastRequestCard) lastRequestCard.style.display = 'none';
        if (noRequestsMessage) noRequestsMessage.style.display = 'block';
    }
}