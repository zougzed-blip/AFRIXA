export function createDatePicker(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    const html = `
        <div class="date-picker-wrapper">
            <input 
                type="date" 
                id="exportDate" 
                class="date-input"
                max="${options.maxDate || '2026-12-31'}"
                value="${options.defaultDate || '2026-01-23'}"
            >
        </div>
    `;
    
    container.innerHTML = html;
    
    const input = document.getElementById('exportDate');
    if (options.onChange) {
        input.addEventListener('change', (e) => options.onChange(e.target.value));
    }
    
    return input;
}