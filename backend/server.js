const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

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
    timestamp: new Date().toISOString()
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 POLLENEER SERVER STARTING...');
    console.log('🐝 Database temporarily disabled for initial launch');
    
    // CRITICAL: COMMENT OUT DATABASE INITIALIZATION
    // console.log('Attempting database connection...');
    // await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`✅ POLLENEER IS NOW LIVE ON PORT ${PORT}!`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`⚡ API: http://localhost:${PORT}/api`);
      console.log(`📱 Test login: admin / polleneer2024`);
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
