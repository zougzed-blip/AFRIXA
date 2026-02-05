function createMessageBox() {
    if (document.getElementById('messageBox')) return;
    
    const messageBox = document.createElement('div');
    messageBox.id = 'messageBox';
    messageBox.className = 'message-box';
    
    messageBox.innerHTML = `
        <div>
            <div class="message-icon">
                <i class="fas fa-info-circle"></i>
            </div>
            <div>
                <div class="message-detail"></div>
            </div>
            <button onclick="closeMessageBox()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(messageBox);
}

function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;
    
    const messageIcon = messageBox.querySelector('.message-icon i');
    const messageDetail = messageBox.querySelector('.message-detail');

    if (!messageIcon || !messageDetail) return;

    messageDetail.textContent = escapeHtml(message);

    switch(type) {
        case 'success':
            messageIcon.className = 'fas fa-check-circle';
            messageIcon.style.color = '#28a745';
            messageBox.style.backgroundColor = '#f0f9f0';
            break;
        case 'error':
            messageIcon.className = 'fas fa-exclamation-circle';
            messageIcon.style.color = '#dc3545';
            messageBox.style.backgroundColor = '#fdf3f3';
            break;
        case 'warning':
            messageIcon.className = 'fas fa-exclamation-triangle';
            messageIcon.style.color = '#ffc107';
            messageBox.style.backgroundColor = '#fff9e6';
            break;
        default:
            messageIcon.className = 'fas fa-info-circle';
            messageIcon.style.color = '#17a2b8';
            messageBox.style.backgroundColor = '#f0f8ff';
    }

    messageBox.style.display = 'block';

    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

function closeMessageBox() {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.style.display = 'none';
    }
}

window.createMessageBox = createMessageBox;
window.showMessage = showMessage;
window.closeMessageBox = closeMessageBox;