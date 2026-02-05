function showPopup(message, type = 'info') {
    let container = document.getElementById('popup-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'popup-container';
        container.className = 'popup-container';
        document.body.appendChild(container);
    }

    const popup = document.createElement('div');
    popup.className = `popup-message ${type}`;

    popup.innerHTML = sanitizeHtml(`
        <i class="fas ${escapeHtml(getPopupIcon(type))}"></i>
        <span>${escapeHtml(message)}</span>
        <button class="popup-close">×</button>
    `);

    container.appendChild(popup);

    const closeBtn = popup.querySelector('.popup-close');
    closeBtn.addEventListener('click', () => {
        popup.style.animation = 'popupSlideOut 0.3s ease';
        setTimeout(() => popup.remove(), 300);
    });

    setTimeout(() => {
        if (popup.parentElement) {
            popup.style.animation = 'popupSlideOut 0.3s ease';
            setTimeout(() => popup.remove(), 300);
        }
    }, 5000);
}

function getPopupColor(type) {
    switch (type) {
        case 'success': return 'var(--success)';
        case 'error': return 'var(--danger)';
        case 'warning': return 'var(--warning)';
        case 'info': return 'var(--dore)';
        default: return 'var(--vert-fonce)';
    }
}

function getPopupIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-info-circle';
    }
}

function showConfirmPopup(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-popup-overlay';

        const confirmPopup = document.createElement('div');
        confirmPopup.className = 'confirm-popup';

        confirmPopup.innerHTML = sanitizeHtml(`
            <div class="confirm-popup-content">
                <i class="fas fa-question-circle confirm-popup-icon"></i>
                <h3 class="confirm-popup-title">Confirmation</h3>
                <p class="confirm-popup-message">${escapeHtml(message)}</p>
            </div>
            <div class="confirm-popup-actions">
                <button class="btn-confirm-no">Non</button>
                <button class="btn-confirm-yes">Oui</button>
            </div>
        `);

        overlay.appendChild(confirmPopup);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        const noBtn = overlay.querySelector('.btn-confirm-no');
        const yesBtn = overlay.querySelector('.btn-confirm-yes');

        const closePopup = (result) => {
            overlay.style.animation = 'confirmPopupOut 0.3s ease';
            setTimeout(() => {
                if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
                document.body.style.overflow = 'auto';
            }, 300);
            resolve(result);
        };

        noBtn.addEventListener('click', () => closePopup(false));
        yesBtn.addEventListener('click', () => closePopup(true));
        overlay.addEventListener('click', (e) => e.target === overlay && closePopup(false));
    });
}