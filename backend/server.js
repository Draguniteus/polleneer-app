const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ DIGITALOCEAN FIX: Always serve from ./public
const publicPath = path.join(__dirname, 'public');
console.log('📂 Serving from:', publicPath);

// Check if public folder exists
const fs = require('fs');
if (fs.existsSync(publicPath)) {
  const files = fs.readdirSync(publicPath);
  console.log('📄 Files in public:', files);
} else {
  console.log('⚠️ Public folder not found, creating...');
  fs.mkdirSync(publicPath, { recursive: true });
}

// Serve static files
app.use(express.static(publicPath));

// Test API endpoint
app.get('/api/test', (req, res) => {
  console.log('✅ API Test called');
  res.json({ 
    message: '🐝 Polleneer API is working on DigitalOcean!', 
    status: 'success',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// ✅ DIGITALOCEAN FIX: Serve index.html for all routes
app.get('*', (req, res) => {
  console.log('📄 Serving index.html for:', req.url);
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(50));
  console.log('🐝 POLLENEER - DIGITALOCEAN PRODUCTION');
  console.log('='.repeat(50));
  console.log(`✅ Server running on port: ${PORT}`);
  console.log(`📁 Serving from: ${publicPath}`);
  console.log(`🌐 Mode: ${process.env.NODE_ENV || 'production'}`);
  console.log('='.repeat(50) + '\n');
});
