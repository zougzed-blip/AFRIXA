import * as API from '../api/admin.api.js';
import * as UI from '../ui/components/notifications.js';

export async function loadAdminNotifications() {
    try {
        const notifications = await API.loadAdminNotificationsAPI();
        UI.displayNotifications(notifications);
        
        const unreadCount = notifications.filter(n => !n.read).length;
        updateNotificationCount(unreadCount);
        
    } catch (error) {
     
    }
}

export async function showAllNotificationsModal() {
    try {
        const notifications = await API.loadAdminNotificationsAPI();
        const modalContent = document.getElementById('all-notifications');
        
        if (!modalContent) return;
        
        if (!notifications || notifications.length === 0) {
            modalContent.innerHTML = '';
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            const icon = document.createElement('i');
            icon.className = 'fas fa-bell-slash';
            const p = document.createElement('p');
            p.textContent = 'Aucune notification';
            emptyState.appendChild(icon);
            emptyState.appendChild(p);
            modalContent.appendChild(emptyState);
        } else {
            modalContent.innerHTML = '';
            
            notifications.forEach(notif => {
                const notificationItem = document.createElement('div');
                notificationItem.className = `notification-item ${notif.read ? '' : 'unread'} ${notif.type || 'info'}`;
                notificationItem.setAttribute('data-action', 'mark-notification-read');
                notificationItem.setAttribute('data-notification-id', notif._id);
                
                const iconDiv = document.createElement('div');
                iconDiv.className = 'notification-icon';
                const icon = document.createElement('i');
                icon.className = `fas fa-${getNotificationIcon(notif.type)}`;
                iconDiv.appendChild(icon);
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'notification-content';
                
                const titleDiv = document.createElement('div');
                titleDiv.className = 'notification-title';
                titleDiv.textContent = notif.title || 'Notification';
                
                const messageDiv = document.createElement('div');
                messageDiv.className = 'notification-message';
                messageDiv.textContent = notif.message;
                
                const timeDiv = document.createElement('div');
                timeDiv.className = 'notification-time';
                timeDiv.textContent = formatDate(notif.createdAt);
                
                contentDiv.appendChild(titleDiv);
                contentDiv.appendChild(messageDiv);
                contentDiv.appendChild(timeDiv);
                
                notificationItem.appendChild(iconDiv);
                notificationItem.appendChild(contentDiv);
                
                modalContent.appendChild(notificationItem);
            });
        }
        
        document.getElementById('notifications-modal').style.display = 'flex';
        
    } catch (error) {
        UI.showMessageBox('Erreur lors du chargement des notifications', 'error');
    }
}

export async function markNotificationAsRead(notificationId) {
    try {
        await API.markNotificationAsReadAPI(notificationId);        
        await loadAdminNotifications();
        
    } catch (error) {
      
    }
}

export async function markAllNotificationsAsRead() {
    try {
        await API.markAllNotificationsAsReadAPI();     
        await loadAdminNotifications();       
        UI.showMessage('Toutes les notifications marquées comme lues', 'success');
        
    } catch (error) {
       
        UI.showMessageBox('Erreur lors du marquage des notifications', 'error');
    }
}

export function updateNotificationCount(count) {
    const notificationCount = document.getElementById('notificationCount');
    if (notificationCount) {
        notificationCount.textContent = count;
        notificationCount.style.display = count > 0 ? 'flex' : 'none';
    }
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle',
        'offer': 'handshake',
        'payment': 'credit-card',
        'transport': 'truck'
    };
    return icons[type] || 'bell';
}

function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return 'Date invalide';
    }
}