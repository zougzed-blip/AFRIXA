export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function sanitizeHtml(dirty) {
  return DOMPurify.sanitize(dirty, { 
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
    ALLOWED_ATTR: ['href']
  });
}

// ==================== MESSAGE BOX  =====================================
export function showConfirm(message, onConfirm, onCancel = null) {
    const alertBox = document.getElementById('customAlert');
    const overlay = document.getElementById('customAlertOverlay');
    const messageEl = document.getElementById('customAlertMessage');
    const titleEl = document.getElementById('customAlertTitle');
    const confirmBtn = document.getElementById('customAlertConfirm');
    const cancelBtn = document.getElementById('customAlertCancel');
 
    let type = 'info';
    if (message.toLowerCase().includes('erreur')) type = 'error';
    if (message.toLowerCase().includes('succès') || message.toLowerCase().includes('accepté')) type = 'success';
    if (message.toLowerCase().includes('attention') || message.toLowerCase().includes('avertissement')) type = 'warning';
    
    messageEl.textContent = message;
    titleEl.textContent = getAlertTitle(type);
    
    const header = document.getElementById('customAlertHeader');
    header.className = `custom-alert-header ${type}`;
    header.querySelector('i').className = `fas ${getAlertIcon(type)}`;
   
    alertBox.classList.add('active');
    overlay.classList.add('active');

    const handleConfirm = () => {
        cleanup();
        if (onConfirm) onConfirm();
    };
    
    const handleCancel = () => {
        cleanup();
        if (onCancel) onCancel();
    };
    
    const handleKeydown = (e) => {
        if (e.key === 'Escape') handleCancel();
        if (e.key === 'Enter') handleConfirm();
    };
    
    const cleanup = () => {
        alertBox.classList.remove('active');
        overlay.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        document.removeEventListener('keydown', handleKeydown);
        overlay.removeEventListener('click', handleCancel);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    document.addEventListener('keydown', handleKeydown);
    overlay.addEventListener('click', handleCancel);
}

export function showMessageBox(message, type = 'info') {
    const messageBox = document.getElementById('customMessage');
    const overlay = document.getElementById('customMessageOverlay');
    const messageEl = document.getElementById('customMessageText');
    const titleEl = document.getElementById('customMessageTitle');
    const okBtn = document.getElementById('customMessageOk');
    
    messageEl.textContent = message;
    titleEl.textContent = getAlertTitle(type);
    
    const header = document.getElementById('customMessageHeader');
    header.className = `custom-alert-header ${type}`;
    header.querySelector('i').className = `fas ${getAlertIcon(type)}`;
    
    messageBox.classList.add('active');
    overlay.classList.add('active');
   
    const handleClose = () => {
        messageBox.classList.remove('active');
        overlay.classList.remove('active');
        okBtn.removeEventListener('click', handleClose);
        document.removeEventListener('keydown', handleKeydown);
        overlay.removeEventListener('click', handleClose);
    };
    
    const handleKeydown = (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') handleClose();
    };
    
    okBtn.addEventListener('click', handleClose);
    document.addEventListener('keydown', handleKeydown);
    overlay.addEventListener('click', handleClose);
}

export function showMessage(message, type = 'info') {
    let container = document.getElementById('popup-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'popup-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    const popup = document.createElement('div');
    popup.className = `popup-message ${type}`;
    popup.style.cssText = `
    background: var(--blanc);
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 12px;
    animation: popupSlideIn 0.3s ease;
    max-width: 400px;
    width: 100%;
    border: 1px solid var(--gris-clair); 
`;
    
    const messageSpan = document.createElement('span');
    messageSpan.style.cssText = 'flex: 1; color: var(--gris-fonce);';
    messageSpan.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-close';
    closeButton.setAttribute('data-action', 'close-popup');
    closeButton.style.cssText = `
        background: none;
        border: none;
        font-size: 1.3rem;
        cursor: pointer;
        color: var(--gris-moyen);
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeButton.textContent = '×';
    
    const icon = document.createElement('i');
    icon.className = `fas ${getPopupIcon(type)}`;
    icon.style.fontSize = '1.3rem';
    icon.style.color = getIconColor(type);
    
    popup.appendChild(icon);
    popup.appendChild(messageSpan);
    popup.appendChild(closeButton);
    
    container.appendChild(popup);
    
    closeButton.addEventListener('click', () => {
        if (popup.parentElement) {
            popup.style.animation = 'popupSlideOut 0.3s ease';
            setTimeout(() => popup.remove(), 300);
        }
    });
    
    setTimeout(() => {
        if (popup.parentElement) {
            popup.style.animation = 'popupSlideOut 0.3s ease';
            setTimeout(() => popup.remove(), 300);
        }
    }, 5000);
}

// ==================== FONCTIONS UTILITAIRES ============================
function getAlertTitle(type) {
    switch(type) {
        case 'success': return 'Succès';
        case 'error': return 'Erreur';
        case 'warning': return 'Attention';
        default: return 'Information';
    }
}

function getAlertIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function getPopupColor(type) {
    switch(type) {
        case 'success': return 'var(--success)';
        case 'error': return 'var(--danger)';
        case 'warning': return 'var(--warning)';
        case 'info': return '#ffffff';
        default: return 'var(--vert-fonce)';
    }
}

function getIconColor(type) {
    switch(type) {
        case 'success': return 'var(--success)';
        case 'error': return 'var(--danger)';
        case 'warning': return 'var(--warning)';
        case 'info': return 'var(--gris-fonce)';
        default: return 'var(--vert-fonce)';
    }
}

function getPopupIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-info-circle';
    }
}