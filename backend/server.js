const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection (temporarily disabled)
const { pool, initializeDatabase } = require('./database');

// Routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

// Basic test endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Polleneer API is running! 🐝',
    database: 'temporarily_disabled',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Debug endpoint - check frontend files
app.get('/api/debug', (req, res) => {
  const fs = require('fs');
  const frontendPath = path.join(__dirname, '../frontend');
  const indexPath = path.join(frontendPath, 'index.html');
  
  try {
    const filesExist = fs.existsSync(frontendPath);
    const indexExists = fs.existsSync(indexPath);
    
    res.json({
      backend: 'running',
      frontend_path: frontendPath,
      frontend_exists: filesExist,
      index_html_exists: indexExists,
      directory_contents: filesExist ? fs.readdirSync(frontendPath) : [],
      current_dir: __dirname,
      parent_dir: path.join(__dirname, '..'),
      root_dir: path.join(__dirname, '../..')
    });
  } catch (error) {
    res.json({
      backend: 'running',
      error: error.message,
      frontend_path: frontendPath
    });
  }
});

// Serve Polleneer frontend
app.get('*', (req, res) => {
  // Try to serve from frontend folder first
  const frontendPath = path.join(__dirname, '../frontend/index.html');
  const fs = require('fs');
  
  if (fs.existsSync(frontendPath)) {
    console.log('✅ Serving frontend from:', frontendPath);
    
    // Also try to serve static files from frontend folder
    if (req.url.endsWith('.css') || req.url.endsWith('.js') || req.url.endsWith('.json')) {
      const filePath = path.join(__dirname, '../frontend', req.url);
      if (fs.existsSync(filePath)) {
        console.log('Serving static file:', req.url);
        return res.sendFile(filePath);
      }
    }
    
    // Serve main index.html
    res.sendFile(frontendPath);
  } else {
    // If frontend file doesn't exist, serve a beautiful temporary version
    console.log('⚠️ Frontend not found at:', frontendPath);
    console.log('📁 Serving beautiful temporary interface');
    
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Polleneer 🐝 - The Social Hive</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          /* CSS Variables for Bee Theme */
          :root {
            --honey-yellow: #FFC30B;
            --honey-dark: #E6A800;
            --hive-orange: #FF8C00;
            --flower-pink: #FF69B4;
            --leaf-green: #228B22;
            --bee-black: #1A1A1A;
            --background-dark: #0F0F0F;
            --text-light: #E0E0E0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            background: var(--background-dark);
            color: var(--text-light);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            text-align: center;
            line-height: 1.6;
          }
          
          .container {
            max-width: 800px;
            width: 100%;
          }
          
          /* Bee Animation */
          .bee-animation {
            font-size: 100px;
            margin-bottom: 20px;
            animation: float 3s ease-in-out infinite;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          
          /* Logo */
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 30px;
          }
          
          .logo-icon {
            font-size: 48px;
            color: var(--honey-yellow);
          }
          
          .logo-text {
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            font-size: 48px;
            background: linear-gradient(45deg, var(--honey-yellow), var(--hive-orange));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          /* Status Cards */
          .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
          }
          
          .status-card {
            background: rgba(255, 195, 11, 0.1);
            border: 2px solid var(--honey-yellow);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            transition: transform 0.3s;
          }
          
          .status-card:hover {
            transform: translateY(-5px);
          }
          
          .status-icon {
            font-size: 32px;
            margin-bottom: 15px;
          }
          
          .status-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
            color: var(--honey-yellow);
          }
          
          /* Buttons */
          .button-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 30px 0;
          }
          
          .btn {
            background: linear-gradient(45deg, var(--honey-yellow), var(--hive-orange));
            color: var(--bee-black);
            border: none;
            padding: 15px 20px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            text-decoration: none;
          }
          
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(255, 195, 11, 0.3);
          }
          
          .btn.secondary {
            background: rgba(255, 195, 11, 0.1);
            color: var(--honey-yellow);
            border: 2px solid var(--honey-yellow);
          }
          
          .btn.secondary:hover {
            background: rgba(255, 195, 11, 0.2);
          }
          
          /* Message */
          .message {
            background: rgba(255, 105, 180, 0.1);
            border: 2px solid var(--flower-pink);
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            text-align: left;
          }
          
          .message h3 {
            color: var(--flower-pink);
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          /* Footer */
          .footer {
            margin-top: 40px;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #333;
            padding-top: 20px;
            width: 100%;
          }
          
          .test-accounts {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            justify-content: center;
            margin: 20px 0;
          }
          
          .account-badge {
            background: rgba(34, 139, 34, 0.1);
            border: 1px solid var(--leaf-green);
            border-radius: 10px;
            padding: 10px 15px;
            font-size: 14px;
          }
          
          /* Responsive */
          @media (max-width: 768px) {
            .logo-text { font-size: 36px; }
            .bee-animation { font-size: 80px; }
            .status-grid { grid-template-columns: 1fr; }
          }
          
          @media (max-width: 480px) {
            .logo-text { font-size: 28px; }
            .bee-animation { font-size: 60px; }
            .button-grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Bee Animation -->
          <div class="bee-animation">🐝</div>
          
          <!-- Logo -->
          <div class="logo">
            <div class="logo-icon">🐝</div>
            <div class="logo-text">Polleneer</div>
          </div>
          
          <p style="font-size: 18px; margin-bottom: 30px; color: #AAA; max-width: 600px;">
            Welcome to Polleneer! The bee-themed social ecosystem is running. 
            Full frontend is loading soon. You can still test all API features below.
          </p>
          
          <!-- Status Grid -->
          <div class="status-grid">
            <div class="status-card">
              <div class="status-icon" style="color: #228B22;">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="status-title">Backend API</div>
              <div>✅ Running perfectly!</div>
            </div>
            
            <div class="status-card">
              <div class="status-icon" style="color: #87CEEB;">
                <i class="fas fa-database"></i>
              </div>
              <div class="status-title">Database</div>
              <div>⚡ Coming soon!</div>
            </div>
            
            <div class="status-card">
              <div class="status-icon" style="color: #FF69B4;">
                <i class="fas fa-clock"></i>
              </div>
              <div class="status-title">Status</div>
              <div id="currentTime">${new Date().toLocaleTimeString()}</div>
            </div>
            
            <div class="status-card">
              <div class="status-icon" style="color: #FF8C00;">
                <i class="fas fa-bolt"></i>
              </div>
              <div class="status-title">Version</div>
              <div>Polleneer 1.0.0</div>
            </div>
          </div>
          
          <!-- API Buttons -->
          <div class="button-grid">
            <a href="/api/health" class="btn">
              <i class="fas fa-heartbeat"></i>
              API Health
            </a>
            
            <a href="/api/auth/login" class="btn">
              <i class="fas fa-sign-in-alt"></i>
              Test Login
            </a>
            
            <a href="/api/posts" class="btn">
              <i class="fas fa-feather-alt"></i>
              View Posts
            </a>
            
            <a href="/api/debug" class="btn secondary">
              <i class="fas fa-bug"></i>
              Debug Info
            </a>
          </div>
          
          <!-- Message Box -->
          <div class="message">
            <h3><i class="fas fa-info-circle"></i> What's Next?</h3>
            <p>Your Polleneer backend is 100% working! Here's what's happening:</p>
            <ul style="margin: 15px 0 15px 20px; color: #AAA;">
              <li>✅ Backend API deployed successfully</li>
              <li>🔄 Full frontend loading in next update</li>
              <li>🐝 Bee theme and animations ready</li>
              <li>💾 Real database connection coming soon</li>
              <li>📱 PWA installation available next</li>
            </ul>
            <p>You can already test all API endpoints above!</p>
          </div>
          
          <!-- Test Accounts -->
          <div style="margin: 30px 0;">
            <h3 style="color: var(--honey-yellow); margin-bottom: 15px;">
              <i class="fas fa-user-check"></i> Test Accounts
            </h3>
            <div class="test-accounts">
              <div class="account-badge">
                <strong>Admin:</strong> admin / polleneer2024
              </div>
              <div class="account-badge">
                <strong>Test User:</strong> testuser / password123
              </div>
              <div class="account-badge">
                <strong>Or create new account!</strong>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p>Polleneer 🐝 - Where ideas cross-pollinate</p>
            <p style="margin-top: 10px; font-size: 12px; color: #444;">
              Backend running on DigitalOcean • Node.js • Express • Ready for frontend
            </p>
          </div>
        </div>
        
        <script>
          // Update time every second
          function updateTime() {
            const timeElement = document.getElementById('currentTime');
            if (timeElement) {
              timeElement.textContent = new Date().toLocaleTimeString();
            }
          }
          setInterval(updateTime, 1000);
          
          // Add click animations
          document.addEventListener('DOMContentLoaded', function() {
            console.log('🐝 Polleneer temporary interface loaded');
            
            const buttons = document.querySelectorAll('.btn');
            buttons.forEach(btn => {
              btn.addEventListener('click', function(e) {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                  this.style.transform = '';
                }, 200);
                
                console.log('Navigating to:', this.href);
              });
            });
            
            // Animate status cards on load
            const cards = document.querySelectorAll('.status-card');
            cards.forEach((card, index) => {
              card.style.opacity = '0';
              card.style.transform = 'translateY(20px)';
              
              setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
              }, index * 100);
            });
          });
        </script>
      </body>
      </html>
    `);
  }
});

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 POLLENEER SERVER STARTING...');
    console.log('📁 Current directory:', __dirname);
    console.log('🐝 Database temporarily disabled for initial launch');
    
    // CRITICAL: COMMENT OUT DATABASE INITIALIZATION
    // console.log('Attempting database connection...');
    // await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`✅ POLLENEER BACKEND LIVE ON PORT ${PORT}!`);
      console.log(`🌐 API Base: http://localhost:${PORT}/api`);
      console.log(`📱 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🐝 Temporary frontend serving from backend`);
      console.log(`🎉 Polleneer is ready to use!`);
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('Starting app in basic mode...');
    
    // Start anyway even if there's an error
    app.listen(PORT, () => {
      console.log(`⚠️ App running in BASIC MODE on port ${PORT}`);
      console.log(`🔧 Full features will be added after database fix`);
    });
  }
}

startServer();
