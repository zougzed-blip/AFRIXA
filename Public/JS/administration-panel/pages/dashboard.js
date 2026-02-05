
import * as API from '../api/admin.api.js';
import * as DashboardService from '../services/dashboard.service.js';
import * as Utils from '../utils/helpers.js';
import * as MessageBox from '../ui/components/message-box.js';

// ==================== DASHBOARD PRINCIPAL ==============================
export async function loadDashboardPage() {
    try {
        
        const data = await API.loadDashboardDataAPI();
        
        
        if (!data) {
            return;
        }
        
        updateStatistic('total-users', data.totalUsers || 0);
        updateStatistic('total-agences', data.agences || 0);
        updateStatistic('pending-count', data.pendingValidation || 0);
        updateStatistic('active-agences', data.activeAgences || data.agences || 0);
     
        await loadAgenceDashboardData();
        await loadRecentActivities();
        await loadRecentDemandesAgence();

        setTimeout(() => {
            DashboardService.setupRevenueFilter();
        }, 1000);
        
        
    } catch (error) {
        MessageBox.showMessage('Erreur de chargement des données du dashboard', 'error');
    }
}

// ==================== STATS AGENCE ====================================
async function loadAgenceDashboardData() {
    try {
        const agenceStats = await API.loadAgenceDashboardDataAPI();
        
        if (!agenceStats) {
            return;
        }
        
        updateStatistic('total-demandes-agence', agenceStats.totalDemandes || 0);
        updateStatistic('pending-demandes-agence', agenceStats.pendingDemandes || 0);
        updateStatistic('acceptees-demandes-agence', agenceStats.accepteesDemandes || 0);
        updateStatistic('livrees-demandes-agence', agenceStats.livreesDemandes || 0);
        updateStatistic('annulees-demandes-agence', agenceStats.annuleesDemandes || 0);
        
        updateStatistic('total-paiements-agence', agenceStats.totalPaiements || 0);
        updateStatistic('pending-paiements-agence', agenceStats.pendingPaiements || 0);
        updateStatistic('acceptes-paiements-agence', agenceStats.acceptesPaiements || 0);
        updateStatistic('refuses-paiements-agence', agenceStats.refusesPaiements || 0);
        
        const revenue = agenceStats.revenue || 0;
        updateStatistic('revenue-agence', DashboardService.formatCurrency(revenue, 'USD'));
        
        updateStatistic('agence-total-demandes', agenceStats.totalDemandes || 0);
        updateStatistic('agence-demandes-livrees', agenceStats.livreesDemandes || 0);
        updateStatistic('agence-revenue', DashboardService.formatCurrency(revenue, 'USD'));
        updateStatistic('agence-success-rate', agenceStats.successRate || '0%');
        
        
    } catch (error) {
    }
}

// ==================== ACTIVITÉS RÉCENTES ==============================
export async function loadRecentActivities() {
    try {
        const response = await API.apiFetch('/api/admin/activities');
        
        if (!response || !response.ok) {
            showEmptyState('recent-activities', 'Aucune activité récente');
            return;
        }
        
        const activities = await response.json();
        
        
        if (!activities || activities.length === 0) {
            showEmptyState('recent-activities', 'Aucune activité récente');
            return;
        }
        
        displayRecentActivities(activities);
        
        
    } catch (error) {
        showEmptyState('recent-activities', 'Erreur de chargement');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function displayRecentActivities(activities) {
    const container = document.getElementById('recent-activities');
    if (!container) {
        return;
    }

    container.innerHTML = '';
    
    activities.forEach(act => {
        const user = act.user;
        const name = Utils.getUserName(user);
        const role = Utils.getRoleLabel(user.role);
        const phone = Utils.getUserPhone(user);
        const date = Utils.formatDate(act.createdAt);

        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'activity-avatar';
        avatarDiv.textContent = Utils.getInitials(name);
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'activity-info';
        
        const nameP = document.createElement('p');
        const nameStrong = document.createElement('strong');
        nameStrong.textContent = escapeHtml(name);
        nameP.appendChild(nameStrong);
        
        const roleP = document.createElement('p');
        roleP.className = 'activity-role';
        roleP.textContent = escapeHtml(role);
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'activity-time';
        timeSpan.textContent = escapeHtml(date);
        
        infoDiv.appendChild(nameP);
        infoDiv.appendChild(roleP);
        infoDiv.appendChild(timeSpan);
        
        if (phone !== 'Non renseigné') {
            const phoneSpan = document.createElement('span');
            phoneSpan.className = 'activity-phone';
            phoneSpan.textContent = escapeHtml(phone);
            infoDiv.appendChild(phoneSpan);
        }
        
        activityItem.appendChild(avatarDiv);
        activityItem.appendChild(infoDiv);
        
        container.appendChild(activityItem);
    });
}

// ==================== DEMANDES AGENCE RECENTES ========================
export async function loadRecentDemandesAgence() {
    try {
        const response = await API.apiFetch('/api/admin/agence/demandes');
        
        if (!response || !response.ok) {
            showEmptyState('recent-agence-demands', 'Aucune demande d\'agence récente');
            return;
        }
        
        const result = await response.json();
        const demandes = result.success ? result.data : result;
        
        
        if (!Array.isArray(demandes) || demandes.length === 0) {
            showEmptyState('recent-agence-demands', 'Aucune demande d\'agence récente');
            return;
        }
 
        const recentDemandes = demandes.slice(0, 5);
        displayRecentDemandesAgence(recentDemandes);
        
        
    } catch (error) {
        showEmptyState('recent-agence-demands', 'Erreur de chargement');
    }
}

function displayRecentDemandesAgence(demandes) {
    const container = document.getElementById('recent-agence-demands');
    if (!container) {
        return;
    }
    
    container.innerHTML = '';
    
    demandes.forEach(demande => {
        const agenceName = demande.agenceName || 
                          demande.agence?.agence?.agenceName || 
                          demande.agence?.email || 
                          'Agence';
        
        const requestItem = document.createElement('div');
        requestItem.className = 'request-item';
        
        const requestHeader = document.createElement('div');
        requestHeader.className = 'request-header';
        
        const codeDiv = document.createElement('div');
        codeDiv.className = 'request-code';
        codeDiv.textContent = escapeHtml(demande.codeColis || 'N/A');
        
        const dateDiv = document.createElement('div');
        dateDiv.className = 'request-date';
        dateDiv.textContent = escapeHtml(Utils.formatDate(demande.date || demande.createdAt));
        
        requestHeader.appendChild(codeDiv);
        requestHeader.appendChild(dateDiv);
        
        const requestContent = document.createElement('div');
        requestContent.className = 'request-content';
        
        const routeDiv = document.createElement('div');
        routeDiv.className = 'request-route';
        const routeIcon = document.createElement('i');
        routeIcon.className = 'fas fa-route';
        routeDiv.appendChild(routeIcon);
        routeDiv.appendChild(document.createTextNode(` ${escapeHtml(demande.destination || 'N/A')}`));
        
        const clientDiv = document.createElement('div');
        clientDiv.className = 'request-client';
        const clientIcon = document.createElement('i');
        clientIcon.className = 'fas fa-user';
        clientDiv.appendChild(clientIcon);
        clientDiv.appendChild(document.createTextNode(` ${escapeHtml(demande.fullName || 'N/A')} • ${escapeHtml(demande.telephone || 'N/A')}`));
        
        const agenceDiv = document.createElement('div');
        agenceDiv.className = 'request-agence';
        const agenceIcon = document.createElement('i');
        agenceIcon.className = 'fas fa-building';
        agenceDiv.appendChild(agenceIcon);
        agenceDiv.appendChild(document.createTextNode(` ${escapeHtml(agenceName)}`));
        
        requestContent.appendChild(routeDiv);
        requestContent.appendChild(clientDiv);
        requestContent.appendChild(agenceDiv);
        
        const requestFooter = document.createElement('div');
        requestFooter.className = 'request-footer';
        
        const statusSpan = document.createElement('span');
        statusSpan.className = `status-badge status-${demande.status || 'en_attente'}`;
        statusSpan.textContent = Utils.getAgenceStatusText(demande.status);
        
        const viewButton = document.createElement('button');
        viewButton.className = 'btn-view-small';
        viewButton.setAttribute('data-action', 'view-demande-agence-details');
        viewButton.setAttribute('data-demande-id', demande._id);
        const viewIcon = document.createElement('i');
        viewIcon.className = 'fas fa-eye';
        viewButton.appendChild(viewIcon);
        
        requestFooter.appendChild(statusSpan);
        requestFooter.appendChild(viewButton);
        
        requestItem.appendChild(requestHeader);
        requestItem.appendChild(requestContent);
        requestItem.appendChild(requestFooter);
        
        container.appendChild(requestItem);
    });
}

// ==================== FONCTIONS UTILITAIRES ============================
function updateStatistic(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value || 0;
    }
}

function showEmptyState(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        const icon = document.createElement('i');
        icon.className = 'fas fa-inbox';
        const p = document.createElement('p');
        p.textContent = escapeHtml(message);
        emptyState.appendChild(icon);
        emptyState.appendChild(p);
        container.appendChild(emptyState);
    }
}

// ==================== EXPORTS ==========================================

window.loadDashboardPage = loadDashboardPage;
window.loadRecentActivities = loadRecentActivities;
window.loadRecentDemandesAgence = loadRecentDemandesAgence;

export const loadFilteredRevenue = DashboardService.loadFilteredRevenue;
export const setupRevenueFilter = DashboardService.setupRevenueFilter;