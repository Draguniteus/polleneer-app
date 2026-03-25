const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, useRealDatabase } = require('../database');

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (useRealDatabase) {
      // Real database authentication
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR username = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      
      const user = result.rows[0];
      
      // Check password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      
      // Create JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'polleneer-secret-key',
        { expiresIn: '7d' }
      );
      
      // Remove password hash from response
      delete user.password_hash;
      
      res.json({
        message: 'Login successful',
        user: user,
        token
      });
    } else {
      // Mock authentication for demo (when no DATABASE_URL)
      return res.status(500).json({ error: 'Database not configured. Please set DATABASE_URL environment variable.' });
    }
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, beeRole } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    if (useRealDatabase) {
      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      
      // Hash password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);
      
      // Create new user
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, display_name, role, honey_points, avatar_url, bio) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, username, email, display_name, role, honey_points, avatar_url, bio, created_at`,
        [
          username, 
          email, 
          password_hash, 
          username, // display_name
          beeRole || 'worker', 
          100, // honey_points
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`, // avatar_url
          'New to Polleneer! Ready to start pollinating ideas.' // bio
        ]
      );
      
      const newUser = result.rows[0];
      
      // Create JWT token
      const token = jwt.sign(
        { userId: newUser.id, username: newUser.username },
        process.env.JWT_SECRET || 'polleneer-secret-key',
        { expiresIn: '7d' }
      );
      
      res.json({
        message: 'User created successfully',
        user: newUser,
        token
      });
    } else {
      // Mock registration (when no DATABASE_URL)
      return res.status(500).json({ error: 'Database not configured. Please set DATABASE_URL environment variable.' });
    }
    
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
      return res.status(401).json({ error: 'No token provided' });
    }
    
    if (useRealDatabase) {
      // Verify JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'polleneer-secret-key');
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      const result = await pool.query(
        'SELECT id, username, email, display_name, role, honey_points, avatar_url, bio, created_at FROM users WHERE id = $1',
        [decoded.userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ user: result.rows[0] });
    } else {
      res.status(500).json({ error: 'Database not configured' });
    }
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
