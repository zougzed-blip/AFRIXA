
import * as API from '../api/admin.api.js';

const EXCHANGE_RATES = {
    USD: 1,
    FC: 2500,  
    ZAR: 17.5   
};

const CURRENCY_SYMBOLS = {
    USD: '$',
    FC: 'FC',
    ZAR: 'R'
};

// ==================== FONCTIONS DE CONVERSION =========================
export function convertToUSD(amount, fromCurrency) {
    if (!amount || amount === 0) return 0;
    if (fromCurrency === 'USD') return amount;
    const rate = EXCHANGE_RATES[fromCurrency];
    if (!rate) return amount;
    return amount / rate;
}

export function convertFromUSD(amountInUSD, toCurrency) {
    if (!amountInUSD || amountInUSD === 0) return 0;
    if (toCurrency === 'USD') return amountInUSD;
    const rate = EXCHANGE_RATES[toCurrency];
    if (!rate) return amountInUSD;
    return amountInUSD * rate;
}

export function formatCurrency(amount, currency = 'USD') {
    if (amount === undefined || amount === null) return '0';
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '0';
    
    const formattedAmount = numAmount.toLocaleString('fr-FR', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
    });
    return `${formattedAmount} ${symbol}`;
}

// ==================== CHARGER DASHBOARD AGENCE ======================
export async function loadAgenceDashboardData() {
    try {
        const agenceStats = await API.loadAgenceDashboardDataAPI();
        
        if (!agenceStats || typeof agenceStats !== 'object') {
            await loadDashboardManually();
            return;
        }

        const normalizedStats = normalizeDashboardStats(agenceStats);

        updateStatistic('total-demandes-agence', normalizedStats.totalDemandes || 0);
        updateStatistic('pending-demandes-agence', normalizedStats.pendingDemandes || 0);
        updateStatistic('acceptees-demandes-agence', normalizedStats.accepteesDemandes || 0);
        updateStatistic('livrees-demandes-agence', normalizedStats.livreesDemandes || 0);
        updateStatistic('annulees-demandes-agence', normalizedStats.annuleesDemandes || 0);
        
        updateStatistic('total-paiements-agence', normalizedStats.totalPaiements || 0);
        updateStatistic('pending-paiements-agence', normalizedStats.pendingPaiements || 0);
        updateStatistic('acceptes-paiements-agence', normalizedStats.acceptesPaiements || 0);
        updateStatistic('refuses-paiements-agence', normalizedStats.refusesPaiements || 0);
        
        await calculateMissingStats(normalizedStats);
        
        setTimeout(() => {
            setupRevenueFilter();
        }, 500);

    } catch (error) {
        await loadDashboardManually();
    }
}

// ==================== NORMALISATION DES STATS ==========================
function normalizeDashboardStats(stats) {
    const normalized = {
        totalDemandes: stats.totalDemandes || 0,
        pendingDemandes: stats.pendingDemandes || 0,
        accepteesDemandes: stats.accepteesDemandes || stats.acceptees || 
                          stats.acceptedDemandes || stats.accepted || 0,
        livreesDemandes: stats.livreesDemandes || stats.livrees || 
                        stats.deliveredDemandes || stats.delivered || 0,
        annuleesDemandes: stats.annuleesDemandes || stats.annulees || 
                         stats.cancelledDemandes || stats.cancelled || 0,
        totalPaiements: stats.totalPaiements || 0,
        pendingPaiements: stats.pendingPaiements || 0,
        acceptesPaiements: stats.acceptesPaiements || stats.acceptedPayments || 
                          stats.acceptedPaiements || 0,
        refusesPaiements: stats.refusesPaiements || stats.refusedPayments || 
                         stats.refusedPaiements || 0,
        revenue: stats.revenue || stats.totalRevenue || 0,
        revenueToday: stats.revenueToday || 0,
        successRate: stats.successRate || '0%'
    };
    
    return normalized;
}

// ==================== CALCUL DES STATS MANQUANTES ==============================
async function calculateMissingStats(stats) {
    if ((stats.accepteesDemandes === 0 || stats.livreesDemandes === 0 || 
         stats.annuleesDemandes === 0 || stats.acceptesPaiements === 0) && 
        stats.totalDemandes > 0) {
        
        try {
            const [demandes, paiements] = await Promise.all([
                API.loadDemandesAgenceDataAPI(),
                API.loadProofsDataAPI()
            ]);
            
            if (demandes && Array.isArray(demandes)) {
                const demandesStats = {
                    acceptees: demandes.filter(d => d.status === 'accepté').length,
                    livrees: demandes.filter(d => d.status === 'livré').length,
                    annulees: demandes.filter(d => d.status === 'annulé').length,
                    encours: demandes.filter(d => d.status === 'en_cours').length
                };
                
                if (demandesStats.acceptees > 0) {
                    updateStatistic('acceptees-demandes-agence', demandesStats.acceptees);
                }
                if (demandesStats.livrees > 0) {
                    updateStatistic('livrees-demandes-agence', demandesStats.livrees);
                    updateStatistic('agence-demandes-livrees', demandesStats.livrees);
                }
                if (demandesStats.annulees > 0) {
                    updateStatistic('annulees-demandes-agence', demandesStats.annulees);
                }
            }
            
            if (paiements && Array.isArray(paiements)) {
                const paiementsStats = {
                    acceptes: paiements.filter(p => p.status === 'accepté').length,
                    refuses: paiements.filter(p => p.status === 'refusé').length,
                    pending: paiements.filter(p => p.status === 'en_attente').length
                };
                
                if (paiementsStats.acceptes > 0) {
                    updateStatistic('acceptes-paiements-agence', paiementsStats.acceptes);
                }
                if (paiementsStats.refuses > 0) {
                    updateStatistic('refuses-paiements-agence', paiementsStats.refuses);
                }
                if (paiementsStats.pending > 0 && stats.pendingPaiements === 0) {
                    updateStatistic('pending-paiements-agence', paiementsStats.pending);
                }
                
                if (paiementsStats.acceptes > 0) {
                    let totalRevenueUSD = 0;
                    paiements.forEach(paiement => {
                        if (paiement.status === 'accepté') {
                            const montant = parseFloat(paiement.montant) || 0;
                            const devise = paiement.devise || 'USD';
                            const amountInUSD = convertToUSD(montant, devise);
                            totalRevenueUSD += amountInUSD;
                        }
                    });
                    
                    if (Math.abs(totalRevenueUSD - stats.revenue) > 1) {
                        updateStatistic('revenue-agence', formatCurrency(totalRevenueUSD, 'USD'));
                        updateStatistic('agence-revenue', formatCurrency(totalRevenueUSD, 'USD'));
                    }
                }
            }
            
        } catch (error) {
        }
    }
    
    const totalDemandes = stats.totalDemandes || 0;
    const livreesDemandesElement = document.getElementById('livrees-demandes-agence');
    const livreesDemandes = livreesDemandesElement ? 
        parseInt(livreesDemandesElement.textContent) || 0 : 
        stats.livreesDemandes || 0;
    
    const successRate = totalDemandes > 0 ? 
        ((livreesDemandes / totalDemandes) * 100).toFixed(1) : 0;
    
    updateStatistic('agence-success-rate', `${successRate}%`);
}

// ==================== CHARGEMENT MANUEL ================================
async function loadDashboardManually() {
    try {
        const [demandes, paiements] = await Promise.all([
            API.loadDemandesAgenceDataAPI(),
            API.loadProofsDataAPI()
        ]);
        
        const stats = {
            totalDemandes: demandes?.length || 0,
            pendingDemandes: demandes?.filter(d => d.status === 'en_attente').length || 0,
            accepteesDemandes: demandes?.filter(d => d.status === 'accepté').length || 0,
            livreesDemandes: demandes?.filter(d => d.status === 'livré').length || 0,
            annuleesDemandes: demandes?.filter(d => d.status === 'annulé').length || 0,
            totalPaiements: paiements?.length || 0,
            pendingPaiements: paiements?.filter(p => p.status === 'en_attente').length || 0,
            acceptesPaiements: paiements?.filter(p => p.status === 'accepté').length || 0,
            refusesPaiements: paiements?.filter(p => p.status === 'refusé').length || 0,
            revenue: 0
        };
        
        if (paiements && paiements.length > 0) {
            let revenueUSD = 0;
            paiements.forEach(paiement => {
                if (paiement.status === 'accepté') {
                    const montant = parseFloat(paiement.montant) || 0;
                    const devise = paiement.devise || 'USD';
                    const amountInUSD = convertToUSD(montant, devise);
                    revenueUSD += amountInUSD;
                }
            });
            stats.revenue = revenueUSD;
        }
        
        updateStatistic('total-demandes-agence', stats.totalDemandes);
        updateStatistic('pending-demandes-agence', stats.pendingDemandes);
        updateStatistic('acceptees-demandes-agence', stats.accepteesDemandes);
        updateStatistic('livrees-demandes-agence', stats.livreesDemandes);
        updateStatistic('annulees-demandes-agence', stats.annuleesDemandes);
        
        updateStatistic('total-paiements-agence', stats.totalPaiements);
        updateStatistic('pending-paiements-agence', stats.pendingPaiements);
        updateStatistic('acceptes-paiements-agence', stats.acceptesPaiements);
        updateStatistic('refuses-paiements-agence', stats.refusesPaiements);
        
        updateStatistic('revenue-agence', formatCurrency(stats.revenue, 'USD'));
        updateStatistic('agence-revenue', formatCurrency(stats.revenue, 'USD'));
        updateStatistic('agence-total-demandes', stats.totalDemandes);
        updateStatistic('agence-demandes-livrees', stats.livreesDemandes);
        
        const successRate = stats.totalDemandes > 0 
            ? ((stats.livreesDemandes / stats.totalDemandes) * 100).toFixed(1) 
            : 0;
        updateStatistic('agence-success-rate', `${successRate}%`);
        
    } catch (error) {
    }
}

export async function loadFilteredRevenue(currency = 'USD', startDate = null, endDate = null) {
    try {
        let url = '/api/admin/agence/dashboard/revenue';
        const params = new URLSearchParams();
        
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        const queryString = params.toString();
        if (queryString) url += '?' + queryString;
        
        const response = await API.apiFetch(url);
        if (!response) {
            updateStatistic('revenue-agence', formatCurrency(0, currency));
            return;
        }
        
        const result = await response.json();
        const paiements = result.paiements || [];
        
        if (paiements.length === 0) {
            updateStatistic('revenue-agence', formatCurrency(0, currency));
            return;
        }

        let totalInUSD = 0;
        
        paiements.forEach(p => {
            const montant = parseFloat(p.montant) || 0;
            const devise = p.devise || 'USD';
            totalInUSD += (montant / EXCHANGE_RATES[devise]);
        });
        
        const totalInTargetCurrency = totalInUSD * EXCHANGE_RATES[currency];
        updateStatistic('revenue-agence', formatCurrency(totalInTargetCurrency, currency));
        
    } catch (error) {
        updateStatistic('revenue-agence', 'Erreur');
    }
}

export function setupRevenueFilter() {
    const currencySelect = document.getElementById('revenue-currency');
    const filterBtn = document.getElementById('filter-revenue-btn');
    const startDateInput = document.getElementById('revenue-date-start');
    const endDateInput = document.getElementById('revenue-date-end');
    
    if (!currencySelect) {
        return;
    }
    
    const applyRevenueFilter = () => {
        const currency = currencySelect.value;
        const startDate = startDateInput?.value || null;
        const endDate = endDateInput?.value || null;
        
        loadFilteredRevenue(currency, startDate, endDate);
    };
    
    currencySelect.addEventListener('change', applyRevenueFilter);
    
    if (filterBtn) {
        filterBtn.addEventListener('click', applyRevenueFilter);
    }
    
    setTimeout(() => {
        applyRevenueFilter();
    }, 1000);
}

// ==================== FONCTIONS UTILITAIRES =================
function updateStatistic(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// ==================== INITIALISATION ===========================
window.DashboardService = {
    convertToUSD,
    convertFromUSD,
    formatCurrency,
    loadAgenceDashboardData,
    loadFilteredRevenue,
    setupRevenueFilter
};

export default {
    convertToUSD,
    convertFromUSD,
    formatCurrency,
    loadAgenceDashboardData,
    loadFilteredRevenue,
    setupRevenueFilter
};