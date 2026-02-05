import * as Utils from '../../utils/helpers.js';

export function displayNotifications(notifications) {
    const container = document.getElementById('notifications-list');
    const emptyContainer = document.querySelector('.empty-notifications');
    
    if (!container) return;
    
    if (!notifications || notifications.length === 0) {
        container.style.display = 'none';
        if (emptyContainer) emptyContainer.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    if (emptyContainer) emptyContainer.style.display = 'none';
    
    const recentNotifications = notifications.slice(0, 5);
    
    container.innerHTML = '';
    
    recentNotifications.forEach(notif => {
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
        timeDiv.textContent = formatNotificationTime(notif.createdAt);
        
        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(messageDiv);
        contentDiv.appendChild(timeDiv);
        
        notificationItem.appendChild(iconDiv);
        notificationItem.appendChild(contentDiv);
        
        container.appendChild(notificationItem);
    });
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