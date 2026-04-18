const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Import database module
const { pool, initializeDatabase, useRealDatabase } = require('./database');

// Import route files
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');

// Middleware
app.use(cors());
app.use(express.json());

// Mock users data (fallback)
const mockUsers = [
  { id: 1, username: 'admin', display_name: 'Admin Bee', role: 'admin', honey_points: 9999 },
  { id: 2, username: 'testuser', display_name: 'Test User', role: 'worker', honey_points: 250 }
];

const mockBeeRoles = [
  { id: 1, name: 'Worker Bee', tier: 1, type: 'honeybee', description: 'The humble worker bee', required_honey_points: 0 },
  { id: 2, name: 'Forager', tier: 2, type: 'honeybee', description: 'Gathers nectar', required_honey_points: 100 },
  { id: 3, name: 'Hive Builder', tier: 3, type: 'honeybee', description: 'Constructs honeycomb', required_honey_points: 250 },
  { id: 4, name: 'Queen Attendant', tier: 4, type: 'honeybee', description: 'Serves the queen', required_honey_points: 500 },
  { id: 5, name: 'Queen Bee', tier: 5, type: 'honeybee', description: 'The ruler of the hive', required_honey_points: 1000 }
];

// Serve static files from public folder
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);

// API Routes

// Health check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;
  if (useRealDatabase) {
    try {
      const result = await pool.query('SELECT 1 as test');
      dbStatus = result.rows[0].test === 1 ? 'connected' : 'error';
    } catch (e) {
      dbStatus = 'error';
      dbError = e.message;
    }
  }
  res.json({ status: 'ok', database: dbStatus, error: dbError, timestamp: new Date().toISOString() });
});

// 🚨 SECRET SETUP ENDPOINT - Creates database tables
// Visit this ONCE to set up the database, then never again
app.get('/setup-tables', async (req, res) => {
  if (!useRealDatabase) {
    return res.send('❌ No database configured. Set DATABASE_URL first.');
  }
  
  const userSchema = 'polleneer';
  
  try {
    // Try to create a schema for the app's tables
    try { 
      await pool.query('CREATE SCHEMA IF NOT EXISTS ' + userSchema); 
      console.log('✅ Created schema:', userSchema);
    } catch (e) { 
      console.log('⚠️ Schema creation failed (may exist or no permission):', e.message); 
    }
    
    // Grant schema permissions
    try {
      await pool.query('GRANT ALL PRIVILEGES ON SCHEMA ' + userSchema + ' TO CURRENT_USER');
    } catch (e) {
      console.log('⚠️ Grant schema failed:', e.message);
    }
    
    // Set search path
    try {
      await pool.query('SET search_path TO ' + userSchema + ', public');
    } catch (e) {
      console.log('⚠️ search_path setting failed:', e.message);
    }
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${userSchema}.users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'worker',
        bio TEXT,
        honey_points INTEGER DEFAULT 100,
        followers INTEGER DEFAULT 0,
        following INTEGER DEFAULT 0,
        avatar_url TEXT,
        website TEXT,
        location VARCHAR(255),
        joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ users table created');
    
    // Create posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${userSchema}.posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ${userSchema}.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        image_url TEXT,
        likes INTEGER DEFAULT 0,
        pollinations INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ posts table created');
    
    res.send('✅ Tables created in schema "' + userSchema + '"! You can now register and login at /');
  } catch (error) {
    res.send('❌ Error: ' + error.message);
  }
});

// Simple test endpoint
app.get('/api/test-insert', async (req, res) => {
  if (!useRealDatabase) {
    return res.json({ error: 'No database' });
  }
  
  try {
    // Try inserting a test user
    const result = await pool.query(
      'INSERT INTO polleneer.users (username, email, password_hash, display_name, honey_points, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username',
      ['test_' + Date.now(), 'test@test.com', 'test123', 'Test User', 100, 'worker']
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.json({ error: error.message, detail: error.code });
  }
});

// Bee roles routes
app.get('/api/bee-roles', (req, res) => {
  res.json({ roles: mockBeeRoles, count: mockBeeRoles.length });
});

app.get('/api/bee-roles/:id', (req, res) => {
  const role = mockBeeRoles.find(r => r.id === parseInt(req.params.id));
  if (role) {
    res.json({ role });
  } else {
    res.status(404).json({ error: 'Role not found' });
  }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start server with database initialization
async function startServer() {
  // Initialize database (create tables if needed)
  await initializeDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log('🐝 POLLENEER - DIGITALOCEAN PRODUCTION');
    console.log('='.repeat(50));
    console.log(`✅ Server running on port: ${PORT}`);
    console.log(`📁 Serving from: ${publicPath}`);
    console.log(`🗄️ Database: ${useRealDatabase ? 'CONNECTED TO POSTGRESQL' : 'MOCK DATA (no DATABASE_URL)'}`);
    console.log('='.repeat(50) + '\n');
  });
}

startServer();
