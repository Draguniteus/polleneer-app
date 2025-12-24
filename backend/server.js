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

// ✅ Serve static files from public folder
const publicPath = path.join(__dirname, 'public');
console.log('📂 Serving from:', publicPath);

// Check if files exist
const fs = require('fs');
if (fs.existsSync(publicPath)) {
  const files = fs.readdirSync(publicPath);
  console.log('📄 Files found:', files);
}

// Serve static files
app.use(express.static(publicPath));

// ✅ FIX: Serve index.html for root path
app.get('/', (req, res) => {
  console.log('📄 Serving index.html for /');
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  console.log('✅ API called');
  res.json({ 
    message: '🐝 Polleneer API is working!', 
    status: 'success',
    time: new Date().toLocaleTimeString()
  });
});

// ✅ FIX: Catch-all route MUST come LAST
app.get('*', (req, res) => {
  console.log('🔄 Catch-all route for:', req.url);
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(50));
  console.log('🐝 POLLENEER SERVER STARTED');
  console.log('='.repeat(50));
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving: ${publicPath}`);
  console.log('='.repeat(50) + '\n');
});
