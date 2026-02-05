import * as AuthService from './services/auth.service.js';
import * as Navigation from './ui/navigation.js';
import * as EventHandlers from './ui/event-handlers.js';
import * as Dashboard from './pages/dashboard.js';
import * as BadgeService from './services/badge.service.js';
import * as NotificationService from './services/notification.service.js';

let currentCompanies = [];
let currentUsers = [];
let currentProofs = [];
let currentPropositions = [];
let currentRatings = [];
let currentDemandes = [];
let currentDemandesAgence = [];
let currentHistoriqueAgence = [];
let newProofsCount = 0;
let selectedCompanyForProof = null;

window.currentCompanies = currentCompanies;
window.currentUsers = currentUsers;
window.currentProofs = currentProofs;
window.currentPropositions = currentPropositions;
window.currentRatings = currentRatings;
window.currentDemandes = currentDemandes;
window.currentDemandesAgence = currentDemandesAgence;
window.currentHistoriqueAgence = currentHistoriqueAgence;
window.newProofsCount = newProofsCount;
window.selectedCompanyForProof = selectedCompanyForProof;

document.addEventListener("DOMContentLoaded", async () => {
    
    setCurrentDate();
    await initializeAdminPanel();
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
        dateElement.textContent = now.toLocaleDateString('fr-FR', options);
    }
}

async function initializeAdminPanel() {
    try {
        await AuthService.loadAdminProfile();
        Navigation.setupNavigation();
        EventHandlers.setupEventListeners();
        EventHandlers.setupMobileMenu();
        EventHandlers.setupModals();
        BadgeService.setupBadgesInterval();
        EventHandlers.setupSecureEventHandlers();
        
        Navigation.loadActiveSection();
    
        await BadgeService.updateAllBadges();
        
        await NotificationService.loadAdminNotifications();
        
    } catch (error) {
        EventHandlers.showMessage('Erreur de chargement des données', 'error');
    }
}
export {
    currentCompanies, currentUsers, currentProofs, currentPropositions,
    currentRatings, currentDemandes, currentDemandesAgence, currentHistoriqueAgence,
    newProofsCount, selectedCompanyForProof
}
window.showSection = Navigation.showSection;
window.filterCompanies = EventHandlers.filterCompanies;
window.filterUsers = EventHandlers.filterUsers;
window.sortTable = EventHandlers.sortTable;
window.validateCompany = EventHandlers.validateCompany;
window.toggleUserStatus = EventHandlers.toggleUserStatus;
window.viewProfile = EventHandlers.viewProfile;
window.viewProof = EventHandlers.viewProof;
window.filterProofsByDate = EventHandlers.filterProofsByDate;
window.viewDemandeDetails = EventHandlers.viewDemandeDetails;
window.changePaymentStatus = EventHandlers.changePaymentStatus;
window.filterDemandes = EventHandlers.filterDemandes;
window.viewOfferDetails = EventHandlers.viewOfferDetails;
window.filterPropositions = EventHandlers.filterPropositions;
window.filterRatings = EventHandlers.filterRatings;
window.showAllNotificationsModal = NotificationService.showAllNotificationsModal;
window.markNotificationAsRead = NotificationService.markNotificationAsRead;
window.markAllNotificationsAsRead = NotificationService.markAllNotificationsAsRead;
window.closeModal = EventHandlers.closeModal;
window.logout = EventHandlers.logout;
window.selectCompanyForProof = EventHandlers.selectCompanyForProof;
window.sendProofToCompany = EventHandlers.sendProofToCompany;
window.filterDemandesAgence = EventHandlers.filterDemandesAgence;
window.openDemandeAgenceStatusModal = EventHandlers.openDemandeAgenceStatusModal;
window.updateDemandeAgenceStatus = EventHandlers.updateDemandeAgenceStatus;
window.openDemandeAgenceAdjustModal = EventHandlers.openDemandeAgenceAdjustModal;
window.adjustDemandeAgenceWeight = EventHandlers.adjustDemandeAgenceWeight;
window.viewDemandeAgenceDetails = EventHandlers.viewDemandeAgenceDetails;
window.filterHistoriqueAgence = EventHandlers.filterHistoriqueAgence;
window.loadFilteredRevenue = Dashboard.loadFilteredRevenue;
window.setupRevenueFilter = Dashboard.setupRevenueFilter;
window.loadRecentActivities = Dashboard.loadRecentActivities;
window.loadRecentDemandesAgence = Dashboard.loadRecentDemandesAgence;