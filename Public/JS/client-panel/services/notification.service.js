async function loadAllUserNotifications() {
    try {
        const token = localStorage.getItem("token");
        const transportResponse = await apiFetch('/api/client/notifications');
        const agenceResponse = await apiFetch('/api/client/agence-notifications');

        let allNotifications = [];

        if (transportResponse && transportResponse.ok) {
            const transportData = await transportResponse.json();
            if (transportData.success && transportData.notifications) {
                allNotifications = [...allNotifications, ...transportData.notifications];
            }
        }

        if (agenceResponse && agenceResponse.ok) {
            const agenceData = await agenceResponse.json();
            if (agenceData.success && agenceData.notifications) {
                allNotifications = [...allNotifications, ...agenceData.notifications];
            }
        }

        if (allNotifications.length > 0) {
            displayNotifications(allNotifications);

            const unreadCount = allNotifications.filter(n => !n.read).length;
            updateNotificationBadge(unreadCount);
        } else {
            displayNotifications([]);
            updateNotificationBadge(0);
        }

    } catch (error) {
    }
}

function displayNotifications(notifications) {
    const notificationArea = document.getElementById('notifications-list');
    if (!notificationArea) return;

    if (!notifications || notifications.length === 0) {
        notificationArea.innerHTML = sanitizeHtml(`
            <div class="empty-state">
                <i class="fas fa-bell-slash fa-2x"></i>
                <p>Aucune notification pour le moment</p>
            </div>
        `);
        return;
    }

    const sortedNotifications = [...notifications].sort((a, b) => new Date(b.date) - new Date(a.date));

    notificationArea.innerHTML = sortedNotifications.map(notif => {
        let icon = 'fa-bell';
        let colorClass = 'notification-info';

        let details = '';
        if (notif.type === 'agence_weight' && notif.oldWeight && notif.newWeight) {
            details = sanitizeHtml(`
                <div class="notification-details">
                    <small>
                        <strong>Poids déclaré:</strong> ${escapeHtml(notif.oldWeight)}
                    </small>
                    <small>
                        <strong>Poids réel:</strong> ${escapeHtml(notif.newWeight)}
                    </small>
                </div>
            `);
        }

        return sanitizeHtml(`
            <div class="notification-item ${escapeHtml(colorClass)} ${notif.read ? '' : 'unread'}">
                <div class="notification-icon">
                    <i class="fas ${escapeHtml(icon)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${escapeHtml(notif.title || 'Notification')}</div>
                    <div class="notification-message">${escapeHtml(notif.message)}</div>
                    ${details}
                    <div class="notification-time">${escapeHtml(formatNotificationTime(notif.date))}</div>
                </div>
                ${notif.read ? '' : '<div class="notification-unread"></div>'}
            </div>
        `);
    }).join('');
}

function formatNotificationTime(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;

        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours} h`;
        if (days === 1) return 'Hier';
        if (days < 7) return `Il y a ${days} jours`;

        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch (error) {
        return '';
    }
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = escapeHtml(count.toString());
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function addNotificationToPanel(message, type = 'info') {
    const notificationArea = document.getElementById('notifications-list');
    if (!notificationArea) return;

    const notificationItem = document.createElement('div');
    notificationItem.className = `notification-item`;
    notificationItem.innerHTML = sanitizeHtml(`
        <div class="notification-icon">
            <i class="fas fa-${escapeHtml(getNotificationIcon(type))}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${escapeHtml(type === 'success' ? 'Offre acceptée' : 'Offre refusée')}</div>
            <div class="notification-message">${escapeHtml(message)}</div>
            <div class="notification-time">À l'instant</div>
        </div>
    `);
    notificationArea.insertBefore(notificationItem, notificationArea.firstChild);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        case 'info': return 'info-circle';
        default: return 'bell';
    }
}