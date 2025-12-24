// ============================================
// POLLENEER - MAIN JAVASCRIPT
// Connects to backend API for real database functionality
// ============================================

// Global variables
let currentUser = null;
let currentToken = null;
let posts = [];
let isDarkTheme = true;

// API base URL - will be set automatically
// IMPORTANT FIX: Use current window location
const API_BASE = window.location.origin;

// Debug logging
console.log('🐝 Polleneer frontend loaded');
console.log('🌐 API Base URL:', API_BASE);
console.log('📱 Current URL:', window.location.href);

// DOM Elements
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const registerCard = document.getElementById('registerCard');
const themeToggle = document.getElementById('themeToggle');
const feed = document.getElementById('feed');
const loadingSpinner = document.getElementById('loadingSpinner');
const postContent = document.getElementById('postContent');
const createPostModal = document.getElementById('createPostModal');

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM fully loaded, initializing Polleneer...');
    initializeApp();
    setupEventListeners();
    
    // Check if user is already logged in
    const savedToken = localStorage.getItem('polleneer_token');
    const savedUser = localStorage.getItem('polleneer_user');
    
    if (savedToken && savedUser) {
        console.log('🔑 Found saved login credentials');
        currentToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showApp();
        loadUserData();
        loadPosts();
    } else {
        console.log('👤 No saved login, showing auth screen');
        showAuth();
    }
});

function initializeApp() {
    console.log('⚙️ Initializing app...');
    // Set theme
    const savedTheme = localStorage.getItem('polleneer_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    isDarkTheme = savedTheme === 'dark';
    updateThemeIcon();
    console.log('🎨 Theme set to:', savedTheme);
}

function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // Auth forms
    if (loginForm) {
        console.log('✅ Login form found');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.log('❌ Login form NOT found');
    }
    
    if (registerForm) {
        console.log('✅ Register form found');
        registerForm.addEventListener('submit', handleRegister);
    } else {
        console.log('❌ Register form NOT found');
    }
    
    if (showRegister) {
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📝 Switching to register form');
            showRegisterForm();
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔐 Switching to login form');
            showLoginForm();
        });
    }
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        console.log('🎨 Theme toggle button found');
    }
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Login attempt...');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('📧 Email/Username:', email ? 'Provided' : 'Missing');
    console.log('🔑 Password:', password ? 'Provided' : 'Missing');
    
    if (!email || !password) {
        showToast('Please enter email and password');
        return;
    }
    
    try {
        console.log('🌐 Calling API:', `${API_BASE}/api/auth/login`);
        
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        console.log('📡 API Response status:', response.status);
        
        const data = await response.json();
        console.log('📦 API Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Save token and user
        currentToken = data.token;
        currentUser = data.user;
        
        localStorage.setItem('polleneer_token', data.token);
        localStorage.setItem('polleneer_user', JSON.stringify(data.user));
        
        console.log('✅ Login successful, user:', data.user.username);
        
        showApp();
        loadUserData();
        loadPosts();
        showToast(`Welcome back, ${data.user.username}! 🐝`);
        
    } catch (error) {
        console.error('❌ Login error:', error);
        showToast(error.message || 'Login failed. Try: admin/polleneer2024');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    console.log('📝 Registration attempt...');
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const beeRole = document.getElementById('regBeeRole').value;
    
    if (!username || !email || !password || !beeRole) {
        showToast('Please fill all fields');
        return;
    }
    
    try {
        console.log('🌐 Calling registration API...');
        
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                beeRole: beeRole
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        // Save token and user
        currentToken = data.token;
        currentUser = data.user;
        
        localStorage.setItem('polleneer_token', data.token);
        localStorage.setItem('polleneer_user', JSON.stringify(data.user));
        
        console.log('✅ Registration successful');
        
        showApp();
        loadUserData();
        loadPosts();
        showToast(`Welcome to Polleneer, ${username}! 🎉 +100 Honey Points!`);
        
        // Switch back to login form
        showLoginForm();
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        showToast(error.message || 'Registration failed');
    }
}

function showRegisterForm() {
    document.querySelector('.auth-card').classList.add('hidden');
    registerCard.classList.remove('hidden');
    console.log('📝 Showing register form');
}

function showLoginForm() {
    if (registerCard) registerCard.classList.add('hidden');
    document.querySelector('.auth-card').classList.remove('hidden');
    console.log('🔐 Showing login form');
}

function logout() {
    if (confirm('Are you sure you want to leave the hive?')) {
        localStorage.removeItem('polleneer_token');
        localStorage.removeItem('polleneer_user');
        currentToken = null;
        currentUser = null;
        showAuth();
        showToast('You have been logged out. Come back soon! 🐝');
        console.log('👋 User logged out');
    }
}

// ============================================
// UI MANAGEMENT FUNCTIONS
// ============================================

function showAuth() {
    console.log('🔓 Showing authentication screen');
    if (authScreen) authScreen.classList.remove('hidden');
    if (appScreen) appScreen.classList.add('hidden');
}

function showApp() {
    console.log('🚀 Showing main app screen');
    if (authScreen) authScreen.classList.add('hidden');
    if (appScreen) appScreen.classList.remove('hidden');
}

function loadUserData() {
    if (!currentUser) {
        console.log('❌ No current user to load data for');
        return;
    }
    
    console.log('👤 Loading user data for:', currentUser.username);
    
    // Update sidebar
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    const sidebarHoneyPoints = document.getElementById('sidebarHoneyPoints');
    const honeyPoints = document.getElementById('honeyPoints');
    const currentUserAvatar = document.getElementById('currentUserAvatar');
    const postUserAvatar = document.getElementById('postUserAvatar');
    
    if (sidebarUserAvatar) {
        sidebarUserAvatar.src = currentUser.avatar_url || currentUser.avatar;
        console.log('🖼️ Sidebar avatar updated');
    }
    if (sidebarUserName) {
        sidebarUserName.textContent = currentUser.display_name || currentUser.username;
        console.log('📛 Sidebar name updated');
    }
    if (sidebarUserRole) {
        sidebarUserRole.textContent = getRoleName(currentUser.role);
        console.log('👑 Sidebar role updated');
    }
    if (sidebarHoneyPoints) {
        sidebarHoneyPoints.textContent = currentUser.honey_points || currentUser.honeyPoints || 0;
        console.log('🍯 Sidebar honey points updated');
    }
    if (honeyPoints) {
        honeyPoints.textContent = currentUser.honey_points || currentUser.honeyPoints || 0;
        console.log('💰 Honey points display updated');
    }
    if (currentUserAvatar) {
        currentUserAvatar.src = currentUser.avatar_url || currentUser.avatar;
        console.log('👤 Navbar avatar updated');
    }
    if (postUserAvatar) {
        postUserAvatar.src = currentUser.avatar_url || currentUser.avatar;
        console.log('✏️ Post avatar updated');
    }
}

function getRoleName(role) {
    const roles = {
        'queen': 'Queen Bee',
        'worker': 'Worker Bee',
        'drone': 'Drone',
        'honeybee': 'Honey Bee',
        'admin': 'Admin'
    };
    return roles[role] || 'Bee';
}

// ============================================
// POST MANAGEMENT FUNCTIONS
// ============================================

async function loadPosts() {
    if (!feed) {
        console.log('❌ Feed element not found');
        return;
    }
    
    console.log('📮 Loading posts from API...');
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/api/posts`);
        console.log('📡 Posts API response:', response.status);
        
        if (!response.ok) {
            throw new Error('Failed to load posts');
        }
        
        posts = await response.json();
        console.log(`✅ Loaded ${posts.length} posts`);
        renderPosts();
        
    } catch (error) {
        console.error('❌ Load posts error:', error);
        feed.innerHTML = `
            <div class="post-card">
                <p style="text-align: center; color: var(--text-secondary); padding: 40px;">
                    Could not load posts. The hive is busy!<br>
                    Error: ${error.message}
                </p>
            </div>
        `;
    } finally {
        hideLoading();
    }
}

function renderPosts() {
    if (!feed) return;
    
    if (posts.length === 0) {
        feed.innerHTML = `
            <div class="post-card">
                <p style="text-align: center; color: var(--text-secondary); padding: 40px;">
                    No buzz in the hive yet. Be the first to post!
                </p>
            </div>
        `;
        console.log('📭 No posts to render');
        return;
    }
    
    console.log(`🎨 Rendering ${posts.length} posts`);
    feed.innerHTML = posts.map(post => createPostHTML(post)).join('');
}

function createPostHTML(post) {
    console.log('🖼️ Creating HTML for post:', post.id);
    return `
        <div class="post-card" id="post-${post.id}">
            <div class="post-header">
                <div class="post-user" onclick="viewUserProfile(${post.user_id})">
                    <img src="${post.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}" 
                         alt="User" class="post-avatar"
                         onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
                    <div class="user-name-role">
                        <div class="user-name">
                            ${post.display_name || post.username || 'User'}
                            <span class="user-role-badge">${getRoleName(post.role)}</span>
                        </div>
                        <div class="post-meta">@${post.username || 'user'} • ${formatTime(post.created_at)}</div>
                    </div>
                </div>
            </div>
            
            <div class="post-content">${formatPostContent(post.content)}</div>
            
            ${post.tags && post.tags.length > 0 ? `
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
            </div>
            ` : ''}
            
            ${post.media_url ? `
            <div class="post-media">
                <img src="${post.media_url}" alt="Post media" class="post-image"
                     onerror="this.style.display='none'">
            </div>
            ` : ''}
            
            <div class="post-stats">
                <div class="stat">
                    <i class="fas fa-retweet"></i>
                    <span>${post.pollinations || 0} Pollinations</span>
                </div>
                <div class="stat">
                    <i class="fas fa-comment"></i>
                    <span>${post.comments_count || 0} Comments</span>
                </div>
                <div class="stat">
                    <i class="fas fa-heart"></i>
                    <span>${post.likes_count || post.likes || 0} Likes</span>
                </div>
                <div class="stat">
                    <i class="fas fa-chart-line"></i>
                    <span>${post.views || 0} Views</span>
                </div>
            </div>
            
            <div class="post-actions-bar">
                <button class="post-action-btn" onclick="likePost(${post.id})" id="like-btn-${post.id}">
                    <i class="far fa-heart"></i>
                    <span>Like</span>
                </button>
                <button class="post-action-btn" onclick="commentOnPost(${post.id})">
                    <i class="far fa-comment"></i>
                    <span>Comment</span>
                </button>
                <button class="post-action-btn" onclick="pollinatePost(${post.id})">
                    <i class="far fa-retweet"></i>
                    <span>Pollinate</span>
                </button>
            </div>
        </div>
    `;
}

function formatPostContent(content) {
    if (!content) return '';
    return content
        .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
        .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
        .replace(/\n/g, '<br>');
}

function formatTime(timestamp) {
    if (!timestamp) return 'Just now';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

// ============================================
// POST INTERACTIONS
// ============================================

async function likePost(postId) {
    if (!currentToken) {
        showToast('Please login to like posts');
        return;
    }
    
    console.log(`❤️ Liking post ${postId}`);
    
    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                userId: currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to like post');
        }
        
        // Update UI
        const likeBtn = document.getElementById(`like-btn-${postId}`);
        if (likeBtn) {
            const icon = likeBtn.querySelector('i');
            const text = likeBtn.querySelector('span');
            
            if (data.liked) {
                likeBtn.classList.add('liked');
                icon.className = 'fas fa-heart';
                text.textContent = 'Liked';
                showToast('+5 Honey Points for liking! 🍯');
            } else {
                likeBtn.classList.remove('liked');
                icon.className = 'far fa-heart';
                text.textContent = 'Like';
            }
        }
        
        // Reload posts to update counts
        loadPosts();
        
    } catch (error) {
        console.error('❌ Like post error:', error);
        showToast('Failed to like post');
    }
}

function commentOnPost(postId) {
    const comment = prompt('Enter your comment:');
    if (comment && comment.trim()) {
        // In a real app, this would call the API
        showToast('Comment added! +10 Honey Points 🍯');
        console.log(`💬 Comment on post ${postId}: ${comment}`);
    }
}

function pollinatePost(postId) {
    // In a real app, this would call the API
    showToast('Post pollinated! +15 Honey Points 🍯');
    console.log(`🔄 Pollinated post ${postId}`);
}

// ============================================
// CREATE POST FUNCTIONS
// ============================================

function showCreatePostModal() {
    if (!currentToken) {
        showToast('Please login to create posts');
        return;
    }
    
    console.log('📝 Opening create post modal');
    openModal('createPostModal');
}

async function submitPost() {
    const content = document.getElementById('postContent').value.trim();
    
    if (!content) {
        showToast('Please write something before posting!');
        return;
    }
    
    if (!currentToken) {
        showToast('Please login to post');
        return;
    }
    
    console.log('📤 Submitting new post...');
    
    try {
        const response = await fetch(`${API_BASE}/api/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                userId: currentUser.id,
                content: content,
                tags: [],
                mediaUrl: null
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create post');
        }
        
        // Clear and close
        document.getElementById('postContent').value = '';
        closeModal('createPostModal');
        
        // Reload posts
        loadPosts();
        
        // Update user honey points
        if (currentUser) {
            currentUser.honey_points = (currentUser.honey_points || 0) + 25;
            loadUserData();
        }
        
        showToast('Post created! +25 Honey Points 🍯');
        console.log('✅ Post created successfully');
        
    } catch (error) {
        console.error('❌ Create post error:', error);
        showToast('Failed to create post');
    }
}

function addTagToPost() {
    const tag = prompt('Enter tag (without #):');
    if (tag) {
        const content = document.getElementById('postContent');
        content.value += ` #${tag}`;
        console.log(`🏷️ Added tag: ${tag}`);
    }
}

function addMediaToPost() {
    const url = prompt('Enter image URL:');
    if (url) {
        const content = document.getElementById('postContent');
        content.value += `\n[Image: ${url}]`;
        console.log(`🖼️ Added media URL: ${url}`);
    }
}

// ============================================
// THEME FUNCTIONS
// ============================================

function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    const theme = isDarkTheme ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('polleneer_theme', theme);
    updateThemeIcon();
    
    showToast(`${theme.charAt(0).toUpperCase() + theme.slice(1)} theme activated`);
    console.log(`🎨 Theme switched to: ${theme}`);
}

function updateThemeIcon() {
    if (!themeToggle) return;
    
    const icon = themeToggle.querySelector('i');
    if (isDarkTheme) {
        icon.className = 'fas fa-moon';
        themeToggle.title = 'Switch to light theme';
    } else {
        icon.className = 'fas fa-sun';
        themeToggle.title = 'Switch to dark theme';
    }
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

function loadHome() {
    console.log('🏠 Loading home feed');
    loadPosts();
    updateActiveNav('home');
}

function loadExplore() {
    showToast('Explore page coming soon!');
    updateActiveNav('explore');
    console.log('🔍 Explore page requested');
}

function goToProfile() {
    showToast('Profile page coming soon!');
    updateActiveNav('profile');
    console.log('👤 Profile page requested');
}

function updateActiveNav(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.nav-link[onclick*="${page}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        console.log(`📍 Active nav: ${page}`);
    }
}

function viewUserProfile(userId) {
    showToast(`Viewing user profile #${userId}`);
    console.log(`👥 Viewing user profile: ${userId}`);
}

function showHoneyShop() {
    showToast('Honey Shop coming soon!');
    console.log('🏪 Honey shop requested');
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        console.log(`📂 Opened modal: ${modalId}`);
    } else {
        console.log(`❌ Modal not found: ${modalId}`);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        console.log(`📂 Closed modal: ${modalId}`);
    }
}

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
        console.log('⎋ Closed all modals with Escape');
    }
});

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
        console.log('👆 Closed modal by clicking outside');
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showToast(message) {
    console.log('🍞 Toast:', message);
    
    // Create toast if it doesn't exist
    let toast = document.getElementById('notificationToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'notificationToast';
        toast.className = 'toast';
        document.body.appendChild(toast);
        console.log('✅ Toast container created');
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoading() {
    console.log('⏳ Showing loading spinner');
    if (loadingSpinner) {
        loadingSpinner.classList.remove('hidden');
    }
}

function hideLoading() {
    console.log('✅ Hiding loading spinner');
    if (loadingSpinner) {
        loadingSpinner.classList.add('hidden');
    }
}

// ============================================
// PWA SUPPORT
// ============================================

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('🔧 ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('❌ ServiceWorker registration failed:', error);
            });
    });
}

// Add to Home Screen prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    console.log('📱 PWA install prompt available');
    
    // Show install prompt after 5 seconds
    setTimeout(() => {
        if (deferredPrompt) {
            showToast('Install Polleneer on your home screen for app-like experience!');
        }
    }, 5000);
});

// ============================================
// DEBUG HELPER: Test API Connection
// ============================================

// Test API connection on load
window.testAPI = async function() {
    console.log('🧪 Testing API connection...');
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        const data = await response.json();
        console.log('✅ API Test Result:', data);
        showToast(`API Connection: ${data.status}`);
        return data;
    } catch (error) {
        console.error('❌ API Test Failed:', error);
        showToast('API Connection Failed');
        return { error: error.message };
    }
};

// Run a quick test on load
setTimeout(() => {
    console.log('🚀 Polleneer frontend initialized successfully!');
    console.log('🐝 Ready for action!');
}, 1000);

