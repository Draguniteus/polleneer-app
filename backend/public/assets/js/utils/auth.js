// Polleneer Authentication Utilities

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.user = null;
        this.init();
    }

    async init() {
        if (this.token) {
            try {
                this.user = await this.getUserFromToken();
            } catch (error) {
                console.error('Failed to validate token:', error);
                this.clearAuth();
            }
        }
    }

    async getUserFromToken() {
        // This would typically decode and validate the JWT
        // For now, we'll use the API
        const response = await fetch('/api/auth/validate', {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Invalid token');
        }
        
        return await response.json();
    }

    setAuth(token, userData) {
        this.token = token;
        this.user = userData;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // Update API instance token
        if (window.PolleneerAPI) {
            window.PolleneerAPI.token = token;
        }
        
        // Dispatch auth change event
        window.dispatchEvent(new CustomEvent('authchange', {
            detail: { authenticated: true, user: userData }
        }));
    }

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        // Update API instance
        if (window.PolleneerAPI) {
            window.PolleneerAPI.token = null;
        }
        
        // Dispatch auth change event
        window.dispatchEvent(new CustomEvent('authchange', {
            detail: { authenticated: false, user: null }
        }));
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    // Check if user has specific role or permission
    hasRole(roleName) {
        if (!this.user || !this.user.roles) return false;
        return this.user.roles.includes(roleName);
    }

    // Check if user is admin
    isAdmin() {
        return this.hasRole('admin') || this.hasRole('queen_bee');
    }
}

// Create singleton instance
const auth = new AuthManager();
window.AuthManager = auth;
