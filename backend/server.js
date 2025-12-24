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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Polleneer API is running! 🐝',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================
// ✅ CRITICAL FIX: Serve frontend from backend/frontend/
// ============================================
const frontendPath = path.join(__dirname, 'frontend');
console.log('📁 Serving frontend from:', frontendPath);

// Serve static files from backend/frontend/
app.use(express.static(frontendPath));

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start server
async function startServer() {
  try {
    console.log('🚀 POLLENEER SERVER STARTING...');
    console.log('📁 Current directory:', __dirname);
    console.log('📁 Frontend path:', frontendPath);
    
    app.listen(PORT, () => {
      console.log(`\n🎉🎉🎉 POLLENEER IS LIVE! 🎉🎉🎉`);
      console.log(`========================================`);
      console.log(`✅ Server running on port: ${PORT}`);
      console.log(`🌐 Your App URL: https://polleneer-dbkzq.ondigitalocean.app`);
      console.log(`📱 API Health: https://polleneer-dbkzq.ondigitalocean.app/api/health`);
      console.log(`🐝 Frontend loaded from: backend/frontend/`);
      console.log(`========================================\n`);
    });
    
  } catch (error) {
    console.error('❌ Server error:', error.message);
    process.exit(1);
  }
}

startServer();
