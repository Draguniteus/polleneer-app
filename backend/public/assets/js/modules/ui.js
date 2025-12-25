// Polleneer UI Module

class UIManager {
    constructor() {
        this.notifications = [];
        this.modal = null;
    }

    // Show notification
    showNotification(message, type = 'info', duration = 5000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            duration
        };
        
        this.notifications.push(notification);
        this.renderNotifications();
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }
        
        return notification.id;
    }

    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.renderNotifications();
    }

    renderNotifications() {
        const container = document.getElementById('notification-container');
        if (!container) return;

        container.innerHTML = this.notifications.map(notif => `
            <div class="notification notification-${notif.type}">
                <span>${notif.message}</span>
                <button onclick="window.ui.removeNotification(${notif.id})">×</button>
            </div>
        `).join('');
    }

    // Show modal
    showModal(title, content, options = {}) {
        this.closeModal();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="window.ui.closeModal()">×</button>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
                ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
        
        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') this.closeModal();
        };
        document.addEventListener('keydown', escapeHandler);
        this.modal._escapeHandler = escapeHandler;
    }

    closeModal() {
        if (this.modal) {
            if (this.modal._escapeHandler) {
                document.removeEventListener('keydown', this.modal._escapeHandler);
            }
            this.modal.remove();
            this.modal = null;
        }
    }

    // Loading state
    showLoading(message = 'Loading...') {
        const loader = document.createElement('div');
        loader.className = 'global-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="bee-loader">
                    <div class="bee-wing left"></div>
                    <div class="bee-body"></div>
                    <div class="bee-wing right"></div>
                </div>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(loader);
        return loader;
    }

    hideLoading(loader) {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    }

    // Error display
    showError(message, title = 'Error') {
        this.showModal(title, `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `, {
            footer: '<button onclick="window.ui.closeModal()">Close</button>'
        });
    }

    // Success display
    showSuccess(message, title = 'Success') {
        this.showNotification(message, 'success');
    }

    // Update page title
    setPageTitle(title) {
        document.title = `${title} - Polleneer`;
    }

    // Toggle dark/light mode
    toggleTheme() {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') !== 'light';
        
        if (isDark) {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    }

    // Initialize theme from localStorage
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

// Create singleton instance
const ui = new UIManager();
window.ui = ui;

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ui.initTheme();
    
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
});
