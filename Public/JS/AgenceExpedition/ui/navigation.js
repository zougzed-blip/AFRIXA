function initializePanel() {
    setupNavigation();
    setupEventListeners();
    loadDemandes();
    startBadgeAutoRefresh();
    
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (input.id.includes('start')) {
            input.value = lastMonth.toISOString().split('T')[0];
        }
        if (input.id.includes('end')) {
            input.value = today.toISOString().split('T')[0];
        }
    });
    
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-item a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') && this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const sectionId = this.getAttribute('href').substring(1);
                showSection(sectionId);
                
                if (window.innerWidth <= 1024) {
                    document.getElementById('sidebar').classList.remove('active');
                }
            }
        });
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
    if (activeLink) activeLink.parentElement.classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    const activeSection = document.getElementById(sectionId);
    if (activeSection) activeSection.classList.add('active');
    
    switch(sectionId) {
        case 'demandes':
            getCurrentTotal('demandes').then(total => {
                setSeenCount('demandes', total);
                updateBadge('demandes', total);
            });
            loadDemandes();
            break;
            
        case 'paiements':
            getCurrentTotal('paiements').then(total => {
                setSeenCount('paiements', total);
                updateBadge('paiements', total);
            });
            loadPaiements();
            break;
            
        case 'historique':
            loadHistorique();
            break;
            
        case 'parametres':
            loadProfileData();
            break;
    }
}

window.initializePanel = initializePanel;
window.setupNavigation = setupNavigation;
window.showSection = showSection;