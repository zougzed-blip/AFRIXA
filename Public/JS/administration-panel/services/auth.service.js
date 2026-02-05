import * as API from '../api/admin.api.js';
import { showMessage } from '../ui/event-handlers.js';

let inactivityTimer;

export function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        showMessage('Session expirée par inactivité', 'warning');
        setTimeout(async () => {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch {
            }
            window.location.href = '/login';
        }, 2000);
    }, 30 * 60 * 1000);
}

export function setupInactivityTimer() {
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
        document.addEventListener(event, resetInactivityTimer, { passive: true });
    });
    resetInactivityTimer();
}

export async function loadAdminProfile() {
    try {
        const adminData = await API.loadAdminProfileAPI();
        if (adminData) {
            updateAdminInterface(adminData);
        }
    } catch {
        window.location.href = '/login';
    }
}

function updateAdminInterface(adminData) {
    const adminNameHeader = document.getElementById('admin-name-header');
    const adminRoleHeader = document.getElementById('admin-role-header');
    const adminPhotoHeader = document.getElementById('admin-photo-header');
    const adminInitialsHeader = document.getElementById('admin-initials-header');
    
    if (adminNameHeader) {
        adminNameHeader.textContent = adminData.name || 'Administrateur';
    }
    if (adminRoleHeader) {
        adminRoleHeader.textContent = 'Super Admin';
    }
    
    if (adminData.photo && adminPhotoHeader) {
        adminPhotoHeader.src = adminData.photo;
        adminPhotoHeader.style.display = 'block';
        if (adminInitialsHeader) adminInitialsHeader.style.display = 'none';
    } else if (adminInitialsHeader) {
        const initials = getInitials(adminData.name || 'Admin');
        adminInitialsHeader.textContent = initials;
        adminInitialsHeader.style.display = 'flex';
        if (adminPhotoHeader) adminPhotoHeader.style.display = 'none';
    }
    
    const adminNameSidebar = document.getElementById('admin-name-sidebar');
    const adminRoleSidebar = document.getElementById('admin-role-sidebar');
    const adminPhotoSidebar = document.getElementById('admin-photo-sidebar');
    const adminInitialsSidebar = document.getElementById('admin-initials-sidebar');
    
    if (adminNameSidebar) {
        adminNameSidebar.textContent = adminData.name || 'Administrateur';
    }
    if (adminRoleSidebar) {
        adminRoleSidebar.textContent = 'Super Admin';
    }
   
    if (adminData.photo && adminPhotoSidebar) {
        adminPhotoSidebar.src = adminData.photo;
        adminPhotoSidebar.style.display = 'block';
        if (adminInitialsSidebar) adminInitialsSidebar.style.display = 'none';
    } else if (adminInitialsSidebar) {
        const initials = getInitials(adminData.name || 'Admin');
        adminInitialsSidebar.textContent = initials;
        adminInitialsSidebar.style.display = 'flex';
        if (adminPhotoSidebar) adminPhotoSidebar.style.display = 'none';
    }
}

function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ')
               .map(n => n[0])
               .join('')
               .toUpperCase()
               .substring(0, 2);
}

window.setupInactivityTimer = setupInactivityTimer;