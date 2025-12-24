const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Polleneer API is running! 🐝',
    database: 'temporarily_disabled',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// FRONTEND FILES PATH
// DigitalOcean structure: /workspace/backend/ (we're here)
// Frontend is at: /workspace/frontend/
const frontendPath = path.join(__dirname, '../frontend');

console.log('🔍 Looking for frontend files at:', frontendPath);

// Check if frontend exists
if (fs.existsSync(frontendPath)) {
  const files = fs.readdirSync(frontendPath);
  console.log(`✅ Frontend files found (${files.length} files):`, files);
  
  // Serve ALL static files from frontend folder
  app.use(express.static(frontendPath));
  
  // Special handling for manifest.json
  app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(frontendPath, 'manifest.json'));
  });
  
  // Special handling for service-worker.js
  app.get('/service-worker.js', (req, res) => {
    res.type('application/javascript');
    res.sendFile(path.join(frontendPath, 'service-worker.js'));
  });
  
  // All other routes serve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
  
} else {
  console.log('❌ Frontend folder not found at:', frontendPath);
  
  // Fallback: Serve error page
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Polleneer Setup Error</title>
        <style>
          body { 
            background: #0F0F0F; 
            color: #FFC30B; 
            font-family: Arial; 
            padding: 50px;
            text-align: center;
          }
          h1 { color: #FF69B4; }
          .bee { font-size: 100px; animation: float 3s infinite; }
          @keyframes float { 
            0%,100% { transform: translateY(0); } 
            50% { transform: translateY(-20px); } 
          }
          .error-box { 
            background: #222; 
            padding: 30px; 
            border-radius: 15px; 
            margin: 30px auto; 
            max-width: 600px;
            border: 2px solid #FFC30B;
          }
          code { 
            background: #333; 
            padding: 5px 10px; 
            border-radius: 5px;
            display: block;
            margin: 10px 0;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="bee">🐝</div>
        <h1>Frontend Files Missing</h1>
        
        <div class="error-box">
          <p>Your backend is working, but frontend files weren't found.</p>
          <p>Expected location: <code>${frontendPath}</code></p>
          <p>Current directory: <code>${__dirname}</code></p>
          <p>Please check your GitHub repository has:</p>
          <ul style="text-align: left; margin: 20px;">
            <li><code>frontend/index.html</code></li>
            <li><code>frontend/style.css</code></li>
            <li><code>frontend/app.js</code></li>
          </ul>
        </div>
        
        <p>Backend is working: <a href="/api/health" style="color: #87CEEB;">Check API Health</a></p>
      </body>
      </html>
    `);
  });
}

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 POLLENEER SERVER STARTING...');
    console.log(`📁 Current directory: ${__dirname}`);
    console.log(`🔍 Frontend expected at: ${frontendPath}`);
    
    // Check frontend
    if (fs.existsSync(frontendPath)) {
      console.log('✅ Frontend folder exists!');
      const files = fs.readdirSync(frontendPath);
      console.log(`📄 Files found: ${files.join(', ')}`);
    } else {
      console.log('❌ Frontend folder NOT found');
    }
    
    console.log('🐝 Database temporarily disabled for initial launch');
    // await initializeDatabase(); // Temporarily disabled
    
    app.listen(PORT, () => {
      console.log(`\n🎉🎉🎉 POLLENEER IS LIVE! 🎉🎉🎉`);
      console.log(`===================================`);
      console.log(`✅ Server running on port: ${PORT}`);
      console.log(`🌐 Your app URL: https://polleneer-dbkzq.ondigitalocean.app`);
      console.log(`📱 API Health: /api/health`);
      console.log(`🐝 Frontend: /index.html`);
      console.log(`⚡ Database: Coming soon!`);
      console.log(`===================================\n`);
      console.log(`🎯 NEXT: Your original Polleneer frontend should load!`);
    });
    
  } catch (error) {
    console.error('❌ Server error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

startServer();
