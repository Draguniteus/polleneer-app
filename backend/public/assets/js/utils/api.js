// Polleneer API Utilities - Client-side communication

const API_BASE_URL = window.location.origin;

class PolleneerAPI {
    constructor() {
        this.token = localStorage.getItem('auth_token');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        return this.request('/api/health');
    }

    // Authentication endpoints
    async login(email, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(username, email, password) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }

    // User endpoints
    async getCurrentUser() {
        return this.request('/api/users/me');
    }

    async updateProfile(data) {
        return this.request('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // Bee Roles endpoints
    async getBeeRoles() {
        return this.request('/api/bee-roles');
    }

    async getUserRole() {
        return this.request('/api/bee-roles/current');
    }

    // Honey Points endpoints
    async getHoneyBalance() {
        return this.request('/api/honey/balance');
    }

    async getShopItems() {
        return this.request('/api/shop/items');
    }

    // Admin endpoints (protected)
    async adminGetUsers() {
        return this.request('/api/admin/users');
    }

    async adminUpdateUser(userId, data) {
        return this.request(`/api/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
}

// Create singleton instance
const api = new PolleneerAPI();
window.PolleneerAPI = api;
