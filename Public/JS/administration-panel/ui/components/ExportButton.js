import { exportDataByDateAPI } from '../../api/admin.api.js';

export function createExportButton(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    const html = `
        <button class="export-btn" id="exportBtn">
            <i class="fas fa-download"></i>
            <span>Export CSV</span>
        </button>
    `;
    
    container.innerHTML = html;
    
    const button = document.getElementById('exportBtn');
    button.addEventListener('click', async () => {
        const dateInput = document.getElementById(options.datePickerId || 'exportDate');
        const date = dateInput?.value;
        
        if (!date) {
            alert('Choisis une date mon bro!');
            return;
        }
        
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Export...';
        
        await exportDataByDateAPI(date);
        
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-download"></i> Export CSV';
    });
    
    return button;
}