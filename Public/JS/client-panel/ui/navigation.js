function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            if (this.classList.contains('logout')) return;

            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

            const pageId = this.getAttribute('data-page');
            const targetSection = document.getElementById(pageId);
            if (targetSection) {
                targetSection.classList.add('active');

                switch (pageId) {
                    case 'dashboard': loadDashboardData(); break;
                    case 'requests': loadClientRequests(); break;
                    case 'history': loadClientHistory(); break;
                    case 'profile': loadProfileData(); break;
                    case 'new-request': setupRequestForms(); break;
                }
            }

            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('active')) sidebar.classList.remove('active');
        });
    });
}

function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }
}

function setupQuickActions() {
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function () {
            const pageId = this.getAttribute('data-page');
            if (pageId) {
                const targetNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
                if (targetNav) targetNav.click();
            }
        });
    });
}