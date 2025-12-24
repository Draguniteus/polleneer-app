const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock user database (temporary for launch)
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@polleneer.com',
    password_hash: '$2b$10$EXAMPLEHASHADMIN', // Hash for 'polleneer2024'
    display_name: 'Admin Bee',
    role: 'admin',
    bio: 'The hive administrator',
    honey_points: 9999,
    followers: 100,
    following: 50,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    username: 'testuser',
    email: 'test@polleneer.com',
    password_hash: '$2b$10$EXAMPLEHASHTEST', // Hash for 'password123'
    display_name: 'Test User',
    role: 'worker',
    bio: 'Just testing Polleneer!',
    honey_points: 250,
    followers: 10,
    following: 20,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Test',
    created_at: new Date().toISOString()
  }
];

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple mock authentication
    let user;
    if (email === 'admin' || email === 'admin@polleneer.com') {
      user = mockUsers[0];
      if (password !== 'polleneer2024') {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
    } else if (email === 'testuser' || email === 'test@polleneer.com') {
      user = mockUsers[1];
      if (password !== 'password123') {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
    } else {
      // Auto-create new user for demo
      user = {
        id: mockUsers.length + 1,
        username: email.split('@')[0] || 'newuser',
        email: email,
        display_name: email.split('@')[0] || 'New User',
        role: 'worker',
        bio: 'New to Polleneer!',
        honey_points: 100,
        followers: 0,
        following: 0,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        created_at: new Date().toISOString()
      };
      mockUsers.push(user);
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'polleneer-secret-key',
      { expiresIn: '7d' }
    );
    
    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, beeRole } = req.body;
    
    // Check if user exists in mock data
    const existingUser = mockUsers.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Create new mock user
    const newUser = {
      id: mockUsers.length + 1,
      username: username,
      email: email,
      display_name: username,
      role: beeRole || 'worker',
      bio: 'New to Polleneer! Ready to start pollinating ideas.',
      honey_points: 100,
      followers: 0,
      following: 0,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      created_at: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    
    // Create JWT token
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET || 'polleneer-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'User created successfully',
      user: newUser,
      token
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // Return a default user for demo
      return res.json({ 
        user: mockUsers[0],
        note: 'No token provided, showing demo user'
      });
    }
    
    // In real app, verify JWT token
    // For demo, just return first user
    res.json({ user: mockUsers[0] });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
