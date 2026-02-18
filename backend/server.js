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

// Mock users data
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: '🐝 Polleneer API is working!', status: 'success' });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, display_name } = req.body;
  // Mock registration - in production, save to database
  const newUser = {
    id: mockUsers.length + 1,
    username: username || 'newuser',
    display_name: display_name || username || 'New User',
    role: 'worker',
    honey_points: 0,
    created_at: new Date().toISOString()
  };
  mockUsers.push(newUser);
  res.status(201).json({ message: 'Registration successful', user: newUser, token: 'mock-token-123' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  // Mock login - accept any credentials
  const user = mockUsers.find(u => u.username === username) || mockUsers[0];
  res.json({ message: 'Login successful', user, token: 'mock-token-123' });
});

// Users routes
app.get('/api/users/me', (req, res) => {
  // Return 401 to indicate not authenticated - frontend should show login
  res.status(401).json({ error: 'Not authenticated' });
});

app.get('/api/users/:id', (req, res) => {
  const user = mockUsers.find(u => u.id === parseInt(req.params.id));
  if (user) {
    res.json({ user });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Bee roles routes
app.get('/api/bee-roles', (req, res) => {
  // Return mock data (no database needed)
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(50));
  console.log('🐝 POLLENEER - DIGITALOCEAN PRODUCTION');
  console.log('='.repeat(50));
  console.log(`✅ Server running on port: ${PORT}`);
  console.log(`📁 Serving from: ${publicPath}`);
  console.log('🌐 API endpoints ready (mock data mode)');
  console.log('='.repeat(50) + '\n');
});
