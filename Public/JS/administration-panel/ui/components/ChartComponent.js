import { ChartService } from '../../services/chart.service.js';

export class ChartComponent {
    constructor(containerId) {
        this.containerId = containerId;
        this.chartService = new ChartService();
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="chart-wrapper">
                <div class="chart-header">
                    <h3> Évolution</h3>
                    <select id="chart-period" class="chart-select">
                        <option value="7">7 jours</option>
                        <option value="15">15 jours</option>
                        <option value="30" selected>30 jours</option>
                        <option value="90">90 jours</option>
                    </select>
                </div>
                <div class="chart-container">
                    <canvas id="evolutionChart" height="400"></canvas>
                </div>
                <div id="chart-stats" class="chart-stats"></div>
            </div>
        `;

        document.getElementById('chart-period').addEventListener('change', (e) => {
            this.loadData(parseInt(e.target.value));
        });

        this.loadData(30);
    }

    async loadData(jours) {
        const data = await this.chartService.loadChartData(jours);
        if (data) this.chartService.createChart('evolutionChart', data);
    }

    destroy() {
        this.chartService.destroy();
    }
}