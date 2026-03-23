const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Import database module
const { pool, initializeDatabase, useRealDatabase } = require('./database');

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

// API Routes

// Health check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  if (useRealDatabase) {
    try {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'error';
    }
  }
  res.json({ status: 'ok', database: dbStatus, timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '🐝 Polleneer API is working!', 
    database: useRealDatabase ? 'CONNECTED' : 'MOCK',
    status: 'success' 
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, display_name } = req.body;
  
  if (!useRealDatabase) {
    // Mock registration
    const newUser = {
      id: mockUsers.length + 1,
      username: username || 'newuser',
      display_name: display_name || username || 'New User',
      role: 'worker',
      honey_points: 100,
      created_at: new Date().toISOString()
    };
    mockUsers.push(newUser);
    return res.status(201).json({ message: 'Registration successful (mock)', user: newUser, token: 'mock-token-123' });
  }

  try {
    // Hash password in production
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, display_name, honey_points, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, display_name, role, honey_points',
      [username, email, password, display_name || username, 100, 'worker']
    );
    res.status(201).json({ message: 'Registration successful', user: result.rows[0], token: 'real-token-123' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!useRealDatabase) {
    // Mock login
    const user = mockUsers.find(u => u.username === username) || mockUsers[0];
    return res.json({ message: 'Login successful (mock)', user, token: 'mock-token-123' });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, display_name, email, role, honey_points FROM users WHERE username = $1 AND password_hash = $2',
      [username, password]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ message: 'Login successful', user: result.rows[0], token: 'real-token-123' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Users routes
app.get('/api/users/me', (req, res) => {
  res.status(401).json({ error: 'Not authenticated' });
});

app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!useRealDatabase) {
    const user = mockUsers.find(u => u.id === parseInt(id));
    if (user) return res.json({ user });
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const result = await pool.query('SELECT id, username, display_name, role, bio, honey_points, avatar_url FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
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
