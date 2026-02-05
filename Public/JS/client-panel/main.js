
document.addEventListener("DOMContentLoaded", async () => {
   
    
    setCurrentDate();
    await initializeClientPanel();
});

function setCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        dateElement.textContent = escapeHtml(now.toLocaleDateString('fr-FR', options));
    }
}

async function initializeClientPanel() {
    try {
     
        await loadUserProfile();
        
        setupNavigation();
        setupEventListeners();
        setupMobileMenu();
        setupQuickActions();
        setupModals();
        setupPaymentProofModal();

        await loadAllUserNotifications();
        await loadClientRequests();


        const openProofModalBtn = document.getElementById('openProofModalBtn');
        if (openProofModalBtn) {
            openProofModalBtn.addEventListener('click', () => {
                const modal = document.getElementById('paymentProofModal');
                if (modal) modal.style.display = 'flex';
            });
        }

        loadActiveSection();
    } catch (error) {
        showPopup('Erreur de chargement des données', 'error');
    }
}

function loadActiveSection() {
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) return;

    switch (activeSection.id) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'requests':
            loadClientRequests();
            break;
        case 'history':
            loadClientHistory();
            break;
        case 'profile':
            loadProfileData();
            break;
        case 'new-request':
            setupRequestForms();
            break;
    }
}