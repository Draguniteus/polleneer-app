// Polleneer Main Application
class PolleneerApp {
    constructor() {
        this.api = window.PolleneerAPI;
        this.auth = window.AuthManager;
        this.ui = window.ui;
        this.currentUser = null;
        this.userRole = null;
        this.honeyBalance = 0;
        this.beeRoles = [];
        this.init();
    }

    async init() {
        console.log('🐝 Polleneer App Initializing...');
        
        try {
            // Check API health
            const health = await this.api.healthCheck();
            console.log('API Health:', health);

            // Check authentication status
            await this.checkAuth();

            // Load initial data
            await this.loadInitialData();

            // Render appropriate view
            this.renderView();

            // Listen for auth changes
            window.addEventListener('authchange', (e) => {
                this.onAuthChange(e.detail);
            });

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.ui.showError('Failed to connect to hive. Please refresh the page.');
        }
    }

    async checkAuth() {
        try {
            this.currentUser = await this.api.getCurrentUser();
            console.log('User authenticated:', this.currentUser);
            return true;
        } catch (error) {
            console.log('No authenticated user');
            this.currentUser = null;
            return false;
        }
    }

    async loadInitialData() {
        const loader = this.ui.showLoading('Loading hive data...');
        
        try {
            if (this.currentUser) {
                // Load user-specific data
                const [roles, honey] = await Promise.all([
                    this.api.getUserRole(),
                    this.api.getHoneyBalance()
                ]);
                
                this.userRole = roles;
                this.honeyBalance = honey?.balance || 0;
            } else {
                // Load public data
                this.beeRoles = await this.api.getBeeRoles();
            }
        } finally {
            this.ui.hideLoading(loader);
        }
    }

    renderView() {
        const appElement = document.getElementById('app');
        
        if (!this.currentUser) {
            // Show login/register view
            this.renderAuthView(appElement);
        } else {
            // Show main dashboard
            this.renderDashboard(appElement);
        }
    }

    renderAuthView(container) {
        container.innerHTML = `
            <div class="auth-container">
                <div class="auth-header">
                    <h1>🐝 Welcome to Polleneer</h1>
                    <p class="auth-subtitle">The Bee-Themed Social Network</p>
                    <p class="auth-description">Join our hive of creators, collectors, and community builders</p>
                </div>
                
                <div class="auth-buttons">
                    <button class="auth-button primary" onclick="app.showLoginModal()">
                        <span>🐝 Login to Hive</span>
                    </button>
                    <button class="auth-button secondary" onclick="app.showRegisterModal()">
                        <span>🍯 Register New Bee</span>
                    </button>
                </div>
                
                <div class="auth-features">
                    <div class="feature">
                        <h3>🐝 91 Unique Roles</h3>
                        <p>Progress through our bee-themed hierarchy</p>
                    </div>
                    <div class="feature">
                        <h3>🍯 Honey Economy</h3>
                        <p>Earn and spend honey points</p>
                    </div>
                    <div class="feature">
                        <h3>👑 Admin Game Mode</h3>
                        <p>Special tools for hive moderators</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderDashboard(container) {
        container.innerHTML = `
            <div class="dashboard">
                <header class="dashboard-header">
                    <div class="header-left">
                        <h1>🐝 Hive Dashboard</h1>
                        <nav class="dashboard-nav">
                            <a href="#" onclick="app.navigate('home')">Home</a>
                            <a href="#" onclick="app.navigate('profile')">Profile</a>
                            <a href="#" onclick="app.navigate('honey')">Honey Shop</a>
                            <a href="#" onclick="app.navigate('roles')">Bee Roles</a>
                            ${this.auth.isAdmin() ? '<a href="#" onclick="app.navigate(\'admin\')">Admin</a>' : ''}
                        </nav>
                    </div>
                    <div class="header-right">
                        <div class="user-info">
                            <span class="username">${this.currentUser.username}</span>
                            <div class="user-stats">
                                <span class="role-badge">${this.userRole?.name || 'Worker Bee'}</span>
                                <span class="honey-badge">${this.honeyBalance} 🍯</span>
                            </div>
                            <button class="logout-button" onclick="app.logout()">Logout</button>
                        </div>
                    </div>
                </header>
                
                <main class="dashboard-content">
                    <div class="welcome-card">
                        <h2>Welcome back, ${this.currentUser.username}!</h2>
                        <p>Your hive is buzzing with activity. Check out what's new:</p>
                        
                        <div class="dashboard-grid">
                            <div class="dashboard-card">
                                <h3>Your Status</h3>
                                <p>Role: <strong>${this.userRole?.name || 'Worker Bee'}</strong></p>
                                <p>Level: <strong>${this.userRole?.tier || 1}</strong></p>
                                <button onclick="app.navigate('roles')">View All Roles</button>
                            </div>
                            
                            <div class="dashboard-card">
                                <h3>Honey Balance</h3>
                                <p class="honey-amount">${this.honeyBalance} 🍯</p>
                                <button onclick="app.navigate('honey')">Visit Honey Shop</button>
                            </div>
                            
                            <div class="dashboard-card">
                                <h3>Quick Actions</h3>
                                <button onclick="app.showProfile()">Edit Profile</button>
                                <button onclick="app.showSettings()">Settings</button>
                                <button onclick="app.ui.toggleTheme()">Toggle Theme</button>
                            </div>
                        </div>
                    </div>
                </main>
                
                <footer class="dashboard-footer">
                    <p>🐝 Polleneer - Building the hive one bee at a time</p>
                </footer>
            </div>
        `;
    }

    showLoginModal() {
        this.ui.showModal('Login to Hive', `
            <form id="login-form" onsubmit="app.handleLogin(event)">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required placeholder="bee@hive.com">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required placeholder="••••••••">
                </div>
            </form>
        `, {
            footer: `
                <button type="submit" form="login-form">Login</button>
                <button onclick="window.ui.closeModal()">Cancel</button>
            `
        });
    }

    showRegisterModal() {
        this.ui.showModal('Register New Bee', `
            <form id="register-form" onsubmit="app.handleRegister(event)">
                <div class="form-group">
                    <label for="reg-username">Username</label>
                    <input type="text" id="reg-username" name="username" required placeholder="BusyBee123">
                </div>
                <div class="form-group">
                    <label for="reg-email">Email</label>
                    <input type="email" id="reg-email" name="email" required placeholder="bee@hive.com">
                </div>
                <div class="form-group">
                    <label for="reg-password">Password</label>
                    <input type="password" id="reg-password" name="password" required placeholder="••••••••">
                </div>
                <div class="form-group">
                    <label for="reg-confirm">Confirm Password</label>
                    <input type="password" id="reg-confirm" name="confirm" required placeholder="••••••••">
                </div>
            </form>
        `, {
            footer: `
                <button type="submit" form="register-form">Create Account</button>
                <button onclick="window.ui.closeModal()">Cancel</button>
            `
        });
    }

    async handleLogin(event) {
        event.preventDefault();
        const form = event.target;
        const email = form.email.value;
        const password = form.password.value;

        const loader = this.ui.showLoading('Authenticating...');
        
        try {
            const result = await this.api.login(email, password);
            this.auth.setAuth(result.token, result.user);
            this.ui.showSuccess('Successfully logged in!');
            this.ui.closeModal();
        } catch (error) {
            this.ui.showError('Login failed. Please check your credentials.');
        } finally {
            this.ui.hideLoading(loader);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        const form = event.target;
        const username = form.username.value;
        const email = form.email.value;
        const password = form.password.value;
        const confirm = form.confirm.value;

        if (password !== confirm) {
            this.ui.showError('Passwords do not match!');
            return;
        }

        const loader = this.ui.showLoading('Creating your account...');
        
        try {
            const result = await this.api.register(username, email, password);
            this.auth.setAuth(result.token, result.user);
            this.ui.showSuccess('Account created successfully!');
            this.ui.closeModal();
        } catch (error) {
            this.ui.showError('Registration failed. Please try again.');
        } finally {
            this.ui.hideLoading(loader);
        }
    }

    async logout() {
        const loader = this.ui.showLoading('Logging out...');
        
        try {
            // Call logout API if available
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`
                }
            });
        } catch (error) {
            console.log('Logout API call failed, clearing local auth only');
        }
        
        this.auth.clearAuth();
        this.ui.hideLoading(loader);
        this.ui.showSuccess('Successfully logged out!');
        
        // Refresh the view
        setTimeout(() => {
            this.currentUser = null;
            this.renderView();
        }, 1000);
    }

    onAuthChange(detail) {
        this.currentUser = detail.user;
        if (detail.authenticated) {
            this.loadInitialData();
        }
        this.renderView();
    }

    navigate(page) {
        this.ui.showNotification(`Navigating to ${page}...`, 'info', 2000);
        // Page routing would be implemented here
        console.log(`Navigate to: ${page}`);
    }

    showProfile() {
        this.ui.showModal('Your Profile', `
            <p>Profile editing functionality coming soon!</p>
            <p>Username: ${this.currentUser.username}</p>
            <p>Email: ${this.currentUser.email || 'Not set'}</p>
        `);
    }

    showSettings() {
        this.ui.showModal('Settings', `
            <p>Settings functionality coming soon!</p>
            <div class="setting-item">
                <label>Theme:</label>
                <button onclick="app.ui.toggleTheme()">Toggle Dark/Light</button>
            </div>
        `);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PolleneerApp();
});
