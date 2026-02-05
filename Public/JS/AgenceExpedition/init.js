document.addEventListener('DOMContentLoaded', () => {
    if (typeof checkAuth !== 'undefined') {
        checkAuth();
        initializePanel();
        createMessageBox();
        setupEventDelegation();
    } else {
        console.warn('Les fonctions ne sont pas encore chargées');
    }
});
