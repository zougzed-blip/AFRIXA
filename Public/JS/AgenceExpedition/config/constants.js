function getStatusText(status) {
    const texts = {
        'en_attente': 'En attente',
        'acceptee': 'Accepté',
        'accepté': 'Accepté',
        'en_cours': 'En cours',
        'livree': 'Livré',
        'livré': 'Livré',
        'annulee': 'Annulé',
        'annulé': 'Annulé',
        'refusé': 'Refusé',
        'refuse': 'Refusé',
        'prix_ajuste': 'Prix ajusté'
    };
    return texts[status] || status;
}
function refreshDemandes() {
    loadDemandes();
    showMessage('Demandes actualisées', 'success');
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

window.addEventListener('resize', function() {
    if (window.innerWidth > 1024) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('active');
    }
});

window.getStatusText = getStatusText;
window.refreshDemandes = refreshDemandes;
window.logout = logout;


window.showSection = showSection;
window.filterDemandesByStatus = filterDemandesByStatus;
window.filterHistoriqueByType = filterHistoriqueByType;
window.openStatusModal = openStatusModal;
window.openAdjustModal = openAdjustModal;
window.updateProfile = updateProfile;
window.loadProfileData = loadProfileData;
window.filterDemandes = filterDemandes;
window.filterPaiements = filterPaiements;
window.filterHistorique = filterHistorique;
window.refreshDemandes = refreshDemandes;
window.logout = logout;
window.closeModal = closeModal;
window.closeMessageBox = closeMessageBox;
window.clearBadge = clearBadge;
window.saveTarif = saveTarif;
window.editTarif = editTarif;
window.cancelTarifEdit = cancelTarifEdit;
window.confirmDeleteTarif = confirmDeleteTarif;
window.displayTarifs = displayTarifs;

window.saveDestination = saveTarif;
window.editDestination = editTarif;
window.cancelDestinationEdit = cancelTarifEdit;
window.confirmDeleteDestination = confirmDeleteTarif;