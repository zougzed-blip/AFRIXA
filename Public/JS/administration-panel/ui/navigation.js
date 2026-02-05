
import * as Pages from '../pages/index.js';
import * as BadgeService from '../services/badge.service.js';

export function setupNavigation() {
    document.querySelectorAll('.nav-item a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const sectionId = this.getAttribute('href').substring(1);
                showSection(sectionId);

                handleSectionVisit(sectionId);
  
                if (window.innerWidth <= 1024) {
                    const sidebar = document.querySelector('.sidebar');
                    if (sidebar) sidebar.classList.remove('active');
                }
            }
        });
    });
}

export function showSection(sectionId) {
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    
   
    const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
    if (activeLink) {
        activeLink.parentElement.classList.add('active');
    }
    
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    updatePageTitle(sectionId);
 
    loadSectionData(sectionId);
}

export function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            if (window.loadDashboardPage) window.loadDashboardPage();
            break;
        case 'validation':
            if (window.loadValidationPage) window.loadValidationPage();
            break;
        case 'utilisateurs':
            if (window.loadUsersPage) window.loadUsersPage();
            break;
        case 'paiements':
            if (window.loadProofsPage) window.loadProofsPage();
            break;
        case 'demandes-agence':
            if (window.loadDemandesAgencePage) window.loadDemandesAgencePage();
            break;
   
        case 'ratings':
            if (window.loadRatingsPage) window.loadRatingsPage();
            break;
        default:
            if (window.loadDashboardPage) window.loadDashboardPage();
            break;
    }
}

export function loadActiveSection() {
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) return;
    
    loadSectionData(activeSection.id);
}

function handleSectionVisit(sectionId) {
    const now = new Date().toISOString();
    
    switch(sectionId) {
        case 'paiements':
            localStorage.setItem('lastProofsViewed', now);
            if (window.badgeCounts) window.badgeCounts.proofs = 0;
            updateBadge('new-proofs-count', 0);
            break;
        case 'demandes-agence':
            localStorage.setItem('lastDemandesAgenceViewed', now);
            if (window.badgeCounts) window.badgeCounts.demandesAgence = 0;
            updateBadge('demandes-agence-badge', 0);
            break;
        case 'ratings':
            localStorage.setItem('lastRatingsViewed', now);
            if (window.badgeCounts) window.badgeCounts.ratings = 0;
            updateBadge('ratings-badge', 0);
            break;
    }
}

function updatePageTitle(sectionId) {
    const titles = {
        'dashboard': 'Tableau de Bord',
        'validation': 'Validation des Sociétés',
        'utilisateurs': 'Gestion des Utilisateurs',
        'demandes-agence': 'Demandes d\'Agence',
        'paiements': 'Preuves de Paiement',
        'ratings': 'Évaluations',
      
    };
    
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionId] || 'Tableau de Bord';
    }
}

function updateBadge(badgeId, count) {
    const badge = document.getElementById(badgeId);
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

window.showSection = showSection;