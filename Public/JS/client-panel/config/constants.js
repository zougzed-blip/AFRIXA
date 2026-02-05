function getStatusIcon(status) {
    const icons = {
        'en_attente': 'clock',
        'accepté': 'check-circle',
        'accepté_par_client': 'check-circle',
        'refusé': 'times-circle',
        'en_cours': 'truck-moving',
        'livré': 'check-double',
        'annulé': 'ban'
    };
    return icons[status] || 'clock';
}

function getStatusClass(status) {
    const statusMap = {
        'en_attente': 'status-pending',
        'accepté': 'status-accepted',
        'accepté_par_client': 'status-accepted',
        'refusé': 'status-refused',
        'refusé_par_client': 'status-refused',
        'en_cours': 'status-in-progress',
        'livré': 'status-delivered',
        'annulé': 'status-refused'
    };
    return statusMap[status] || 'status-pending';
}

function getStatusText(status) {
    const statusMap = {
        'en_attente': 'En attente',
        'accepté': 'Accepté',
        'accepté_par_client': 'Accepté',
        'refusé': 'Refusé',
        'refusé_par_client': 'Refusé',
        'en_cours': 'En cours',
        'livré': 'Livré',
        'annulé': 'Annulé'
    };
    return statusMap[status] || 'En attente';
}

function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Date invalide';
    }
}

function formatCurrency(amount) {
    if (!amount) return '0 FC';
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'CDF'
    }).format(amount).replace('CDF', 'FC');
}