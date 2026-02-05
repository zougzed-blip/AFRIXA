document.addEventListener("DOMContentLoaded", async () => {
   
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const rememberCheckbox = document.getElementById("remember");
    const loginBtn = document.querySelector('.btn-login');
    const notificationsContainer = document.querySelector('.notifications-container');

    let isSubmitting = false;
    let csrfToken = null
    function getCSRFTokenFromCookie() {
        try {
            const cookieNames = [
                'XSRF-TOKEN',
                'csrfToken',
                '_csrf',
                'csrf-token'
            ];
            
            const cookies = document.cookie.split('; ');
            for (const cookie of cookies) {
                for (const name of cookieNames) {
                    if (cookie.startsWith(`${name}=`)) {
                        const value = cookie.split('=')[1];
                        csrfToken = decodeURIComponent(value);
                        return csrfToken;
                    }
                }
            }
            
            const metaToken = document.querySelector('meta[name="csrf-token"]');
            if (metaToken) {
                csrfToken = metaToken.getAttribute('content');
                return csrfToken;
            }
            
            return null;
        } catch (error) {
            console.error("Erreur récupération CSRF:", error);
            return null;
        }
    }

    csrfToken = getCSRFTokenFromCookie();

    
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
    const inputs = [emailInput, passwordInput];
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.borderColor = 'var(--vert-fonce)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.borderColor = '';
        });
    });

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (isSubmitting) {
            showNotification("Veuillez patienter...", "info");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showNotification("Veuillez remplir tous les champs", "warning");
            return;
        }

        isSubmitting = true;

        loginBtn.disabled = true;
        const originalText = loginBtn.querySelector('.btn-text').textContent;
        const originalIcon = loginBtn.querySelector('i').className;
        loginBtn.querySelector('.btn-text').textContent = 'Connexion...';
        loginBtn.querySelector('i').className = 'fas fa-spinner fa-spin';

        try {
        
            if (!csrfToken) {
                csrfToken = getCSRFTokenFromCookie();
            }
            const headers = {
                "Content-Type": "application/json",
            };
            if (csrfToken) {
                headers["X-CSRF-Token"] = csrfToken;
            }
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: headers,
                credentials: 'include', 
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403 && data.error?.includes('CSRF')) {
                    showNotification("Session expirée, veuillez recharger la page", "warning");
                    window.location.reload();
                    return;
                }
                throw new Error(data.message || "Email ou mot de passe incorrect");
            }

            showNotification("Connexion réussie ! Redirection en cours...", "success");
            loginBtn.querySelector('.btn-text').textContent = 'Connecté !';
            loginBtn.querySelector('i').className = 'fas fa-check';
            loginBtn.style.background = 'var(--success)';

            setTimeout(() => {
                const redirectPaths = {
                    "client": "/client/dashboard",
                    "agence": "/agence/dashboard",
                    "admin": "/admin/dashboard"
                };
                
                const path = redirectPaths[data.role] || "/";
                window.location.href = path;
            }, 1500);

        } catch (error) {
            console.error("Erreur:", error);
            showNotification(error.message || "Impossible de se connecter", "error");

            setTimeout(() => {
                resetButton(originalText, originalIcon);
            }, 2000);
            
        } finally {
            setTimeout(() => {
                isSubmitting = false;
            }, 2000);
        }
    });

    function resetButton(originalText = 'Se connecter', originalIcon = 'fas fa-arrow-right') {
        if (!loginBtn) return;
        
        loginBtn.disabled = false;
        loginBtn.querySelector('.btn-text').textContent = originalText;
        loginBtn.querySelector('i').className = originalIcon;
        loginBtn.style.background = '';
    }

    function showNotification(message, type = 'info') {
        if (!notificationsContainer) {
            console.error('Notifications container not found');
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${icons[type]}"></i>
            </div>
            <div class="notification-content">
                <p>${message}</p>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
     
        notificationsContainer.appendChild(notification);
        
        const autoRemove = setTimeout(() => {
            removeNotification(notification);
        }, 5000);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            removeNotification(notification);
        });
    }
    
    function removeNotification(notification) {
        if (!notification) return;
        
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }
});