import { ChartService } from '../../services/chart.service.js';

export class ChartComponent {
    constructor(containerId) {
        if (!containerId || typeof containerId !== 'string') {
            throw new Error('ID de conteneur invalide');
        }
        
        this.containerId = containerId;
        this.chartService = new ChartService();
        this.abortController = null;
        this.eventListeners = [];
    }

    // ===== GESTION DES ERREURS =====
    #handleError(context) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="chart-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur de chargement du graphique</p>
                <button class="btn-retry">Réessayer</button>
            </div>
        `;
        
        const retryBtn = container.querySelector('.btn-retry');
        if (retryBtn) {
            const handler = () => this.render();
            retryBtn.addEventListener('click', handler);
            this.eventListeners.push({ element: retryBtn, type: 'click', handler });
        }
    }

    // ===== NETTOYAGE DES EVENT LISTENERS =====
    #removeEventListeners() {
        this.eventListeners.forEach(({ element, type, handler }) => {
            if (element && handler) {
                element.removeEventListener(type, handler);
            }
        });
        this.eventListeners = [];
    }

    // ===== VALIDATION DES DONNÉES =====
    #validateNumber(value, defaultValue = 30) {
        const num = parseInt(value);
        return !isNaN(num) && num > 0 ? num : defaultValue;
    }

    #createChartHTML() {
        const escapeHtml = (str) => {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        const title = escapeHtml('Évolution');
        const timestamp = Date.now();
        
        return `
            <div class="chart-wrapper">
                <div class="chart-header">
                    <h3>${title}</h3>
                    <select id="chart-period-${timestamp}" class="chart-select">
                        <option value="7">7 jours</option>
                        <option value="15">15 jours</option>
                        <option value="30" selected>30 jours</option>
                        <option value="90">90 jours</option>
                    </select>
                </div>
                <div class="chart-container">
                    <canvas id="evolutionChart-${timestamp}" height="400"></canvas>
                </div>
                <div id="chart-stats-${timestamp}" class="chart-stats"></div>
            </div>
        `;
    }

    render() {
        try {
            const container = document.getElementById(this.containerId);
            if (!container) {
                throw new Error('Conteneur introuvable');
            }

            this.destroy();

            if (this.abortController) {
                this.abortController.abort();
            }
            this.abortController = new AbortController();

            const timestamp = Date.now();
            const selectId = `chart-period-${timestamp}`;
            const canvasId = `evolutionChart-${timestamp}`;
            const statsId = `chart-stats-${timestamp}`;

            container.innerHTML = this.#createChartHTML();

            const select = container.querySelector('.chart-select');
            const canvas = container.querySelector('.chart-container canvas');
            const stats = container.querySelector('.chart-stats');
            
            if (select) select.id = selectId;
            if (canvas) canvas.id = canvasId;
            if (stats) stats.id = statsId;

            const periodSelect = document.getElementById(selectId);
            if (periodSelect) {
                const handler = async (e) => {
                    try {
                        const jours = this.#validateNumber(e.target.value, 30);
                        await this.loadData(jours, canvasId, statsId);
                    } catch {
                        this.#handleError('periodChange');
                    }
                };
                
                periodSelect.addEventListener('change', handler);
                this.eventListeners.push({ element: periodSelect, type: 'change', handler });
            }

            this.loadData(30, canvasId, statsId);

        } catch {
            this.#handleError('render');
        }
    }

    async loadData(jours, canvasId, statsId) {
        try {
            const period = this.#validateNumber(jours, 30);
            
            if (!canvasId || !statsId) {
                throw new Error('IDs manquants');
            }

            this.chartService.destroy();

            const data = await this.chartService.loadChartData(period, this.abortController?.signal);
            
            if (!data) {
                throw new Error('Données manquantes');
            }

            this.chartService.createChart(canvasId, data);

        } catch (error) {
            if (error.name === 'AbortError') return;
            this.#handleError('loadData');
        }
    }

    destroy() {
        try {
            this.#removeEventListeners();

            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }
            
            if (this.chartService) {
                this.chartService.destroy();
            }

            const container = document.getElementById(this.containerId);
            if (container) {
                container.innerHTML = '';
            }
        } catch {
        
        }
    }
}