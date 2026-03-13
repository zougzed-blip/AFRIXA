import { getChartEvolutionAPI } from '../api/admin.api.js';
import { convertToUSD } from './dashboard.service.js';

export class ChartService {
    constructor() {
        this.chart = null;
        this.abortController = null;
    }


    #handleError(error, context) {
        console.error(`[ChartService] Erreur ${context}:`, error);
        return null;
    }

    #validateData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Données invalides');
        }
        if (!Array.isArray(data.labels)) {
            throw new Error('Labels invalides');
        }
        return true;
    }

    #validateNumber(value, defaultValue = 0) {
        const num = Number(value);
        return !isNaN(num) && isFinite(num) ? num : defaultValue;
    }

    async loadChartData(jours = 30) {

        const period = this.#validateNumber(jours, 30);
        if (period <= 0) period = 30;

 
        if (this.abortController) {
            this.abortController.abort();
        }
        
        this.abortController = new AbortController();

        try {
            const response = await getChartEvolutionAPI(period);
            
            if (!response?.success || !response?.data) {
                throw new Error('Réponse API invalide');
            }
            
            const data = response.data;
 
            if (!Array.isArray(data.demandes) || !Array.isArray(data.paiements)) {
                throw new Error('Format de données invalide');
            }

            const paiementsConverted = [];
            let totalPaiementsUSD = 0;
            
            for (const jourPaiements of data.paiements) {
                let totalJourUSD = 0;
                
                if (Array.isArray(jourPaiements) && jourPaiements.length > 0) {
                    for (const p of jourPaiements) {
                        const montant = this.#validateNumber(p?.montant);
                        const devise = p?.devise || 'USD';
                        
                        if (montant > 0) {
                            const montantUSD = convertToUSD(montant, devise);
                            totalJourUSD += this.#validateNumber(montantUSD);
                        }
                    }
                }
                
                paiementsConverted.push(Number(totalJourUSD.toFixed(2)));
                totalPaiementsUSD += totalJourUSD;
            }

            const totalDemandes = data.demandes.reduce((acc, val) => 
                acc + this.#validateNumber(val), 0
            );

            return {
                labels: Array.isArray(data.labels) ? data.labels : [],
                demandes: data.demandes.map(v => this.#validateNumber(v)),
                paiements: paiementsConverted,
                stats: {
                    totalDemandes,
                    totalPaiements: Number(totalPaiementsUSD.toFixed(2)),
                    moyenneDemandesParJour: (totalDemandes / period).toFixed(1),
                    moyennePaiementsParJour: (totalPaiementsUSD / period).toFixed(2)
                }
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                return null; 
            }
            return this.#handleError(error, 'loadChartData');
        } finally {
            this.abortController = null;
        }
    }

    createChart(canvasId, data) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`Canvas "${canvasId}" introuvable`);
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Impossible d\'obtenir le contexte 2D');
            }

            this.#validateData(data);
            
            if (!Array.isArray(data.demandes) || !Array.isArray(data.paiements)) {
                throw new Error('Données de chart invalides');
            }

            this.destroy();

            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels.slice(0, 100), 
                    datasets: [
                        {
                            label: 'Demandes',
                            data: data.demandes.map(v => this.#validateNumber(v)),
                            borderColor: '#C59B33',
                            backgroundColor: 'rgba(197, 155, 51, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            yAxisID: 'y-demandes'
                        },
                        {
                            label: 'Montants (USD)',
                            data: data.paiements.map(v => this.#validateNumber(v)),
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            yAxisID: 'y-montants'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 500 
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        title: { 
                            display: true, 
                            text: ' Évolution des demandes et paiements',
                            font: { size: 14 }
                        },
                        tooltip: {
                            enabled: true,
                            callbacks: {
                                label: (context) => {
                                    const label = context.dataset.label || '';
                                    const value = context.raw;
                                    if (context.dataset.label.includes('Montants')) {
                                        return `${label}: $${Number(value).toFixed(2)}`;
                                    }
                                    return `${label}: ${Number(value)}`;
                                }
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        'y-demandes': { 
                            position: 'left', 
                            title: { display: true, text: 'Nombre' },
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                callback: v => Math.floor(v)
                            }
                        },
                        'y-montants': { 
                            position: 'right', 
                            title: { display: true, text: 'Montant (USD)' },
                            grid: { drawOnChartArea: false },
                            beginAtZero: true,
                            ticks: { 
                                callback: v => '$' + Number(v).toLocaleString()
                            }
                        }
                    }
                }
            });

            this.updateStats(data.stats);

        } catch (error) {
            this.#handleError(error, 'createChart');
        }
    }

    updateStats(stats) {
        try {
            const el = document.getElementById('chart-stats');
            if (!el) return;

            const validStats = {
                totalDemandes: this.#validateNumber(stats?.totalDemandes),
                totalPaiements: this.#validateNumber(stats?.totalPaiements),
                moyenneDemandesParJour: stats?.moyenneDemandesParJour || '0',
                moyennePaiementsParJour: stats?.moyennePaiementsParJour || '0'
            };

            const escapeHtml = (str) => {
                if (!str) return '';
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            };

            el.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Total demandes:</span>
                    <span class="stat-value">${escapeHtml(validStats.totalDemandes)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total paiements:</span>
                    <span class="stat-value">$${escapeHtml(validStats.totalPaiements.toLocaleString())}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Moy. demandes/jour:</span>
                    <span class="stat-value">${escapeHtml(validStats.moyenneDemandesParJour)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Moy. paiements/jour:</span>
                    <span class="stat-value">$${escapeHtml(validStats.moyennePaiementsParJour)}</span>
                </div>
            `;
        } catch (error) {
            this.#handleError(error, 'updateStats');
        }
    }

    destroy() {
        try {
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }

            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
        } catch (error) {
            this.#handleError(error, 'destroy');
        }
    }
}